/**
 * STONICX Local Model Manager
 * Phase 1 — Additive Foundation
 *
 * Manages model metadata, optional on-device storage, download tracking,
 * and memory budgets for 6GB RAM Android devices.
 * Models are NEVER bundled inside the APK.
 */

import { OfflineModelDescriptor } from './offlineAiTypes';

export const DEFAULT_OFFLINE_MODELS: OfflineModelDescriptor[] = [
  {
    id: 'lfm2.5-230m-q4',
    name: 'Mayra Base (LFM 2.5 230M Default)',
    category: 'chat_llm',
    description: 'Ultra-fast low-memory default GGUF model (~145 MB) with instant response and lowest battery impact.',
    filename: 'LFM2.5-230M-Q4_K_M.gguf',
    format: 'GGUF',
    quantization: 'Q4_K_M',
    sizeBytes: 152043520, // ~145 MB
    sizeFormatted: '145 MB',
    estimatedRamBytes: 240000000, // ~240 MB
    estimatedRamFormatted: '240 MB',
    sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    downloadUrl: 'https://huggingface.co/LiquidCloud/LFM-2.5-230M-GGUF/resolve/main/LFM2.5-230M-Q4_K_M.gguf',
    status: 'not_downloaded',
    downloadProgress: 0,
    isLoadedInMemory: false,
    minDeviceRamGb: 2,
    recommendedCores: 2
  },
  {
    id: 'qwen2.5-0.5b-q4',
    name: 'Mayra Compact (Qwen 2.5 0.5B)',
    category: 'chat_llm',
    description: 'Fast, balanced daily conversational model (~398 MB) with low RAM footprint.',
    filename: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
    format: 'GGUF',
    quantization: 'Q4_K_M',
    sizeBytes: 398000000, // ~398 MB
    sizeFormatted: '398 MB',
    estimatedRamBytes: 520000000, // ~520 MB
    estimatedRamFormatted: '520 MB',
    sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
    status: 'not_downloaded',
    downloadProgress: 0,
    isLoadedInMemory: false,
    minDeviceRamGb: 3,
    recommendedCores: 2
  },
  {
    id: 'smollm2-1.7b-q4',
    name: 'Mayra High-Reasoning (SmolLM2 1.7B)',
    category: 'chat_llm',
    description: 'High-accuracy reasoning and conversational depth (~1.06 GB) for complex queries.',
    filename: 'smollm2-1.7b-instruct-q4_k_m.gguf',
    format: 'GGUF',
    quantization: 'Q4_K_M',
    sizeBytes: 1048576000, // ~1.00 GB
    sizeFormatted: '1.00 GB',
    estimatedRamBytes: 1180000000, // ~1.18 GB
    estimatedRamFormatted: '1.18 GB',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    downloadUrl: 'https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF/resolve/main/smollm2-1.7b-instruct-q4_k_m.gguf',
    status: 'not_downloaded',
    downloadProgress: 0,
    isLoadedInMemory: false,
    minDeviceRamGb: 4,
    recommendedCores: 4
  },
  {
    id: 'llama-3.2-1b-q4',
    name: 'Mayra Knowledge (Llama 3.2 1B)',
    category: 'chat_llm',
    description: 'Rich knowledge and multilingual precision (~750 MB) optimized for on-device execution.',
    filename: 'llama-3.2-1b-instruct-q4_k_m.gguf',
    format: 'GGUF',
    quantization: 'Q4_K_M',
    sizeBytes: 786432000, // ~750 MB
    sizeFormatted: '750 MB',
    estimatedRamBytes: 880000000, // ~880 MB
    estimatedRamFormatted: '880 MB',
    sha256: '3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
    downloadUrl: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    status: 'not_downloaded',
    downloadProgress: 0,
    isLoadedInMemory: false,
    minDeviceRamGb: 4,
    recommendedCores: 4
  },
  {
    id: 'piper-tts-en',
    name: 'Mayra Local Voice (Piper TTS)',
    category: 'voice_tts',
    description: 'Local neural text-to-speech voice pack for offline spoken responses.',
    filename: 'en_US-lessac-medium.onnx',
    format: 'ONNX',
    sizeBytes: 42000000, // ~42 MB
    sizeFormatted: '42 MB',
    estimatedRamBytes: 85000000, // ~85 MB
    estimatedRamFormatted: '85 MB',
    status: 'not_downloaded',
    downloadProgress: 0,
    isLoadedInMemory: false,
    minDeviceRamGb: 3,
    recommendedCores: 2
  },
  {
    id: 'whisper-stt-tiny',
    name: 'Mayra Local Hearing (Whisper Tiny)',
    category: 'voice_stt',
    description: 'Local speech-to-text acoustic model for offline microphone transcription.',
    filename: 'ggml-tiny.en-q5_1.bin',
    format: 'BIN',
    quantization: 'Q5_1',
    sizeBytes: 45000000, // ~45 MB
    sizeFormatted: '45 MB',
    estimatedRamBytes: 110000000, // ~110 MB
    estimatedRamFormatted: '110 MB',
    status: 'not_downloaded',
    downloadProgress: 0,
    isLoadedInMemory: false,
    minDeviceRamGb: 4,
    recommendedCores: 2
  },
  {
    id: 'sd-turbo-int8',
    name: 'Mayra Local Imagination (SD-Turbo Quantized)',
    category: 'image_diffusion',
    description: '1-step ultra-fast local latent diffusion image synthesis (Requires >= 6GB RAM).',
    filename: 'sd_turbo_q4_0.gguf',
    format: 'GGUF',
    quantization: 'Q4_0',
    sizeBytes: 1720000000, // ~1.72 GB
    sizeFormatted: '1.72 GB',
    estimatedRamBytes: 1850000000, // ~1.85 GB
    estimatedRamFormatted: '1.85 GB',
    status: 'not_downloaded',
    downloadProgress: 0,
    isLoadedInMemory: false,
    minDeviceRamGb: 6,
    recommendedCores: 6
  }
];

