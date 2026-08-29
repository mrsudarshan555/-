/**
 * Voice Output & Speech Synthesis Engine (Ported from backtalk-main mouth.py)
 * 
 * Features:
 * - Plays Charon Deep Voice / Gemini TTS / Web Speech API
 * - Automatically triggers Audio Ducking on speech start
 * - Restores Audio Ducking on speech completion
 * - Dispatches onSpeechStart & onSpeechEnd lifecycle hooks
 */

import { AudioDuckingManager } from './audioDuckingManager';
import { playPcmAudio, stopCurrentSpeech } from '../../utils/speechEngine';

export interface MouthSpeakOptions {
  voice?: 'Charon' | 'Aoede' | 'Fenrir' | 'Puck' | 'Kore';
  persona?: 'MAYRA' | 'STONICX';
  language?: 'en' | 'hi';
  onStart?: () => void;
  onEnd?: () => void;
}

export class Mouth {
  private static instance: Mouth | null = null;
  private isSpeaking: boolean = false;

  private constructor() {}

  public static getInstance(): Mouth {
    if (!this.instance) {
      this.instance = new Mouth();
    }
    return this.instance;
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Speaks text using Charon Deep Voice or Web Speech API with automatic audio ducking
   */
  public async speak(text: string, options: MouthSpeakOptions = {}): Promise<boolean> {
    if (!text || typeof window === 'undefined') return false;

    const ducking = AudioDuckingManager.getInstance();
    
    // Stop any currently playing speech
    this.stop();

    this.isSpeaking = true;
    ducking.duck({ duckGain: 0.20, rampDownTimeSec: 0.15 });

    if (options.onStart) {
      options.onStart();
    }

    const persona = options.persona || 'STONICX';
    const voiceName = options.voice || (persona === 'STONICX' ? 'Charon' : 'Aoede');

    const handleSpeechEnd = () => {
      this.isSpeaking = false;
      ducking.restore({ rampUpTimeSec: 0.30 });
      if (options.onEnd) {
        options.onEnd();
      }
    };

    try {
      // 1. Primary: Server-side Gemini Live TTS / Charon endpoint
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName,
          assistant: persona.toLowerCase(),
          language: options.language || 'en'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const played = playPcmAudio(
            data.audioBase64,
            () => {},
            handleSpeechEnd
          );
          if (played) return true;
        }
      }
    } catch (e) {
      // Fallback
    }

    // 2. Secondary Web Speech API fallback
    if (window.speechSynthesis) {
      const clean = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#+\s/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = persona === 'STONICX' ? 0.75 : 1.05;

      utterance.onend = () => {
        handleSpeechEnd();
      };

      utterance.onerror = () => {
        handleSpeechEnd();
      };

      window.speechSynthesis.speak(utterance);
      return true;
    }

    handleSpeechEnd();
    return false;
  }

  public stop(): void {
    this.isSpeaking = false;
    stopCurrentSpeech();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    AudioDuckingManager.getInstance().restore({ rampUpTimeSec: 0.20 });
  }
}
