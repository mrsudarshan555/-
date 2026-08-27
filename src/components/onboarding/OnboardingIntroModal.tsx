import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Hand, Mic, Camera, Shield, 
  ArrowRight, Check, Bot, Zap, Volume2, Globe, Heart
} from 'lucide-react';
import { MayraLogo } from '../common/MayraLogo';

interface OnboardingIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to MAYRA',
    subtitle: 'Your next-generation Autonomous 3D AI Assistant',
    description: 'A deeply personal AI companion featuring 3D holographic presence, real-time voice, vision analysis, and contextual memory.',
    icon: Sparkles,
    badge: 'HOLOGRAPHIC AI',
    color: 'from-cyan-500 to-blue-600',
    glow: 'rgba(6,182,212,0.4)'
  },
  {
    title: 'Touchless Hand Gestures',
    subtitle: 'Control with natural hand movements',
    description: 'Use Barehands camera tracking to rotate the 3D model, scroll feeds with swipe up, and double-tap your fingers to click without touching the screen.',
    icon: Hand,
    badge: 'VISION GESTURES',
    color: 'from-purple-500 to-indigo-600',
    glow: 'rgba(168,85,247,0.4)'
  },
  {
    title: 'Vision Scanner & Live OCR',
    subtitle: 'See and understand the world instantly',
    description: 'Scan documents, translate foreign languages, recognize objects, and extract tables with sub-second neural inference.',
    icon: Camera,
    badge: 'MULTIMODAL VISION',
    color: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.4)'
  },
  {
    title: 'Persistent Memory Vault',
    subtitle: 'Remembers what matters to you',
    description: 'All your personal preferences, family contacts, and custom routines are securely indexed with vector hybrid ranking.',
    icon: Shield,
    badge: 'LOCAL PRIVACY',
    color: 'from-pink-500 to-rose-600',
    glow: 'rgba(236,72,153,0.4)'
  }
];

export const OnboardingIntroModal: React.FC<OnboardingIntroModalProps> = ({
  isOpen,
  onClose,
  userName = 'Zafer'
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const stepData = ONBOARDING_STEPS[currentStep];
  const StepIcon = stepData.icon;
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mayra_onboarding_completed', 'true');
      }
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#050814]/90 backdrop-blur-3xl select-none">
      
      {/* Background Animated Ambient Gradient Beams */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-cyan-600/15 blur-[80px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-purple-600/15 blur-[80px]"
        />
      </div>

      {/* Main Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-sm bg-[#090D22]/95 border border-white/15 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] flex flex-col items-center text-center gap-5 z-10"
      >
        {/* Top Header & Step Indicators */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MayraLogo size={24} showGlow={false} />
            <span className="font-bold text-xs text-white tracking-wider font-sans">
              MAYRA AI
            </span>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-5 bg-cyan-400' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Animated Step Feature Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            {/* Holographic Glowing Icon Frame */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div 
                className={`absolute inset-0 rounded-2xl bg-gradient-to-tr ${stepData.color} opacity-30 blur-xl animate-pulse`} 
              />
              <div className="relative w-16 h-16 rounded-2xl bg-white/[0.07] border border-white/20 backdrop-blur-2xl flex items-center justify-center shadow-lg">
                <StepIcon className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
              </div>
              <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#050814] border border-cyan-400/40 text-[8px] font-mono text-cyan-300 font-bold tracking-widest shadow-md">
                {stepData.badge}
              </span>
            </div>

            {/* Texts */}
            <div className="space-y-1.5 mt-2">
              <h2 className="text-lg font-bold text-white font-sans tracking-wide">
                {stepData.title}
              </h2>
              <p className="text-xs font-semibold text-cyan-300 font-sans">
                {stepData.subtitle}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-xs pt-1">
                {stepData.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action Controls */}
        <div className="w-full flex flex-col gap-2 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleNext}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white text-xs font-bold font-sans tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(6,182,212,0.4)] transition-all"
          >
            <span>{isLast ? `Start Exploring, ${userName}` : 'Continue'}</span>
            {isLast ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </motion.button>

          {!isLast && (
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('mayra_onboarding_completed', 'true');
                }
                onClose();
              }}
              className="py-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              Skip Introduction
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
};
