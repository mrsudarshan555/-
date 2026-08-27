/**
 * STONICX Offline AI System Type Definitions
 * Phase 1 — Additive Foundation
 *
 * Defines the contract for on-device native GGUF LLM, TTS, STT, and Image Diffusion engines
 * without modifying any existing online Gemini Live or 3D avatar systems.
 */

export type OfflineModelCategory = 'chat_llm' | 'voice_stt' | 'voice_tts' | 'image_diffusion';

export type OfflineModelStatus = 
  | 'not_downloaded' 
  | 'downloading' 
  | 'downloaded' 
  | 'verifying' 
  | 'ready' 
  | 'error';

export type OfflineDownloadModelStatus =
  | 'NOT_INSTALLED'
  | 'DOWNLOADING'
  | 'VERIFYING'
  | 'READY'
  | 'CORRUPTED'
  | 'ERROR';

export interface ModelDownloadProgress {
  modelId: string;
  status: OfflineDownloadModelStatus;
  progressPercent: number; // 0 to 100
  downloadedBytes: number;
  totalBytes: number;
  speedMbps: number;
  etaSeconds: number;
  error?: string;
}

export interface OfflineModelDescriptor {
  id: string;
  name: string;
  category: OfflineModelCategory;
  description: string;
  filename: string;
  format: 'GGUF' | 'ONNX' | 'BIN';
  quantization?: string;
  sizeBytes: number;
  sizeFormatted: string;
  estimatedRamBytes: number;
  estimatedRamFormatted: string;
  sha256?: string;
  downloadUrl?: string;
  status: OfflineModelStatus;
  downloadProgress?: number; // 0.0 to 1.0
  isLoadedInMemory?: boolean;
  minDeviceRamGb: number;
  recommendedCores: number;
}

export interface OfflinePromptOptions {
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[];
  contextLength?: number;
}

export interface OfflineStreamChunk {
  token: string;
  accumulatedText: string;
  isFinished: boolean;
  tokensPerSecond?: number;
}

export interface OfflineGenerationResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  tokensPerSecond: number;
}

export interface NativeLLMBridgeStatus {
  isSupported: boolean;
  isEngineInitialized: boolean;
  isModelLoaded?: boolean;
  isSTTLoaded?: boolean;
  isTTSLoaded?: boolean;
  activeModelId: string | null;
  activeSTTModelId?: string | null;
  activeTTSModelId?: string | null;
  availableVramMb?: number;
  deviceRamMb?: number;
  lowMemoryAlert?: boolean;
  engineVersion?: string;
}

export interface NativeDeviceMemory {
  totalRamMb: number;
  availRamMb: number;
  isLowMemory: boolean;
}

export interface NativeDeviceStorage {
  totalStorageMb: number;
  freeStorageMb: number;
}

export interface OfflineSpeechRecognitionResult {
  text: string;
  language: string;
  durationMs: number;
  confidence: number;
}

export interface OfflineSpeechSynthesisResult {
  audioBase64: string;
  sampleRate: number;
  durationMs: number;
}

/**
 * Native Android Interface Specification
 * Exposed via window.MayraNativeLLM when running inside Android WebView/Capacitor Native Container
 */
export interface MayraNativeLLMInterface {
  isAvailable(): Promise<boolean> | boolean;
  getStatus(): Promise<string | NativeLLMBridgeStatus> | string | NativeLLMBridgeStatus;
  getModelStatus?(): Promise<string | NativeLLMBridgeStatus> | string | NativeLLMBridgeStatus;
  getDeviceMemory?(): Promise<string | NativeDeviceMemory> | string | NativeDeviceMemory;
  getAvailableStorage?(): Promise<string | NativeDeviceStorage> | string | NativeDeviceStorage;
  getModelDirectory?(): Promise<string> | string;
  checkModelFile?(filename: string): Promise<string | { exists: boolean; sizeBytes: number; path: string }> | string | { exists: boolean; sizeBytes: number; path: string };
  deleteModelFile?(filename: string): Promise<boolean> | boolean;
  isModelLoaded?(): Promise<boolean> | boolean;
  loadModel(modelPath: string, options?: string | { nThreads?: number; nGpuLayers?: number; contextSize?: number }): Promise<boolean>;
  loadLocalModel?(modelPath: string, options?: string | { nThreads?: number; nGpuLayers?: number; contextSize?: number }): Promise<boolean>;
  unloadModel(): Promise<boolean>;
  unloadLocalModel?(): Promise<boolean>;
  sendPrompt?(prompt: string, options?: OfflinePromptOptions): Promise<OfflineGenerationResult>;
  streamPrompt?(
    prompt: string,
    options: OfflinePromptOptions,
    onTokenCallbackName?: string,
    onCompleteCallbackName?: string,
    onErrorCallbackName?: string
  ): Promise<void>;
  cancelGeneration(): Promise<boolean>;
  cancelOfflineGeneration?(): Promise<boolean>;

  // Offline Voice Engine methods (STT / Whisper & TTS / Piper)
  isVoiceEngineAvailable?(): Promise<boolean> | boolean;
  loadSTTModel?(modelPath: string): Promise<boolean>;
  unloadSTTModel?(): Promise<boolean>;
  isSTTLoaded?(): Promise<boolean> | boolean;
  transcribeAudio?(base64Pcm: string, sampleRate: number): Promise<string | OfflineSpeechRecognitionResult>;
  loadTTSModel?(modelPath: string): Promise<boolean>;
  unloadTTSModel?(): Promise<boolean>;
  isTTSLoaded?(): Promise<boolean> | boolean;
  synthesizeSpeech?(text: string, voice?: string): Promise<string | OfflineSpeechSynthesisResult>;
  streamSynthesizeSpeech?(text: string): Promise<void>;
}

declare global {
  interface Window {
    MayraNativeLLM?: MayraNativeLLMInterface;
    __mayra_native_on_token?: (token: string, accumulated: string, tps: number) => void;
    __mayra_native_on_complete?: (fullText: string, tpsOrPromptTokens?: number, completionTokens?: number, durationMs?: number, tps?: number) => void;
    __mayra_native_on_error?: (errorMessage: string) => void;
    __mayra_native_on_tts_chunk?: (audioBase64Pcm: string, isFinished: boolean) => void;
    __mayra_native_on_stt_result?: (text: string, isFinal: boolean) => void;
  }
}

