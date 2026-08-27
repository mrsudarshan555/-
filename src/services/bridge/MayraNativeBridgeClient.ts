/**
 * MayraNativeBridgeClient
 * Phase 2 - Native Android Local LLM Bridge Client
 * Communicates with the native llama.cpp ARM64 runtime via Android WebView / Capacitor bridge.
 */

import {
  NativeLLMBridgeStatus,
  NativeDeviceMemory,
  NativeDeviceStorage,
  OfflinePromptOptions
} from '../offline/offlineAiTypes';

export interface NativeLoadOptions {
  nThreads?: number;
  nGpuLayers?: number;
  contextSize?: number;
}

export interface NativePromptOptions {
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[];
  onToken?: (token: string, accumulated: string, tps: number) => void;
  onComplete?: (fullText: string, tps: number) => void;
  onError?: (error: Error) => void;
}

export type DeviceMemoryInfo = NativeDeviceMemory;
export type DeviceStorageInfo = NativeDeviceStorage;
export type NativeModelStatusReport = NativeLLMBridgeStatus;

export interface NativeTextResponse {
  success: boolean;
  text: string;
  tokensPerSecond: number;
  durationMs: number;
  error?: string;
}

class MayraNativeBridgeClientClass {
  private activeTokenCallback: ((token: string, accumulated: string, tps: number) => void) | null = null;
  private activeCompleteCallback: ((fullText: string, tps: number) => void) | null = null;
  private activeErrorCallback: ((err: Error) => void) | null = null;

  constructor() {
    this.setupWindowListeners();
  }

  private setupWindowListeners() {
    if (typeof window === 'undefined') return;

    window.__mayra_native_on_token = (token: string, accumulated: string, tps: number) => {
      if (this.activeTokenCallback) {
        this.activeTokenCallback(token, accumulated, tps);
      }
    };

    window.__mayra_native_on_complete = (fullText: string, tps?: number) => {
      if (this.activeCompleteCallback) {
        this.activeCompleteCallback(fullText, tps || 0);
      }
      this.clearCallbacks();
    };

    window.__mayra_native_on_error = (errorMessage: string) => {
      if (this.activeErrorCallback) {
        this.activeErrorCallback(new Error(errorMessage));
      }
      this.clearCallbacks();
    };
  }

  private clearCallbacks() {
    this.activeTokenCallback = null;
    this.activeCompleteCallback = null;
    this.activeErrorCallback = null;
  }

