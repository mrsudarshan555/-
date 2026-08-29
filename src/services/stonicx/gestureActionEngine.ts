/**
 * Gesture-to-Workflow Action Engine for STONICX
 * 
 * Binds MediaPipe Physical Gestures directly into autonomous execution routines:
 * - GESTURE_THROW -> Execution Dispatcher (Compile / Run / Export code payload)
 * - GESTURE_CLAP_CLEAR -> Workspace Flush (Clear terminal logs, reset buffers)
 * - GESTURE_FIST_HOLD -> Emergency Execution Freeze / Pause latch
 * - GESTURE_PINCH_DRAG -> Dynamic technical canvas inspection / panning
 */

import { GestureEventBus } from '../gestures/gestureEventBus';
import { 
  GestureThrowPayload, 
  GestureClapClearPayload, 
  GestureFistHoldPayload 
} from '../../types/gestures';
import { PersonaSwitchBridge } from '../router/personaSwitchBridge';
import { RouterStateBus } from '../router/routerStateBus';

export interface GestureActionCallbacks {
  onExecutePayload?: (targetId?: string) => void;
  onClearWorkspace?: () => void;
  onToggleExecutionPause?: (isPaused: boolean) => void;
  onPinchDrag?: (x: number, y: number) => void;
}

export class StonicxGestureActionEngine {
  private static instance: StonicxGestureActionEngine | null = null;
  private isExecutionPaused = false;
  private unsubscribers: Array<() => void> = [];
  private callbacks: GestureActionCallbacks = {};
  private isSpeaking = false;
  private lastActionTime = 0;

  public static getInstance(): StonicxGestureActionEngine {
    if (!this.instance) {
      this.instance = new StonicxGestureActionEngine();
    }
    return this.instance;
  }

  /**
   * Initializes gesture event bus listeners for STONICX workflow bindings
   */
  public initialize(callbacks: GestureActionCallbacks = {}): void {
    this.cleanup();
    this.callbacks = callbacks;

    const bus = GestureEventBus.getInstance();

    // 1. GESTURE_THROW -> Execute code payload
    const unsubThrow = bus.on('GESTURE_THROW', (payload: GestureThrowPayload) => {
      this.handleGestureThrow(payload);
    });

    // 2. GESTURE_CLAP_CLEAR -> Clear terminal and canvas buffers
    const unsubClap = bus.on('GESTURE_CLAP_CLEAR', (payload: GestureClapClearPayload) => {
      this.handleGestureClapClear(payload);
    });

    // 3. GESTURE_FIST_HOLD -> Emergency Freeze / Pause Latch
    const unsubFist = bus.on('GESTURE_FIST_HOLD', (payload: GestureFistHoldPayload) => {
      this.handleGestureFistHold(payload);
    });

    this.unsubscribers.push(unsubThrow, unsubClap, unsubFist);
  }

  /**
   * Handles GESTURE_THROW execution trigger
   */
  public handleGestureThrow(payload?: GestureThrowPayload): void {
    const now = Date.now();
    if (now - this.lastActionTime < 1000) return; // Debounce
    this.lastActionTime = now;

    console.log('[STONICX Engine] Action Triggered via GESTURE_THROW -> Executing Task');

    if (this.callbacks.onExecutePayload) {
      this.callbacks.onExecutePayload(payload?.targetId);
    }

    // Charon verbal confirmation
    this.speakFeedback('Payload dispatched for execution.');
  }

  /**
   * Handles GESTURE_CLAP_CLEAR workspace buffer reset
   */
  public handleGestureClapClear(payload?: GestureClapClearPayload): void {
    const now = Date.now();
    if (now - this.lastActionTime < 1000) return;
    this.lastActionTime = now;

    console.log('[GestureEngine] CLAP detected -> Workspace Cleared');

    if (this.callbacks.onClearWorkspace) {
      this.callbacks.onClearWorkspace();
    }

    // Charon verbal confirmation
    this.speakFeedback('Workspace buffer cleared.');
  }

  /**
   * Handles GESTURE_FIST_HOLD emergency pause
   */
  public handleGestureFistHold(payload?: GestureFistHoldPayload): void {
    const now = Date.now();
    if (now - this.lastActionTime < 1200) return;
    this.lastActionTime = now;

    this.isExecutionPaused = !this.isExecutionPaused;
    console.log(`[GestureEngine] FIST detected -> Freeze Triggered (${this.isExecutionPaused ? 'PAUSED' : 'RESUMED'})`);

    if (this.callbacks.onToggleExecutionPause) {
      this.callbacks.onToggleExecutionPause(this.isExecutionPaused);
    }

    const feedback = this.isExecutionPaused ? 'Execution paused.' : 'Execution resumed.';
    this.speakFeedback(feedback);
  }

  /**
   * Speaks authoritative verbal feedback using Charon TTS
   */
  private async speakFeedback(text: string): Promise<void> {
    if (this.isSpeaking) return;
    this.isSpeaking = true;

    try {
      await PersonaSwitchBridge.speakCharonVoice(text);
    } catch (e) {
      console.warn('[STONICX Engine] Charon voice feedback note:', e);
    } finally {
      this.isSpeaking = false;
    }
  }

  public isPaused(): boolean {
    return this.isExecutionPaused;
  }

  public setPaused(paused: boolean): void {
    this.isExecutionPaused = paused;
  }

  public cleanup(): void {
    this.unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
    this.unsubscribers = [];
  }
}
