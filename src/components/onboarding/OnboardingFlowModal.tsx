import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Hand, Mic, Camera, Shield, 
  ArrowRight, ArrowLeft, Check, Bot, Zap, Volume2, Globe, Heart,
  Smartphone, Bell, PhoneCall, FolderOpen, Users, Palette, Moon, Sun,
  CheckCircle2, AlertCircle, Layers, Flame, Eye, RefreshCw
} from 'lucide-react';
import { MayraLogo } from '../common/MayraLogo';
import { 
  UserPersonalConfig, AssistantConfig, AppearanceConfig, 
  PermissionItem, AppThemePreset 
} from '../../types';
import { APP_THEMES } from '../../utils/themePresets';

interface OnboardingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalConfig: UserPersonalConfig;
  setPersonalConfig: React.Dispatch<React.SetStateAction<UserPersonalConfig>>;
  assistantConfig: AssistantConfig;
  setAssistantConfig: React.Dispatch<React.SetStateAction<AssistantConfig>>;
  appearanceConfig: AppearanceConfig;
  setAppearanceConfig: React.Dispatch<React.SetStateAction<AppearanceConfig>>;
  permissions: PermissionItem[];
  setPermissions: React.Dispatch<React.SetStateAction<PermissionItem[]>>;
}

// Audio chime synthesis via Web Audio API
function playCelebrationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.85);
    });
  } catch (e) {
    // Audio unsupported or user gesture required
  }
}

const FEATURE_SLIDES = [
  {
    id: 'ai-voice',
    title: 'Autonomous 3D AI & Voice',
    subtitle: 'Real-time natural speech conversation',
    desc: 'Speak naturally in Hindi, English, or Hinglish with sub-second response times and realistic 3D presence.',
    icon: Sparkles,
    badge: '3D VOICE ENGINE',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'gestures',
    title: 'Touchless Hand Gestures',
    subtitle: 'Control with barehand camera tracking',
    desc: 'Rotate the 3D model, scroll feeds with swipe gestures, and control actions seamlessly without touching the screen.',
    icon: Hand,
    badge: 'VISION GESTURES',
    gradient: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'vision-ocr',
    title: 'Vision Scanner & Live OCR',
    subtitle: 'See and understand anything instantly',
    desc: 'Scan documents, translate signs, recognize objects, and extract text using high-speed multimodal intelligence.',
    icon: Camera,
    badge: 'MULTIMODAL OCR',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'memory-vault',
    title: 'Persistent Memory Vault',
    subtitle: 'Remembers what matters to you',
    desc: 'Say "yaad rakho" to store facts, family contacts, and preferences securely with local instant retrieval.',
    icon: Shield,
    badge: 'SECURE MEMORY',
    gradient: 'from-rose-500 to-pink-600'
  }
];

const QUICK_NAME_SUGGESTIONS = ['Zafer', 'Sir', 'Boss', 'Friend', 'User'];

const THEME_OPTIONS: { id: AppThemePreset; name: string; hex: string; bg: string }[] = [
  { id: 'cyan', name: 'Cyan Pulse', hex: '#06b6d4', bg: 'bg-cyan-500' },
  { id: 'royal_blue', name: 'Royal Blue', hex: '#2563eb', bg: 'bg-blue-600' },
  { id: 'aura_red', name: 'Aura Red', hex: '#ef4444', bg: 'bg-red-500' },
  { id: 'purple', name: 'Cosmic Purple', hex: '#a855f7', bg: 'bg-purple-500' },
  { id: 'emerald', name: 'Emerald Cyber', hex: '#10b981', bg: 'bg-emerald-500' },
  { id: 'amber', name: 'Amber Gold', hex: '#f59e0b', bg: 'bg-amber-500' },
  { id: 'rose_pink', name: 'Rose Pink', hex: '#f43f5e', bg: 'bg-rose-500' },
  { id: 'midnight', name: 'Midnight Stealth', hex: '#64748b', bg: 'bg-slate-700' }
];

