import React, { useRef, useState, useEffect } from 'react';
import { Camera, Zap, RefreshCw, Sparkles, Check, X, ShieldAlert, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface StonicxScannerProps {
  onAnalyzeImage: (prompt: string, image: { base64: string; mimeType: string; name?: string }) => void;
  onClose?: () => void;
}

export const StonicxScanner: React.FC<StonicxScannerProps> = ({ onAnalyzeImage, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanMode, setScanMode] = useState<'matrix' | 'ocr' | 'tactical'>('matrix');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        currentStream = mediaStream;
        setStream(mediaStream);
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn('Camera access denied or unavailable in STONICX:', err);
        setHasPermission(false);
      }
    }

    setupCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(base64);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setIsAnalyzing(false);
  };

  const handleExecuteAnalysis = (customPrompt?: string) => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    const cleanBase64 = capturedImage.replace(/^data:image\/[a-z]+;base64,/, '');

    const prompt = customPrompt || (
      scanMode === 'ocr'
        ? 'Extract all text, code snippets, diagrams, and numerical data visible in this image with exact precision.'
        : scanMode === 'tactical'
        ? 'Perform deep tactical scene decomposition: object classification, environment dimensions, technical specs, and structural anomalies.'
        : 'Perform comprehensive high-density visual telemetry analysis on this optical input.'
    );

    onAnalyzeImage(prompt, {
      base64: cleanBase64,
      mimeType: 'image/jpeg',
      name: `stonicx_optical_${Date.now()}.jpg`
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#020611] text-cyan-100 overflow-hidden select-none font-mono">
      {/* Top Cyber HUD Header */}
      <div className="p-3 border-b border-cyan-500/20 bg-[#030B1C]/90 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
              <span>OPTICAL TELEMETRY</span>
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="text-[9px] text-cyan-500/70">SENSOR RESOLUTION: 1080P • LATENCY: 4MS</div>
          </div>
        </div>

        {/* Scan Mode Selector */}
        <div className="flex items-center bg-[#071738] p-0.5 rounded-xl border border-cyan-500/20 text-[10px]">
          {(['matrix', 'ocr', 'tactical'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setScanMode(mode)}
              className={`px-2 py-1 rounded-lg uppercase font-bold transition-colors cursor-pointer ${
                scanMode === mode
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,229,255,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {capturedImage ? (
          <div className="relative w-full h-full">
            <img src={capturedImage} alt="Captured Optical Frame" className="w-full h-full object-cover" />
            {/* Frozen Frame Grid Overlay */}
            <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none border-2 border-cyan-500/40" />
            <div className="absolute top-4 left-4 bg-black/80 px-2.5 py-1 rounded border border-cyan-500/40 text-[10px] text-cyan-300">
              FRAME LOCKED • READY FOR NEURAL SYNTHESIS
            </div>
          </div>
        ) : (
          <>
            {hasPermission === false ? (
              <div className="p-6 text-center space-y-3">
                <ShieldAlert className="w-10 h-10 text-cyan-400 mx-auto animate-bounce" />
                <p className="text-xs text-slate-300">Camera feed unavailable or permissions required.</p>
                <p className="text-[10px] text-cyan-500">Please verify camera permissions in Android settings.</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Cyber HUD Reticles & Target Boxes */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
              {/* Corner brackets */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
              </div>

              {/* Center Crosshair / Scanning Grid */}
              <div className="relative self-center flex items-center justify-center w-48 h-48 border border-cyan-500/30 rounded-2xl">
                <div className="absolute inset-0 border border-cyan-400/20 rounded-2xl animate-ping" />
                <div className="w-4 h-4 border-t border-l border-cyan-400" />
                <div className="w-4 h-4 border-b border-r border-cyan-400" />
                <div className="absolute text-[8px] text-cyan-400 tracking-widest bottom-2 font-mono">
                  [ TARGET ACQUISITION ]
                </div>
              </div>

              {/* Bottom brackets */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Controls Deck */}
      <div className="p-4 bg-[#030B1C] border-t border-cyan-500/20 flex items-center justify-around z-20">
        {capturedImage ? (
          <div className="flex items-center gap-4 w-full max-w-sm mx-auto">
            <button
              onClick={handleRetake}
              className="flex-1 py-2.5 bg-[#071738] hover:bg-[#0C2456] border border-cyan-500/20 text-cyan-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> RETAKE
            </button>
            <button
              onClick={() => handleExecuteAnalysis()}
              disabled={isAnalyzing}
              className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> {isAnalyzing ? 'SYNTHESIZING...' : 'ANALYZE FRAME'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-8 w-full">
            <button
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              className="p-3 bg-[#071738] hover:bg-[#0C2456] border border-cyan-500/20 text-cyan-300 rounded-full active:scale-95 transition-all cursor-pointer"
              title="Flip Sensor"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Main Shutter Button */}
            <button
              onClick={handleCapture}
              className="p-4 bg-gradient-to-br from-cyan-400 to-blue-600 text-black rounded-full border-4 border-black shadow-[0_0_25px_rgba(0,229,255,0.6)] active:scale-90 transition-all cursor-pointer"
              title="Capture Frame"
            >
              <Camera className="w-6 h-6" />
            </button>

            <button
              onClick={() => handleExecuteAnalysis('Perform quick optical environment telemetry')}
              className="p-3 bg-[#071738] hover:bg-[#0C2456] border border-cyan-500/20 text-cyan-400 rounded-full active:scale-95 transition-all cursor-pointer"
              title="Quick Optical Ping"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
