/**
 * STONICX Offline Voice Service (STT + TTS Pipeline)
 * Phase 4 — Additive Offline Voice Engine
 *
 * Responsibilities:
 * - On-device speech recognition via Whisper.cpp / Native STT
 * - On-device neural speech synthesis via Piper TTS / Native TTS
 * - Direct Web Audio PCM playback driving the Mayra avatar lip-sync system
 * - Zero modification to the online Gemini Live / Aoede WebSocket pipeline
 */

import { MayraNativeBridgeClient } from '../bridge/MayraNativeBridgeClient';
import { modelDownloadManager } from '../models/ModelDownloadManager';
import { AssistantStatus } from '../../types';

export interface OfflineVoiceStatus {
  isVoiceEngineAvailable: boolean;
  isSttReady: boolean;
  isTtsReady: boolean;
  isLlmReady: boolean;
  sttModelName?: string;
  ttsModelName?: string;
  llmModelName?: string;
}

class OfflineVoiceService {
  private static instance: OfflineVoiceService;
  private audioContext: AudioContext | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private isPlayingAudio = false;

  private constructor() {}

  public static getInstance(): OfflineVoiceService {
    if (!OfflineVoiceService.instance) {
      OfflineVoiceService.instance = new OfflineVoiceService();
    }
    return OfflineVoiceService.instance;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * Check whether all required components (STT + LLM + TTS) are ready for offline voice conversation.
   */
  public async getVoiceStatus(): Promise<OfflineVoiceStatus> {
    const isBridge = await MayraNativeBridgeClient.isAvailable();
    const isVoiceAvail = await MayraNativeBridgeClient.isVoiceEngineAvailable();

    const sttModel = modelDownloadManager.getReadySTTModel();
    const ttsModel = modelDownloadManager.getReadyTTSModel();
    const llmModel = modelDownloadManager.getReadyModel();

    return {
      isVoiceEngineAvailable: isBridge || isVoiceAvail,
      isSttReady: !!sttModel && sttModel.status === 'READY',
      isTtsReady: !!ttsModel && ttsModel.status === 'READY',
      isLlmReady: !!llmModel && llmModel.status === 'READY',
      sttModelName: sttModel?.name,
      ttsModelName: ttsModel?.name,
      llmModelName: llmModel?.name
    };
  }

  /**
   * Transcribe 16kHz PCM audio on-device.
   */
  public async transcribeAudio(
    pcm16kBase64: string,
    sampleRate = 16000
  ): Promise<{ text: string; language: string; durationMs: number }> {
    const status = await this.getVoiceStatus();
    if (!status.isSttReady) {
      throw new Error('OFFLINE_VOICE_PACK_REQUIRED: Whisper STT model is not installed. Please download the Offline Voice Pack from Settings > Offline Models.');
    }

    // Ensure model is loaded in native memory
    const isSttLoaded = await MayraNativeBridgeClient.isSTTLoaded();
    if (!isSttLoaded) {
      const sttModel = modelDownloadManager.getReadySTTModel();
      if (sttModel) {
        await modelDownloadManager.loadModel(sttModel.id);
      }
    }

    return await MayraNativeBridgeClient.transcribeOfflineSpeech(pcm16kBase64, sampleRate);
  }

  /**
   * Synthesize text to speech using Piper TTS on-device.
   */
  public async synthesizeSpeech(
    text: string,
    voice = 'lessac'
  ): Promise<{ audioBase64: string; sampleRate: number; durationMs: number }> {
    const status = await this.getVoiceStatus();
    if (!status.isTtsReady) {
      throw new Error('OFFLINE_VOICE_PACK_REQUIRED: Piper TTS voice pack is not installed. Please download the Offline Voice Pack from Settings > Offline Models.');
    }

    // Ensure model is loaded in native memory
    const isTtsLoaded = await MayraNativeBridgeClient.isTTSLoaded();
    if (!isTtsLoaded) {
      const ttsModel = modelDownloadManager.getReadyTTSModel();
      if (ttsModel) {
        await modelDownloadManager.loadModel(ttsModel.id);
      }
    }

    return await MayraNativeBridgeClient.synthesizeOfflineSpeech(text, voice);
  }

  /**
   * Plays raw 16-bit linear PCM audio chunk through Web Audio API.
   * Directly drives the Mayra 3D Avatar lip-sync and speaking state.
   */
  public playRawPcmAudio(
    base64Pcm: string,
    sampleRate = 22050,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!base64Pcm) {
      if (onEnd) onEnd();
      return false;
    }

    try {
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit signed integer PCM to Float32 [-1.0, 1.0]
      const int16Count = Math.floor(bytes.length / 2);
      const float32Data = new Float32Array(int16Count);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      for (let i = 0; i < int16Count; i++) {
        const int16 = dataView.getInt16(i * 2, true); // little-endian
        float32Data[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
      }

      const ctx = this.getAudioContext();
      const audioBuffer = ctx.createBuffer(1, float32Data.length, sampleRate);
      audioBuffer.copyToChannel(float32Data, 0);

      // Stop previous source if playing
      this.stopAudioPlayback();

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      this.currentSourceNode = source;
      this.isPlayingAudio = true;

      if (onStart) {
        onStart();
      }

      source.onended = () => {
        this.isPlayingAudio = false;
        this.currentSourceNode = null;
        if (onEnd) {
          onEnd();
        }
      };

      source.start();
      return true;
    } catch (e) {
      console.error('[OfflineVoiceService] playRawPcmAudio failed:', e);
      this.isPlayingAudio = false;
      if (onEnd) onEnd();
      return false;
    }
  }

  /**
   * Stop active audio playback immediately.
   */
  public stopAudioPlayback(): void {
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch {}
      this.currentSourceNode = null;
    }
    this.isPlayingAudio = false;
  }

  public isSpeaking(): boolean {
    return this.isPlayingAudio;
  }
}

export const offlineVoiceService = OfflineVoiceService.getInstance();
