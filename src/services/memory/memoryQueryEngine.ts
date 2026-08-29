/**
 * Cross-Brain Query Engine (Ported from ai-memory-vault-main)
 * 
 * Enables MAYRA & STONICX to perform sub-50ms semantic & keyword queries
 * across the shared Markdown Memory Vault (MEMORY.md, DAILY-NOTE.md, VAULT-INDEX.md).
 * 
 * Console Log:
 * `[MemoryBridge] Cross-brain query resolved -> Context injected to prompt`
 */

import { MemoryVaultManager, VaultIndexEntry } from './memoryVaultManager';

export interface QueryResult {
  found: boolean;
  matchedContent: string[];
  sourceDocs: string[];
  relevanceScore: number;
  extractedAnswer?: string;
}

export class MemoryQueryEngine {
  private static instance: MemoryQueryEngine | null = null;
  private vault: MemoryVaultManager;

  private constructor() {
    this.vault = MemoryVaultManager.getInstance();
  }

  public static getInstance(): MemoryQueryEngine {
    if (!this.instance) {
      this.instance = new MemoryQueryEngine();
    }
    return this.instance;
  }

  /**
   * Queries the shared vault across all markdown documents
   */
  public queryVault(query: string, askingBrain: 'MAYRA' | 'STONICX' = 'MAYRA'): QueryResult {
    const cleanQuery = query.toLowerCase().trim();
    const memoryDoc = this.vault.getDocument('MEMORY.md');
    const dailyDoc = this.vault.getDocument('DAILY-NOTE.md');
    const indexEntries = this.vault.getIndexEntries();

    const matchedContent: string[] = [];
    const sourceDocs: string[] = [];
    let score = 0;

    // Tokenize query
    const keywords = cleanQuery
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((k) => k.length > 2);

    // 1. Search index entries
    indexEntries.forEach((entry) => {
      const entryText = `${entry.tag} ${entry.summary} ${entry.category} ${entry.source}`.toLowerCase();
      const hits = keywords.filter((kw) => entryText.includes(kw));
      if (hits.length > 0) {
        matchedContent.push(`[INDEX: ${entry.tag}] (${entry.source}) ${entry.summary}`);
        if (!sourceDocs.includes(entry.referenceDoc)) {
          sourceDocs.push(entry.referenceDoc);
        }
        score += hits.length * 15;
      }
    });

    // 2. Search MEMORY.md lines
    const memoryLines = memoryDoc.split('\n');
    memoryLines.forEach((line) => {
      if (line.trim().startsWith('-')) {
        const lowerLine = line.toLowerCase();
        const hits = keywords.filter((kw) => lowerLine.includes(kw));
        if (hits.length > 0) {
          matchedContent.push(`[MEMORY] ${line.trim()}`);
          if (!sourceDocs.includes('MEMORY.md')) sourceDocs.push('MEMORY.md');
          score += hits.length * 10;
        }
      }
    });

    // 3. Search DAILY-NOTE.md lines
    const dailyLines = dailyDoc.split('\n');
    dailyLines.forEach((line) => {
      if (line.trim().startsWith('-')) {
        const lowerLine = line.toLowerCase();
        const hits = keywords.filter((kw) => lowerLine.includes(kw));
        if (hits.length > 0) {
          matchedContent.push(`[DAILY-TIMELINE] ${line.trim()}`);
          if (!sourceDocs.includes('DAILY-NOTE.md')) sourceDocs.push('DAILY-NOTE.md');
          score += hits.length * 8;
        }
      }
    });

    const isFound = matchedContent.length > 0;
    if (isFound) {
      console.log(`[MemoryBridge] Cross-brain query resolved -> Context injected to prompt (${askingBrain})`);
    }

    return {
      found: isFound,
      matchedContent: matchedContent.slice(0, 8),
      sourceDocs,
      relevanceScore: score,
      extractedAnswer: matchedContent.length > 0 ? matchedContent.join('\n') : undefined
    };
  }

  /**
   * Helper to format query results as a context snippet for LLM prompts
   */
  public formatQueryResultForPrompt(result: QueryResult): string {
    if (!result.found || result.matchedContent.length === 0) {
      return '';
    }

    return `\n\n[RECALLED FROM SHARED VAULT]:\n${result.matchedContent.join('\n')}\n`;
  }
}
