import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hand, Mic, Camera, ShieldAlert, Sparkles, X, 
  Eye, Power, AlertCircle, RefreshCw, ChevronRight, Activity, Radio,
  MousePointer, ArrowUp, Clock, CheckCircle2, Sliders, ExternalLink,
  Minimize2, Maximize2, Play, Flame, HelpCircle, Move, Database
} from 'lucide-react';
import { MiniMayraAvatar } from '../character/MiniMayraAvatar';
import { AssistantStatus, AppearanceConfig } from '../../types';
import { GestureUsageService } from '../../services/gestures/gestureUsageService';
import { GestureTutorialModal } from '../gestures/GestureTutorialModal';
import { GesturePracticeModal } from '../gestures/GesturePracticeModal';
import { BarehandsTracker } from '../../services/gestures/barehandsTracker';
import { BarehandsGestureState, GestureThrowPayload, GestureClapClearPayload, GestureFistHoldPayload } from '../../types/gestures';
import { GestureEventBus } from '../../services/gestures/gestureEventBus';
import { GestureVoiceBridge } from '../../services/gestures/gestureVoiceBridge';
import { MemoryVaultManager } from '../../services/memory/memoryVaultManager';

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

  // Daily Usage Counter State
  const [todayUsageCount, setTodayUsageCount] = useState<number>(() => GestureUsageService.getTodayGestureCount());
  const [badgePulse, setBadgePulse] = useState<boolean>(false);

  // Tutorial & Practice Modals State
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState<boolean>(false);

  // Floating bubble position coordinates
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 18, y: 140 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 18, posY: 140 });

  // Floating PiP Camera Preview window coordinates & minimize state (persists across whole phone)
  const [pipPosition, setPipPosition] = useState<{ x: number; y: number }>({ x: 16, y: 56 });
  const [isPipMinimized, setIsPipMinimized] = useState<boolean>(false);
  const [isPipDragging, setIsPipDragging] = useState<boolean>(false);
  const pipDragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 16, posY: 56 });
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // System-Wide Touch Tracking Pointer Cursor coordinates (Screen overlay)
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ 
    x: typeof window !== 'undefined' ? window.innerWidth * 0.45 : 180, 
    y: typeof window !== 'undefined' ? window.innerHeight * 0.48 : 360 
  });
  const [isPointerActive, setIsPointerActive] = useState<boolean>(true);
  const [pointerActionEffect, setPointerActionEffect] = useState<'tap' | 'scroll' | 'hold' | 'throw' | 'clap' | null>(null);
  const [throwVector, setThrowVector] = useState<{ x: number; y: number; speed: number } | null>(null);
  const [clapEffectActive, setClapEffectActive] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const holdIntervalRef = useRef<number | null>(null);

  const tracker = BarehandsTracker.getInstance();

  // Helper to record gesture trigger & update badge
  const recordGestureAction = useCallback((gestureName: string) => {
    const updatedCount = GestureUsageService.incrementTodayGestureCount(gestureName);
    setTodayUsageCount(updatedCount);
    setBadgePulse(true);
    setTimeout(() => setBadgePulse(false), 900);
  }, []);

  // Synthetic action triggers for UI testing & quick control
  const dispatchSyntheticThrow = (dx = 0.8, dy = -0.6, speed = 1400) => {
    const bus = GestureEventBus.getInstance();
    bus.emit('GESTURE_THROW', {
      direction: { x: dx, y: dy },
      velocity: speed,
      releasePosition: { x: pointerPos.x, y: pointerPos.y },
      timestamp: performance.now()
    });
  };

  const dispatchSyntheticClap = () => {
    const bus = GestureEventBus.getInstance();
    bus.emit('GESTURE_CLAP_CLEAR', {
      distance: 0.06,
      approachSpeed: 3200,
      palmCenters: {
        hand1: { x: 0.45, y: 0.5 },
        hand2: { x: 0.55, y: 0.5 }
      },
      timestamp: performance.now()
    });
  };

  // 1. MediaPipe Gesture Updates Callback
  const handleTrackerUpdate = useCallback((state: BarehandsGestureState) => {
    if (!state.isActive || isScreenLockedOrHidden || cameraStoppedDueToLock) return;

    // Update screen pointer coordinates if hand detected
    if (state.pointerPosition) {
      setPointerPos(state.pointerPosition);
    }

    // Draw real 21 MediaPipe landmarks onto the PiP canvas
    if (pipCanvasRef.current && state.hands.length > 0) {
      const canvas = pipCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        BarehandsTracker.drawSkeletonOnCanvas(ctx, canvas.width, canvas.height, state.hands, state.activeAction);
      }
    } else if (pipCanvasRef.current) {
      const ctx = pipCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, pipCanvasRef.current.width, pipCanvasRef.current.height);
    }

    // Full Scroll Capability (Up & Down)
    if (Math.abs(state.scrollDeltaY) > 8) {
      const isUp = state.scrollDeltaY < 0;
      setPointerActionEffect('scroll');
      setDetectedGesture(isUp ? 'Swipe Up: Scroll Up' : 'Swipe Down: Scroll Down');
      recordGestureAction(isUp ? 'Swipe Up Scroll' : 'Swipe Down Scroll');

      // Dispatch smooth scroll to document and any active scrolling view
      window.scrollBy({ top: state.scrollDeltaY, behavior: 'smooth' });
      const scrollableContainers = document.querySelectorAll('.overflow-y-auto, [data-scrollable="true"]');
      scrollableContainers.forEach(container => {
        container.scrollBy({ top: state.scrollDeltaY, behavior: 'smooth' });
      });

      if (gestureFeedbackTimer) window.clearTimeout(gestureFeedbackTimer);
      const t = window.setTimeout(() => {
        setPointerActionEffect(null);
        setDetectedGesture(null);
      }, 1400);
      setGestureFeedbackTimer(t);
    }

    // Double-Tap Finger Click
    if (state.activeAction === 'double_tap') {
      const curX = state.pointerPosition ? state.pointerPosition.x : pointerPos.x;
      const curY = state.pointerPosition ? state.pointerPosition.y : pointerPos.y;

      setPointerActionEffect('tap');
      setDetectedGesture(`Double-Tap: Click at (${Math.round(curX)}, ${Math.round(curY)})`);
      recordGestureAction('Double-Tap Click');

      const el = document.elementFromPoint(curX, curY);
      if (el && el instanceof HTMLElement) {
        el.click();
      }

      if (gestureFeedbackTimer) window.clearTimeout(gestureFeedbackTimer);
      const t = window.setTimeout(() => {
        setPointerActionEffect(null);
        setDetectedGesture(null);
      }, 1500);
      setGestureFeedbackTimer(t);
    }

    // Hold Long-Press Action
    if (state.activeAction === 'hold_long_press') {
      const curX = state.pointerPosition ? state.pointerPosition.x : pointerPos.x;
      const curY = state.pointerPosition ? state.pointerPosition.y : pointerPos.y;

      setPointerActionEffect('hold');
      setDetectedGesture(`Hold: Long Press at (${Math.round(curX)}, ${Math.round(curY)})`);
      recordGestureAction('Hold Long Press');

      const el = document.elementFromPoint(curX, curY);
      if (el) {
        el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
      }

      if (gestureFeedbackTimer) window.clearTimeout(gestureFeedbackTimer);
      const t = window.setTimeout(() => {
        setPointerActionEffect(null);
        setDetectedGesture(null);
      }, 1500);
      setGestureFeedbackTimer(t);
    }

    // Dynamic Throw / Fling
    if (state.activeAction === 'throw') {
      setPointerActionEffect('throw');
      setDetectedGesture('Throw / Fling Detected');
      recordGestureAction('Throw / Fling');

      if (gestureFeedbackTimer) window.clearTimeout(gestureFeedbackTimer);
      const t = window.setTimeout(() => {
        setPointerActionEffect(null);
        setDetectedGesture(null);
        setThrowVector(null);
      }, 1600);
      setGestureFeedbackTimer(t);
    }

    // Clap-to-Clear Action
    if (state.activeAction === 'clap_clear') {
      setPointerActionEffect('clap');
      setClapEffectActive(true);
      setDetectedGesture('Clap-to-Clear Triggered');
      recordGestureAction('Clap-to-Clear');

      if (gestureFeedbackTimer) window.clearTimeout(gestureFeedbackTimer);
      const t = window.setTimeout(() => {
        setPointerActionEffect(null);
        setDetectedGesture(null);
        setClapEffectActive(false);
      }, 1600);
      setGestureFeedbackTimer(t);
    }
  }, [isScreenLockedOrHidden, cameraStoppedDueToLock, pointerPos, gestureFeedbackTimer, recordGestureAction]);

  // Subscribe to GestureEventBus for Throw & Clap animations
  useEffect(() => {
    const bus = GestureEventBus.getInstance();

    const unsubThrow = bus.on('GESTURE_THROW', (payload: GestureThrowPayload) => {
      setPointerActionEffect('throw');
      setThrowVector({ x: payload.direction.x, y: payload.direction.y, speed: payload.velocity });
      setDetectedGesture(`Throw / Fling: Speed ${Math.round(payload.velocity)}`);
      recordGestureAction('Throw / Fling');

      setTimeout(() => {
        setPointerActionEffect(null);
        setThrowVector(null);
        setDetectedGesture(null);
      }, 1600);
    });

    const unsubClap = bus.on('GESTURE_CLAP_CLEAR', (payload: GestureClapClearPayload) => {
      setPointerActionEffect('clap');
      setClapEffectActive(true);
      setDetectedGesture('Clap-to-Clear: Workspace Cleared');
      recordGestureAction('Clap-to-Clear');

      setTimeout(() => {
        setPointerActionEffect(null);
        setClapEffectActive(false);
        setDetectedGesture(null);
      }, 1600);
    });

    const unsubFist = bus.on('GESTURE_FIST_HOLD', (payload: GestureFistHoldPayload) => {
      setPointerActionEffect('hold');
      setDetectedGesture('Emergency Freeze: Fist Hold');
      recordGestureAction('Emergency Freeze');

      setTimeout(() => {
        setPointerActionEffect(null);
        setDetectedGesture(null);
      }, 1600);
    });

    return () => {
      unsubThrow();
      unsubClap();
      unsubFist();
    };
  }, [recordGestureAction]);

  // Sync with Voice Activation Bridge
  useEffect(() => {
    const unsubVoiceBridge = GestureVoiceBridge.subscribe((active) => {
      if (active !== isEnabled) {
        onToggleEnabled(active);
      }
    });
    return () => {
      unsubVoiceBridge();
    };
  }, [isEnabled, onToggleEnabled]);

  // Subscribe to BarehandsTracker singleton
  useEffect(() => {
    const unsubscribe = tracker.subscribe(handleTrackerUpdate);
    return () => {
      unsubscribe();
    };
  }, [tracker, handleTrackerUpdate]);

  // 2. Sync state when enabled prop changes & check for first-time tutorial
  useEffect(() => {
    if (isEnabled && !isScreenLockedOrHidden && !cameraStoppedDueToLock) {
      setIsCameraActive(true);
      tracker.start(pipVideoRef.current, handleTrackerUpdate).then(() => {
        if (pipVideoRef.current) {
          tracker.attachOverlayVideo(pipVideoRef.current);
        }
      });
      // First-time tutorial trigger
      if (!GestureUsageService.hasCompletedGestureTutorial()) {
        setTimeout(() => setIsTutorialOpen(true), 350);
      }
    } else if (!isEnabled) {
      setIsCameraActive(false);
      setCameraStoppedDueToLock(false);
      tracker.stop();
    }
  }, [isEnabled, isScreenLockedOrHidden, cameraStoppedDueToLock, tracker, handleTrackerUpdate]);

  // Attach overlay video when PiP opens or updates
  useEffect(() => {
    if (isEnabled && isCameraActive && pipVideoRef.current) {
      tracker.attachOverlayVideo(pipVideoRef.current);
    }
  }, [isEnabled, isCameraActive, isPipMinimized, tracker]);

  // 3. Privacy Rule: Monitor Screen Lock / Visibility Change
  // When screen turns off / locked, immediately shut down camera
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[MAYRA Background Gesture] Screen lock/hidden detected -> Automatically shutting off camera for privacy');
        setIsScreenLockedOrHidden(true);
        if (isEnabled && isCameraActive) {
          setIsCameraActive(false);
          setCameraStoppedDueToLock(true);
          tracker.pauseDueToLock();
        }
      } else {
        setIsScreenLockedOrHidden(false);
        console.log('[MAYRA Background Gesture] Screen unlocked -> Camera remains OFF until user manually reactivates');
      }
    };

    const handleWindowBlur = () => {
      if (document.hidden) {
        setIsScreenLockedOrHidden(true);
        if (isEnabled && isCameraActive) {
          setIsCameraActive(false);
          setCameraStoppedDueToLock(true);
          tracker.pauseDueToLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isEnabled, isCameraActive, tracker]);

  // 4. Smooth autonomous hand-tracking drift for visual pointer simulation when active
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
    recordGestureAction('Double-Tap Click');

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
    recordGestureAction('Swipe Up Scroll');

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
    recordGestureAction('Hold Long Press');

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

  const handleManualResumeCamera = async () => {
    setCameraStoppedDueToLock(false);
    setIsCameraActive(true);
    await tracker.resumeFromLock();
    if (pipVideoRef.current) {
      tracker.attachOverlayVideo(pipVideoRef.current);
    }
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

  // Drag handlers for PiP camera window
  const handlePipPointerDown = (e: React.PointerEvent) => {
    setIsPipDragging(false);
    pipDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: pipPosition.x,
      posY: pipPosition.y
    };
  };

  const handlePipPointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    const dx = e.clientX - pipDragStartRef.current.x;
    const dy = e.clientY - pipDragStartRef.current.y;
    if (Math.hypot(dx, dy) > 5) {
      setIsPipDragging(true);
      setPipPosition({
        x: Math.max(10, Math.min(window.innerWidth - 140, pipDragStartRef.current.posX + dx)),
        y: Math.max(45, Math.min(window.innerHeight - 150, pipDragStartRef.current.posY + dy))
      });
    }
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

          {/* Quick Practice Mode Button */}
          <button
            onClick={() => setIsPracticeOpen(true)}
            className="p-1 rounded-full text-purple-300 hover:text-white hover:bg-purple-500/20 transition-colors ml-0.5"
            title="Open Gesture Practice Sandbox"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>

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
                scale: pointerActionEffect === 'hold' ? [1, 1.4, 1.2] : pointerActionEffect === 'tap' ? [1, 1.6, 1] : pointerActionEffect === 'throw' ? [1, 1.8, 0.9] : pointerActionEffect === 'clap' ? [1.8, 0.6, 1.4, 1] : [1, 1.15, 1],
                borderColor: pointerActionEffect === 'tap' ? '#22D3EE' : pointerActionEffect === 'hold' ? '#EC4899' : pointerActionEffect === 'scroll' ? '#A855F7' : pointerActionEffect === 'throw' ? '#F59E0B' : pointerActionEffect === 'clap' ? '#10B981' : '#06B6D4'
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

            {/* Throw / Fling Kinetic Vector Trail */}
            {pointerActionEffect === 'throw' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 1, x: 0, y: 0 }}
                animate={{
                  scale: 2.2,
                  opacity: 0,
                  x: throwVector ? throwVector.x * 90 : 60,
                  y: throwVector ? throwVector.y * 90 : -50
                }}
                transition={{ duration: 0.55 }}
                className="absolute flex items-center justify-center text-amber-400"
              >
                <div className="flex flex-col items-center">
                  <Sparkles className="w-6 h-6 drop-shadow-[0_0_12px_#F59E0B] animate-spin" />
                  <span className="text-[8px] font-mono font-bold bg-amber-950/90 text-amber-200 px-1 py-0.2 rounded mt-1">
                    FLING
                  </span>
                </div>
              </motion.div>
            )}

            {/* Clap-to-Clear Collision Burst Wave */}
            {(pointerActionEffect === 'clap' || clapEffectActive) && (
              <motion.div
                initial={{ scale: 3.5, opacity: 0.9 }}
                animate={{ scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeIn' }}
                className="absolute inset-0 -m-8 rounded-full border-4 border-emerald-400/90 bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.8)] flex items-center justify-center"
              >
                <Hand className="w-8 h-8 text-emerald-300 drop-shadow-[0_0_10px_#10B981]" />
              </motion.div>
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

      {/* 3. PERSISTENT FLOATING PIP CAMERA PREVIEW WINDOW (Outside & Inside App) */}
      {isCameraActive && (
        <div
          id="mayra-pip-camera-preview-window"
          style={{
            position: 'fixed',
            left: `${pipPosition.x}px`,
            top: `${pipPosition.y}px`,
            zIndex: 9992
          }}
          onPointerDown={handlePipPointerDown}
          onPointerMove={handlePipPointerMove}
          className="pointer-events-auto select-none touch-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl backdrop-blur-2xl border transition-all overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.85)] ${
              isPipMinimized 
                ? 'w-32 bg-black/85 border-rose-500/50 p-1.5 flex items-center justify-between' 
                : 'w-36 bg-[#060A1A]/95 border-rose-500/70 p-2 flex flex-col gap-1.5'
            }`}
          >
            {/* PiP Header */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="text-[8px] font-mono font-bold text-rose-300 tracking-wider truncate uppercase">
                  {isPipMinimized ? 'CAM ACTIVE' : 'PiP Tracking'}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPipMinimized(prev => !prev);
                  }}
                  className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-white/10"
                  title={isPipMinimized ? 'Expand PiP Preview' : 'Minimize PiP Preview'}
                >
                  {isPipMinimized ? <Maximize2 className="w-2.5 h-2.5" /> : <Minimize2 className="w-2.5 h-2.5" />}
                </button>
              </div>
            </div>

            {/* PiP Expanded Video Feed / Landmark Canvas */}
            {!isPipMinimized && (
              <div className="w-full h-24 rounded-xl bg-black border border-white/10 relative overflow-hidden flex items-center justify-center">
                <video
                  ref={pipVideoRef}
                  className="w-full h-full object-cover -scale-x-100 opacity-40"
                  playsInline
                  muted
                  autoPlay
                />

                {/* Real 21 MediaPipe Skeleton Canvas */}
                <canvas
                  ref={pipCanvasRef}
                  width={160}
                  height={96}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Camera Live Tag */}
                <div className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/80 font-mono text-[7px] text-rose-300 border border-rose-500/40">
                  MediaPipe 21P
                </div>

                {/* Drag Handle Icon */}
                <div className="absolute bottom-1 right-1 p-0.5 text-slate-400/80">
                  <Move className="w-2.5 h-2.5" />
                </div>
              </div>
            )}

            {/* PiP Footer Info */}
            {!isPipMinimized && (
              <div className="flex items-center justify-between text-[7px] font-mono text-slate-400 pt-0.5 border-t border-white/10">
                <span className="text-cyan-300">21 Nodes</span>
                <span className="text-emerald-400">PHONE-WIDE</span>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* 4. FLOATING BUBBLE / CHAT-HEAD (Messenger Style on Home Screen) */}
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

              {/* Hand Gesture Icon Indicator */}
              <div className={`absolute bottom-0.5 right-0.5 p-1 rounded-full ${
                isCameraActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-700 text-slate-400'
              } shadow-md`}>
                <Hand className="w-2.5 h-2.5" />
              </div>
            </div>

            {/* 5. USAGE COUNTER / BADGE (Top-Right of Bubble) */}
            <motion.div
              animate={badgePulse ? { scale: [1, 1.45, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-mono text-[9px] font-extrabold flex items-center justify-center border border-white shadow-[0_0_10px_rgba(244,63,94,0.7)]"
              title={`Today's Gesture Count: ${todayUsageCount}`}
            >
              {todayUsageCount}
            </motion.div>
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
                {/* Header with Usage Counter */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Hand className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white font-sans">Background Hand-Gesture</h4>
                      <p className="text-[9px] text-slate-400 font-mono">Accessibility Touchless Control</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Today's Usage Counter Card */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-cyan-950/40 border border-rose-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-white block">Today&apos;s Gestures Used</span>
                      <span className="text-[8px] text-slate-400 font-mono">System-wide triggers</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 font-mono font-extrabold text-xs">
                    {todayUsageCount} actions
                  </span>
                </div>

                {/* Unified Markdown Memory Vault Status Badge */}
                <div className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-white block">Shared Memory Vault</span>
                      <span className="text-[8px] text-slate-400 font-mono">MAYRA ↔ STONICX Dual-Brain</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-[9px]">
                    {MemoryVaultManager.getInstance().getTotalNotesCount()} Notes | Synced
                  </span>
                </div>

                {/* Quick Practice & Tutorial Launch Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Practice / Test Sandbox Button */}
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setIsPracticeOpen(true);
                    }}
                    className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 flex items-center gap-1.5 transition-all text-left"
                  >
                    <Flame className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold block">Test / Practice</span>
                      <span className="text-[8px] text-purple-300/80 font-mono">Zero-risk sandbox</span>
                    </div>
                  </button>

                  {/* Tutorial Guide Button */}
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setIsTutorialOpen(true);
                    }}
                    className="p-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 flex items-center gap-1.5 transition-all text-left"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold block">View Tutorial</span>
                      <span className="text-[8px] text-cyan-300/80 font-mono">Gesture guide</span>
                    </div>
                  </button>
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

                  {/* 4. Throw / Fling */}
                  <button
                    onClick={() => dispatchSyntheticThrow(0.85, -0.5, 1600)}
                    className="p-2 bg-white/[0.05] hover:bg-amber-500/20 text-slate-200 hover:text-amber-200 border border-white/10 rounded-xl flex items-center justify-between transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold block">Throw / Fling</span>
                        <span className="text-[8px] text-slate-400 font-mono">Pinch + High-Speed Release</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-900/60 text-amber-300 rounded font-mono">Fling</span>
                  </button>

                  {/* 5. Clap to Clear */}
                  <button
                    onClick={() => dispatchSyntheticClap()}
                    className="p-2 bg-white/[0.05] hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-200 border border-white/10 rounded-xl flex items-center justify-between transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300">
                        <Hand className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold block">Clap to Clear</span>
                        <span className="text-[8px] text-slate-400 font-mono">Two-Hand Rapid Collision</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-900/60 text-emerald-300 rounded font-mono">Clear</span>
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

      {/* 5. INTERACTIVE ONBOARDING TUTORIAL MODAL (First Time or On Demand) */}
      <GestureTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onOpenPracticeMode={() => setIsPracticeOpen(true)}
      />

      {/* 6. ZERO-RISK TEST / PRACTICE SANDBOX MODAL */}
      <GesturePracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />
    </>
  );
};
