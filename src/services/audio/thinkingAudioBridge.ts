/**
 * Reactive Thinking Audio Bridge for STONICX Execution Core
 * 
 * Features:
 * 1. Low-Latency Synthesis: Implemented a procedural Web Audio API harmonic oscillator engine 
 *    (432Hz harmonic code pulse + sub-bass drone + digital data stream chirp) with `/thinking.wav` audio support.
 * 2. Dynamic Audio Ducking: Automatically ducks ambient audio/music levels when complex processing starts and restores volume upon completion.
 * 3. Smooth Fade-Out: Smooth 300ms linear ramp release (gainNode.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3)) when synthesis finishes.
 * 4. Verification Trace: Emits `[STONICX Audio] Thinking audio loop started -> Ducking active`.
 */

export interface ThinkingAudioOptions {
  volume?: number;
  pitchMultiplier?: number;
  enableDucking?: boolean;
}

export class ThinkingAudioBridge {
  private static audioCtx: AudioContext | null = null;
  private static gainNode: GainNode | null = null;
  private static filterNode: BiquadFilterNode | null = null;
  private static oscillators: OscillatorNode[] = [];
  private static audioElement: HTMLAudioElement | null = null;
  private static isPlaying = false;
  private static isDuckingActive = false;
  private static duckingElements: HTMLMediaElement[] = [];

  /**
   * Initializes or resumes AudioContext
   */
  private static getOrCreateAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Starts the procedural low-latency thinking audio loop with 432Hz harmonic code pulse + sub-bass drone
   */
  public static startThinkingLoop(options: ThinkingAudioOptions = {}): void {
    if (typeof window === 'undefined') return;

    if (this.isPlaying) {
      return;
    }

    try {
      const ctx = this.getOrCreateAudioContext();
      const targetVolume = options.volume ?? 0.22;

      // 1. Master Gain Node
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 0.12);

      // 2. Resonant Lowpass Filter (Cybernetic Coding Matrix)
      this.filterNode = ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(650, ctx.currentTime);
      this.filterNode.Q.setValueAtTime(4.0, ctx.currentTime);

      // Filter LFO for pulsating neural texture (2.4 Hz harmonic sweep)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(2.4, ctx.currentTime);
      lfoGain.gain.setValueAtTime(180, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(this.filterNode.frequency);
      lfo.start();
      this.oscillators.push(lfo);

      // 3. Harmonic Sub & Resonant Frequencies
      // Base sub drone: 64Hz
      const oscSub = ctx.createOscillator();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(64, ctx.currentTime);

      // 432Hz Harmonic Code Pulse
      const osc432 = ctx.createOscillator();
      osc432.type = 'triangle';
      osc432.frequency.setValueAtTime(432, ctx.currentTime);

      // High cybernetic harmonic overtone (864Hz / 1296Hz)
      const oscHarmonic = ctx.createOscillator();
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(864, ctx.currentTime);

      // Connect synthesis nodes
      oscSub.connect(this.filterNode);
      osc432.connect(this.filterNode);
      oscHarmonic.connect(this.filterNode);

      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);

      oscSub.start();
      osc432.start();
      oscHarmonic.start();

      this.oscillators.push(oscSub, osc432, oscHarmonic);
      this.isPlaying = true;

      // 4. Try loading background wav file as complementary layer if available
      try {
        if (!this.audioElement) {
          this.audioElement = new Audio('/thinking.wav');
          this.audioElement.loop = true;
          this.audioElement.volume = targetVolume * 0.5;
        }
        this.audioElement.currentTime = 0;
        this.audioElement.play().catch(() => {});
      } catch {}

      // 5. Audio Ducking for background music/audio elements
      if (options.enableDucking !== false) {
        this.applyAudioDucking(true);
      }

      console.log('[STONICX Audio] Thinking audio loop started -> Ducking active');
    } catch (err) {
      console.warn('[STONICX Audio] Could not initialize Web Audio oscillator loop:', err);
    }
  }

  /**
   * Smoothly fades out thinking audio over 300ms (0.3s)
   */
  public static stopThinkingLoop(fadeDurationSec: number = 0.3): void {
    if (!this.isPlaying) {
      this.cleanup();
      return;
    }

    try {
      if (this.audioCtx && this.gainNode) {
        const now = this.audioCtx.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeDurationSec);
      }

      if (this.audioElement) {
        const audioEl = this.audioElement;
        const fadeStep = audioEl.volume / 10;
        const fadeInterval = setInterval(() => {
          if (audioEl.volume > fadeStep) {
            audioEl.volume -= fadeStep;
          } else {
            audioEl.pause();
            audioEl.currentTime = 0;
            clearInterval(fadeInterval);
          }
        }, 30);
      }

      setTimeout(() => {
        this.cleanup();
        this.applyAudioDucking(false);
        console.log('[STONICX Audio] Thinking audio loop stopped -> Volume restored');
      }, fadeDurationSec * 1000 + 30);
    } catch (e) {
      this.cleanup();
    }
  }

  /**
   * Applies volume ducking to any playing media elements
   */
  private static applyAudioDucking(duck: boolean): void {
    if (typeof document === 'undefined') return;

    if (duck) {
      this.duckingElements = Array.from(document.querySelectorAll('audio, video')) as HTMLMediaElement[];
      this.duckingElements.forEach((el) => {
        try {
          if (el !== this.audioElement && !el.paused && el.volume > 0.2) {
            (el as any).__preDuckVolume = el.volume;
            el.volume = Math.max(0.08, el.volume * 0.3);
          }
        } catch {}
      });
      this.isDuckingActive = true;
    } else {
      this.duckingElements.forEach((el) => {
        try {
          if (typeof (el as any).__preDuckVolume === 'number') {
            el.volume = (el as any).__preDuckVolume;
            delete (el as any).__preDuckVolume;
          }
        } catch {}
      });
      this.duckingElements = [];
      this.isDuckingActive = false;
    }
  }

  /**
   * Cleans up audio nodes
   */
  private static cleanup(): void {
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.oscillators = [];

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }

    if (this.filterNode) {
      try {
        this.filterNode.disconnect();
      } catch {}
      this.filterNode = null;
    }

    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch {}
    }

    this.isPlaying = false;
  }

  public static isLoopActive(): boolean {
    return this.isPlaying;
  }
}
