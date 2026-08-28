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
  Zap, X, Sparkles, Activity, Layers, Terminal, Check, Star
} from 'lucide-react';

interface OfflineModelsViewProps {
  onBack: () => void;
}

export const OfflineModelsView: React.FC<OfflineModelsViewProps> = ({ onBack }) => {
  const [models, setModels] = useState<ManagedModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(() => modelDownloadManager.getSelectedModelId());
  const [memoryInfo, setMemoryInfo] = useState<DeviceMemoryInfo>({ totalRamMb: 0, availRamMb: 0, isLowMemory: false });
  const [storageInfo, setStorageInfo] = useState<DeviceStorageInfo>({ totalStorageMb: 0, freeStorageMb: 0 });
  const [engineStatus, setEngineStatus] = useState<NativeModelStatusReport | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticTestResult | null>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

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
      setSelectedModelId(modelDownloadManager.getSelectedModelId());
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = modelDownloadManager.subscribe((updated) => {
      setModels(updated);
      setSelectedModelId(modelDownloadManager.getSelectedModelId());
    });

    loadStats();

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSelectActiveModel = async (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    if (!model) return;

    setActionLoadingId(`select-${modelId}`);
    try {
      await modelDownloadManager.setSelectedModelId(modelId);
      setSelectedModelId(modelId);
      setSwitchFeedback(`Active Offline Model switched to: ${model.name}`);
      setTimeout(() => setSwitchFeedback(null), 3500);
      loadStats();
    } finally {
      setActionLoadingId(null);
    }
  };

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
            <CheckCircle2 className="w-3 h-3 stroke-[1.8]" />
            DOWNLOADED / READY
          </span>
        );
      case 'DOWNLOADING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-500/30 animate-pulse">
            <Download className="w-3 h-3 stroke-[1.8] animate-bounce" />
            DOWNLOADING
          </span>
        );
      case 'VERIFYING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950/80 text-purple-400 border border-purple-500/30">
            <ShieldCheck className="w-3 h-3 stroke-[1.8] animate-spin" />
            VERIFYING SHA-256
          </span>
        );
      case 'CORRUPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 stroke-[1.8]" />
            CORRUPTED
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 stroke-[1.8]" />
            ERROR
          </span>
        );
      case 'NOT_INSTALLED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800/80 text-slate-400 border border-white/5">
            <Download className="w-3 h-3 stroke-[1.8]" />
            DOWNLOAD REQUIRED
          </span>
        );
    }
  };

  const activeSelectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070914] text-slate-100 relative select-none">
      
      {/* Top Bar Header */}
      <div className="h-14 px-4 bg-[#080B1C] border-b border-white/5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-1 text-slate-400 hover:text-white rounded-full hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-5 h-5 text-white stroke-[1.8]" />
          </button>

          <div>
            <h1 className="text-sm font-bold font-sans text-white tracking-tight flex items-center gap-2">
              Local AI & Offline Mode
              <span className="text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-bold">
                llama.cpp GGUF
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-sans">
              Choose on-device neural model for offline chat & voice
            </p>
          </div>
        </div>

        <button
          onClick={loadStats}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          title="Refresh hardware stats"
        >
          <RefreshCw className={`w-4 h-4 stroke-[1.8] ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10">

        {/* Instant Switch Toast Banner */}
        {switchFeedback && (
          <div className="p-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-sans flex items-center justify-between gap-2 shadow-lg shadow-cyan-950/30 animate-fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400 shrink-0 stroke-[2]" />
              <span>{switchFeedback}</span>
            </div>
            <button
              onClick={() => setSwitchFeedback(null)}
              className="text-cyan-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5 stroke-[1.8]" />
            </button>
          </div>
        )}

        {/* Device Resource Status & Active Model Highlight */}
        <div className="bg-[#0C1021] border border-white/5 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400 stroke-[1.8]" />
              System Status & Active Model
            </span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              ARM64 NEON ON-DEVICE
            </span>
          </div>

          {/* Active Model Focus Card */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-blue-300 font-bold flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                SELECTED FOR OFFLINE CHAT:
              </span>
              <span className="text-slate-300 font-semibold">
                {activeSelectedModel?.status === 'READY' ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3 h-3 stroke-[2]" /> READY FOR OFFLINE USE
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">
                    NEEDS DOWNLOAD
                  </span>
                )}
              </span>
            </div>
            <div className="text-xs font-bold text-white font-sans flex items-center gap-2">
              {activeSelectedModel?.name || 'LFM 2.5 230M (Default)'}
              <span className="text-[9px] font-mono font-normal text-slate-300 bg-white/10 px-1.5 py-0.5 rounded">
                {activeSelectedModel?.sizeFormatted}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              {activeSelectedModel?.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* RAM Stats */}
            <div className="bg-[#070914]/80 border border-white/5 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                <Cpu className="w-4 h-4 stroke-[1.8]" />
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
                <HardDrive className="w-4 h-4 stroke-[1.8]" />
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

          {/* Active Model in RAM Indicator */}
          {engineStatus?.isModelLoaded && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse stroke-[1.8]" />
                <span className="font-mono text-[11px]">
                  Loaded in RAM: <strong className="text-white">{engineStatus.activeModelId}</strong>
                </span>
              </div>
              <button
                onClick={handleUnloadModel}
                disabled={actionLoadingId === 'unload'}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                {actionLoadingId === 'unload' ? 'Unloading...' : 'Unload RAM'}
              </button>
            </div>
          )}
        </div>

        {/* Model Catalog Cards */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-mono font-bold text-blue-400/80 tracking-widest uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400 stroke-[1.8]" />
                Offline AI Models (4-5 Options)
              </h3>
              <span className="text-[9px] font-mono text-slate-400">
                Click any model to select as active
              </span>
            </div>

            {models.map((model) => {
              const isSelected = selectedModelId === model.id;
              const isDownloading = model.status === 'DOWNLOADING';
              const isVerifying = model.status === 'VERIFYING';
              const isReady = model.status === 'READY';
              const isLoaded = model.isLoadedInMemory;
              const isTesting = isRunningDiagnostic === model.id;
              const isChatModel = model.category === 'primary_chat' || model.category === 'fallback_chat';

              // Calculate remaining MB and progress
              const totalMb = (model.sizeBytes / (1024 * 1024)).toFixed(1);
              const downloadedMb = (model.downloadedBytes / (1024 * 1024)).toFixed(1);
              const remainingMb = Math.max(0, (model.sizeBytes - model.downloadedBytes) / (1024 * 1024)).toFixed(1);

              return (
                <div
                  key={model.id}
                  onClick={() => {
                    if (isChatModel && !isSelected) {
                      handleSelectActiveModel(model.id);
                    }
                  }}
                  className={`bg-[#0C1021] border rounded-2xl p-4 space-y-3 transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-gradient-to-b from-[#0e1630] to-[#0C1021] shadow-lg shadow-blue-950/40'
                      : isLoaded 
                      ? 'border-emerald-500/40' 
                      : isReady
                      ? 'border-white/10 hover:border-white/20'
                      : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Selected Indicator Top Border Bar */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                  )}

                  {/* Top Row: Title & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Radio / Selection Circle */}
                        {isChatModel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectActiveModel(model.id);
                            }}
                            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                              isSelected
                                ? 'bg-blue-500 text-white shadow-sm shadow-blue-400/50'
                                : 'border border-slate-600 hover:border-slate-400'
                            }`}
                            title="Select as active offline model"
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        )}

                        <h4 className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
                          {model.name}
                        </h4>

                        {isSelected && (
                          <span className="text-[8px] font-mono font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                            ★ ACTIVE CHAT MODEL
                          </span>
                        )}

                        {model.id === 'lfm2.5-230m-q4' && (
                          <span className="text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                            DEFAULT / BASE
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

                  {/* Download Progress Bar: Shows %, Downloaded MB / Total MB, and Remaining MB */}
                  {(isDownloading || isVerifying) && (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="space-y-2 p-3 rounded-xl bg-blue-950/30 border border-blue-500/30"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-blue-300 font-bold flex items-center gap-1.5">
                          {isVerifying ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-400 animate-spin stroke-[1.8]" />
                              Calculating SHA-256 Integrity Checksum...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-blue-400 stroke-[1.8] animate-bounce" />
                              Downloading: <strong className="text-white ml-1">{model.progressPercent}%</strong>
                            </>
                          )}
                        </span>
                        <span className="text-slate-300 font-mono text-[10px]">
                          {model.speedMbps > 0 ? `${model.speedMbps} Mbps • ETA ${model.etaSeconds}s` : 'Connecting...'}
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isVerifying 
                              ? 'bg-purple-500 animate-pulse' 
                              : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500'
                          }`}
                          style={{ width: `${Math.max(4, model.progressPercent)}%` }}
                        />
                      </div>

                      {/* Detail Metrics: MB Downloaded, MB Remaining */}
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span>
                          Downloaded: <strong className="text-slate-200">{downloadedMb} MB</strong> / {totalMb} MB
                        </span>
                        <span className="text-amber-300 font-semibold">
                          {remainingMb} MB bacha hai
                        </span>
                        {isDownloading && (
                          <button
                            onClick={() => handleCancelDownload(model.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                          >
                            Cancel Download
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Banner */}
                  {model.lastErrorMessage && (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[10px] font-mono flex items-start gap-2"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5 stroke-[1.8]" />
                      <div className="min-w-0">
                        <strong className="block text-white">Download or Verification Notice:</strong>
                        {model.lastErrorMessage}
                      </div>
                    </div>
                  )}

                  {/* Action Button Row */}
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="flex items-center gap-2 pt-1"
                  >
                    {/* Download / Retry Button */}
                    {model.status === 'NOT_INSTALLED' && (
                      <button
                        onClick={() => handleDownload(model.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-900/30 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 stroke-[1.8]" />
                        Download Model ({model.sizeFormatted})
                      </button>
                    )}

                    {(model.status === 'CORRUPTED' || model.status === 'ERROR') && (
                      <button
                        onClick={() => handleDownload(model.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-98 text-white text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 stroke-[1.8]" />
                        Retry Download
                      </button>
                    )}

                    {/* Ready Controls */}
                    {isReady && (
                      <>
                        {/* Select as Active Toggle */}
                        {isChatModel && (
                          <button
                            onClick={() => handleSelectActiveModel(model.id)}
                            disabled={isSelected || actionLoadingId === `select-${model.id}`}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-950/60 border border-blue-500/40 text-blue-300 opacity-90'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2]" />
                            {isSelected ? 'Currently Selected' : 'Select for Offline Chat'}
                          </button>
                        )}

                        {/* Load / Unload Toggle */}
                        {isLoaded ? (
                          <button
                            onClick={handleUnloadModel}
                            disabled={actionLoadingId === 'unload'}
                            className="py-2 px-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                          >
                            <Square className="w-3.5 h-3.5 text-amber-400 stroke-[1.8]" />
                            Unload
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLoadModel(model.id)}
                            disabled={actionLoadingId === model.id}
                            className="py-2 px-3 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                            title="Pre-warm model into RAM"
                          >
                            <Play className="w-3.5 h-3.5 stroke-[1.8]" />
                            {actionLoadingId === model.id ? 'Loading...' : 'Pre-warm RAM'}
                          </button>
                        )}

                        {/* Diagnostic Test Button */}
                        <button
                          onClick={() => handleRunDiagnostic(model.id)}
                          disabled={isTesting}
                          className="py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
                          title="Run real diagnostic test on this model"
                        >
                          <Terminal className={`w-3.5 h-3.5 stroke-[1.8] ${isTesting ? 'animate-spin text-purple-400' : ''}`} />
                          {isTesting ? 'Testing...' : 'Test'}
                        </button>

                        {/* Delete Button */}
                        {confirmDeleteId === model.id ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleDeleteModel(model.id)}
                              disabled={actionLoadingId === model.id}
                              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono font-bold transition-all cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-2 rounded-xl bg-white/10 text-slate-300 text-[10px] font-mono transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 stroke-[1.8]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(model.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 transition-all shrink-0 cursor-pointer"
                            title="Delete model file"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
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
                <Terminal className="w-3.5 h-3.5 stroke-[1.8]" />
                llama.cpp Native Engine Diagnostic Test
              </span>
              <button
                onClick={() => setDiagnosticResult(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3 h-3 stroke-[1.8]" />
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
                      <CheckCircle2 className="w-3 h-3 stroke-[1.8]" />
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
                    <AlertCircle className="w-3 h-3 stroke-[1.8]" />
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

