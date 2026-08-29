/**
 * Dynamic Intent Classifier for MAYRA <-> STONICX Delegation
 * 
 * Analyzes user prompts to categorize requests into:
 * - COMPANION / GENERAL -> Handled by MAYRA (Conversational, daily updates, reminders, emotional check-ins, light Q&A)
 * - TECHNICAL / WORK -> Handled by STONICX (Code generation, debugging, terminal ops, architecture design, memory vault indexing, canvas blueprint edits)
 * - DIRECT_SWITCH -> Explicit voice/text commands to swap active brain
 */

export type PersonaTarget = 'MAYRA' | 'STONICX';
export type IntentTrack = 'COMPANION' | 'GENERAL' | 'TECHNICAL' | 'WORK' | 'DIRECT_SWITCH';
export type SwitchDirection = 'TO_STONICX' | 'TO_MAYRA';

export interface ClassificationResult {
  targetPersona: PersonaTarget;
  track: IntentTrack;
  confidence: number;
  matchedKeywords: string[];
  isDirectSwitch: boolean;
  switchDirection?: SwitchDirection;
  reason: string;
  suggestedPrompt?: string;
}

// 1. Explicit Direct Voice & Text Switch Triggers
export const STONICX_SWITCH_TRIGGERS: string[] = [
  'switch to stonicx',
  'stonicx mode on',
  'stonicx se baat karao',
  'talk to stonicx',
  'open stonicx',
  'enable stonicx',
  'activate stonicx',
  'connect stonicx',
  'delegate to stonicx',
  'stonicx ko bulao',
  'stonicx shuru karo',
  'stonicx mode',
  'stonicx on',
  'launch stonicx'
];

export const MAYRA_SWITCH_TRIGGERS: string[] = [
  'switch to mayra',
  'mayra mode on',
  'mayra wapas aao',
  'talk to mayra',
  'open mayra',
  'enable mayra',
  'activate mayra',
  'back to mayra',
  'return to mayra',
  'connect mayra',
  'mayra ko bulao',
  'mayra se baat karao',
  'mayra on',
  'mayra mode',
  'launch mayra'
];

// 2. Natural Language Trigger Keywords for Technical / STONICX Workload
export const STONICX_TECHNICAL_KEYWORDS: string[] = [
  'code',
  'debug',
  'terminal',
  'system',
  'circuit',
  'architecture',
  'analyze codebase',
  'stonicx',
  'technical task',
  'refactor',
  'bug',
  'compiler',
  'api',
  'database',
  'sql',
  'git',
  'deploy',
  'algorithm',
  'python',
  'typescript',
  'javascript',
  'rust',
  'c++',
  'kotlin',
  'java',
  'html',
  'css',
  'backend',
  'frontend',
  'kernel',
  'linux',
  'function',
  'pull request',
  'syntax error',
  'stack trace',
  'memory leak',
  'binary tree',
  'rest api',
  'websocket',
  'docker',
  'kubernetes',
  'regex',
  'endpoint',
  'graphql',
  'async',
  'multithreading',
  'blueprint'
];

