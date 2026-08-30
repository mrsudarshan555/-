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

// 3. Clear Conversational & Companion Triggers
export const COMPANION_TRIGGERS: string[] = [
  'how are you',
  'kaise ho',
  'kaisi ho',
  'kya haal',
  'kya hal',
  'kya chal raha hai',
  'good morning',
  'good night',
  'good evening',
  'good afternoon',
  'shubh prabhat',
  'shubh ratri',
  'joke sunao',
  'tell me a joke',
  'kahani sunao',
  'tell me a story',
  'sing a song',
  'gana gao',
  'i love you',
  'feeling sad',
  'feeling happy',
  'are you happy',
  'are you sad',
  'cheer me up',
  'friend',
  'feeling lonely',
  'miss you'
];

// 4. Technical code syntax patterns (regex checks)
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
    const isTechnical = technicalScore >= 0.40;

    // Check for clear Companion/Emotional/Daily prompts
    const matchedCompanion = COMPANION_TRIGGERS.find((t) => lower.includes(t));

    // C. Autonomous Routing Decision based on current active persona
    if (currentPersona === 'STONICX') {
      // If currently STONICX:
      // 1. If companion trigger is matched -> delegate/switch to MAYRA
      if (matchedCompanion) {
        return {
          targetPersona: 'MAYRA',
          track: 'COMPANION',
          confidence: 0.90,
          matchedKeywords: [matchedCompanion],
          isDirectSwitch: false,
          reason: `Companion request "${matchedCompanion}" routed to MAYRA`
        };
      }

      // 2. All other queries (technical or general/ambiguous like "aaj mausam kaisa hai") remain with STONICX!
      return {
        targetPersona: 'STONICX',
        track: isTechnical ? 'TECHNICAL' : 'GENERAL',
        confidence: isTechnical ? parseFloat(confidence.toFixed(2)) : 0.85,
        matchedKeywords,
        isDirectSwitch: false,
        reason: isTechnical
          ? `Technical workload detected with keywords [${matchedKeywords.join(', ')}]`
          : 'General query retained and answered directly by STONICX'
      };
    }

    // If currently MAYRA:
    // 1. If technical score meets threshold -> delegate to STONICX
    if (isTechnical) {
      return {
        targetPersona: 'STONICX',
        track: 'TECHNICAL',
        confidence: parseFloat(confidence.toFixed(2)),
        matchedKeywords,
        isDirectSwitch: false,
        reason: `Technical workload detected with keywords [${matchedKeywords.join(', ')}]`
      };
    }

    // 2. All other queries (companion or general) remain with MAYRA
    return {
      targetPersona: 'MAYRA',
      track: matchedCompanion ? 'COMPANION' : 'GENERAL',
      confidence: parseFloat((1.0 - Math.min(0.5, technicalScore)).toFixed(2)),
      matchedKeywords: matchedCompanion ? [matchedCompanion] : [],
      isDirectSwitch: false,
      reason: matchedCompanion
        ? `Conversational companion request "${matchedCompanion}" handled by MAYRA`
        : 'General query handled directly by MAYRA'
    };
  }
}
