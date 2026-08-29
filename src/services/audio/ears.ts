/**
 * Reactive Microphone Listener & Audio Ingest (Ported from backtalk-main ears.py)
 * 
 * Provides:
 * - Robust continuous SpeechRecognition stream for full-duplex turn-taking
 * - Auto-restart on speech boundary / silence detection
 * - Immediate re-arming 500ms post-speech
 * - Interruption / barge-in support
 */

export interface EarsConfig {
  language?: 'en' | 'hi';
  continuous?: boolean;
  interimResults?: boolean;
  silenceTimeoutMs?: number;
}

export type EarsState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'MUTED' | 'ERROR';

export interface EarsCallbacks {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onTurnComplete?: (finalText: string) => void;
  onStateChange?: (state: EarsState) => void;
  onError?: (error: string) => void;
}

export class Ears {
  private static instance: Ears | null = null;
  private recognition: any = null;
  private state: EarsState = 'IDLE';
  private callbacks: EarsCallbacks = {};
  private config: EarsConfig = {
    language: 'en',
    continuous: true,
    interimResults: true,
    silenceTimeoutMs: 900
  };
  private currentTranscript: string = '';
  private silenceTimer: any = null;
  private isExplicitlyStopped: boolean = true;
  private rearmTimer: any = null;

  private constructor() {}

  public static getInstance(): Ears {
    if (!this.instance) {
      this.instance = new Ears();
    }
    return this.instance;
  }

  public initialize(callbacks: EarsCallbacks = {}, config: Partial<EarsConfig> = {}): void {
    this.callbacks = callbacks;
    this.config = { ...this.config, ...config };
  }

  private setState(newState: EarsState): void {
    if (this.state === newState) return;
    this.state = newState;
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(newState);
    }
  }

  public getState(): EarsState {
    return this.state;
  }

  public setLanguage(lang: 'en' | 'hi'): void {
    this.config.language = lang;
    if (this.recognition) {
      try {
        this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      } catch (e) {}
    }
  }

  /**
   * Starts full-duplex microphone listening stream
   */
  public startListening(): boolean {
    if (typeof window === 'undefined') return false;

    this.isExplicitlyStopped = false;
    this.clearRearmTimer();
    this.clearSilenceTimer();

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      this.setState('ERROR');
      if (this.callbacks.onError) {
        this.callbacks.onError('Web Speech API is not supported in this browser.');
      }
      return false;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = this.config.continuous !== false;
      recognition.interimResults = this.config.interimResults !== false;
      recognition.maxAlternatives = 1;
      recognition.lang = this.config.language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        this.setState('LISTENING');
        console.log('[Ears] Microphone stream listening active');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            finalTranscript += text + ' ';
          } else {
            interimTranscript += text;
          }
        }

        const combined = (finalTranscript + interimTranscript).trim();
        if (combined) {
          this.currentTranscript = combined;
          if (this.callbacks.onTranscript) {
            this.callbacks.onTranscript(combined, Boolean(finalTranscript));
          }

          // Schedule dynamic turn completion after silence window
          this.scheduleTurnCompletionTimer();
        }
      };

      recognition.onerror = (event: any) => {
        const error = event?.error;
        console.log('[Ears] Recognition event note:', error);

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          this.setState('ERROR');
          this.isExplicitlyStopped = true;
          if (this.callbacks.onError) {
            this.callbacks.onError('Microphone access denied.');
          }
        } else if (error === 'no-speech' || error === 'network') {
          // Auto re-arm if continuous
          if (!this.isExplicitlyStopped) {
            this.rearm(300);
          }
        }
      };

      recognition.onend = () => {
        // Auto-restart stream if continuous listening is desired
        if (!this.isExplicitlyStopped && this.state !== 'PROCESSING' && this.state !== 'MUTED') {
          this.rearm(250);
        } else if (this.isExplicitlyStopped) {
          this.setState('IDLE');
        }
      };

      this.recognition = recognition;
      this.recognition.start();
      return true;
    } catch (err: any) {
      console.warn('[Ears] Failed to start recognition stream:', err);
      this.setState('ERROR');
      return false;
    }
  }

  /**
   * Automatically re-arms listener after delay (e.g. 500ms post-TTS)
   */
  public rearm(delayMs: number = 500): void {
    if (this.isExplicitlyStopped) return;

    this.clearRearmTimer();
    this.rearmTimer = setTimeout(() => {
      if (!this.isExplicitlyStopped) {
        try {
          this.startListening();
        } catch (e) {}
      }
    }, delayMs);
  }

  private scheduleTurnCompletionTimer(): void {
    this.clearSilenceTimer();

    const timeout = this.config.silenceTimeoutMs || 900;
    this.silenceTimer = setTimeout(() => {
      const textToEmit = this.currentTranscript.trim();
      if (textToEmit) {
        console.log(`[Ears] Turn detected complete: "${textToEmit}"`);
        this.clearSilenceTimer();
        this.currentTranscript = '';

        if (this.callbacks.onTurnComplete) {
          this.callbacks.onTurnComplete(textToEmit);
        }
      }
    }, timeout);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private clearRearmTimer(): void {
    if (this.rearmTimer) {
      clearTimeout(this.rearmTimer);
      this.rearmTimer = null;
    }
  }

  public stopListening(): void {
    this.isExplicitlyStopped = true;
    this.clearSilenceTimer();
    this.clearRearmTimer();

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.onresult = null;
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }

    this.setState('IDLE');
  }

  public mute(): void {
    this.setState('MUTED');
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
  }

  public unmute(): void {
    if (this.state === 'MUTED') {
      this.rearm(150);
    }
  }
}
