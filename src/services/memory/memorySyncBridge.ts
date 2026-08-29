/**
 * Bidirectional Memory Sync Bridge (MAYRA ↔ STONICX)
 * 
 * Auto-extracts key facts, project variables, and code paths from conversations,
 * synchronizing them into MEMORY.md, DAILY-NOTE.md, and VAULT-INDEX.md.
 * Injects shared contextual summaries into LLM system prompts for both brains.
 */

import { MemoryVaultManager } from './memoryVaultManager';

export interface ExtractedFact {
  category: 'preference' | 'technical' | 'project' | 'identity' | 'routine';
  fact: string;
  tag: string;
}

export class MemorySyncBridge {
  private static instance: MemorySyncBridge | null = null;
  private vault: MemoryVaultManager;

  private constructor() {
    this.vault = MemoryVaultManager.getInstance();
  }

  public static getInstance(): MemorySyncBridge {
    if (!this.instance) {
      this.instance = new MemorySyncBridge();
    }
    return this.instance;
  }

  /**
   * Automatically analyzes an exchange and syncs extracted facts to the shared vault
   */
  public async syncConversationTurn(
    speaker: 'MAYRA' | 'STONICX',
    userPrompt: string,
    assistantReply: string
  ): Promise<void> {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Append raw interaction to DAILY-NOTE.md
    const logSummary = `User: "${userPrompt.slice(0, 100)}" -> ${speaker}: "${assistantReply.slice(0, 120)}"`;
    await this.vault.appendDailyLog(logSummary, speaker);

    // 2. Heuristic Fact Extraction
    const extractedFacts = this.extractFactsFromTurn(userPrompt, assistantReply, speaker);
    for (const factItem of extractedFacts) {
      await this.vault.appendMemoryFact(factItem.category, factItem.fact, speaker);
    }
  }

  /**
   * Fast rule-based fact and preference extractor
   */
  private extractFactsFromTurn(
    prompt: string,
    reply: string,
    speaker: 'MAYRA' | 'STONICX'
  ): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const lowerPrompt = prompt.toLowerCase();
    const lowerReply = reply.toLowerCase();

    // User preference detection
    if (lowerPrompt.includes('mera naam') || lowerPrompt.includes('my name is') || lowerPrompt.includes('call me')) {
      const match = prompt.match(/(?:my name is|mera naam|call me)\s+([A-Za-z0-9_]+)/i);
      if (match && match[1]) {
        facts.push({
          category: 'identity',
          fact: `User Preferred Name is "${match[1]}"`,
          tag: '#identity'
        });
      }
    }

    // Technical / Code file creation detection
    if (lowerPrompt.includes('create file') || lowerPrompt.includes('code in') || lowerPrompt.includes('refactor') || lowerPrompt.includes('component')) {
      const fileMatch = prompt.match(/([a-zA-Z0-9_\-/\\]+\.(?:ts|tsx|js|jsx|json|md|py|css|html))/i);
      if (fileMatch && fileMatch[1]) {
        facts.push({
          category: 'technical',
          fact: `Active codebase file referenced: ${fileMatch[1]}`,
          tag: '#codebase'
        });
      }
    }

    // Project goal detection
    if (lowerPrompt.includes('project') || lowerPrompt.includes('app goal') || lowerPrompt.includes('hum bana rahe')) {
      facts.push({
        category: 'project',
        fact: `Project context updated: ${prompt.slice(0, 80)}`,
        tag: '#project'
      });
    }

    return facts;
  }

  /**
   * Generates a dynamic markdown context injection string for system prompts
   */
  public generateSystemContextPrompt(targetBrain: 'MAYRA' | 'STONICX'): string {
    const memoryDoc = this.vault.getDocument('MEMORY.md');
    const dailyDoc = this.vault.getDocument('DAILY-NOTE.md');

    // Slice recent daily notes (last 800 chars)
    const recentDaily = dailyDoc.length > 800 ? '...' + dailyDoc.slice(-800) : dailyDoc;

    return `\n\n--- [UNIFIED SHARED MEMORY VAULT: ${targetBrain}] ---
The following persistent memories and session notes are shared live between MAYRA and STONICX:

### CORE PERSISTENT KNOWLEDGE (MEMORY.md):
${memoryDoc}

### RECENT TIMELINE & ACTIONS (DAILY-NOTE.md):
${recentDaily}
----------------------------------------------------\n`;
  }
}
