import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AssistantStatus, UserPersonalConfig, AssistantConfig, PermissionItem, CharacterModelMetadata, ChatMessage, AppearanceConfig } from '../../types';
import { MayraAvatar } from '../character/MayraAvatar';
import { MayraOrb, ORB_STYLES, normalizeOrbStyle } from '../character/MayraOrb';
import { HomeAtmosphereBackground } from '../character/HomeAtmosphereBackground';
import { useCharacterController } from '../../hooks/useCharacterController';
import { useBarehandsGesture } from '../../hooks/useBarehandsGesture';
import { BarehandsCameraOverlay } from '../character/BarehandsCameraOverlay';
import { MayraLogo } from '../common/MayraLogo';
import { AttachmentBottomSheet, AttachmentItem } from '../common/AttachmentBottomSheet';
import { getDynamicSuggestions } from '../../utils/dynamicSuggestions';
import { 
  Settings as SettingsIcon, Send, Paperclip, 
  Sparkles, ScreenShare, Lock, Unlock, FileText, 
  X, PenTool, Hand, Zap, Smartphone, ChevronDown, Check, Cpu
} from 'lucide-react';

interface HomeScreenProps {
  status: AssistantStatus;
  personalConfig: UserPersonalConfig;
  assistantConfig: AssistantConfig;
  setAssistantConfig?: React.Dispatch<React.SetStateAction<AssistantConfig>>;
  onSwitchMode?: (mode: 'mayra' | 'stonicx') => void;
  appearanceConfig?: AppearanceConfig;
  permissions: PermissionItem[];
  messages?: ChatMessage[];
  inputText: string;
  setInputText: (text: string) => void;
  onSubmitPrompt: (customText?: string, image?: { base64: string; mimeType?: string; name?: string; size?: string }) => void;
  onTriggerVoice: () => void;
  onSelectAction: (action: string) => void;
  onOpenSettings: () => void;
  onOpenPermissions: () => void;
  onOpenWhiteboard?: () => void;
  onOpenRoutines?: () => void;
  onOpenWidgetGuide?: () => void;
  modelMetadata?: CharacterModelMetadata;
  proactiveEnabled?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  status,
  personalConfig,
  assistantConfig,
  setAssistantConfig,
  onSwitchMode,
  appearanceConfig,
  permissions,
  messages = [],
  inputText,
  setInputText,
  onSubmitPrompt,
  onTriggerVoice,
  onSelectAction,
  onOpenSettings,
  onOpenPermissions,
  onOpenWhiteboard,
  onOpenRoutines,
  onOpenWidgetGuide,
  modelMetadata,
  proactiveEnabled = true
}) => {
  const {
    transform,
    lockState,
    isDragging,
    toggleLock,
    rotateByDelta,
    scaleByDelta,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleWheel
  } = useCharacterController(status);

  // Barehands Hand Tracking & Gesture Control Engine
  const {
    isEnabled: isHandTrackingActive,
    isLoading: isHandTrackingLoading,
    gestureState: handGestureState,
    errorMessage: handTrackingError,
    videoRef: handVideoRef,
    canvasRef: handCanvasRef,
    toggleTracking: toggleHandTracking,
    disableTracking: disableHandTracking
  } = useBarehandsGesture({
    onRotateModel: rotateByDelta,
    onScaleModel: scaleByDelta,
    characterLocked: lockState.isLocked
  });

  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [screenShareNotice, setScreenShareNotice] = useState<string | null>(null);
  const [lockToast, setLockToast] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachmentItem | null>(null);
  const [isAttachmentSheetOpen, setIsAttachmentSheetOpen] = useState<boolean>(false);
  const [isProactivePromptActive, setIsProactivePromptActive] = useState<boolean>(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggleLock = () => {
    toggleLock();
    const nextLocked = !lockState.isLocked;
    setLockToast(nextLocked ? 'Character Pose & Orbit Locked' : 'Character Pose Unlocked');
    setTimeout(() => {
      setLockToast(null);
    }, 2200);
  };

  // 15-Second Idle Check-In
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (isProactivePromptActive) {
      setIsProactivePromptActive(false);
    }

    if (proactiveEnabled && status === 'READY') {
      idleTimerRef.current = setTimeout(() => {
        setIsProactivePromptActive(true);
      }, 15000);
    }
  }, [proactiveEnabled, status, isProactivePromptActive]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer, inputText]);

  const handleToggleScreenShare = async () => {
    resetIdleTimer();
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          setIsScreenSharing(true);
          setScreenShareNotice('Screen stream connected to MAYRA Vision');
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            setScreenShareNotice(null);
          };
        } else {
          setIsScreenSharing(true);
          setScreenShareNotice('Screen stream connected to MAYRA Vision');
        }
      } catch (err) {
        setIsScreenSharing(!isScreenSharing);
        setScreenShareNotice(isScreenSharing ? null : 'Screen stream connected');
      }
    } else {
      setIsScreenSharing(false);
      setScreenShareNotice(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetIdleTimer();
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          type: file.type.startsWith('image/') ? 'gallery' : 'file',
          name: file.name,
          size: sizeStr,
          mimeType: file.type || 'application/octet-stream',
          dataUrl: reader.result as string,
          file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetIdleTimer();
    const isDoc = attachedFile?.mimeType?.includes('pdf') || 
                  attachedFile?.mimeType?.includes('text') || 
                  attachedFile?.mimeType?.includes('csv') || 
                  attachedFile?.mimeType?.includes('json') ||
                  attachedFile?.name.match(/\.(pdf|txt|csv|json|md|doc|docx)$/i);

    const defaultPrompt = isDoc
      ? `Please read and analyze this attached document (${attachedFile?.name}). Summarize key points and explain its contents.`
      : 'Please analyze what is in this image in detail.';

    const promptToSend = attachedFile && !inputText.trim()
      ? defaultPrompt
      : inputText;
    
    const filePayload = attachedFile?.dataUrl 
      ? { 
          base64: attachedFile.dataUrl, 
          mimeType: attachedFile.mimeType || (isDoc ? 'application/pdf' : 'image/jpeg'),
          name: attachedFile.name,
          size: attachedFile.size
        }
      : undefined;

    console.log('[MAYRA HomeScreen] Submitting message with attachment data:', {
      prompt: promptToSend,
      hasAttachment: Boolean(attachedFile),
      attachmentName: attachedFile?.name,
      mimeType: filePayload?.mimeType,
      dataUrlLength: attachedFile?.dataUrl ? attachedFile.dataUrl.length : 0
    });

    onSubmitPrompt(promptToSend, filePayload);
    setAttachedFile(null);
  };

  const getAssistantMessage = () => {
    switch (status) {
      case 'SPEAKING':
        return 'Speaking response...';
      case 'THINKING':
        return 'Reasoning...';
      case 'LISTENING':
        return 'Listening... Speak naturally';
      case 'INTERRUPTED':
        return 'Interrupted. Listening to you...';
      case 'ERROR':
        return 'Microphone unavailable';
      case 'READY':
      default: {
        if (isProactivePromptActive) {
          const name = personalConfig.preferredName || personalConfig.fullName || 'Zafer';
          return `${name}, I'm right here if you need anything.`;
        }
        const name = personalConfig.preferredName || personalConfig.fullName || 'Zafer';
        return `Hi ${name}, what should we do today?`;
      }
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'LISTENING':
        return {
          label: 'LISTENING',
          badgeColor: 'text-cyan-300 bg-cyan-950/70 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.4)]',
          dotColor: 'bg-cyan-400'
        };
      case 'THINKING':
        return {
          label: 'REASONING',
          badgeColor: 'text-amber-300 bg-amber-950/70 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
          dotColor: 'bg-amber-400'
        };
      case 'SPEAKING':
        return {
          label: 'SPEAKING',
          badgeColor: 'text-emerald-300 bg-emerald-950/70 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
          dotColor: 'bg-emerald-400'
        };
      case 'INTERRUPTED':
        return {
          label: 'BARGE-IN',
          badgeColor: 'text-violet-300 bg-violet-950/70 border-violet-400/40 shadow-[0_0_12px_rgba(139,92,246,0.4)]',
          dotColor: 'bg-violet-400'
        };
      case 'ERROR':
        return {
          label: 'ERROR',
          badgeColor: 'text-rose-300 bg-rose-950/70 border-rose-400/40 shadow-[0_0_12px_rgba(244,63,94,0.4)]',
          dotColor: 'bg-rose-400'
        };
      case 'READY':
      default:
        return {
          label: 'ONLINE',
          badgeColor: 'text-cyan-400 bg-cyan-950/50 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]',
          dotColor: 'bg-cyan-400'
        };
    }
  };

  const statusBadge = getStatusBadge();
  const userName = personalConfig.preferredName || personalConfig.fullName || 'Zafer';

  // Dynamic Suggestion Rotation Engine
  const [rotationSeed, setRotationSeed] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationSeed(prev => (prev + 1) % 10);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const quickPrompts = useMemo(() => {
    return getDynamicSuggestions(messages, (assistantConfig as any)?.language || 'en', rotationSeed);
  }, [messages, assistantConfig, rotationSeed]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#070914] text-slate-100 select-none min-h-0"
    >
      
      {/* 1. Atmospheric Ambient Background Depth & Drifting Particles */}
      <HomeAtmosphereBackground status={status} appearanceConfig={appearanceConfig} />

      {/* 2. FULL-SCREEN MAYRA 3D CHARACTER LAYER OR ORB LAYER */}
      {appearanceConfig?.useOrbOnHome ? (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-auto cursor-pointer"
          onClick={onTriggerVoice}
        >
          <div className="relative flex flex-col items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <MayraOrb
                style={appearanceConfig.orbStyle}
                color={appearanceConfig.orbColor}
                size={210}
                status={status}
                interactive={true}
              />
            </motion.div>
            <div className="flex flex-col items-center select-none text-center px-4">
              <span className="text-xs font-mono tracking-widest text-cyan-300 font-bold uppercase drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                {status === 'LISTENING' ? 'LISTENING...' : status === 'SPEAKING' ? 'MAYRA SPEAKING' : status === 'THINKING' ? 'REASONING...' : 'TAP ORB TO SPEAK'}
              </span>
              <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                {ORB_STYLES.find(s => s.id === normalizeOrbStyle(appearanceConfig.orbStyle))?.name || 'Particle Swirl'} • {status === 'READY' ? 'Ready for command' : status}
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <MayraAvatar
          status={status}
          scaleMultiplier={transform.zoom || 1.0}
          characterZoom={100}
          characterSkinTone={assistantConfig?.characterSkinTone ?? 50}
          transform={transform}
          lockState={lockState}
          modelMetadata={modelMetadata}
          isDragging={isDragging}
          onPointerDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onPointerUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onWheel={handleWheel}
          onTriggerVoice={onTriggerVoice}
        />
      )}

      {/* Floating Barehands Camera HUD when Hand Tracking is active */}
      {(isHandTrackingActive || isHandTrackingLoading) && (
        <BarehandsCameraOverlay
          gestureState={handGestureState}
          videoRef={handVideoRef}
          canvasRef={handCanvasRef}
          isLoading={isHandTrackingLoading}
          onClose={disableHandTracking}
        />
      )}

      {/* 3. MINIMAL TOP FLOATING HEADER (Clean & Uncluttered with animated icons) */}
      <div className="relative z-20 w-full px-3.5 pt-2 flex flex-col gap-1.5 pointer-events-auto">
        <header className="w-full flex items-center justify-between">
          {/* Left: MAYRA Branding with Account/Mode Switcher Dropdown */}
          <div className="relative flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => setIsSwitcherOpen(prev => !prev)}
              className="flex items-center gap-1.5 min-w-0 bg-transparent hover:bg-white/10 active:scale-95 px-1 py-0.5 -ml-1 rounded-xl transition-all cursor-pointer group text-left"
              title="Switch Assistant Mode (MAYRA / STONICX)"
              aria-expanded={isSwitcherOpen}
            >
              <MayraLogo size={26} showGlow={true} variant="raw" />
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-sans font-bold text-sm text-white tracking-wide truncate group-hover:text-cyan-200 transition-colors">
                  ★𝐌₳ᎽⱤ₳ ᥫ᭡
                </span>
                <motion.div
                  animate={{ rotate: isSwitcherOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4 rounded-full bg-white/5 group-hover:bg-white/15 flex items-center justify-center text-slate-300 group-hover:text-white transition-colors"
                >
                  <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                </motion.div>
              </div>
            </button>

            <div className={`px-1.5 py-0.5 rounded-full border text-[8px] font-mono font-bold tracking-wider flex items-center gap-1 shrink-0 ${statusBadge.badgeColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor} animate-ping`} />
              <span>{statusBadge.label}</span>
            </div>

            {/* Dropdown Menu for Switching Assistant Mode (MAYRA / STONICX) */}
            <AnimatePresence>
              {isSwitcherOpen && (
                <>
                  {/* Backdrop to catch outside clicks */}
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                    onClick={() => setIsSwitcherOpen(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-11 z-50 w-64 p-2 bg-[#0C1022]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 font-sans"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                      <span>Switch Assistant</span>
                      <span className="text-[9px] text-cyan-400 font-bold">CORE SHELL</span>
                    </div>

                    <div className="space-y-1">
                      {/* Option 1: ⭐ MAYRA (Currently selected) */}
                      <button
                        onClick={() => {
                          setIsSwitcherOpen(false);
                          if (onSwitchMode) onSwitchMode('mayra');
                          else if (setAssistantConfig) setAssistantConfig(prev => ({ ...prev, activeMode: 'mayra' }));
                        }}
                        className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                          (assistantConfig.activeMode || 'mayra') === 'mayra'
                            ? 'bg-gradient-to-r from-purple-950/80 to-cyan-950/80 border border-cyan-400/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                            : 'hover:bg-white/10 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white shadow-md text-sm font-bold">
                            ⭐
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>MAYRA</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">3D AVATAR</span>
                            </div>
                            <div className="text-[10px] text-slate-300">Spatial companion & routines</div>
                          </div>
                        </div>
                        {(assistantConfig.activeMode || 'mayra') === 'mayra' && (
                          <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>

                      {/* Option 2: ⚡ STONICX */}
                      <button
                        onClick={() => {
                          setIsSwitcherOpen(false);
                          if (onSwitchMode) onSwitchMode('stonicx');
                          else if (setAssistantConfig) setAssistantConfig(prev => ({ ...prev, activeMode: 'stonicx' }));
                        }}
                        className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                          assistantConfig.activeMode === 'stonicx'
                            ? 'bg-gradient-to-r from-amber-950/80 to-stone-950/80 border border-amber-400/40 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'hover:bg-amber-500/10 text-slate-300 border border-amber-500/20 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black shadow-md text-sm font-bold">
                            ⚡
                          </div>
                          <div>
                            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <span>STONICX</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">CIRCUIT OS</span>
                            </div>
                            <div className="text-[10px] text-amber-200/70">Living silicon quantum terminal</div>
                          </div>
                        </div>
                        {assistantConfig.activeMode === 'stonicx' && (
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/10 px-1 text-[9px] text-slate-400 flex items-center justify-between font-mono">
                      <span>Shared System Permissions</span>
                      <span className="text-cyan-400">INSTANT DUAL-CORE</span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Sleek Pure Action Icons with Spring Hover & Tap animations */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenRoutines && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onOpenRoutines}
                className="p-1 bg-transparent border-0 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                title="Smart Shortcuts & Dinacharya"
              >
                <Zap className="w-4 h-4 stroke-[2]" />
              </motion.button>
            )}

            {onOpenWidgetGuide && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onOpenWidgetGuide}
                className="p-1 bg-transparent border-0 text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
                title="Android Quick Widget Preview"
              >
                <Smartphone className="w-4 h-4 stroke-[1.8]" />
              </motion.button>
            )}

            {onOpenWhiteboard && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onOpenWhiteboard}
                className="p-1 bg-transparent border-0 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Interactive Whiteboard Tool"
              >
                <PenTool className="w-4 h-4 stroke-[1.8]" />
              </motion.button>
            )}

            {/* Barehands Gesture Tracking Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.88 }}
              onClick={toggleHandTracking}
              className={`p-1 bg-transparent border-0 transition-colors cursor-pointer ${
                isHandTrackingActive || isHandTrackingLoading
                  ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]'
                  : 'text-slate-300 hover:text-white'
              }`}
              title={
                isHandTrackingLoading
                  ? 'Initializing Barehands...'
                  : isHandTrackingActive
                  ? 'Disable Hand Tracking (Camera)'
                  : 'Enable Barehands Hand Tracking (Rotate & Zoom via Gestures)'
              }
            >
              <Hand className={`w-4 h-4 stroke-[1.8] ${isHandTrackingLoading ? 'animate-pulse text-cyan-400' : ''}`} />
            </motion.button>

            {/* Screen Share / Cast Button */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.88 }}
              onClick={handleToggleScreenShare}
              className={`p-1 bg-transparent border-0 transition-colors cursor-pointer ${
                isScreenSharing
                  ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]'
                  : 'text-slate-300 hover:text-white'
              }`}
              title={isScreenSharing ? 'Disconnect Screen Share' : 'Connect Screen Stream'}
            >
              <ScreenShare className="w-4 h-4 stroke-[1.8]" />
            </motion.button>

            {/* Character Lock / Unlock Button */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.88 }}
              onClick={handleToggleLock}
              className="p-1 bg-transparent border-0 transition-colors text-slate-300 hover:text-white cursor-pointer"
              title={lockState.isLocked ? 'Character Locked' : 'Character Unlocked'}
            >
              {lockState.isLocked ? (
                <Lock className="w-4 h-4 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] stroke-[1.8]" />
              ) : (
                <Unlock className="w-4 h-4 text-slate-300 hover:text-white stroke-[1.8]" />
              )}
            </motion.button>

            {/* Settings Gear Icon: Clean rotating gear with spring hover */}
            <motion.button
              whileHover={{ scale: 1.15, rotate: 45 }}
              whileTap={{ scale: 0.88 }}
              onClick={onOpenSettings}
              className="p-1 bg-transparent border-0 text-cyan-400 hover:text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-colors group cursor-pointer"
              title={`Settings (${userName})`}
            >
              <SettingsIcon className="w-4 h-4 animate-[spin_10s_linear_infinite] stroke-[1.8]" />
            </motion.button>
          </div>
        </header>
      </div>

      {/* Floating Notices */}
      <AnimatePresence>
        {handTrackingError && !isHandTrackingActive && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="relative z-30 mx-auto mt-1 px-3.5 py-1.5 bg-[#120808]/90 backdrop-blur-xl border border-rose-500/50 rounded-2xl text-[10px] font-mono text-rose-200 flex items-center gap-2 shadow-[0_4px_20px_rgba(244,63,94,0.3)] max-w-sm"
          >
            <Hand className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="leading-tight">{handTrackingError}</span>
            <button onClick={disableHandTracking} className="p-0.5 hover:bg-white/10 rounded text-slate-400 hover:text-white shrink-0 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        {lockToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="relative z-30 mx-auto mt-1 px-3.5 py-1 bg-[#080D20]/90 backdrop-blur-xl border border-amber-500/40 rounded-full text-[10px] font-mono text-amber-300 flex items-center gap-1.5 shadow-[0_4px_20px_rgba(245,158,11,0.25)]"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>{lockToast}</span>
          </motion.div>
        )}

        {screenShareNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="relative z-30 mx-auto mt-1 px-3 py-1 bg-slate-900/70 backdrop-blur-xl border border-cyan-400/30 rounded-full text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-[0_4px_20px_rgba(6,182,212,0.25)]"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{screenShareNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. LOWER INTERACTION STAGE: Cardless Live Transcript / Prompts & iOS Search Pill */}
      <div className="relative z-20 w-full px-3.5 pb-2 flex flex-col items-center gap-2 pointer-events-auto">
        
        {/* Dynamic Cardless Transcript / Status: Direct text without large card */}
        {status !== 'READY' ? (
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm px-2 py-1 flex items-center justify-between text-xs text-slate-200 leading-relaxed font-sans"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor} animate-pulse shrink-0`} />
              <p className="truncate text-slate-100">
                {getAssistantMessage()}
              </p>
            </div>
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0 ml-2 animate-spin" />
          </motion.div>
        ) : (
          /* Quick Prompt Chips with spring hover & tap */
          <div className="w-full max-w-sm flex items-center gap-1.5 overflow-x-auto py-0.5 px-0.5 scrollbar-none">
            {quickPrompts.map((prompt) => (
              <motion.button
                key={prompt}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setInputText(prompt);
                }}
                className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 rounded-full text-[11px] text-slate-300 hover:text-white whitespace-nowrap backdrop-blur-xl transition-colors shadow-sm cursor-pointer"
              >
                {prompt}
              </motion.button>
            ))}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Attached File Chip */}
        <AnimatePresence>
          {attachedFile && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="w-full max-w-sm flex items-center justify-between px-3 py-1.5 bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-xl text-[11px] font-mono text-cyan-300 shadow-md"
            >
              <div className="flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{attachedFile.name}</span>
                <span className="text-[9px] text-cyan-400/60">({attachedFile.size})</span>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="p-0.5 text-slate-400 hover:text-red-400 rounded-md transition-colors ml-2 cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sleek Bottom Chat Input Bar */}
        <form
          onSubmit={handleFormSubmit}
          className="w-full max-w-sm bg-white/[0.08] hover:bg-white/[0.12] focus-within:bg-white/[0.14] backdrop-blur-2xl border border-white/15 focus-within:border-cyan-400/50 rounded-xl flex items-center px-2.5 py-1.5 gap-1.5 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.12)] focus-within:shadow-[0_4px_24px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
        >
          {/* Attachment Paperclip Button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.88 }}
            type="button"
            onClick={() => setIsAttachmentSheetOpen(true)}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08] rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Attach photo, video, audio or document"
          >
            <Paperclip className="w-4 h-4" />
          </motion.button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask MAYRA..."
            className="bg-transparent border-none outline-none flex-1 text-xs text-white placeholder-slate-400 font-sans min-w-0"
          />

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={!inputText.trim() && !attachedFile}
            className="p-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-white transition-all shadow-md shrink-0 cursor-pointer"
            title="Send prompt"
          >
            <Send className="w-3.5 h-3.5" />
          </motion.button>
        </form>

      </div>

      {/* Attachment Action Sheet */}
      <AttachmentBottomSheet
        isOpen={isAttachmentSheetOpen}
        onClose={() => setIsAttachmentSheetOpen(false)}
        onSelectAttachment={(item) => {
          setAttachedFile(item);
        }}
      />

    </motion.div>
  );
};
