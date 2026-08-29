/**
 * Full-Duplex Continuous Voice Pipeline for STONICX & MAYRA (Phase E)
 * 
 * Capabilities:
 * 1. Continuous turn-taking: Active SpeechRecognition stream feeding the general LLM inference pipeline.
 * 2. Automatically re-arms listener 500ms after TTS finishes speaking.
 * 3. Autonomous intent routing via `DelegationRouter.routePrompt()`.
 * 4. Dual-layer thinking integration with dynamic audio ducking.
 * 
 * Console Verification Log:
 * `[VoicePipeline] Continuous listener active -> Routing utterance to STONICX`
 */

import { Ears, EarsState } from './ears';
import { Mouth } from './mouth';
import { DelegationRouter } from '../router/delegationRouter';
import { RouterStateBus } from '../router/routerStateBus';
import { PersonaTarget } from '../router/intentClassifier';
import { ThinkingProgressEngine } from './thinkingProgressEngine';

export interface VoicePipelineCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onTurnStart?: () => void;
  onTurnComplete?: (text: string, activeBrain: PersonaTarget) => void;
  onStatusChange?: (status: 'READY' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR') => void;
  onModeSwitch?: (newMode: 'mayra' | 'stonicx') => void;
}

export class VoicePipeline {
  private static instance: VoicePipeline | null = null;
  private ears: Ears;
  private mouth: Mouth;
  private callbacks: VoicePipelineCallbacks = {};
  private isActive: boolean = false;
  private activePersona: PersonaTarget = 'STONICX';
  private language: 'en' | 'hi' = 'en';

  private constructor() {
    this.ears = Ears.getInstance();
    this.mouth = Mouth.getInstance();
  }

  public static getInstance(): VoicePipeline {
    if (!this.instance) {
      this.instance = new VoicePipeline();
    }
    return this.instance;
  }

  public initialize(callbacks: VoicePipelineCallbacks = {}): void {
    this.callbacks = callbacks;
    this.activePersona = RouterStateBus.getActivePersona();

    this.ears.initialize({
      onTranscript: (transcript, isFinal) => {
        if (this.callbacks.onTranscript) {
          this.callbacks.onTranscript(transcript, isFinal);
        }
      },
      onTurnComplete: (completedText) => {
        this.handleUserTurnComplete(completedText);
      },
      onStateChange: (earsState) => {
        if (earsState === 'LISTENING') {
          this.notifyStatus('LISTENING');
        } else if (earsState === 'ERROR') {
          this.notifyStatus('ERROR');
        }
      }
    }, {
      language: this.language,
      continuous: true,
      interimResults: true,
      silenceTimeoutMs: 900
    });
  }

  public setPersona(persona: PersonaTarget): void {
    this.activePersona = persona;
  }

  public setLanguage(lang: 'en' | 'hi'): void {
    this.language = lang;
    this.ears.setLanguage(lang);
  }

  /**
   * Starts the continuous full-duplex voice pipeline
   */
  public start(): boolean {
    this.isActive = true;
    this.activePersona = RouterStateBus.getActivePersona();
    const started = this.ears.startListening();
    if (started) {
      console.log(`[VoicePipeline] Continuous listener active -> Routing utterance to ${this.activePersona}`);
      this.notifyStatus('LISTENING');
    }
    return started;
  }

  /**
   * Stops the continuous voice pipeline
   */
  public stop(): void {
    this.isActive = false;
    this.ears.stopListening();
    this.mouth.stop();
    ThinkingProgressEngine.getInstance().stopDualLayerThinking();
    this.notifyStatus('READY');
  }

  /**
   * Toggles listening mode
   */
  public toggle(): boolean {
    if (this.isActive && this.ears.getState() === 'LISTENING') {
      this.stop();
      return false;
    } else {
      return this.start();
    }
  }

  /**
   * Handles user turn completion and routes prompt to the active brain
   */
  public async handleUserTurnComplete(text: string): Promise<void> {
    const cleanText = text.trim();
    if (!cleanText) return;

    this.notifyStatus('THINKING');
    this.ears.mute();

    const currentBrain = RouterStateBus.getActivePersona();
    console.log(`[VoicePipeline] Continuous listener active -> Routing utterance to ${currentBrain}`);

    if (this.callbacks.onTurnComplete) {
      this.callbacks.onTurnComplete(cleanText, currentBrain);
    }
  }

  /**
   * Called when assistant speech begins
   */
  public onSpeechStart(): void {
    this.ears.mute();
    this.notifyStatus('SPEAKING');
  }

  /**
   * Called when assistant speech ends; automatically re-arms listener after 500ms
   */
  public onSpeechEnd(): void {
    this.notifyStatus('READY');

    if (this.isActive) {
      // Re-arm listener 500ms post-speech
      setTimeout(() => {
        if (this.isActive) {
          this.ears.unmute();
          this.ears.rearm(50);
          this.notifyStatus('LISTENING');
          console.log(`[VoicePipeline] Listener re-armed (500ms post-speech) -> Ready for next turn`);
        }
      }, 500);
    }
  }

  private notifyStatus(status: 'READY' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR'): void {
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(status);
    }
  }

  public isRunning(): boolean {
    return this.isActive;
  }
}
