/**
 * Memory Vault Service for MAYRA (Extracted from Jarvis Memory Architecture)
 * 
 * Capabilities:
 * 1. Hybrid Token & Keyword Relevance Search with Recency Decay (S = S_base * e^(-lambda * dt))
 * 2. Importance-weighted relevance ranking and deterministic pinning
 * 3. Conservative Auto-Memory Extraction with high confidence threshold
 * 4. Deduplication & Conflict Detection (Update vs Append vs Create)
 * 5. Project Memory isolation and category partitioning
 * 6. Context Window prompt injector for assistant prompt construction
 * 7. Safe backward-compatible backup and local persistence
 */

import { MemoryItem, MemoryCategory, MemoryQueryOptions, MemorySearchResult, MemoryExtractionResult } from '../../types';

const STORAGE_KEY = 'mayra_memory_vault_v2';
const BACKUP_STORAGE_KEY = 'mayra_memory_vault_backup';

/**
 * Tokenizes text into lowercase normalized alphanumeric tokens
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ') // Supports English & Devanagari/Hindi characters
    .split(/\s+/)
    .filter(t => t.length > 1);
}

/**
 * Calculates string similarity using token overlap Jaccard index
 */
function calculateSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  
  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export class MemoryVaultService {
  /**
   * Loads persisted memories from local storage, falling back to default seed memories,
   * while creating an automatic backup snapshot.
   */
  public static loadPersistedMemories(defaultMemories: MemoryItem[]): MemoryItem[] {
    if (typeof window === 'undefined') {
      return this.migrateAndBackup(defaultMemories);
    }
    try {
      const savedJson = window.localStorage.getItem(STORAGE_KEY);
      if (savedJson) {
        const parsed = JSON.parse(savedJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Backup existing valid state
          window.localStorage.setItem(BACKUP_STORAGE_KEY, savedJson);
          return this.migrateAndBackup(parsed);
        }
      }
    } catch (e) {
      console.warn('[MemoryVault] Error reading stored memories, using fallback seed:', e);
    }

    const migrated = this.migrateAndBackup(defaultMemories);
    this.savePersistedMemories(migrated);
    return migrated;
  }

  /**
   * Persists memories safely to localStorage
   */
  public static savePersistedMemories(memories: MemoryItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    } catch (e) {
      console.warn('[MemoryVault] Failed to persist memories to localStorage:', e);
    }
  }

  /**
   * Restores memories from the last automatic backup snapshot
   */
  public static restoreFromBackup(fallback: MemoryItem[]): MemoryItem[] {
    if (typeof window === 'undefined') return fallback;
    try {
      const backup = window.localStorage.getItem(BACKUP_STORAGE_KEY);
      if (backup) {
        const parsed = JSON.parse(backup);
        if (Array.isArray(parsed)) {
          this.savePersistedMemories(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[MemoryVault] Failed to restore from backup:', e);
    }
    return fallback;
  }

  /**
   * Safe migration & backup loader: loads existing memories and enriches them
   * without destroying or modifying original fields.
   */
  public static migrateAndBackup(existing: MemoryItem[]): MemoryItem[] {
    try {
      // 1. Create a safe rollback snapshot in local storage
      if (typeof window !== 'undefined' && existing.length > 0) {
        window.localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(existing));
      }
    } catch (e) {
      console.warn('[MemoryVault] Backup creation skipped:', e);
    }

    // 2. Enrich with default vault metadata if missing
    return existing.map((item) => ({
      ...item,
      importance: item.importance ?? (item.isPinned ? 5 : item.category === 'personal' || item.category === 'preference' ? 4 : 3),
      tags: item.tags ?? [item.category, item.key.toLowerCase().replace(/\s+/g, '_')],
      accessCount: item.accessCount ?? 0,
      lastAccessedAt: item.lastAccessedAt ?? item.timestamp,
      source: item.source ?? 'user_explicit',
      confidenceScore: item.confidenceScore ?? 1.0,
      isArchived: item.isArchived ?? false
    }));
  }

  /**
   * Hybrid Search & Relevance Ranking Engine
   * Combines exact key match, token overlap, category weight, importance multiplier,
   * pinning priority, and exponential time decay.
   */
  public static search(memories: MemoryItem[], options: MemoryQueryOptions = {}): MemorySearchResult[] {
    const {
      query = '',
      categories,
      projectId,
      minImportance = 1,
      limit = 10,
      includeArchived = false,
      recencyWeight = 0.25
    } = options;

    const queryTokens = tokenize(query);
    const now = Date.now();
    const results: MemorySearchResult[] = [];

    for (const item of memories) {
      // Filter out archived unless explicitly requested
      if (!includeArchived && item.isArchived) continue;

      // Filter by category if specified
      if (categories && categories.length > 0 && !categories.includes(item.category)) {
        continue;
      }

      // Filter by project ID if in project mode
      if (projectId && item.projectId !== projectId && item.category === 'project') {
        continue;
      }

      // Filter by minimum importance
      const importance = item.importance ?? 3;
      if (importance < minImportance && !item.isPinned) {
        continue;
      }

      let score = 0;
      const matchReasons: string[] = [];

      // 1. Pinned items receive baseline boost
      if (item.isPinned) {
        score += 3.0;
        matchReasons.push('Pinned Priority');
      }

      // 2. Importance score weight (scale 1-5 -> 0.2 to 1.0)
      score += (importance / 5.0) * 1.5;

      // 3. Keyword / Query Match
      if (queryTokens.length > 0) {
        const keyTokens = new Set(tokenize(item.key));
        const valTokens = new Set(tokenize(item.value));
        const tags = item.tags ? new Set(item.tags.map(t => t.toLowerCase())) : new Set<string>();

        let tokenMatchCount = 0;
        let exactKeyMatch = false;

        if (item.key.toLowerCase().includes(query.toLowerCase())) {
          score += 4.0;
          exactKeyMatch = true;
          matchReasons.push('Exact Key Match');
        }

        for (const qt of queryTokens) {
          if (keyTokens.has(qt)) {
            tokenMatchCount += 2.0;
          }
          if (valTokens.has(qt)) {
            tokenMatchCount += 1.0;
          }
          if (tags.has(qt)) {
            tokenMatchCount += 1.5;
            matchReasons.push(`Tag Match (#${qt})`);
          }
        }

        if (tokenMatchCount > 0) {
          score += tokenMatchCount;
          if (!exactKeyMatch) matchReasons.push(`Token Overlap (${tokenMatchCount.toFixed(1)})`);
        } else if (!exactKeyMatch && !item.isPinned) {
          // If query provided but zero token matches and not pinned, drop
          continue;
        }
      }

      // 4. Recency Decay (S_decay = e^(-lambda * dt_days))
      const ageInDays = Math.max(0, (now - (item.lastAccessedAt || item.timestamp)) / (1000 * 60 * 60 * 24));
      const decayFactor = Math.exp(-0.05 * ageInDays); // Gentle 30-day half-life decay
      score += decayFactor * recencyWeight * 2.0;

      results.push({
        item,
        score: Math.round(score * 100) / 100,
        matchReasons
      });
    }

    // Sort descending by calculated score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Deduplication & Conflict Detection
   * Evaluates if a new memory should update an existing entry or be created fresh.
   */
  public static findConflictOrDuplicate(
    existing: MemoryItem[],
    newKey: string,
    newValue: string
  ): { status: 'EXACT_DUPLICATE' | 'UPDATE_EXISTING' | 'NEW_RECORD'; existingItem?: MemoryItem } {
    const cleanKey = newKey.trim().toLowerCase();
    const cleanVal = newValue.trim().toLowerCase();

    for (const item of existing) {
      const itemKey = item.key.trim().toLowerCase();
      const itemVal = item.value.trim().toLowerCase();

      // Exact match on both key and value
      if (itemKey === cleanKey && itemVal === cleanVal) {
        return { status: 'EXACT_DUPLICATE', existingItem: item };
      }

      // Exact key match with different value -> Update existing
      if (itemKey === cleanKey) {
        return { status: 'UPDATE_EXISTING', existingItem: item };
      }

      // High semantic similarity on key (> 0.8)
      if (calculateSimilarity(itemKey, cleanKey) > 0.8) {
        return { status: 'UPDATE_EXISTING', existingItem: item };
      }
    }

    return { status: 'NEW_RECORD' };
  }

  /**
   * Conservative Auto-Memory Extractor
   * Only triggers when the user explicitly asks to remember, or states a high-confidence permanent fact.
   * Rejects ephemeral chat messages, questions, and transient statements.
   */
  public static analyzeForMemoryExtraction(text: string): MemoryExtractionResult {
    const clean = text.trim();
    if (!clean || clean.length < 5) {
      return { shouldMemorize: false, confidence: 0 };
    }

    const lower = clean.toLowerCase();

    // 1. Explicit Memory Triggers (English + Hindi) (High Confidence >= 0.95)
    // English Examples: "Remember that my main AI project is called Mayra", "Mayra, note down my car license is ABC-123"
    // Hindi Examples: "याद रखो कि मेरी AI प्रोजेक्ट का नाम Mayra है", "Mayra yaad rakhna ki mera project Mayra hai"
    const explicitRegex = /^(?:mayra[,\s]+)?(?:please\s+)?(?:remember|note down|save to memory|keep in mind|never forget|yaad rakhna|yaad rakho|dhyan rakhna|याद रखो|याद रखना|नोट कर लो)\s+(?:that\s+|ki\s+|कि\s+)?(.+)$/i;
    const explicitMatch = clean.match(explicitRegex);
    if (explicitMatch && explicitMatch[1]) {
      const statement = explicitMatch[1].trim();
      const keyVal = this.parseFactStatement(statement);
      return {
        shouldMemorize: true,
        key: keyVal.key,
        value: keyVal.value,
        category: keyVal.category,
        importance: 5,
        tags: ['explicit_recall', keyVal.category],
        confidence: 0.98,
        reason: 'Explicit user command to remember'
      };
    }

    // 2. Strong User Preference Statements (Confidence >= 0.85)
    // Examples: "I prefer dark mode always", "My favorite coffee is cappuccino"
    const prefRegex = /^(?:i prefer|my favorite|i always use|my preferred|i like my)\s+([^,.]+?)\s+(?:to be|is|as|always)\s+([^,.]+)/i;
    const prefMatch = clean.match(prefRegex);
    if (prefMatch && prefMatch[1] && prefMatch[2]) {
      return {
        shouldMemorize: true,
        key: `User Preference: ${prefMatch[1].trim()}`,
        value: prefMatch[2].trim(),
        category: 'preference',
        importance: 4,
        tags: ['preference', 'user_choice'],
        confidence: 0.88,
        reason: 'Clear persistent user preference'
      };
    }

    // 3. Core Personal Identity / Contact / Family Facts (Confidence >= 0.85)
    // Examples: "My phone number is +123456", "My father's name is Robert"
    const personalRegex = /^(?:my|our)\s+([a-zA-Z\s]{3,25})\s+(?:is|are)\s+([^,.]+)/i;
    const personalMatch = clean.match(personalRegex);
    if (personalMatch && personalMatch[1] && personalMatch[2]) {
      const subject = personalMatch[1].trim().toLowerCase();
      // Only capture persistent nouns, avoid temporary feelings (e.g. "my head is hurting")
      const permanentSubjects = ['name', 'wife', 'husband', 'son', 'daughter', 'father', 'mother', 'brother', 'sister', 'phone', 'email', 'address', 'birthday', 'car', 'city', 'office', 'profession', 'role', 'blood group', 'allergies'];
      
      const isPermanent = permanentSubjects.some(p => subject.includes(p));
      if (isPermanent) {
        return {
          shouldMemorize: true,
          key: `User ${personalMatch[1].trim()}`,
          value: personalMatch[2].trim(),
          category: 'personal',
          importance: 4,
          tags: ['personal_identity', subject],
          confidence: 0.90,
          reason: 'Permanent personal relationship or identity fact'
        };
      }
    }

    // Default: Reject ephemeral message
    return { shouldMemorize: false, confidence: 0.1 };
  }

  /**
   * Helper to parse a freeform fact statement into a clean key and value
   */
  private static parseFactStatement(statement: string): { key: string; value: string; category: MemoryCategory } {
    const isProject = /project|repo|codebase|app|build|architecture|api/i.test(statement);
    const isTask = /task|todo|schedule|deadline|meeting/i.test(statement);
    const isPref = /prefer|like|always|theme|color|voice/i.test(statement);

    let category: MemoryCategory = 'personal';
    if (isProject) category = 'project';
    else if (isTask) category = 'task';
    else if (isPref) category = 'preference';

    // Check for "X is Y" or "X: Y" structure
    const isMatch = statement.match(/^(.+?)\s+(?:is|are|=|:)\s+(.+)$/i);
    if (isMatch && isMatch[1] && isMatch[2]) {
      return {
        key: isMatch[1].trim(),
        value: isMatch[2].trim(),
        category
      };
    }

    return {
      key: statement.length > 30 ? `${statement.slice(0, 27)}...` : statement,
      value: statement,
      category
    };
  }

  /**
   * Context Window Injector
   * Selects the most relevant memories for the current prompt and formats them
   * into a lightweight context block to prepend to the assistant system instructions.
   */
  public static buildPromptContext(memories: MemoryItem[], userQuery: string, maxTokens: number = 5): string {
    if (!memories || memories.length === 0) return '';

    // Search top relevant memories
    const matches = this.search(memories, {
      query: userQuery,
      limit: maxTokens,
      minImportance: 2
    });

    if (matches.length === 0) return '';

    const lines = matches.map(m => `- [${m.item.category.toUpperCase()}] ${m.item.key}: ${m.item.value}`);

    return `\n<memory_vault>\nRelevant Long-Term Memory:\n${lines.join('\n')}\n</memory_vault>\n`;
  }
}
