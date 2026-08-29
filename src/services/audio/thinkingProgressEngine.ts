/**
 * Dual-Layer Thinking Engine for STONICX & MAYRA (Phase E)
 * 
 * Capabilities:
 * - Layer 1 (Audio Tone Loop): Ambient 432Hz harmonic drone (`ThinkingAudioBridge`)
 * - Layer 2 (Live Spoken Progress Commentary): Low-latency verbal telemetry updates
 *   (e.g., "Analyzing query..." -> "Accessing shared memory vault..." -> "Synthesizing output.")
 * - Clean Release: Smoothly fades out audio drone over 300ms on final payload delivery.
 * - Dynamic Ducking Integration: Coordinates background audio ducking during spoken commentary.
 */

import { ThinkingAudioBridge } from './thinkingAudioBridge';
import { AudioDuckingManager } from './audioDuckingManager';
import { PersonaSwitchBridge } from '../router/personaSwitchBridge';

export interface ThinkingProgressOptions {
  persona?: 'MAYRA' | 'STONICX';
  customSteps?: string[];
  enableSpokenCommentary?: boolean;
  stepIntervalMs?: number;
}

const DEFAULT_STONICX_COMMENTARY = [
  'Analyzing query vector...',
  'Accessing shared memory vault...',
  'Compiling telemetry matrix...',
  'Synthesizing output.'
];

const DEFAULT_MAYRA_COMMENTARY = [
  'Thinking through this for you...',
  'Checking our memories...',
  'Preparing your answer.'
];

export class ThinkingProgressEngine {
  private static instance: ThinkingProgressEngine | null = null;
  private isThinkingActive = false;
  private currentStepIndex = 0;
  private commentaryTimer: any = null;
  private activePersona: 'MAYRA' | 'STONICX' = 'STONICX';
  private commentarySteps: string[] = [];
  private onStepCallback?: (step: string) => void;

  private constructor() {}

  public static getInstance(): ThinkingProgressEngine {
    if (!this.instance) {
      this.instance = new ThinkingProgressEngine();
    }
    return this.instance;
  }

  /**
   * Starts Dual-Layer Thinking: Audio Loop + Spoken Telemetry Commentary
   */
  public startDualLayerThinking(
    options: ThinkingProgressOptions = {},
    onStep?: (step: string) => void
  ): void {
    if (this.isThinkingActive) {
      return;
    }

    this.isThinkingActive = true;
    this.currentStepIndex = 0;
    this.activePersona = options.persona || 'STONICX';
    this.onStepCallback = onStep;

    this.commentarySteps = options.customSteps || (
      this.activePersona === 'STONICX' ? DEFAULT_STONICX_COMMENTARY : DEFAULT_MAYRA_COMMENTARY
    );

    // 1. Layer 1: Start 432Hz ambient audio loop
    ThinkingAudioBridge.startThinkingLoop({ volume: 0.18, enableDucking: true });

    console.log('[ThinkingEngine] Dual-layer active -> Audio loop + Spoken telemetry triggered');

    // 2. Layer 2: Start non-blocking spoken commentary if enabled
    if (options.enableSpokenCommentary !== false) {
      this.scheduleNextCommentaryStep(options.stepIntervalMs || 1800);
    }
  }

  private scheduleNextCommentaryStep(intervalMs: number): void {
    if (!this.isThinkingActive) return;

    if (this.currentStepIndex < this.commentarySteps.length) {
      const stepText = this.commentarySteps[this.currentStepIndex];
      this.currentStepIndex++;

      // Trigger UI callback
      if (this.onStepCallback) {
        this.onStepCallback(stepText);
      }

      // Speak commentary non-blockingly with ducking
      this.speakCommentary(stepText);

      this.commentaryTimer = setTimeout(() => {
        this.scheduleNextCommentaryStep(intervalMs);
      }, intervalMs);
    }
  }

  private async speakCommentary(text: string): Promise<void> {
    if (!this.isThinkingActive) return;

    const ducking = AudioDuckingManager.getInstance();
    ducking.duck({ duckGain: 0.20, rampDownTimeSec: 0.15 });

    try {
      if (this.activePersona === 'STONICX') {
        await PersonaSwitchBridge.speakCharonVoice(text);
      }
    } catch (e) {
      // Non-blocking fallback
    } finally {
      if (this.isThinkingActive) {
        ducking.restore({ rampUpTimeSec: 0.30 });
      }
    }
  }

  /**
   * Stops thinking engine cleanly: fades out audio drone over 300ms
   */
  public stopDualLayerThinking(fadeDurationSec: number = 0.3): void {
    if (!this.isThinkingActive) return;

    this.isThinkingActive = false;
    if (this.commentaryTimer) {
      clearTimeout(this.commentaryTimer);
      this.commentaryTimer = null;
    }

    // Smoothly fade out Layer 1 audio loop over 300ms
    ThinkingAudioBridge.stopThinkingLoop(fadeDurationSec);
    AudioDuckingManager.getInstance().restore({ rampUpTimeSec: fadeDurationSec });

    console.log('[ThinkingEngine] Dual-layer thinking complete -> Clean release');
  }

  public isRunning(): boolean {
    return this.isThinkingActive;
  }
}
