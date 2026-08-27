/**
 * Backtalk-Style Continuous Voice Conversation Engine for MAYRA
 * 
 * Provides:
 * 1. Continuous conversational loop (User Speaks -> Turn Detected -> AI Processes -> Natural Voice Speaks -> Auto-Resumes Listening).
 * 2. Automatic turn detection & silence window (Hindi, English, and Hinglish).
 * 3. Real-time barge-in / speech interruption while Mayra is speaking.
 * 4. Clear internal conversation state machine (IDLE/READY, LISTENING, THINKING, SPEAKING, INTERRUPTED, ERROR).
 * 5. Full preservation of Mayra Natural Voice & Memory Vault.
 */

import { AssistantStatus, MayraLanguage } from '../../types';
import { 
  stopCurrentSpeech, 
  flushQueuedAudio, 
  detectLanguage,
  acquireMicrophoneStream,
  cleanupAudioStreams
} from '../../utils/speechEngine';

export interface ContinuousConversationCallbacks {
  onStateChange: (state: AssistantStatus) => void;
  onUserTranscript: (transcript: string, isFinal: boolean) => void;
  onTurnComplete: (completedTranscript: string) => void;
  onInterruption: () => void;
  onError?: (error: string) => void;
}

export class ContinuousConversationEngine {
  private state: AssistantStatus = 'READY';
  private isContinuousModeActive: boolean = false;
  private preferredLanguage: MayraLanguage = 'en';

  private recognition: any = null;
  private silenceTimer: any = null;
  private currentTurnTranscript: string = '';
  private lastSpokenTimestamp: number = 0;

  // Interruption monitoring
  private isSpeaking: boolean = false;
  private micStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadInterval: any = null;

  private callbacks: ContinuousConversationCallbacks;

  constructor(callbacks: ContinuousConversationCallbacks, initialLang: MayraLanguage = 'en') {
    this.callbacks = callbacks;
    this.preferredLanguage = initialLang;
  }

  public setLanguage(lang: MayraLanguage): void {
    this.preferredLanguage = lang;
    if (this.recognition) {
      try {
        this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      } catch (e) {
        // Ignore recognition lang change errors
      }
    }
  }

  public getState(): AssistantStatus {
    return this.state;
  }

  public isContinuousActive(): boolean {
    return this.isContinuousModeActive;
  }

  private transitionTo(newState: AssistantStatus): void {
    if (this.state === newState) return;
    console.log(`[ContinuousEngine] State Transition: ${this.state} -> ${newState}`);
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  /**
   * Starts Continuous Conversation Mode
   */
  public async startContinuousMode(): Promise<boolean> {
    if (this.isContinuousModeActive && this.state === 'LISTENING') {
      return true;
    }

    console.log('[ContinuousEngine] START_CONTINUOUS_MODE initiated');
    this.isContinuousModeActive = true;
    this.currentTurnTranscript = '';

    // Initialize Speech Recognition
    const initSuccess = await this.initSpeechRecognition();
    if (!initSuccess) {
      console.warn('[ContinuousEngine] Web Speech API initialization failed or unsupported.');
    }

    // Initialize VAD / Audio Monitor for barge-in detection
    await this.initBargeInDetector();

    this.startListeningTurn();
    return true;
  }

  /**
   * Stops Continuous Conversation Mode and cleans up microphone
   */
  public stopContinuousMode(): void {
    console.log('[ContinuousEngine] STOP_CONTINUOUS_MODE called');
    this.isContinuousModeActive = false;
    this.isSpeaking = false;
    this.clearSilenceTimer();
    this.stopBargeInDetector();

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.onresult = null;
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }

    cleanupAudioStreams(this.micStream);
    this.micStream = null;

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }

