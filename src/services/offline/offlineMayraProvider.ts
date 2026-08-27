/**
 * STONICX Offline Mayra Provider
 * Phase 1 — Additive Foundation
 *
 * Implements the offline fallback contract.
 * Dispatches queries to local GGUF models via NativeLLMBridge when running on-device.
 * Zero interference with the primary Gemini Live pipeline.
 */

import { nativeLlmBridge } from './nativeLlmBridge';
import { MayraNativeBridgeClient } from '../bridge/MayraNativeBridgeClient';
import { modelDownloadManager } from '../models/ModelDownloadManager';
import { localModelManager } from './localModelManager';
import { offlineVoiceService } from './offlineVoiceService';
import { OfflineGenerationResult, OfflineStreamChunk } from './offlineAiTypes';

export interface OfflineMayraQueryOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  onToken?: (token: string, accumulated: string) => void;
}

export interface OfflineMayraResponse {
  text: string;
  isOffline: true;
  engine: 'llama.cpp' | 'unavailable';
  tokensPerSecond?: number;
  durationMs?: number;
  audioBase64?: string;
}

export interface OfflineVoiceTurnResult {
  userSpeechText: string;
  aiResponseText: string;
  tokensPerSecond: number;
  durationMs: number;
}

export class OfflineMayraProvider {
  private static instance: OfflineMayraProvider;

  private constructor() {}

  public static getInstance(): OfflineMayraProvider {
    if (!OfflineMayraProvider.instance) {
      OfflineMayraProvider.instance = new OfflineMayraProvider();
    }
    return OfflineMayraProvider.instance;
  }

  /**
   * Checks if offline inference is ready to serve queries
   */
  public async isOfflineReady(): Promise<{ ready: boolean; reason?: string }> {
    const isBridgeAvailable = await MayraNativeBridgeClient.isAvailable();
    if (!isBridgeAvailable) {
      return {
        ready: false,
        reason: 'Native Android offline AI engine (llama.cpp) is not available on this platform.'
      };
    }

    const readyModel = modelDownloadManager.getReadyModel() || localModelManager.getReadyChatModel();
    if (!readyModel) {
      return {
        ready: false,
        reason: 'Offline mode ke liye Settings se Offline AI Model download karein.'
      };
    }

    return { ready: true };
  }

  /**
   * Generates a streaming response using on-device GGUF LLM
   */
  public async generateStreamingResponse(
    prompt: string,
    options?: OfflineMayraQueryOptions
  ): Promise<OfflineMayraResponse> {
    const readiness = await this.isOfflineReady();
    if (!readiness.ready) {
      throw new Error(readiness.reason || 'Offline AI engine unavailable.');
    }

    const readyModel = modelDownloadManager.getReadyModel() || localModelManager.getReadyChatModel()!;
    
    // Ensure model is loaded on-demand
    const isLoaded = await MayraNativeBridgeClient.isModelLoaded();
    if (!isLoaded) {
      const loadOk = await MayraNativeBridgeClient.loadLocalModel(readyModel.filename);
      if (!loadOk) {
        throw new Error('MODEL_LOAD_FAILED: Unable to allocate context for offline model.');
      }
    }

    return new Promise((resolve, reject) => {
      let accumulated = '';
      let tps = 0;

      MayraNativeBridgeClient.streamLocalTokens(
        prompt,
        {
          systemPrompt: options?.systemPrompt || 'You are MAYRA, a helpful, intelligent personal AI companion.',
          temperature: options?.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? 512,
          onToken: (token: string, acc: string, tokenTps: number) => {
            accumulated = acc;
            tps = tokenTps;
            if (options?.onToken) {
              options.onToken(token, acc);
            }
          },
          onComplete: (fullText: string, finalTps: number) => {
            resolve({
              text: fullText || accumulated,
              isOffline: true,
              engine: 'llama.cpp',
              tokensPerSecond: finalTps || tps,
              durationMs: 0
            });
          },
          onError: (err: Error) => {
            reject(err);
          }
        }
      );
    });
  }

  /**
   * Complete Offline Voice Turn:
   * 1. Transcribes input 16kHz PCM audio on-device using Whisper STT
   * 2. Generates response using local llama.cpp LLM
   * 3. Synthesizes voice audio on-device using Piper TTS
   * 4. Plays audio and triggers avatar lip-sync/speaking animation
   */
  public async processOfflineVoiceTurn(
    base64Pcm16k: string,
    options?: {
      onStatusChange?: (status: 'LISTENING' | 'THINKING' | 'SPEAKING' | 'READY') => void;
      onUserTranscript?: (text: string) => void;
      onAiToken?: (token: string, fullText: string) => void;
    }
  ): Promise<OfflineVoiceTurnResult> {
    const startTime = performance.now();

    // 1. Transcription (Whisper STT)
    options?.onStatusChange?.('THINKING');
    const sttResult = await offlineVoiceService.transcribeAudio(base64Pcm16k);
    const userText = sttResult.text.trim();

    if (!userText) {
      options?.onStatusChange?.('READY');
      return {
        userSpeechText: '',
        aiResponseText: '',
        tokensPerSecond: 0,
        durationMs: performance.now() - startTime
      };
    }

    options?.onUserTranscript?.(userText);

    // 2. Inference (Local llama.cpp)
    let accumulatedAiText = '';
    let finalTps = 0;

    const llmResponse = await this.generateStreamingResponse(userText, {
      systemPrompt: 'You are MAYRA, a smart and helpful offline voice assistant. Answer concisely in 1-2 friendly spoken sentences.',
      onToken: (token, acc) => {
        accumulatedAiText = acc;
        options?.onAiToken?.(token, acc);
      }
    });

    const aiText = llmResponse.text || accumulatedAiText;
    finalTps = llmResponse.tokensPerSecond || 0;

    // 3. Speech Synthesis (Piper TTS)
    const ttsResult = await offlineVoiceService.synthesizeSpeech(aiText);

    // 4. Audio Playback & Lip-Sync Animation
    if (ttsResult.audioBase64) {
      offlineVoiceService.playRawPcmAudio(
        ttsResult.audioBase64,
        ttsResult.sampleRate || 22050,
        () => {
          options?.onStatusChange?.('SPEAKING');
        },
        () => {
          options?.onStatusChange?.('READY');
        }
      );
    } else {
      options?.onStatusChange?.('READY');
    }

    return {
      userSpeechText: userText,
      aiResponseText: aiText,
      tokensPerSecond: finalTps,
      durationMs: performance.now() - startTime
    };
  }

  /**
   * Unloads any currently active offline model to free device RAM
   */
  public async releaseMemory(): Promise<void> {
    await MayraNativeBridgeClient.unloadLocalModel();
    await MayraNativeBridgeClient.unloadSTTModel();
    await MayraNativeBridgeClient.unloadTTSModel();
  }
}

export const offlineMayraProvider = OfflineMayraProvider.getInstance();
