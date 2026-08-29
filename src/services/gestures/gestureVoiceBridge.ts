import { BarehandsTracker } from './barehandsTracker';
import { GestureUsageService } from './gestureUsageService';
import { StageStateManager } from '../stage/stageStateManager';
import { StagePhysicsEngine } from '../stage/stagePhysicsEngine';

export interface VoiceGestureParseResult {
  isMatch: boolean;
  intent: 'ON' | 'OFF' | 'STAGE_OPEN' | 'STAGE_CLEAR' | null;
  command: string;
}

export interface VoiceGestureExecutionResult {
  handled: boolean;
  intent: 'ON' | 'OFF' | 'STAGE_OPEN' | 'STAGE_CLEAR' | null;
  replyText: string;
  isGestureActive: boolean;
}

/**
 * Voice Activation Bridge for MediaPipe Gesture System (Backtalk signal model)
 * Handles bidirectional voice triggers ("gesture chalu karo", "gesture band karo", "show workspace", "stage kholo", "clear canvas", "sab saaf karo", etc.)
 * with zero modification to 3D avatar layers or core personality.
 */
export class GestureVoiceBridge {
  private static isGestureSystemActive: boolean = false;
  private static listeners: Set<(isActive: boolean) => void> = new Set();

  private static readonly ON_INTENT_PATTERNS: string[] = [
    'gesture chalu karo',
    'gesture chalu kijiye',
    'gestures chalu karo',
    'gesture start karo',
    'turn on gestures',
    'turn on gesture',
    'start hand tracking',
    'enable hand tracking',
    'enable gestures',
    'enable gesture',
    'gesture on',
    'gestures on',
    'start gestures',
    'gesture mode on',
    'hand tracking on',
    'hand tracking chalu karo',
    'hand tracking start karo',
    'mayra gesture chalu karo',
    'mayra turn on gestures'
  ];

  private static readonly OFF_INTENT_PATTERNS: string[] = [
    'gesture band karo',
    'gesture band kijiye',
    'gestures band karo',
    'gesture stop karo',
    'turn off gestures',
    'turn off gesture',
    'stop tracking',
    'stop hand tracking',
    'disable hand tracking',
    'disable gestures',
    'disable gesture',
    'gesture off',
    'gestures off',
    'stop gestures',
    'gesture mode off',
    'hand tracking off',
    'hand tracking band karo',
    'hand tracking stop karo',
    'mayra gesture band karo',
    'mayra turn off gestures'
  ];

  private static readonly STAGE_OPEN_PATTERNS: string[] = [
    'show workspace',
    'open workspace',
    'stage kholo',
    'open stage',
    'workspace kholo',
    'stage canvas',
    'show stage'
  ];

  private static readonly STAGE_CLEAR_PATTERNS: string[] = [
    'clear canvas',
    'clear workspace',
    'sab saaf karo',
    'canvas saaf karo',
    'workspace reset karo',
    'reset canvas'
  ];

  public static isSystemActive(): boolean {
    return this.isGestureSystemActive;
  }

  public static setSystemActive(active: boolean): void {
    this.isGestureSystemActive = active;
    this.listeners.forEach((listener) => {
      try {
        listener(active);
      } catch (err) {
        console.error('[GestureVoiceBridge] Listener error:', err);
      }
    });
  }

  public static subscribe(listener: (isActive: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isGestureSystemActive);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Evaluates text transcript for gesture voice activation / deactivation intents
   */
  public static parseIntent(transcript: string): VoiceGestureParseResult {
    if (!transcript) {
      return { isMatch: false, intent: null, command: '' };
    }

    const clean = transcript
      .toLowerCase()
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '')
      .replace(/\s+/g, ' ');

    // Check Stage Open Intents
    for (const pattern of this.STAGE_OPEN_PATTERNS) {
      if (clean === pattern || clean.includes(pattern)) {
        return { isMatch: true, intent: 'STAGE_OPEN', command: pattern };
      }
    }

    // Check Stage Clear Intents
    for (const pattern of this.STAGE_CLEAR_PATTERNS) {
      if (clean === pattern || clean.includes(pattern)) {
        return { isMatch: true, intent: 'STAGE_CLEAR', command: pattern };
      }
    }

    // Check ON Intents
    for (const pattern of this.ON_INTENT_PATTERNS) {
      if (clean === pattern || clean.includes(pattern)) {
        return { isMatch: true, intent: 'ON', command: pattern };
      }
    }

    // Check OFF Intents
    for (const pattern of this.OFF_INTENT_PATTERNS) {
      if (clean === pattern || clean.includes(pattern)) {
        return { isMatch: true, intent: 'OFF', command: pattern };
      }
    }

    return { isMatch: false, intent: null, command: '' };
  }

  /**
   * Executes voice gesture toggle command: starts/stops camera and returns Hindi/English TTS response
   */
  public static async executeVoiceCommand(
    transcript: string,
    onStateToggle?: (enabled: boolean) => void
  ): Promise<VoiceGestureExecutionResult> {
    const parsed = this.parseIntent(transcript);

    if (!parsed.isMatch || !parsed.intent) {
      return {
        handled: false,
        intent: null,
        replyText: '',
        isGestureActive: this.isGestureSystemActive
      };
    }

    const isHindi =
      transcript.includes('karo') ||
      transcript.includes('chalu') ||
      transcript.includes('band') ||
      transcript.includes('kijiye') ||
      transcript.includes('kholo') ||
      transcript.includes('saaf');

    if (parsed.intent === 'STAGE_OPEN') {
      StagePhysicsEngine.getInstance().setConfig({ isOpen: true });
      const replyText = isHindi ? 'Virtual workspace khol diya hai.' : 'Virtual workspace stage opened.';
      return {
        handled: true,
        intent: 'STAGE_OPEN',
        replyText,
        isGestureActive: this.isGestureSystemActive
      };
    }

    if (parsed.intent === 'STAGE_CLEAR') {
      StagePhysicsEngine.getInstance().handleClapClear();
      const replyText = isHindi ? 'Workspace canvas saaf kar diya hai.' : 'Workspace canvas cleared.';
      return {
        handled: true,
        intent: 'STAGE_CLEAR',
        replyText,
        isGestureActive: this.isGestureSystemActive
      };
    }

    if (parsed.intent === 'ON') {
      console.log(`[VoiceBridge] Command matched: "${parsed.command}" -> Camera Stream Initialized`);
      console.log(`[VoiceBridge] Intent matched: "${parsed.command}" -> MediaStream Active`);

      this.setSystemActive(true);
      if (onStateToggle) onStateToggle(true);

      const tracker = BarehandsTracker.getInstance();
      await tracker.start();
      GestureUsageService.incrementTodayGestureCount('Voice Triggered Activation');

      const replyText = isHindi
        ? 'Gesture mode active ho gaya hai.'
        : 'Gesture mode has been activated.';

      return {
        handled: true,
        intent: 'ON',
        replyText,
        isGestureActive: true
      };
    } else {
      console.log(`[VoiceBridge] Command matched: "${parsed.command}" -> Camera Stream Released`);
      console.log(`[VoiceBridge] Intent matched: "${parsed.command}" -> MediaStream Released`);

      this.setSystemActive(false);
      if (onStateToggle) onStateToggle(false);

      const tracker = BarehandsTracker.getInstance();
      tracker.stop();

      const replyText = isHindi
        ? 'Gesture mode band kar diya hai.'
        : 'Gesture mode has been deactivated.';

      return {
        handled: true,
        intent: 'OFF',
        replyText,
        isGestureActive: false
      };
    }
  }
}