    this.currentTurnTranscript = '';
    this.transitionTo('READY');
  }

  /**
   * Notifies the engine that the assistant is now speaking (e.g. Aoede Natural Voice audio playing)
   */
  public onAssistantSpeakingStart(): void {
    this.isSpeaking = true;
    this.clearSilenceTimer();
    this.transitionTo('SPEAKING');
    console.log('[ContinuousEngine] Assistant SPEAKING started. Barge-in detection active.');
  }

  /**
   * Notifies the engine that the assistant has finished speaking.
   * In continuous mode, this automatically loops back to LISTENING!
   */
  public onAssistantSpeakingEnd(): void {
    if (!this.isContinuousModeActive) {
      this.isSpeaking = false;
      this.transitionTo('READY');
      return;
    }

    console.log('[ContinuousEngine] Assistant SPEAKING ended. Automatically resuming LISTENING turn.');
    this.isSpeaking = false;
    this.currentTurnTranscript = '';
    this.startListeningTurn();
  }

  /**
   * User manually triggers an interruption / stop speaking button
   */
  public interruptManually(): void {
    console.log('[ContinuousEngine] Manual interruption triggered');
    this.handleInterruption();
  }

  /**
   * Handles user barge-in (user spoke while Mayra was speaking)
   */
  private handleInterruption(): void {
    if (!this.isSpeaking && this.state !== 'SPEAKING') {
      return;
    }

    console.log('[ContinuousEngine] ✦ USER BARGE-IN DETECTED: Halting speech output & switching to LISTENING');
    this.isSpeaking = false;
    
    // Immediately stop & flush active audio playback
    stopCurrentSpeech();
    flushQueuedAudio();

    this.transitionTo('INTERRUPTED');
    this.callbacks.onInterruption();

    // Small delay to allow audio buffer cleanup then immediately transition to LISTENING
    setTimeout(() => {
      if (this.isContinuousModeActive) {
        this.startListeningTurn();
      } else {
        this.transitionTo('READY');
      }
    }, 120);
  }

  /**
   * Activates listening for the user's turn
   */
  private startListeningTurn(): void {
    this.transitionTo('LISTENING');
    this.currentTurnTranscript = '';
    this.clearSilenceTimer();

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e: any) {
        // If already started, ignore
        if (e?.name !== 'InvalidStateError') {
          console.warn('[ContinuousEngine] Recognition start notice:', e?.message || e);
        }
      }
    }
  }

  /**
   * Initializes browser Speech Recognition with continuous turn handling
   */
  private async initSpeechRecognition(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      return false;
    }

    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = this.preferredLanguage === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        console.log('[ContinuousEngine] SpeechRecognition: STARTED');
      };

      recognition.onresult = (event: any) => {
        // If Mayra is speaking and user speaks, trigger barge-in!
        if (this.isSpeaking || this.state === 'SPEAKING') {
          this.handleInterruption();
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0]?.transcript || '';
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = (finalTranscript + interimTranscript).trim();
        if (currentText) {
          this.currentTurnTranscript = currentText;
          this.lastSpokenTimestamp = Date.now();
          this.callbacks.onUserTranscript(currentText, Boolean(finalTranscript));

          // Set dynamic silence timer to detect end of user turn
          this.scheduleTurnCompletionTimer(1100);
        }
      };

      recognition.onerror = (event: any) => {
        console.log('[ContinuousEngine] Recognition event notice:', event?.error);
        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          this.transitionTo('ERROR');
          if (this.callbacks.onError) {
            this.callbacks.onError('Microphone permission denied.');
          }
          this.stopContinuousMode();
        } else if (event?.error === 'network') {
          // Soft retry in continuous mode
          if (this.isContinuousModeActive && this.state === 'LISTENING') {
            setTimeout(() => {
              if (this.isContinuousModeActive && this.state === 'LISTENING') {
                try { this.recognition?.start(); } catch (e) {}
              }
            }, 600);
          }
        }
      };

      recognition.onend = () => {
        console.log('[ContinuousEngine] Recognition ended event.');
        // Auto-restart if we are in continuous listening mode
        if (this.isContinuousModeActive && (this.state === 'LISTENING' || this.state === 'INTERRUPTED')) {
          try {
            recognition.start();
          } catch (e) {
            setTimeout(() => {
              if (this.isContinuousModeActive && this.state === 'LISTENING') {
                try { recognition.start(); } catch (err) {}
              }
            }, 300);
          }
        }
      };

      this.recognition = recognition;
      return true;
    } catch (err) {
      console.warn('[ContinuousEngine] SpeechRecognition init error:', err);
      return false;
    }
  }

  /**
   * Schedules turn completion after user stops speaking (silence window)
   */
  private scheduleTurnCompletionTimer(delayMs: number = 1100): void {
    this.clearSilenceTimer();

    this.silenceTimer = setTimeout(() => {
      const textToDispatch = this.currentTurnTranscript.trim();
      if (textToDispatch && (this.state === 'LISTENING' || this.state === 'INTERRUPTED')) {
        console.log(`[ContinuousEngine] ✦ USER TURN COMPLETE detected: "${textToDispatch}"`);
        this.clearSilenceTimer();
        this.transitionTo('THINKING');

        // Temporarily stop recognition while AI processes & speaks
        if (this.recognition) {
          try { this.recognition.stop(); } catch (e) {}
        }

        this.callbacks.onTurnComplete(textToDispatch);
        this.currentTurnTranscript = '';
      }
    }, delayMs);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Initializes audio energy monitor (VAD) for fast barge-in detection during speaking
   */
  private async initBargeInDetector(): Promise<void> {
    try {
      this.micStream = await acquireMicrophoneStream();
      if (!this.micStream) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume().catch(() => {});
      }

      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.2;
      source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);
      let consecutiveSpeechFrames = 0;

      this.vadInterval = setInterval(() => {
        if (!this.analyser) return;

        // Only monitor for barge-in while Mayra is in SPEAKING state
        if (this.state === 'SPEAKING' || this.isSpeaking) {
          this.analyser.getByteFrequencyData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i];
          }
          const averageVolume = sum / buffer.length;

          // Acoustic threshold for barge-in detection with echo cancellation
          if (averageVolume > 38) {
            consecutiveSpeechFrames++;
            if (consecutiveSpeechFrames >= 2) {
              console.log('[ContinuousEngine] VAD energy threshold exceeded during SPEAKING (Vol:', averageVolume.toFixed(1), ')');
              consecutiveSpeechFrames = 0;
              this.handleInterruption();
            }
          } else {
            consecutiveSpeechFrames = Math.max(0, consecutiveSpeechFrames - 1);
          }
        } else {
          consecutiveSpeechFrames = 0;
        }
      }, 75);
    } catch (e) {
      console.warn('[ContinuousEngine] VAD barge-in detector error:', e);
    }
  }

  private stopBargeInDetector(): void {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
  }
}
