import React from 'react';
import { BarehandsGestureState } from '../../types/gestures';
import { Hand, ZoomIn, Sparkles, X, Activity, Loader2, MousePointer, ArrowUp, ArrowDown, Clock } from 'lucide-react';

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
  const getActionBadge = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center text-center">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin mb-0.5" />
          <span className="text-[8px] font-mono text-cyan-200">Starting MediaPipe AI...</span>
        </div>
      );
    }

    if (gestureState.handsDetected === 0) {
      return (
        <div className="flex flex-col items-center text-center">
          <Hand className="w-4 h-4 text-cyan-400/70 animate-pulse mb-0.5" />
          <span className="text-[9px] font-mono text-slate-300 font-medium">Show hand to camera</span>
        </div>
      );
    }

    switch (gestureState.activeAction) {
      case 'double_tap':
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-950/80 border border-rose-400/50 rounded-full text-[9px] font-mono text-rose-200 font-bold animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.4)]">
            <MousePointer className="w-3 h-3 text-rose-300" />
            <span>Double-Tap Click</span>
          </div>
        );
      case 'swipe_up':
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-950/80 border border-purple-400/50 rounded-full text-[9px] font-mono text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]">
            <ArrowUp className="w-3 h-3 text-purple-300" />
            <span>Scroll Up</span>
          </div>
        );
      case 'swipe_down':
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-950/80 border border-purple-400/50 rounded-full text-[9px] font-mono text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]">
            <ArrowDown className="w-3 h-3 text-purple-300" />
            <span>Scroll Down</span>
          </div>
        );
      case 'throw':
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-950/90 border border-amber-400/60 rounded-full text-[9px] font-mono text-amber-200 font-bold shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Fling / Throw</span>
          </div>
        );
      case 'clap_clear':
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-950/90 border border-emerald-400/60 rounded-full text-[9px] font-mono text-emerald-200 font-bold shadow-[0_0_14px_rgba(16,185,129,0.6)] animate-bounce">
            <Hand className="w-3 h-3 text-emerald-300" />
            <span>Clap to Clear</span>
          </div>
        );
      case 'hold_long_press':
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-950/80 border border-emerald-400/50 rounded-full text-[9px] font-mono text-emerald-200 font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]">
            <Clock className="w-3 h-3 text-emerald-300" />
            <span>Hold Long-Press</span>
          </div>
        );
      case 'two_hand_zoom':
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-950/80 border border-purple-400/50 rounded-full text-[9px] font-mono text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)] animate-bounce">
            <ZoomIn className="w-3 h-3 text-purple-300" />
            <span>2-Hand Zoom</span>
          </div>
        );
      case 'pinch_drag':
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-950/80 border border-amber-400/50 rounded-full text-[9px] font-mono text-amber-200 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Pinch Drag</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950/80 border border-cyan-400/50 rounded-full text-[9px] font-mono text-cyan-200 font-bold">
            <Activity className="w-3 h-3 text-cyan-300" />
            <span>21-Node Skeleton</span>
          </div>
        );
    }
  };

  return (
    <div className="absolute top-14 right-3 z-30 flex flex-col items-end gap-1.5 animate-in fade-in zoom-in-95 pointer-events-auto">
      {/* Floating HUD Container */}
      <div className="relative w-40 h-32 bg-[#080C1E]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(6,182,212,0.35)] flex flex-col justify-between p-2">
        
        {/* Hidden Raw Video (Used for MediaPipe Landmark extraction) */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-20 pointer-events-none"
          playsInline
          muted
        />

        {/* Dynamic MediaPipe Skeleton Canvas */}
        <canvas
          ref={canvasRef}
          width={160}
          height={128}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Top Header Controls */}
        <div className="relative z-10 w-full flex items-center justify-between">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 border border-cyan-400/30 text-[8px] font-mono text-cyan-300 font-bold">
            <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
            <span>{isLoading ? 'INIT' : `${gestureState.fps || 20} FPS`}</span>
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
          {getActionBadge()}
        </div>

        {/* Bottom Status Pill */}
        <div className="relative z-10 w-full flex items-center justify-between text-[8px] font-mono text-slate-400 px-0.5">
          <span>Hands: <b className="text-white">{isLoading ? '...' : gestureState.handsDetected}</b></span>
          <span className="text-cyan-400 font-bold">MediaPipe 21P</span>
        </div>
      </div>
    </div>
  );
};
