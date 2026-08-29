/**
 * Dynamic Audio Ducking Manager (Ported from backtalk-main ducking.py)
 * 
 * Attenuation Logic:
 * - When Assistant (STONICX/MAYRA) speaks or live commentary triggers:
 *   Ramp background audio gain down to 0.20 (80% ducking) in 150ms.
 * - When speech ends:
 *   Smoothly ramp gain back to 1.0 in 300ms.
 * 
 * Output logs:
 * `[AudioDucking] Speech started -> Gain ducked to 0.20`
 * `[AudioDucking] Speech ended -> Gain restored to 1.0`
 */

export interface DuckingOptions {
  duckGain?: number;
  rampDownTimeSec?: number;
  rampUpTimeSec?: number;
}

export class AudioDuckingManager {
  private static instance: AudioDuckingManager | null = null;
  private audioCtx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private isDucked: boolean = false;
  private currentGainValue: number = 1.0;
  private registeredMediaElements: Set<HTMLMediaElement> = new Set();
  private elementPreDuckVolumes: Map<HTMLMediaElement, number> = new Map();

  private constructor() {
    // Lazy initialized
  }

  public static getInstance(): AudioDuckingManager {
    if (!this.instance) {
      this.instance = new AudioDuckingManager();
    }
    return this.instance;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public getMasterGainNode(): GainNode {
    const ctx = this.getAudioContext();
    if (!this.masterGainNode) {
      this.masterGainNode = ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(1.0, ctx.currentTime);
      this.masterGainNode.connect(ctx.destination);
    }
    return this.masterGainNode;
  }

  /**
   * Registers an external media element (audio/video) for auto-ducking
   */
  public registerMediaElement(el: HTMLMediaElement): void {
    this.registeredMediaElements.add(el);
  }

  public unregisterMediaElement(el: HTMLMediaElement): void {
    this.registeredMediaElements.delete(el);
    this.elementPreDuckVolumes.delete(el);
  }

  /**
   * Triggers ducking (e.g., when speech or commentary starts)
   */
  public duck(options: DuckingOptions = {}): void {
    const duckGain = options.duckGain ?? 0.20;
    const rampTime = options.rampDownTimeSec ?? 0.15;

    this.isDucked = true;
    this.currentGainValue = duckGain;

    // 1. Web Audio GainNode ramping
    try {
      const ctx = this.getAudioContext();
      const gainNode = this.getMasterGainNode();
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(duckGain, now + rampTime);
    } catch (e) {
      // AudioContext might not be created yet
    }

    // 2. HTML Media Elements ducking
    if (typeof document !== 'undefined') {
      const mediaList = Array.from(document.querySelectorAll('audio, video')) as HTMLMediaElement[];
      mediaList.forEach((el) => {
        try {
          if (!el.paused && el.volume > duckGain) {
            if (!this.elementPreDuckVolumes.has(el)) {
              this.elementPreDuckVolumes.set(el, el.volume);
            }
            el.volume = Math.max(0.05, el.volume * duckGain);
          }
        } catch {}
      });
    }

    console.log(`[AudioDucking] Speech started -> Gain ducked to ${duckGain.toFixed(2)}`);
  }

  /**
   * Restores audio gain back to 1.0 (when speech ends)
   */
  public restore(options: DuckingOptions = {}): void {
    const restoreGain = 1.0;
    const rampTime = options.rampUpTimeSec ?? 0.30;

    this.isDucked = false;
    this.currentGainValue = restoreGain;

    // 1. Web Audio GainNode ramping
    try {
      const ctx = this.getAudioContext();
      const gainNode = this.getMasterGainNode();
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(restoreGain, now + rampTime);
    } catch (e) {
      // AudioContext might not be created yet
    }

    // 2. HTML Media Elements restoring
    this.elementPreDuckVolumes.forEach((prevVol, el) => {
      try {
        el.volume = prevVol;
      } catch {}
    });
    this.elementPreDuckVolumes.clear();

    console.log(`[AudioDucking] Speech ended -> Gain restored to ${restoreGain.toFixed(1)}`);
  }

  public getGain(): number {
    return this.currentGainValue;
  }

  public isCurrentlyDucked(): boolean {
    return this.isDucked;
  }
}
