import React from 'react';
import { BarehandsGestureState } from '../../types/gestures';
import { Hand, Eye, ZoomIn, Sparkles, X, Activity, Loader2 } from 'lucide-react';

interface BarehandsCameraOverlayProps {
  gestureState: BarehandsGestureState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isLoading?: boolean;
  onClose: () => void;
}

export const BarehandsCameraOverlay: React.FC<BarehandsCameraOverlayProps> = ({
  gestureState,
  videoRef,
  canvasRef,
  isLoading,
  onClose
}) => {
  return (
    <div className="absolute top-14 right-3 z-30 flex flex-col items-end gap-1.5 animate-in fade-in zoom-in-95 pointer-events-auto">
      {/* Floating HUD Container */}
      <div className="relative w-36 h-28 bg-[#080C1E]/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(6,182,212,0.35)] flex flex-col justify-between p-1.5">
        
        {/* Hidden Raw Video (Used for MediaPipe Landmark extraction) */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-20 pointer-events-none"
          playsInline
          muted
        />

        {/* Dynamic Skeleton Canvas */}
        <canvas
          ref={canvasRef}
          width={144}
          height={112}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Top Header Controls */}
        <div className="relative z-10 w-full flex items-center justify-between">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 border border-cyan-400/30 text-[8px] font-mono text-cyan-300 font-bold">
            <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
            <span>{isLoading ? 'INIT' : `${gestureState.fps || 18} FPS`}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-black/60 hover:bg-rose-500/30 text-slate-300 hover:text-rose-300 border border-white/10 transition-colors"
            title="Disable Hand Tracking"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Center / Gesture Feedback Indicator */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center my-auto">
          {isLoading ? (
            <div className="flex flex-col items-center text-center">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin mb-0.5" />
              <span className="text-[8px] font-mono text-cyan-200">Starting camera & AI...</span>
            </div>
          ) : gestureState.handsDetected === 0 ? (
            <div className="flex flex-col items-center text-center">
              <Hand className="w-4 h-4 text-cyan-400/70 animate-pulse mb-0.5" />
              <span className="text-[9px] font-mono text-slate-300 font-medium">Show hand to camera</span>
            </div>
          ) : gestureState.handsDetected >= 2 ? (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-950/80 border border-purple-400/50 rounded-full text-[9px] font-mono text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)] animate-bounce">
              <ZoomIn className="w-3 h-3 text-purple-300" />
              <span>2-Hand Zoom</span>
            </div>
          ) : gestureState.isPinching ? (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-950/80 border border-amber-400/50 rounded-full text-[9px] font-mono text-amber-200 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Pinch Drag</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950/80 border border-cyan-400/50 rounded-full text-[9px] font-mono text-cyan-200 font-bold">
              <Activity className="w-3 h-3 text-cyan-300" />
              <span>Rotating 3D</span>
            </div>
          )}
        </div>

        {/* Bottom Status Pill */}
        <div className="relative z-10 w-full flex items-center justify-between text-[8px] font-mono text-slate-400 px-0.5">
          <span>Hands: <b className="text-white">{isLoading ? '...' : gestureState.handsDetected}</b></span>
          <span className="text-cyan-400 font-bold">Barehands</span>
        </div>
      </div>
    </div>
  );
};