// 3. Technical code syntax patterns (regex checks)
const CODE_SYNTAX_PATTERNS = [
  /\bfunction\s*\(/i,
  /\bconst\s+[a-zA-Z0-9_$]+\s*=/i,
  /\blet\s+[a-zA-Z0-9_$]+\s*=/i,
  /\bimport\s+.*\s+from\s+['"]/i,
  /\bclass\s+[a-zA-Z0-9_$]+\s*\{/i,
  /\bdef\s+[a-zA-Z0-9_]+\s*\(/i,
  /\bconsole\.log\(/i,
  /\bSELECT\s+.*\s+FROM\s+/i,
  /\bINSERT\s+INTO\s+/i,
  /\bgit\s+(commit|push|pull|checkout|clone|status|branch)/i,
  /\bnpm\s+(install|run|start|build|test)/i,
  /\bdocker\s+(run|build|ps|exec)/i,
  /```[\s\S]*?```/,
  /\{\s*[\w\d_$]+\s*:\s*[\w\d_$]+\s*\}/
];

export class IntentClassifier {
  /**
   * Classifies an incoming user prompt into MAYRA (Companion/General) or STONICX (Technical/Work)
   */
  public static classifyIntent(
    prompt: string,
    currentPersona: PersonaTarget = 'MAYRA'
  ): ClassificationResult {
    const raw = (prompt || '').trim();
    const lower = raw.toLowerCase();

    if (!raw) {
      return {
        targetPersona: currentPersona,
        track: 'GENERAL',
        confidence: 1.0,
        matchedKeywords: [],
        isDirectSwitch: false,
        reason: 'Empty prompt defaults to current active persona'
      };
    }

    // A. Check for Direct Persona Switch Commands
    // 1. Switch to STONICX
    const matchedStonicxSwitch = STONICX_SWITCH_TRIGGERS.find((trigger) =>
      lower === trigger || lower.includes(trigger)
    );
    if (matchedStonicxSwitch) {
      return {
        targetPersona: 'STONICX',
        track: 'DIRECT_SWITCH',
        confidence: 0.99,
        matchedKeywords: [matchedStonicxSwitch],
        isDirectSwitch: true,
        switchDirection: 'TO_STONICX',
        reason: `Explicit direct switch trigger matched: "${matchedStonicxSwitch}"`
      };
    }

    // 2. Switch to MAYRA
    const matchedMayraSwitch = MAYRA_SWITCH_TRIGGERS.find((trigger) =>
      lower === trigger || lower.includes(trigger)
    );
    if (matchedMayraSwitch) {
      return {
        targetPersona: 'MAYRA',
        track: 'DIRECT_SWITCH',
        confidence: 0.99,
        matchedKeywords: [matchedMayraSwitch],
        isDirectSwitch: true,
        switchDirection: 'TO_MAYRA',
        reason: `Explicit direct switch trigger matched: "${matchedMayraSwitch}"`
      };
    }

    // B. Check for Technical Keywords & Code Patterns
    const matchedKeywords: string[] = [];
    let technicalScore = 0;

    for (const kw of STONICX_TECHNICAL_KEYWORDS) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lower)) {
        matchedKeywords.push(kw);
        // Core indicators weigh higher
        if (['stonicx', 'analyze codebase', 'circuit', 'architecture', 'terminal', 'debug', 'code', 'technical task'].includes(kw)) {
          technicalScore += 0.45;
        } else {
          technicalScore += 0.25;
        }
      }
    }

    // Check code syntax patterns
    let syntaxMatches = 0;
    for (const pattern of CODE_SYNTAX_PATTERNS) {
      if (pattern.test(raw)) {
        syntaxMatches++;
        technicalScore += 0.35;
      }
    }
    if (syntaxMatches > 0) {
      matchedKeywords.push(`code_syntax_pattern(${syntaxMatches})`);
    }

    // Normalize confidence
    const confidence = Math.min(1.0, Math.max(0.1, technicalScore));

    // Threshold decision: If technical score >= 0.40, delegate to STONICX
    if (technicalScore >= 0.40) {
      return {
        targetPersona: 'STONICX',
        track: 'TECHNICAL',
        confidence: parseFloat(confidence.toFixed(2)),
        matchedKeywords,
        isDirectSwitch: false,
        reason: `Technical workload detected with keywords [${matchedKeywords.join(', ')}]`
      };
    }

    // Check for Companion/Emotional/Daily prompts
    const isCompanion = lower.includes('how are you') || 
                        lower.includes('kaise ho') || 
                        lower.includes('good morning') || 
                        lower.includes('good night') || 
                        lower.includes('friend') || 
                        lower.includes('feel') || 
                        lower.includes('kya haal') || 
                        lower.includes('weather') || 
                        lower.includes('mausam') || 
                        lower.includes('joke') || 
                        lower.includes('kahani') || 
                        lower.includes('reminder');

    return {
      targetPersona: 'MAYRA',
      track: isCompanion ? 'COMPANION' : 'GENERAL',
      confidence: parseFloat((1.0 - Math.min(0.5, technicalScore)).toFixed(2)),
      matchedKeywords: isCompanion ? ['companion_indicators'] : [],
      isDirectSwitch: false,
      reason: isCompanion ? 'Conversational / Companion request' : 'General non-technical request handled by MAYRA'
    };
  }
}
