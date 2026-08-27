import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hand, Mic, Camera, ShieldAlert, Sparkles, X, 
  Eye, Power, AlertCircle, RefreshCw, ChevronRight, Activity, Radio,
  MousePointer, ArrowUp, Clock, CheckCircle2, Sliders, ExternalLink
} from 'lucide-react';
import { MiniMayraAvatar } from '../character/MiniMayraAvatar';
import { AssistantStatus, AppearanceConfig } from '../../types';

interface BackgroundGestureOverlayBubbleProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  status: AssistantStatus;
  appearanceConfig?: AppearanceConfig;
  onTriggerVoice: () => void;
  onOpenApp: () => void;
  onOpenSettings?: () => void;
}

export const BackgroundGestureOverlayBubble: React.FC<BackgroundGestureOverlayBubbleProps> = ({
  isEnabled,
  onToggleEnabled,
  status,
  appearanceConfig,
  onTriggerVoice,
  onOpenApp,
  onOpenSettings
}) => {
  // Screen lock detection & privacy state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(isEnabled);
  const [isScreenLockedOrHidden, setIsScreenLockedOrHidden] = useState<boolean>(false);
  const [cameraStoppedDueToLock, setCameraStoppedDueToLock] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null);
  const [gestureFeedbackTimer, setGestureFeedbackTimer] = useState<number | null>(null);

  // Floating bubble position coordinates
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 160 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 20, posY: 160 });

  // System-Wide Touch Tracking Pointer Cursor coordinates (Screen overlay)
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ 
    x: typeof window !== 'undefined' ? window.innerWidth * 0.45 : 180, 
    y: typeof window !== 'undefined' ? window.innerHeight * 0.48 : 360 
  });
  const [isPointerActive, setIsPointerActive] = useState<boolean>(true);
  const [pointerActionEffect, setPointerActionEffect] = useState<'tap' | 'scroll' | 'hold' | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const holdIntervalRef = useRef<number | null>(null);

  // Sync state when enabled prop changes
  useEffect(() => {
    if (isEnabled && !isScreenLockedOrHidden && !cameraStoppedDueToLock) {
      setIsCameraActive(true);
    } else if (!isEnabled) {
      setIsCameraActive(false);
      setCameraStoppedDueToLock(false);
    }
  }, [isEnabled, isScreenLockedOrHidden, cameraStoppedDueToLock]);

  // Privacy Rule: Monitor Screen Lock / Visibility Change
  // When screen turns off / locked, immediately shut down camera
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Screen locked or tab backgrounded -> Immediate camera termination
        console.log('[MAYRA Background Gesture] Screen lock/hidden detected -> Automatically shutting off camera for privacy');
        setIsScreenLockedOrHidden(true);
        if (isEnabled && isCameraActive) {
          setIsCameraActive(false);
          setCameraStoppedDueToLock(true);
        }
      } else {
        // User unlocked phone -> Screen is back
        setIsScreenLockedOrHidden(false);
        // Stays OFF per requirement: User must manually reactivate!
        console.log('[MAYRA Background Gesture] Screen unlocked -> Camera remains OFF until user manually reactivates');
      }
    };

    const handleWindowBlur = () => {
      if (document.hidden) {
        setIsScreenLockedOrHidden(true);
        if (isEnabled && isCameraActive) {
          setIsCameraActive(false);
          setCameraStoppedDueToLock(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isEnabled, isCameraActive]);

  // Smooth autonomous hand-tracking drift for visual pointer simulation when active
  useEffect(() => {
    if (!isCameraActive || !isPointerActive) return;

    let frameId: number;
    let t = 0;
    const animatePointer = () => {
      t += 0.02;
      const targetX = Math.max(40, Math.min(window.innerWidth - 40, (window.innerWidth * 0.5) + Math.sin(t * 1.2) * (window.innerWidth * 0.28)));
      const targetY = Math.max(120, Math.min(window.innerHeight - 100, (window.innerHeight * 0.45) + Math.cos(t * 0.9) * (window.innerHeight * 0.22)));
      
      setPointerPos(prev => ({
        x: prev.x + (targetX - prev.x) * 0.06,
        y: prev.y + (targetY - prev.y) * 0.06
      }));

      frameId = requestAnimationFrame(animatePointer);
    };

    frameId = requestAnimationFrame(animatePointer);
    return () => cancelAnimationFrame(frameId);
  }, [isCameraActive, isPointerActive]);

  // 1. Double-Tap Finger Gesture -> Synthetic Tap / Click
  const dispatchSyntheticTap = (targetX = pointerPos.x, targetY = pointerPos.y) => {
    if (!isCameraActive) return;

    setPointerActionEffect('tap');
    setDetectedGesture(`Double-Tap: Click at (${Math.round(targetX)}, ${Math.round(targetY)})`);
    
    // Simulate DOM element click at pointer position
    const el = document.elementFromPoint(targetX, targetY);
    if (el && el instanceof HTMLElement) {
      el.click();
    }

    if (gestureFeedbackTimer) window.clearTimeout(gestureFeedbackTimer);
    const t = window.setTimeout(() => {
      setPointerActionEffect(null);
      setDetectedGesture(null);
    }, 1800);
    setGestureFeedbackTimer(t);
  };

  // 2. Vertical Swipe Up (bottom to top) -> Synthetic Scroll Up
  const dispatchSyntheticScrollUp = () => {
    if (!isCameraActive) return;

    setPointerActionEffect('scroll');
    setDetectedGesture('Swipe Up: Scrolling feed upward');

    // Scroll active view
    window.scrollBy({ top: -350, behavior: 'smooth' });
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollBy({ top: -350, behavior: 'smooth' });
    }

    if (gestureFeedbackTimer) window.clearTimeout(gestureFeedbackTimer);
    const t = window.setTimeout(() => {
      setPointerActionEffect(null);
      setDetectedGesture(null);
    }, 1800);
    setGestureFeedbackTimer(t);
  };

  // 3. Hold Hand in Place -> Synthetic Long Press
  const dispatchSyntheticLongPress = (targetX = pointerPos.x, targetY = pointerPos.y) => {
    if (!isCameraActive) return;

    setPointerActionEffect('hold');
    setDetectedGesture(`Hold: Long Press at (${Math.round(targetX)}, ${Math.round(targetY)})`);

    let progress = 0;
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = window.setInterval(() => {
      progress += 10;
      setHoldProgress(progress);
      if (progress >= 100) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        const el = document.elementFromPoint(targetX, targetY);
        if (el) {
          el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
        }
        setTimeout(() => {
          setPointerActionEffect(null);
          setDetectedGesture(null);
          setHoldProgress(0);
        }, 1200);
      }
    }, 40);
  };

  const handleManualResumeCamera = () => {
    setCameraStoppedDueToLock(false);
    setIsCameraActive(true);
  };

  // Drag handlers for floating bubble
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 6) {
      setIsDragging(true);
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 70, dragStartRef.current.posX + dx)),
        y: Math.max(50, Math.min(window.innerHeight - 120, dragStartRef.current.posY + dy))
      });
    }
  };

  const handleBubbleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    setIsExpanded(prev => !prev);
  };

  const handleBubbleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTriggerVoice();
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* 1. ALWAYS VISIBLE PERSISTENT ACTIVE CAMERA INDICATOR BANNER / DOT */}
      <div 
        id="mayra-background-camera-persistent-indicator"
        className="fixed top-1 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto select-none transition-all duration-300"
      >
        <div className={`px-3 py-1 rounded-full backdrop-blur-2xl border flex items-center gap-2 shadow-2xl transition-all ${
          isCameraActive
            ? 'bg-black/90 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.45)]'
            : 'bg-black/90 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
        }`}>
          {/* Active Glowing Red Dot / Camera Pulse */}
          <div className="relative flex items-center justify-center">
            {isCameraActive ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute opacity-75" />
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative flex items-center justify-center shadow-[0_0_8px_#F43F5E]">
                  <span className="w-1 h-1 rounded-full bg-white" />
                </span>
              </>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 relative" />
            )}
          </div>

          {/* Text Status: Clear & Prominent */}
          <div className="flex items-center gap-1.5">
            <Camera className={`w-3.5 h-3.5 ${isCameraActive ? 'text-rose-400' : 'text-amber-400'}`} />
            <span className="text-[11px] font-mono font-bold tracking-wide text-white">
              {isCameraActive ? 'MAYRA is watching' : 'Camera Paused (Lock)'}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-semibold ${
              isCameraActive 
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
            }`}>
              {isCameraActive ? 'SYSTEM TOUCH MAPPING' : 'PRIVACY SAFE'}
            </span>
          </div>

          {/* Resume button if stopped by screen lock */}
          {cameraStoppedDueToLock && (
            <button
              onClick={handleManualResumeCamera}
              className="ml-1 px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-mono flex items-center gap-1 active:scale-95 transition-all"
              title="Resume Background Camera Tracking"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Resume</span>
            </button>
          )}

          {/* Quick Close / Disable Toggle */}
          <button
            onClick={() => onToggleEnabled(false)}
            className="p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-0.5"
            title="Turn Off Background Gesture"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. SYSTEM-WIDE VISUAL POINTER / CURSOR OVERLAY */}
      {isCameraActive && isPointerActive && (
        <div
          id="mayra-gesture-tracking-pointer"
          style={{
            position: 'fixed',
            left: `${pointerPos.x}px`,
            top: `${pointerPos.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 9995,
            pointerEvents: 'none'
          }}
          className="transition-all duration-75 select-none"
        >
          <div className="relative flex items-center justify-center">
            {/* Outer halo ring */}
            <motion.div
              animate={{
                scale: pointerActionEffect === 'hold' ? [1, 1.4, 1.2] : pointerActionEffect === 'tap' ? [1, 1.6, 1] : [1, 1.15, 1],
                borderColor: pointerActionEffect === 'tap' ? '#22D3EE' : pointerActionEffect === 'hold' ? '#EC4899' : pointerActionEffect === 'scroll' ? '#A855F7' : '#06B6D4'
              }}
              transition={{ duration: 0.3 }}
              className="w-10 h-10 rounded-full border-2 border-cyan-400/80 bg-cyan-500/15 shadow-[0_0_16px_rgba(6,182,212,0.6)] flex items-center justify-center"
            >
              {/* Center pointer dot */}
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#FFF]" />
            </motion.div>

            {/* Tap Action Ripple Wave */}
            {pointerActionEffect === 'tap' && (
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.8, opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="absolute inset-0 rounded-full border-2 border-cyan-300"
              />
            )}

            {/* Scroll Action Trail */}
            {pointerActionEffect === 'scroll' && (
              <motion.div
                initial={{ y: 20, opacity: 1, scale: 1 }}
                animate={{ y: -60, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                className="absolute flex flex-col items-center gap-1 text-purple-400"
              >
                <ArrowUp className="w-5 h-5 drop-shadow-[0_0_8px_#A855F7]" />
              </motion.div>
            )}

            {/* Long Press Circular Charging Ring */}
            {pointerActionEffect === 'hold' && (
              <div className="absolute -inset-2">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-pink-500"
                    strokeWidth="3"
                    strokeDasharray={`${holdProgress}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            )}

            {/* Coordinates Badge */}
            <div className="absolute top-11 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-cyan-500/40 text-[8px] font-mono text-cyan-300 whitespace-nowrap shadow-lg">
              X:{Math.round(pointerPos.x)} Y:{Math.round(pointerPos.y)}
            </div>
          </div>
        </div>
      )}

      {/* 3. FLOATING BUBBLE / CHAT-HEAD (Messenger Style on Home Screen) */}
      <div
        id="mayra-floating-gesture-bubble"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9990
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="pointer-events-auto select-none touch-none"
      >
        <div className="relative group">
          
          {/* Radar ripple rings when camera is active */}
          {isCameraActive && (
            <div className="absolute -inset-2.5 rounded-full border border-cyan-400/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none opacity-40" />
          )}

          {/* Floating Bubble Circle */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleBubbleClick}
            onDoubleClick={handleBubbleDoubleClick}
            className={`w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr ${
              isCameraActive 
                ? 'from-cyan-500 via-indigo-600 to-rose-500 shadow-[0_0_24px_rgba(6,182,212,0.65)]' 
                : 'from-slate-700 via-slate-800 to-slate-900 shadow-[0_0_12px_rgba(0,0,0,0.6)]'
            } cursor-grab active:cursor-grabbing flex items-center justify-center relative`}
            title="MAYRA Floating Gesture Bubble - Single tap to expand, Double tap to speak, Wave/gesture to control screen"
          >
            {/* Inner Avatar Canvas */}
            <div className="w-full h-full rounded-full bg-[#080C1E] flex items-center justify-center overflow-hidden border border-white/20 relative">
              <MiniMayraAvatar
                status={status}
                size={44}
                appearanceConfig={appearanceConfig}
              />

              {/* Hand Gesture Icon Badge */}
              <div className={`absolute bottom-0.5 right-0.5 p-1 rounded-full ${
                isCameraActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-700 text-slate-400'
              } shadow-md`}>
                <Hand className="w-2.5 h-2.5" />
              </div>
            </div>
          </motion.div>

          {/* Gesture Detection Feedback Toast */}
          <AnimatePresence>
            {detectedGesture && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute left-16 top-1/2 -translate-y-1/2 bg-cyan-950/90 text-cyan-200 border border-cyan-400/50 px-2.5 py-1.5 rounded-xl text-[10px] font-mono whitespace-nowrap shadow-2xl flex items-center gap-1.5 z-20"
              >
                <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                <span>{detectedGesture}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded Quick Action Flyout Sheet */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -10 }}
                className="absolute left-16 top-0 w-72 bg-[#0A0E24]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex flex-col gap-3 z-30"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Hand className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white font-sans">System-Wide Touch Gestures</h4>
                      <p className="text-[9px] text-slate-400 font-mono">AccessibilityService Dispatcher</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Accessibility Service Status */}
                <div className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[10px] font-mono flex items-center justify-between text-cyan-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Service: MayraGestureA11y</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded text-[8px] font-bold uppercase">
                    ACTIVE
                  </span>
                </div>

                {/* Gesture Mapping Test Triggers */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Touch Gesture Triggers
                  </p>

                  {/* 1. Double Tap -> Click */}
                  <button
                    onClick={() => dispatchSyntheticTap()}
                    className="p-2 bg-white/[0.05] hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-200 border border-white/10 rounded-xl flex items-center justify-between transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300">
                        <MousePointer className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold block">Double-Tap Finger</span>
                        <span className="text-[8px] text-slate-400 font-mono">Dispatches TAP at pointer</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-cyan-900/60 text-cyan-300 rounded font-mono">Click</span>
                  </button>

                  {/* 2. Swipe Up -> Scroll */}
                  <button
                    onClick={() => dispatchSyntheticScrollUp()}
                    className="p-2 bg-white/[0.05] hover:bg-purple-500/20 text-slate-200 hover:text-purple-200 border border-white/10 rounded-xl flex items-center justify-between transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold block">Swipe Up Gesture</span>
                        <span className="text-[8px] text-slate-400 font-mono">Dispatches SCROLL UP feed</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-900/60 text-purple-300 rounded font-mono">Scroll</span>
                  </button>

                  {/* 3. Hold -> Long Press */}
                  <button
                    onClick={() => dispatchSyntheticLongPress()}
                    className="p-2 bg-white/[0.05] hover:bg-pink-500/20 text-slate-200 hover:text-pink-200 border border-white/10 rounded-xl flex items-center justify-between transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-pink-500/20 text-pink-300">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold block">Hold in Place</span>
                        <span className="text-[8px] text-slate-400 font-mono">Dispatches LONG PRESS</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-pink-900/60 text-pink-300 rounded font-mono">Hold 800ms</span>
                  </button>
                </div>

                {/* Open Full App Button */}
                <button
                  onClick={() => {
                    onOpenApp();
                    setIsExpanded(false);
                  }}
                  className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <span>Open Full MAYRA App</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Privacy Safeguard Note */}
                <div className="text-[8px] text-slate-400 leading-tight bg-black/40 p-2 rounded-lg border border-white/5 flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Privacy Shield: Camera instantly halts whenever screen locks. Never auto-resumes upon unlock without explicit user interaction.
                  </span>
                </div>

                {/* Footer Switch */}
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-slate-300">
                  <span>Disable Feature</span>
                  <button
                    onClick={() => {
                      onToggleEnabled(false);
                      setIsExpanded(false);
                    }}
                    className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[9px] font-mono"
                  >
                    Turn OFF
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};