export const OnboardingFlowModal: React.FC<OnboardingFlowModalProps> = ({
  isOpen,
  onClose,
  personalConfig,
  setPersonalConfig,
  assistantConfig,
  setAssistantConfig,
  appearanceConfig,
  setAppearanceConfig,
  permissions,
  setPermissions
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;
  
  // Local state for interactive editing before final sync
  const [tempName, setTempName] = useState<string>(
    personalConfig.preferredName || personalConfig.fullName || 'Zafer'
  );
  const [tempLanguage, setTempLanguage] = useState<string>(
    assistantConfig.language || 'en'
  );
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number>(0);
  const [isCelebrating, setIsCelebrating] = useState<boolean>(false);
  const [allGrantedFeedback, setAllGrantedFeedback] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsCelebrating(false);
      setTempName(personalConfig.preferredName || personalConfig.fullName || 'Zafer');
      setTempLanguage(assistantConfig.language || 'en');
    }
  }, [isOpen, personalConfig, assistantConfig]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    // Only non-mandatory steps can skip. Permissions is step 4 (mandatory).
    if (currentStep === 4) {
      // For permissions, skipping grants default essential permissions so the user is ready
      handleGrantAllPermissions();
      setCurrentStep(prev => prev + 1);
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleGrantAllPermissions = () => {
    setPermissions(prev => prev.map(p => ({
      ...p,
      status: 'granted' as const,
      statusLabel: 'Granted',
      actionLabel: 'Granted'
    })));
    setAllGrantedFeedback(true);
    setTimeout(() => setAllGrantedFeedback(false), 2000);
  };

  const handleToggleSinglePermission = (id: string) => {
    setPermissions(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'granted' ? 'denied' : 'granted';
        return {
          ...p,
          status: nextStatus as any,
          statusLabel: nextStatus === 'granted' ? 'Granted' : 'Grant',
          actionLabel: nextStatus === 'granted' ? 'Granted' : 'Grant'
        };
      }
      return p;
    }));
  };

  const handleSelectLanguage = (lang: string) => {
    setTempLanguage(lang);
    setAssistantConfig(prev => ({ ...prev, language: lang }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_preferred_language', lang);
    }
  };

  const handleSaveName = (name: string) => {
    setTempName(name);
    setPersonalConfig(prev => ({
      ...prev,
      preferredName: name,
      fullName: prev.fullName || name
    }));
  };

  const handleSelectTheme = (themeId: AppThemePreset) => {
    setAppearanceConfig(prev => ({
      ...prev,
      appTheme: themeId
    }));
  };

  const handleToggleDarkMode = (dark: boolean) => {
    setAppearanceConfig(prev => ({
      ...prev,
      darkMode: dark
    }));
  };

  const handleCompleteOnboarding = () => {
    setIsCelebrating(true);
    playCelebrationChime();

    // Persist onboarding completion
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_onboarding_completed', 'true');
    }

    // Delay close slightly so user sees the celebration effect
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  // Count granted permissions
  const grantedCount = permissions.filter(p => p.status === 'granted' || p.id === 'default_assistant').length;
  const isPermissionsMandatoryStep = currentStep === 4;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-[#030612]/92 backdrop-blur-3xl select-none">
      
      {/* Background Animated Ambient Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            x: [0, 30, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-cyan-600/15 blur-[90px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full bg-purple-600/15 blur-[90px]"
        />
      </div>

      {/* Main Glassmorphic Container Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        className="relative w-full max-w-md bg-[#090D24]/95 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(6,182,212,0.15)] flex flex-col justify-between z-10 max-h-[92vh] overflow-hidden"
      >
        {/* Top Header & 6-Step Progress Indicators */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <MayraLogo size={24} showGlow={false} />
            <span className="font-bold text-xs text-white tracking-wider font-sans">
              MAYRA AI
            </span>
          </div>

          {/* Progress Badge & Step Dots (1/6, 2/6, ...) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
              {currentStep}/{totalSteps}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }).map((_, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === currentStep;
                const isPassed = stepNum < currentStep;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(stepNum)}
                    aria-label={`Go to step ${stepNum}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'w-5 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' 
                        : isPassed 
                        ? 'w-2 bg-cyan-600/60' 
                        : 'w-1.5 bg-white/20'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Multi-Step Body Area */}
        <div className="flex-1 overflow-y-auto py-4 min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: WELCOME SCREEN */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 opacity-40 blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-2xl bg-white/[0.08] border border-white/20 backdrop-blur-2xl flex items-center justify-center shadow-xl">
                    <MayraLogo size={52} showGlow={true} />
                  </div>
                  <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-[#050814] border border-cyan-400/50 text-[9px] font-mono text-cyan-300 font-bold tracking-widest shadow-md">
                    AUTONOMOUS AI
                  </span>
                </div>

                <div className="space-y-1.5 mt-1">
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    Welcome to MAYRA
                  </h1>
                  <p className="text-xs font-semibold text-cyan-300">
                    Your Next-Gen 3D Autonomous AI Companion
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xs pt-1">
                    Namaste! MAYRA seamlessly combines conversational voice, touchless vision gestures, multimodal OCR, and secure memory vault for your everyday life.
                  </p>
                </div>

                {/* Badges */}
                <div className="grid grid-cols-3 gap-2 w-full pt-1">
                  <div className="p-2 bg-white/[0.04] border border-white/10 rounded-xl flex flex-col items-center text-center">
                    <Sparkles className="w-4 h-4 text-cyan-400 mb-1" />
                    <span className="text-[10px] font-bold text-white">3D Presence</span>
                    <span className="text-[8px] text-slate-400">Interactive</span>
                  </div>
                  <div className="p-2 bg-white/[0.04] border border-white/10 rounded-xl flex flex-col items-center text-center">
                    <Mic className="w-4 h-4 text-purple-400 mb-1" />
                    <span className="text-[10px] font-bold text-white">Live Voice</span>
                    <span className="text-[8px] text-slate-400">Ultra-Fast</span>
                  </div>
                  <div className="p-2 bg-white/[0.04] border border-white/10 rounded-xl flex flex-col items-center text-center">
                    <Shield className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-bold text-white">Local Vault</span>
                    <span className="text-[8px] text-slate-400">Private</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: BHASHA CHUNNA (LANGUAGE SELECTION) */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-cyan-500/30 blur-xl animate-pulse" />
                  <div className="relative w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/20 flex items-center justify-center">
                    <Globe className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">
                    Select Your Language
                  </h2>
                  <p className="text-xs text-slate-300">
                    Aap MAYRA se kis bhasha mein baat karna chahte hain?
                  </p>
                </div>

                {/* 3 Dedicated Language Options */}
                <div className="w-full flex flex-col gap-2.5 pt-1">
                  
                  {/* Hindi Option */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectLanguage('hi')}
                    className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                      tempLanguage === 'hi'
                        ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        tempLanguage === 'hi' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-slate-300'
                      }`}>
                        हिं
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">हिंदी (Hindi)</div>
                        <div className="text-[10px] text-cyan-300/80">"नमस्ते! मैं आपकी क्या मदद करूँ?"</div>
                      </div>
                    </div>
                    {tempLanguage === 'hi' && (
                      <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center text-black">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </motion.button>

                  {/* English Option */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectLanguage('en')}
                    className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                      tempLanguage === 'en'
                        ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        tempLanguage === 'en' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-slate-300'
                      }`}>
                        EN
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">English</div>
                        <div className="text-[10px] text-cyan-300/80">"Hello! How can I assist you today?"</div>
                      </div>
                    </div>
                    {tempLanguage === 'en' && (
                      <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center text-black">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </motion.button>

                  {/* Hinglish Option */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectLanguage('hi_en')}
                    className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                      tempLanguage === 'hi_en'
                        ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        tempLanguage === 'hi_en' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-slate-300'
                      }`}>
                        H+E
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Hinglish (Hindi + English)</div>
                        <div className="text-[10px] text-cyan-300/80">"Haan ji! Mayra ready hai, bolo kya help karun?"</div>
                      </div>
                    </div>
                    {tempLanguage === 'hi_en' && (
                      <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center text-black">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </motion.button>

                </div>
              </motion.div>
            )}

            {/* STEP 3: NAAM POOCHNA (NAME INPUT) */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-purple-500/30 blur-xl animate-pulse" />
                  <div className="relative w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/20 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">
                    What Should MAYRA Call You?
                  </h2>
                  <p className="text-xs text-slate-300">
                    Aapko kis naam se pukarein?
                  </p>
                </div>

                {/* Name Input Box with Mic button */}
                <div className="w-full flex flex-col gap-3 pt-1">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => handleSaveName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full py-3.5 pl-4 pr-12 rounded-2xl bg-white/[0.07] border border-white/20 text-white placeholder-slate-400 text-sm font-semibold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                    <button
                      onClick={() => handleSaveName('Zafer')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                      title="Quick Fill"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <span className="text-[10px] text-slate-400 mr-1">Suggestions:</span>
                    {QUICK_NAME_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => handleSaveName(sug)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                          tempName === sug 
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' 
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  {/* Live Feedback Preview */}
                  <div className="p-3 bg-gradient-to-r from-blue-950/40 to-purple-950/40 border border-white/10 rounded-2xl text-left flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] text-slate-200 font-sans">
                      <span className="text-cyan-300 font-bold">MAYRA Voice: </span> 
                      "Bahut badhiya, <span className="text-white font-bold">{tempName || 'Zafer'}</span>! Aaj hum kya naya create karenge?"
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SAARI PERMISSIONS EK SAATH (BATCH PERMISSIONS - MANDATORY) */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center gap-3.5"
              >
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-emerald-500/30 blur-xl animate-pulse" />
                  <div className="relative w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-lg font-bold text-white">
                      Grant All Permissions
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
                      MANDATORY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Ek hi baar mein sabhi zaroori permissions grant karein
                  </p>
                </div>

                {/* Prominent One-Click Grant All Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGrantAllPermissions}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 text-white text-xs font-bold font-sans tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Grant All Essential Permissions ({grantedCount}/{permissions.length})</span>
                </motion.button>

                {allGrantedFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] font-bold text-emerald-400 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> All permissions successfully granted!
                  </motion.div>
                )}

                {/* List of Essential Permission Chips */}
                <div className="w-full grid grid-cols-2 gap-2 text-left max-h-48 overflow-y-auto pr-1">
                  
                  {/* Mic */}
                  <button
                    onClick={() => handleToggleSinglePermission('microphone')}
                    className="p-2.5 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Mic className="w-4 h-4 text-cyan-300 shrink-0" />
                      <div className="truncate">
                        <div className="text-[11px] font-bold text-white truncate">Microphone</div>
                        <div className="text-[8px] text-slate-400">Voice talk</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      permissions.find(p => p.id === 'microphone')?.status === 'granted'
                        ? 'bg-emerald-400 text-black'
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>

                  {/* Camera */}
                  <button
                    onClick={() => handleToggleSinglePermission('camera')}
                    className="p-2.5 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Camera className="w-4 h-4 text-purple-300 shrink-0" />
                      <div className="truncate">
                        <div className="text-[11px] font-bold text-white truncate">Camera & OCR</div>
                        <div className="text-[8px] text-slate-400">Vision & Gestures</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      permissions.find(p => p.id === 'camera')?.status === 'granted'
                        ? 'bg-emerald-400 text-black'
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>

                  {/* Display Over Apps (Overlay) */}
                  <button
                    onClick={() => handleToggleSinglePermission('overlay')}
                    className="p-2.5 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Smartphone className="w-4 h-4 text-blue-300 shrink-0" />
                      <div className="truncate">
                        <div className="text-[11px] font-bold text-white truncate">App Overlay</div>
                        <div className="text-[8px] text-slate-400">Floating Bubble</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      permissions.find(p => p.id === 'overlay')?.status === 'granted'
                        ? 'bg-emerald-400 text-black'
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>

                  {/* Notifications */}
                  <button
                    onClick={() => handleToggleSinglePermission('notification_access')}
                    className="p-2.5 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Bell className="w-4 h-4 text-amber-300 shrink-0" />
                      <div className="truncate">
                        <div className="text-[11px] font-bold text-white truncate">Notifications</div>
                        <div className="text-[8px] text-slate-400">Alerts & Calls</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      permissions.find(p => p.id === 'notification_access')?.status === 'granted'
                        ? 'bg-emerald-400 text-black'
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>

                  {/* Phone & Calls */}
                  <button
                    onClick={() => handleToggleSinglePermission('phone_calls')}
                    className="p-2.5 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PhoneCall className="w-4 h-4 text-rose-300 shrink-0" />
                      <div className="truncate">
                        <div className="text-[11px] font-bold text-white truncate">Phone & Calls</div>
                        <div className="text-[8px] text-slate-400">Calling routines</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      permissions.find(p => p.id === 'phone_calls')?.status === 'granted'
                        ? 'bg-emerald-400 text-black'
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>

                  {/* Files & Storage */}
                  <button
                    onClick={() => handleToggleSinglePermission('gallery_files')}
                    className="p-2.5 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderOpen className="w-4 h-4 text-teal-300 shrink-0" />
                      <div className="truncate">
                        <div className="text-[11px] font-bold text-white truncate">Files & Storage</div>
                        <div className="text-[8px] text-slate-400">Media analysis</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      permissions.find(p => p.id === 'gallery_files')?.status === 'granted'
                        ? 'bg-emerald-400 text-black'
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>

                </div>
              </motion.div>
            )}

            {/* STEP 5: FEATURES DIKHANA (FEATURE SHOWCASE SLIDES) */}
            {currentStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center gap-3.5"
              >
                {/* Feature Icon Hero */}
                {(() => {
                  const slide = FEATURE_SLIDES[activeFeatureIndex];
                  const IconComponent = slide.icon;
                  return (
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-tr ${slide.gradient} opacity-35 blur-xl animate-pulse`} />
                        <div className="relative w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/20 backdrop-blur-2xl flex items-center justify-center">
                          <IconComponent className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                        </div>
                        <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#050814] border border-cyan-400/40 text-[8px] font-mono text-cyan-300 font-bold tracking-wider">
                          {slide.badge}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-white">
                          {slide.title}
                        </h2>
                        <p className="text-xs font-semibold text-cyan-300">
                          {slide.subtitle}
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-xs pt-0.5">
                          {slide.desc}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Carousel Navigation Tabs */}
                <div className="grid grid-cols-4 gap-1.5 w-full pt-1">
                  {FEATURE_SLIDES.map((slide, idx) => (
                    <button
                      key={slide.id}
                      onClick={() => setActiveFeatureIndex(idx)}
                      className={`py-2 px-1 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                        activeFeatureIndex === idx
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="truncate w-full text-center">0{idx + 1}</span>
                      <span className="text-[8px] font-mono text-slate-400 truncate w-full text-center">
                        {slide.badge.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 6: THEME CHUNNA (THEME SELECTION & CELEBRATION) */}
            {currentStep === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center gap-3.5 relative"
              >
                {/* Confetti Celebration Overlay */}
                {isCelebrating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070b1e]/90 backdrop-blur-md rounded-2xl p-4"
                  >
                    <div className="relative w-20 h-20 flex items-center justify-center mb-2">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-pink-500 to-yellow-400 animate-spin blur-xl opacity-70" />
                      <div className="relative w-16 h-16 rounded-2xl bg-black/80 border border-cyan-400 flex items-center justify-center shadow-2xl">
                        <Sparkles className="w-8 h-8 text-yellow-300 animate-bounce" />
                      </div>
                    </div>
                    <h3 className="text-base font-extrabold text-white">Setup Complete! 🎉</h3>
                    <p className="text-xs text-cyan-300 font-semibold mt-1">Welcome aboard, {tempName}!</p>
                    <p className="text-[10px] text-slate-300 mt-1">Launching your personalized MAYRA assistant...</p>
                  </motion.div>
                )}

                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-pink-500/30 blur-xl animate-pulse" />
                  <div className="relative w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/20 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-pink-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">
                    Choose Theme & Style
                  </h2>
                  <p className="text-xs text-slate-300">
                    Aapka pasandeeda color palette aur visual mode
                  </p>
                </div>

                {/* Dark / Light Toggle */}
                <div className="flex items-center justify-center gap-2 p-1 bg-white/[0.06] border border-white/10 rounded-2xl w-full max-w-xs">
                  <button
                    onClick={() => handleToggleDarkMode(true)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      appearanceConfig.darkMode
                        ? 'bg-slate-900 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Dark Mode
                  </button>
                  <button
                    onClick={() => handleToggleDarkMode(false)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      !appearanceConfig.darkMode
                        ? 'bg-white text-slate-900 border border-slate-300 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Light Mode
                  </button>
                </div>

                {/* Color Swatch Grid */}
                <div className="grid grid-cols-4 gap-2 w-full pt-1">
                  {THEME_OPTIONS.map((theme) => {
                    const isSelected = (appearanceConfig.appTheme || 'cyan') === theme.id;
                    return (
                      <motion.button
                        key={theme.id}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleSelectTheme(theme.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-white/15 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-white/50'
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div 
                          className="w-6 h-6 rounded-full shadow-md flex items-center justify-center"
                          style={{ backgroundColor: theme.hex }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                        <span className="text-[9px] font-bold text-slate-200 truncate w-full text-center">
                          {theme.name.split(' ')[0]}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Bottom Action Footer Controls */}
        <div className="w-full flex flex-col gap-2 pt-3 border-t border-white/10 shrink-0">
          
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="py-3 px-4 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                title="Previous Step"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleNext}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white text-xs font-bold font-sans tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(6,182,212,0.4)] transition-all"
            >
              <span>
                {currentStep === totalSteps
                  ? `Finish & Launch MAYRA, ${tempName || 'Zafer'}`
                  : currentStep === 4
                  ? 'Continue to Features'
                  : 'Continue'}
              </span>
              {currentStep === totalSteps ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </motion.button>
          </div>

          {/* "Skip for now" option for non-mandatory steps */}
          {!isPermissionsMandatoryStep && currentStep < totalSteps && (
            <button
              onClick={handleSkip}
              className="py-1 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              Skip for now
            </button>
          )}

          {isPermissionsMandatoryStep && (
            <div className="text-[10px] text-emerald-400/80 text-center font-medium">
              * Permissions step is required for full device assistance
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
};