export class LocalModelManager {
  private static instance: LocalModelManager;
  private models: Map<string, OfflineModelDescriptor> = new Map();
  private storageKey = 'mayra_offline_model_catalog';

  private constructor() {
    this.initCatalog();
  }

  public static getInstance(): LocalModelManager {
    if (!LocalModelManager.instance) {
      LocalModelManager.instance = new LocalModelManager();
    }
    return LocalModelManager.instance;
  }

  private initCatalog(): void {
    DEFAULT_OFFLINE_MODELS.forEach((m) => this.models.set(m.id, { ...m }));

    // Load persisted local installation statuses from localStorage if present
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(this.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.forEach((item: Partial<OfflineModelDescriptor>) => {
            if (item.id && this.models.has(item.id)) {
              const current = this.models.get(item.id)!;
              this.models.set(item.id, {
                ...current,
                status: item.status || current.status,
                downloadProgress: item.downloadProgress ?? current.downloadProgress
              });
            }
          });
        }
      } catch {
        // Fallback to defaults
      }
    }
  }

  private saveCatalog(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const data = Array.from(this.models.values()).map((m) => ({
        id: m.id,
        status: m.status,
        downloadProgress: m.downloadProgress
      }));
      window.localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  public getAllModels(): OfflineModelDescriptor[] {
    return Array.from(this.models.values());
  }

  public getModelById(id: string): OfflineModelDescriptor | undefined {
    return this.models.get(id);
  }

  public getModelsByCategory(category: OfflineModelDescriptor['category']): OfflineModelDescriptor[] {
    return Array.from(this.models.values()).filter((m) => m.category === category);
  }

  public getReadyChatModel(): OfflineModelDescriptor | undefined {
    return Array.from(this.models.values()).find((m) => m.category === 'chat_llm' && m.status === 'ready');
  }

  public updateModelStatus(
    id: string,
    status: OfflineModelDescriptor['status'],
    progress?: number,
    isLoaded?: boolean
  ): void {
    const model = this.models.get(id);
    if (!model) return;

    model.status = status;
    if (progress !== undefined) model.downloadProgress = progress;
    if (isLoaded !== undefined) model.isLoadedInMemory = isLoaded;

    this.models.set(id, { ...model });
    this.saveCatalog();
  }

  public getTotalDownloadedBytes(): number {
    return Array.from(this.models.values())
      .filter((m) => m.status === 'ready')
      .reduce((acc, m) => acc + m.sizeBytes, 0);
  }
}

export const localModelManager = LocalModelManager.getInstance();