  /**
   * Check if the native Android ARM64 bridge is available.
   */
  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return false;
    }
    try {
      return await Promise.resolve(window.MayraNativeLLM.isAvailable());
    } catch {
      return false;
    }
  }

  /**
   * Get device RAM stats to ensure safe allocation.
   */
  async getDeviceMemory(): Promise<DeviceMemoryInfo> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return { totalRamMb: 0, availRamMb: 0, isLowMemory: false };
    }
    try {
      if (window.MayraNativeLLM.getDeviceMemory) {
        const res = await Promise.resolve(window.MayraNativeLLM.getDeviceMemory());
        return typeof res === 'string' ? JSON.parse(res) : res;
      }
      const status = await this.getModelStatus();
      return {
        totalRamMb: status.deviceRamMb || 0,
        availRamMb: status.availableVramMb || 0,
        isLowMemory: !!status.lowMemoryAlert
      };
    } catch {
      return { totalRamMb: 0, availRamMb: 0, isLowMemory: false };
    }
  }

  /**
   * Get device storage capacity in MB.
   */
  async getAvailableStorage(): Promise<DeviceStorageInfo> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return { totalStorageMb: 0, freeStorageMb: 0 };
    }
    try {
      if (window.MayraNativeLLM.getAvailableStorage) {
        const res = await Promise.resolve(window.MayraNativeLLM.getAvailableStorage());
        return typeof res === 'string' ? JSON.parse(res) : res;
      }
      return { totalStorageMb: 0, freeStorageMb: 0 };
    } catch {
      return { totalStorageMb: 0, freeStorageMb: 0 };
    }
  }

  /**
   * Get dedicated model directory path on Android storage.
   */
  async getModelDirectory(): Promise<string> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return '/Android/data/com.mayra.assistant/files/models';
    }
    try {
      if (window.MayraNativeLLM.getModelDirectory) {
        return await Promise.resolve(window.MayraNativeLLM.getModelDirectory());
      }
      return '/Android/data/com.mayra.assistant/files/models';
    } catch {
      return '/Android/data/com.mayra.assistant/files/models';
    }
  }

  /**
   * Check if a specific model GGUF file exists on disk.
   */
  async checkModelFile(filename: string): Promise<{ exists: boolean; sizeBytes: number; path: string }> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return { exists: false, sizeBytes: 0, path: '' };
    }
    try {
      if (window.MayraNativeLLM.checkModelFile) {
        const res = await Promise.resolve(window.MayraNativeLLM.checkModelFile(filename));
        return typeof res === 'string' ? JSON.parse(res) : res;
      }
      return { exists: false, sizeBytes: 0, path: '' };
    } catch {
      return { exists: false, sizeBytes: 0, path: '' };
    }
  }

  /**
   * Delete model GGUF file from disk storage.
   */
  async deleteModelFile(filename: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return true;
    }
    try {
      if (window.MayraNativeLLM.deleteModelFile) {
        return await Promise.resolve(window.MayraNativeLLM.deleteModelFile(filename));
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get comprehensive status of the native LLM engine.
   */
  async getModelStatus(): Promise<NativeModelStatusReport> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return {
        isSupported: false,
        isEngineInitialized: false,
        activeModelId: null,
        lowMemoryAlert: false,
        engineVersion: 'unavailable'
      };
    }
    try {
      const fn = window.MayraNativeLLM.getModelStatus || window.MayraNativeLLM.getStatus;
      const res = await Promise.resolve(fn.call(window.MayraNativeLLM));
      return typeof res === 'string' ? JSON.parse(res) : res;
    } catch (e: any) {
      return {
        isSupported: true,
        isEngineInitialized: false,
        activeModelId: null,
        lowMemoryAlert: false,
        engineVersion: 'llama.cpp-arm64-v8a'
      };
    }
  }

  /**
   * Load local GGUF model into memory with strict RAM checks.
   */
  async loadLocalModel(modelPath: string, options?: NativeLoadOptions): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return false;
    }

    // Safeguard: Check available RAM
    const mem = await this.getDeviceMemory();
    if (mem.availRamMb > 0 && mem.availRamMb < 350) {
      console.warn('[MayraNativeBridgeClient] Insufficient memory to load model safely:', mem.availRamMb, 'MB');
      return false;
    }

    try {
      const fn = window.MayraNativeLLM.loadLocalModel || window.MayraNativeLLM.loadModel;
      return await Promise.resolve(fn.call(window.MayraNativeLLM, modelPath, options));
    } catch (e) {
      console.error('[MayraNativeBridgeClient] loadLocalModel failed:', e);
      return false;
    }
  }

  /**
   * Release GGUF model memory.
   */
  async unloadLocalModel(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return true;
    }
    try {
      const fn = window.MayraNativeLLM.unloadLocalModel || window.MayraNativeLLM.unloadModel;
      return await Promise.resolve(fn.call(window.MayraNativeLLM));
    } catch {
      return false;
    }
  }

  /**
   * Check whether a model is currently active in memory.
   */
  async isModelLoaded(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return false;
    }
    try {
      if (window.MayraNativeLLM.isModelLoaded) {
        return await Promise.resolve(window.MayraNativeLLM.isModelLoaded());
      }
      const status = await this.getModelStatus();
      return !!status.activeModelId;
    } catch {
      return false;
    }
  }

  /**
   * Stream token-by-token generation from native llama.cpp engine.
   */
  async streamLocalTokens(prompt: string, options?: NativePromptOptions): Promise<void> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      options?.onError?.(new Error('Native Android LLM bridge is unavailable on this platform'));
      return;
    }

    const isLoaded = await this.isModelLoaded();
    if (!isLoaded) {
      options?.onError?.(new Error('MODEL_NOT_INSTALLED'));
      return;
    }

    this.activeTokenCallback = options?.onToken || null;
    this.activeCompleteCallback = options?.onComplete || null;
    this.activeErrorCallback = options?.onError || null;

    if (window.MayraNativeLLM.streamPrompt) {
      const opt: OfflinePromptOptions = {
        systemPrompt: options?.systemPrompt,
        temperature: options?.temperature,
        topP: options?.topP,
        maxTokens: options?.maxTokens,
        stopSequences: options?.stopSequences
      };
      await window.MayraNativeLLM.streamPrompt(prompt, opt);
    }
  }

  /**
   * Generate complete response in single promise.
   */
  async sendLocalText(prompt: string, options?: NativePromptOptions): Promise<NativeTextResponse> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let fullAccumulated = '';
      let finalTps = 0;

      this.streamLocalTokens(prompt, {
        ...options,
        onToken: (token, accumulated, tps) => {
          fullAccumulated = accumulated;
          finalTps = tps;
          options?.onToken?.(token, accumulated, tps);
        },
        onComplete: (fullText, tps) => {
          const duration = performance.now() - startTime;
          resolve({
            success: true,
            text: fullText || fullAccumulated,
            tokensPerSecond: tps || finalTps,
            durationMs: duration
          });
        },
        onError: (err) => {
          resolve({
            success: false,
            text: '',
            tokensPerSecond: 0,
            durationMs: performance.now() - startTime,
            error: err.message
          });
        }
      });
    });
  }

  /**
   * Abort currently running generation.
   */
  async cancelOfflineGeneration(): Promise<boolean> {
    this.clearCallbacks();
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return false;
    }
    try {
      const fn = window.MayraNativeLLM.cancelOfflineGeneration || window.MayraNativeLLM.cancelGeneration;
      return await Promise.resolve(fn.call(window.MayraNativeLLM));
    } catch {
      return false;
    }
  }

  // ==========================================
  // PHASE 4: OFFLINE VOICE ENGINE (STT / TTS)
  // ==========================================

  private activeTtsChunkCallback: ((audioBase64Pcm: string, isFinished: boolean) => void) | null = null;
  private activeSttCallback: ((text: string, isFinal: boolean) => void) | null = null;

  /**
   * Check if Native Voice Engine (Whisper / Piper) is available.
   */
  async isVoiceEngineAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return false;
    }
    try {
      if (window.MayraNativeLLM.isVoiceEngineAvailable) {
        return await Promise.resolve(window.MayraNativeLLM.isVoiceEngineAvailable());
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Load Whisper STT Model into Native Memory.
   */
  async loadSTTModel(modelPath: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return false;
    }
    try {
      if (window.MayraNativeLLM.loadSTTModel) {
        return await Promise.resolve(window.MayraNativeLLM.loadSTTModel(modelPath));
      }
      return false;
    } catch (e) {
      console.error('[MayraNativeBridgeClient] loadSTTModel failed:', e);
      return false;
    }
  }

  /**
   * Unload STT Model from memory.
   */
  async unloadSTTModel(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return true;
    }
    try {
      if (window.MayraNativeLLM.unloadSTTModel) {
        return await Promise.resolve(window.MayraNativeLLM.unloadSTTModel());
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if STT model is loaded in native memory.
   */
  async isSTTLoaded(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return false;
    }
    try {
      if (window.MayraNativeLLM.isSTTLoaded) {
        return await Promise.resolve(window.MayraNativeLLM.isSTTLoaded());
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Transcribe 16kHz PCM audio on-device using Whisper.cpp.
   */
  async transcribeOfflineSpeech(base64Pcm16k: string, sampleRate = 16000): Promise<{ text: string; language: string; durationMs: number }> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      throw new Error('Native Android Voice Bridge is unavailable on this platform');
    }
    if (!window.MayraNativeLLM.transcribeAudio) {
      throw new Error('Native STT engine is not supported by current bridge version');
    }
    try {
      const res = await Promise.resolve(window.MayraNativeLLM.transcribeAudio(base64Pcm16k, sampleRate));
      if (typeof res === 'string') {
        return JSON.parse(res);
      }
      return res;
    } catch (e: any) {
      console.error('[MayraNativeBridgeClient] transcribeOfflineSpeech failed:', e);
      throw new Error(e.message || 'Offline Speech Recognition failed');
    }
  }

  /**
   * Load Piper TTS Model into Native Memory.
   */
  async loadTTSModel(modelPath: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return false;
    }
    try {
      if (window.MayraNativeLLM.loadTTSModel) {
        return await Promise.resolve(window.MayraNativeLLM.loadTTSModel(modelPath));
      }
      return false;
    } catch (e) {
      console.error('[MayraNativeBridgeClient] loadTTSModel failed:', e);
      return false;
    }
  }

  /**
   * Unload TTS Model from memory.
   */
  async unloadTTSModel(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return true;
    }
    try {
      if (window.MayraNativeLLM.unloadTTSModel) {
        return await Promise.resolve(window.MayraNativeLLM.unloadTTSModel());
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if TTS model is loaded in native memory.
   */
  async isTTSLoaded(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      return false;
    }
    try {
      if (window.MayraNativeLLM.isTTSLoaded) {
        return await Promise.resolve(window.MayraNativeLLM.isTTSLoaded());
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Synthesize text to speech using Piper TTS on-device.
   */
  async synthesizeOfflineSpeech(text: string, voice = 'lessac'): Promise<{ audioBase64: string; sampleRate: number; durationMs: number }> {
    if (typeof window === 'undefined' || !window.MayraNativeLLM) {
      throw new Error('Native Android Voice Bridge is unavailable on this platform');
    }
    if (!window.MayraNativeLLM.synthesizeSpeech) {
      throw new Error('Native TTS engine is not supported by current bridge version');
    }
    try {
      const res = await Promise.resolve(window.MayraNativeLLM.synthesizeSpeech(text, voice));
      if (typeof res === 'string') {
        return JSON.parse(res);
      }
      return res;
    } catch (e: any) {
      console.error('[MayraNativeBridgeClient] synthesizeOfflineSpeech failed:', e);
      throw new Error(e.message || 'Offline Speech Synthesis failed');
    }
  }
}

export const MayraNativeBridgeClient = new MayraNativeBridgeClientClass();

