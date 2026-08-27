/**
 * STONICX Native LLM Bridge Service
 * Phase 1 — Additive Foundation
 *
 * Provides a TypeScript abstraction over window.MayraNativeLLM.
 * Designed for Android (ARM64, Android 9+, Oppo A31-class 6GB RAM devices).
 * Strictly avoids fake AI generation — reports real native readiness only.
 */

import {
  MayraNativeLLMInterface,
  NativeLLMBridgeStatus,
  OfflineGenerationResult,
  OfflinePromptOptions,
  OfflineStreamChunk
} from './offlineAiTypes';

export class NativeLLMBridge {
  private static instance: NativeLLMBridge;
  private isGenerating = false;
  private currentActiveModelPath: string | null = null;
  private streamTokenCallback: ((chunk: OfflineStreamChunk) => void) | null = null;
  private streamCompleteCallback: ((result: OfflineGenerationResult) => void) | null = null;
  private streamErrorCallback: ((error: Error) => void) | null = null;

  private constructor() {
    this.registerGlobalCallbacks();
  }

  public static getInstance(): NativeLLMBridge {
    if (!NativeLLMBridge.instance) {
      NativeLLMBridge.instance = new NativeLLMBridge();
    }
    return NativeLLMBridge.instance;
  }

  /**
   * Registers global callback dispatchers on window for the Android JNI bridge
   */
  private registerGlobalCallbacks(): void {
    if (typeof window === 'undefined') return;

    (window as any).__mayra_native_on_token = (token: string, accumulated: string, tps: number) => {
      if (this.streamTokenCallback) {
        this.streamTokenCallback({
          token,
          accumulatedText: accumulated,
          isFinished: false,
          tokensPerSecond: tps
        });
      }
    };

    (window as any).__mayra_native_on_complete = (
      text: string,
      promptTokens: number,
      completionTokens: number,
      durationMs: number,
      tps: number
    ) => {
      this.isGenerating = false;
      const result: OfflineGenerationResult = {
        text,
        promptTokens,
        completionTokens,
        durationMs,
        tokensPerSecond: tps
      };
      if (this.streamTokenCallback) {
        this.streamTokenCallback({
          token: '',
          accumulatedText: text,
          isFinished: true,
          tokensPerSecond: tps
        });
      }
      if (this.streamCompleteCallback) {
        this.streamCompleteCallback(result);
      }
    };

    (window as any).__mayra_native_on_error = (errorMessage: string) => {
      this.isGenerating = false;
      if (this.streamErrorCallback) {
        this.streamErrorCallback(new Error(errorMessage));
      }
    };
  }

  /**
   * Checks whether the native Android llama.cpp / NDK engine is present in current runtime
   */
  public async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!window.MayraNativeLLM) return false;

    try {
      const available = await Promise.resolve(window.MayraNativeLLM.isAvailable());
      return Boolean(available);
    } catch {
      return false;
    }
  }

  /**
   * Retrieves native bridge memory and model status
   */
  public async getStatus(): Promise<NativeLLMBridgeStatus> {
    const isSupported = await this.isAvailable();
    if (!isSupported || !window.MayraNativeLLM) {
      return {
        isSupported: false,
        isEngineInitialized: false,
        activeModelId: null,
        lowMemoryAlert: false
      };
    }

    try {
      const res = await Promise.resolve(window.MayraNativeLLM.getStatus());
      if (typeof res === 'string') {
        return JSON.parse(res);
      }
      return res;
    } catch (e: any) {
      return {
        isSupported: true,
        isEngineInitialized: false,
        activeModelId: null,
        lowMemoryAlert: false
      };
    }
  }

  /**
   * Loads a quantized GGUF model into memory on-demand.
   * Tailored for 6GB RAM devices: allocates strictly needed context and threads.
   */
  public async loadModel(
    modelPath: string,
    options?: { nThreads?: number; nGpuLayers?: number; contextSize?: number }
  ): Promise<boolean> {
    const isSupported = await this.isAvailable();
    if (!isSupported || !window.MayraNativeLLM) {
      throw new Error('Offline native AI engine (llama.cpp) is not available on this platform/device.');
    }

    const defaultOptions = {
      nThreads: 4, // optimal for 4 big cores on octa-core ARM64
      nGpuLayers: 0, // safe default for OpenCL/Vulkan fallback on low-tier GPUs
      contextSize: 2048, // 2K context fits easily within <1.2GB RAM
      ...options
    };

    try {
      const success = await window.MayraNativeLLM.loadModel(modelPath, defaultOptions);
      if (success) {
        this.currentActiveModelPath = modelPath;
      }
      return success;
    } catch (err: any) {
      throw new Error(`Failed to load GGUF model into memory: ${err.message || err}`);
    }
  }

  /**
   * Immediately frees model memory from RAM/VRAM.
   * Essential for low-memory Android devices when switching tasks.
   */
  public async unloadModel(): Promise<boolean> {
    if (!window.MayraNativeLLM) return true;

    try {
      const result = await window.MayraNativeLLM.unloadModel();
      this.currentActiveModelPath = null;
      return result;
    } catch {
      this.currentActiveModelPath = null;
      return false;
    }
  }

  /**
   * Sends a synchronous prompt to the native LLM engine
   */
  public async sendPrompt(prompt: string, options?: OfflinePromptOptions): Promise<OfflineGenerationResult> {
    const isSupported = await this.isAvailable();
    if (!isSupported || !window.MayraNativeLLM) {
      throw new Error('Offline native AI engine is not installed or available.');
    }

    if (!this.currentActiveModelPath) {
      throw new Error('No offline GGUF model is currently loaded in memory. Please download and load a model.');
    }

    this.isGenerating = true;
    try {
      const result = await window.MayraNativeLLM.sendPrompt(prompt, options);
      return result;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Streams generation tokens from native engine to UI callbacks
   */
  public async streamPrompt(
    prompt: string,
    options: OfflinePromptOptions,
    onToken: (chunk: OfflineStreamChunk) => void,
    onComplete: (result: OfflineGenerationResult) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const isSupported = await this.isAvailable();
    if (!isSupported || !window.MayraNativeLLM) {
      onError(new Error('Offline native AI engine is not available. Connect to internet for Gemini Live or install local model.'));
      return;
    }

    if (!this.currentActiveModelPath) {
      onError(new Error('No offline model is loaded. Please load an on-device model first.'));
      return;
    }

    this.isGenerating = true;
    this.streamTokenCallback = onToken;
    this.streamCompleteCallback = onComplete;
    this.streamErrorCallback = onError;

    try {
      await window.MayraNativeLLM.streamPrompt(
        prompt,
        options,
        '__mayra_native_on_token',
        '__mayra_native_on_complete',
        '__mayra_native_on_error'
      );
    } catch (err: any) {
      this.isGenerating = false;
      onError(new Error(`Native streaming failed: ${err.message || err}`));
    }
  }

  /**
   * Cancels active generation in progress
   */
  public async cancelGeneration(): Promise<boolean> {
    if (!this.isGenerating || !window.MayraNativeLLM) return true;

    try {
      const res = await window.MayraNativeLLM.cancelGeneration();
      this.isGenerating = false;
      return res;
    } catch {
      this.isGenerating = false;
      return false;
    }
  }

  public getActiveModel(): string | null {
    return this.currentActiveModelPath;
  }
}

export const nativeLlmBridge = NativeLLMBridge.getInstance();
