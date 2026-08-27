/**
 * STONICX Hybrid AI Router
 * Phase 1 — Additive Foundation
 *
 * Coordinates between Online Gemini Live and Offline Provider.
 * Current Online system remains primary and unmodified.
 * Provides fallback detection and network status observers.
 */

import { modelDownloadManager, ManagedModelInfo } from '../models/ModelDownloadManager';
import { MayraNativeBridgeClient } from '../bridge/MayraNativeBridgeClient';

export type ActiveAiMode = 'online_gemini' | 'offline_local';

export interface HybridRouterState {
  currentMode: ActiveAiMode;
  isNetworkAvailable: boolean;
  isOfflineEngineAvailable: boolean;
  isModelReady: boolean;
  activeModelName?: string;
  offlineStatusMessage?: string;
}

export class HybridAiRouter {
  private static instance: HybridAiRouter;
  private isOnline = true;
  private listeners: Set<(state: HybridRouterState) => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public static getInstance(): HybridAiRouter {
    if (!HybridAiRouter.instance) {
      HybridAiRouter.instance = new HybridAiRouter();
    }
    return HybridAiRouter.instance;
  }

  private handleNetworkChange(online: boolean): void {
    this.isOnline = online;
    this.notifyListeners();
  }

  public getNetworkStatus(): boolean {
    return this.isOnline;
  }

  public getReadyOfflineModel(): ManagedModelInfo | undefined {
    return modelDownloadManager.getReadyModel();
  }

  public getOfflineReadiness(): { isReady: boolean; message: string; model?: ManagedModelInfo } {
    const readyModel = modelDownloadManager.getReadyModel();
    if (readyModel) {
      return {
        isReady: true,
        message: `Offline model ready: ${readyModel.name}`,
        model: readyModel
      };
    }

    return {
      isReady: false,
      message: 'Offline mode ke liye Settings se Offline AI Model download karein.'
    };
  }

  public getRecommendedMode(): ActiveAiMode {
    // Online Gemini Live is ALWAYS primary and unmodified whenever connection exists
    if (this.isOnline) {
      return 'online_gemini';
    }
    
    // Only route to offline if a model is downloaded and verified READY
    const readyModel = this.getReadyOfflineModel();
    if (readyModel) {
      return 'offline_local';
    }

    return 'online_gemini';
  }

  public subscribe(callback: (state: HybridRouterState) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const readyModel = this.getReadyOfflineModel();
    const readiness = this.getOfflineReadiness();

    const state: HybridRouterState = {
      currentMode: this.getRecommendedMode(),
      isNetworkAvailable: this.isOnline,
      isOfflineEngineAvailable: true,
      isModelReady: readiness.isReady,
      activeModelName: readyModel?.name,
      offlineStatusMessage: readiness.message
    };
    this.listeners.forEach((cb) => cb(state));
  }
}

export const hybridAiRouter = HybridAiRouter.getInstance();
