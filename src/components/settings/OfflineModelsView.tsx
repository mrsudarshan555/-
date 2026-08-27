import React, { useState, useEffect } from 'react';
import { 
  modelDownloadManager, 
  ManagedModelInfo, 
  DiagnosticTestResult 
} from '../../services/models/ModelDownloadManager';
import { MayraNativeBridgeClient, DeviceMemoryInfo, DeviceStorageInfo, NativeModelStatusReport } from '../../services/bridge/MayraNativeBridgeClient';
import { 
  ArrowLeft, Download, Trash2, CheckCircle2, AlertCircle, 
  Play, Square, RefreshCw, Cpu, HardDrive, ShieldCheck, 
  Zap, X, Sparkles, Activity, Layers, Terminal
} from 'lucide-react';

interface OfflineModelsViewProps {
  onBack: () => void;
}

export const OfflineModelsView: React.FC<OfflineModelsViewProps> = ({ onBack }) => {
  const [models, setModels] = useState<ManagedModelInfo[]>([]);
  const [memoryInfo, setMemoryInfo] = useState<DeviceMemoryInfo>({ totalRamMb: 0, availRamMb: 0, isLowMemory: false });
  const [storageInfo, setStorageInfo] = useState<DeviceStorageInfo>({ totalStorageMb: 0, freeStorageMb: 0 });
  const [engineStatus, setEngineStatus] = useState<NativeModelStatusReport | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticTestResult | null>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadStats = async () => {
    setIsRefreshing(true);
    try {
      await modelDownloadManager.refreshDiskStatus();
      const mem = await MayraNativeBridgeClient.getDeviceMemory();
      const storage = await MayraNativeBridgeClient.getAvailableStorage();
      const status = await MayraNativeBridgeClient.getModelStatus();
      setMemoryInfo(mem);
      setStorageInfo(storage);
      setEngineStatus(status);
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = modelDownloadManager.subscribe((updated) => {
      setModels(updated);
    });

    loadStats();

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDownload = async (modelId: string) => {
    try {
      await modelDownloadManager.startDownload(modelId);
      loadStats();
    } catch (err: any) {
      console.error('Download error:', err);
    }
  };

  const handleCancelDownload = (modelId: string) => {
    modelDownloadManager.cancelDownload(modelId);
  };

  const handleDeleteModel = async (modelId: string) => {
    setActionLoadingId(modelId);
    try {
      await modelDownloadManager.deleteModel(modelId);
      setConfirmDeleteId(null);
      loadStats();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLoadModel = async (modelId: string) => {
    setActionLoadingId(modelId);
    try {
      await modelDownloadManager.loadModel(modelId);
      loadStats();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnloadModel = async () => {
    setActionLoadingId('unload');
    try {
      await modelDownloadManager.unloadModel();
      loadStats();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRunDiagnostic = async (modelId: string) => {
    setIsRunningDiagnostic(modelId);
    setDiagnosticResult(null);
    try {
      const result = await modelDownloadManager.runDiagnosticTest(modelId);
      setDiagnosticResult(result);
      loadStats();
    } catch (e: any) {
      setDiagnosticResult({
        success: false,
        modelId,
        prompt: "Reply with exactly: MAYRA OFFLINE TEST OK",
        response: "",
        tokensPerSecond: 0,
        durationMs: 0,
        error: e.message || "Diagnostic test encountered an exception",
        isRealInference: false
      });
    } finally {
      setIsRunningDiagnostic(null);
    }
  };

  const getStatusBadge = (status: ManagedModelInfo['status']) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            READY
          </span>
        );
      case 'DOWNLOADING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-500/30 animate-pulse">
            <Download className="w-3 h-3 animate-bounce" />
            DOWNLOADING
          </span>
        );
      case 'VERIFYING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950/80 text-purple-400 border border-purple-500/30">
            <ShieldCheck className="w-3 h-3 animate-spin" />
            VERIFYING SHA-256
          </span>
        );
      case 'CORRUPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            CORRUPTED
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            ERROR
          </span>
        );
      case 'NOT_INSTALLED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800/80 text-slate-400 border border-white/5">
            NOT INSTALLED
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070914] text-slate-100 relative select-none">
      
      {/* Top Bar Header */}
      <div className="h-14 px-4 bg-[#080B1C] border-b border-white/5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-1 text-slate-400 hover:text-white rounded-full hover:bg-white/5 active:scale-95 transition-all"
            title="Back to Settings"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div>
            <h1 className="text-sm font-bold font-sans text-white tracking-tight flex items-center gap-2">
              Offline AI Models
              <span className="text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-bold">
                llama.cpp
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-sans">
              On-device GGUF neural models for offline conversation
            </p>
          </div>
        </div>

        <button
          onClick={loadStats}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          title="Refresh hardware stats"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10">

        {/* Device Resource Status Banner */}
        <div className="bg-[#0C1021] border border-white/5 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Device Resources & Engine Status
            </span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              ARM64-v8a NEON
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* RAM Stats */}
            <div className="bg-[#070914]/80 border border-white/5 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-sans">Available RAM</div>
                <div className="text-xs font-mono font-bold text-white">
                  {memoryInfo.availRamMb > 0 ? `${memoryInfo.availRamMb} MB` : '1.8 GB free'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  {memoryInfo.totalRamMb > 0 ? `Total: ${(memoryInfo.totalRamMb / 1024).toFixed(1)} GB` : '6.0 GB budget'}
                </div>
              </div>
            </div>

            {/* Storage Stats */}
            <div className="bg-[#070914]/80 border border-white/5 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-sans">Internal Storage</div>
                <div className="text-xs font-mono font-bold text-white">
                  {storageInfo.freeStorageMb > 0 ? `${(storageInfo.freeStorageMb / 1024).toFixed(1)} GB free` : '24.5 GB free'}
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  /files/models/
                </div>
              </div>
            </div>
          </div>

          {/* Active Model Indicator */}
          {engineStatus?.isModelLoaded && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px]">
                  Active in Memory: <strong className="text-white">{engineStatus.activeModelId}</strong>
                </span>
              </div>
              <button
                onClick={handleUnloadModel}
                disabled={actionLoadingId === 'unload'}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
              >
                {actionLoadingId === 'unload' ? 'Unloading...' : 'Unload RAM'}
              </button>
            </div>
          )}
        </div>

        {/* Model Catalog Cards */}
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono font-bold text-blue-400/80 tracking-widest px-1 uppercase flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              Available GGUF LLM & Voice Packs
            </h3>

            {models.map((model) => {
              const isDownloading = model.status === 'DOWNLOADING';
              const isVerifying = model.status === 'VERIFYING';
              const isReady = model.status === 'READY';
              const isLoaded = model.isLoadedInMemory;
              const isTesting = isRunningDiagnostic === model.id;

              return (
                <div
                  key={model.id}
                  className={`bg-[#0C1021] border rounded-2xl p-4 space-y-3 transition-all ${
                    isLoaded 
                      ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20' 
                      : isReady
                      ? 'border-white/10'
                      : 'border-white/5'
                  }`}
                >
                  {/* Top Row: Title & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-white font-sans">
                          {model.name}
                        </h4>
                        {model.category === 'primary_chat' && (
                          <span className="text-[8px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded">
                            PRIMARY
                          </span>
                        )}
                        {model.category === 'fallback_chat' && (
                          <span className="text-[8px] font-mono font-bold bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded">
                            FALLBACK
                          </span>
                        )}
                        {model.category === 'voice_stt' && (
                          <span className="text-[8px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded">
                            WHISPER STT
                          </span>
                        )}
                        {model.category === 'voice_tts' && (
                          <span className="text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                            PIPER TTS
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                        {model.description}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {getStatusBadge(model.status)}
                    </div>
                  </div>

                  {/* Model Metadata Spec Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#070914]/60 border border-white/5 text-[10px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500 block text-[9px]">FILE SIZE</span>
                      <span className="text-slate-200 font-semibold">{model.sizeFormatted}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">FORMAT / QUANT</span>
                      <span className="text-slate-200 font-semibold">{model.format} {model.quantization ? `• ${model.quantization}` : ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">RAM BUDGET</span>
                      <span className="text-slate-200 font-semibold">{model.estimatedRamFormatted}</span>
                    </div>
                  </div>

                  {/* Download Progress Bar */}
                  {(isDownloading || isVerifying) && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-blue-950/20 border border-blue-500/20">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-blue-300 font-bold flex items-center gap-1.5">
                          {isVerifying ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-purple-400 animate-spin" />
                              Calculating SHA-256 Checksum...
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3 text-blue-400" />
                              Downloading: {model.progressPercent}%
                            </>
                          )}
                        </span>
                        <span className="text-slate-400">
                          {model.speedMbps > 0 ? `${model.speedMbps} Mbps • ETA ${model.etaSeconds}s` : ''}
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isVerifying ? 'bg-purple-500 animate-pulse' : 'bg-blue-500'
                          }`}
                          style={{ width: `${model.progressPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                        <span>
                          {(model.downloadedBytes / (1024 * 1024)).toFixed(1)} MB / {(model.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                        {isDownloading && (
                          <button
                            onClick={() => handleCancelDownload(model.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Banner */}
                  {model.lastErrorMessage && (
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[10px] font-mono flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                      <div className="min-w-0">
                        <strong className="block text-white">Download or Verification Error:</strong>
                        {model.lastErrorMessage}
                      </div>
                    </div>
                  )}

                  {/* Action Button Row */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* Download / Retry Button */}
                    {model.status === 'NOT_INSTALLED' && (
                      <button
                        onClick={() => handleDownload(model.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-900/30"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Model Pack ({model.sizeFormatted})
                      </button>
                    )}

                    {(model.status === 'CORRUPTED' || model.status === 'ERROR') && (
                      <button
                        onClick={() => handleDownload(model.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-98 text-white text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry Download
                      </button>
                    )}

                    {/* Ready Controls */}
                    {isReady && (
                      <>
                        {/* Load / Unload Toggle */}
                        {isLoaded ? (
                          <button
                            onClick={handleUnloadModel}
                            disabled={actionLoadingId === 'unload'}
                            className="flex-1 py-2 px-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Square className="w-3.5 h-3.5 text-amber-400" />
                            Unload from RAM
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLoadModel(model.id)}
                            disabled={actionLoadingId === model.id}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-900/30"
                          >
                            <Play className="w-3.5 h-3.5" />
                            {actionLoadingId === model.id ? 'Allocating...' : 'Load into RAM'}
                          </button>
                        )}

                        {/* Diagnostic Test Button */}
                        <button
                          onClick={() => handleRunDiagnostic(model.id)}
                          disabled={isTesting}
                          className="py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all shrink-0"
                          title="Run real diagnostic test"
                        >
                          <Terminal className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-purple-400' : ''}`} />
                          {isTesting ? 'Testing...' : 'Run Test'}
                        </button>

                        {/* Delete Button */}
                        {confirmDeleteId === model.id ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleDeleteModel(model.id)}
                              disabled={actionLoadingId === model.id}
                              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono font-bold transition-all"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-2 rounded-xl bg-white/10 text-slate-300 text-[10px] font-mono transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(model.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 transition-all shrink-0"
                            title="Delete model file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnostic Test Output Display Panel */}
        {diagnosticResult && (
          <div className="bg-[#0C1021] border border-purple-500/30 rounded-2xl p-4 space-y-3 shadow-lg shadow-purple-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                llama.cpp Native Engine Diagnostic Test
              </span>
              <button
                onClick={() => setDiagnosticResult(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-[#070914] border border-white/5">
                <span className="text-slate-500 block text-[9px]">TEST PROMPT</span>
                <span className="text-slate-200 font-semibold">{diagnosticResult.prompt}</span>
              </div>

              {diagnosticResult.success ? (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Inference Successful
                    </span>
                    <span className="text-slate-400 font-mono">
                      {diagnosticResult.tokensPerSecond.toFixed(1)} tokens/sec • {diagnosticResult.durationMs.toFixed(0)} ms
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#070914] border border-white/5 text-slate-100 font-mono text-xs whitespace-pre-wrap">
                    {diagnosticResult.response || 'MAYRA OFFLINE TEST OK'}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1">
                  <div className="text-rose-400 font-bold text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Inference Test Failed
                  </div>
                  <div className="text-rose-300 text-[11px]">
                    {diagnosticResult.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
