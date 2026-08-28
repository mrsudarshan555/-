import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hand, MousePointer, ArrowUp, Clock, Sparkles, 
  CheckCircle2, ChevronRight, ChevronLeft, X, Eye, 
  Camera, ShieldCheck, PlayCircle
} from 'lucide-react';
import { GestureUsageService } from '../../services/gestures/gestureUsageService';

interface GestureTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPracticeMode?: () => void;
}

interface TutorialStep {
  id: string;
  title: string;
  subtitle: string;
  hindiDescription: string;
  actionBadge: string;
  icon: React.ReactNode;
  animationType: 'tap' | 'swipe' | 'hold' | 'bubble';
  tip: string;
}

export const GestureTutorialModal: React.FC<GestureTutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenPracticeMode
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const steps: TutorialStep[] = [
    {
      id: 'double-tap',
      title: 'Double-Tap / Pinch (Click)',
      subtitle: 'Synthetic Touch & Element Click',
      hindiDescription: 'Ungliyon ko camera ke samne 2 baar pinch ya tap karein. Isse screen par pointer wale element par instant "Click" trigger hoga.',
      actionBadge: 'DOUBLE-TAP → CLICK',
      icon: <MousePointer className="w-8 h-8 text-cyan-400 stroke-[1.8]" />,
      animationType: 'tap',
      tip: 'Camera se 1.5–2 feet ki doori par apna haath rakhein for highest accuracy.'
    },
    {
      id: 'swipe-up',
      title: 'Swipe Up Gesture (Scroll)',
      subtitle: 'Feed & Page Scrolling',
      hindiDescription: 'Haath ko neeche se upar ki taraf swipe karein. Isse active screen ya feed upar scroll ho jayegi bina screen ko touch kiye.',
      actionBadge: 'SWIPE UP → SCROLL',
      icon: <ArrowUp className="w-8 h-8 text-purple-400 stroke-[1.8]" />,
      animationType: 'swipe',
      tip: 'Natural aur smooth motion se swipe karein jaise haath se hawa ko upar push kar rahe hon.'
    },
    {
      id: 'hold-in-place',
      title: 'Hold Hand in Place (Long Press)',
      subtitle: 'Context Menu & Hold Action',
      hindiDescription: 'Apna haath screen ke samne 800ms tak rokkar rakhein. Ek pink charging ring complete hogi aur Long-Press / Context Menu khul jayega.',
      actionBadge: 'HOLD 800MS → LONG PRESS',
      icon: <Clock className="w-8 h-8 text-pink-400 stroke-[1.8]" />,
      animationType: 'hold',
      tip: 'Hold karte waqt ring complete hone tak haath steady rakhein.'
    },
    {
      id: 'bubble-control',
      title: 'Background Bubble & PiP Camera',
      subtitle: 'System-Wide Messenger Style Chat-Head',
      hindiDescription: 'App background mein hone par bhi yeh bubble screen par bana rehta hai. Iske upar live usage badge dikhta hai aur camera indicator track karta rehta hai.',
      actionBadge: 'PHONE-WIDE OVERLAY',
      icon: <Camera className="w-8 h-8 text-emerald-400 stroke-[1.8]" />,
      animationType: 'bubble',
      tip: 'Bubble ko drag karke screen ke kisi bhi kone par set kar sakte hain!'
    }
  ];

  const currentStep = steps[currentStepIndex];

  const handleFinish = () => {
    GestureUsageService.setGestureTutorialCompleted();
    onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleLaunchPractice = () => {
    GestureUsageService.setGestureTutorialCompleted();
    onClose();
    if (onOpenPracticeMode) {
      setTimeout(() => onOpenPracticeMode(), 150);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="mayra-gesture-tutorial-overlay"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-[#090D20] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col text-slate-200"
        >
          {/* Top Bar with Badge & Close */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40">
                <Hand className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-white tracking-wide uppercase">
                  Hand-Gesture Navigation Guide
                </span>
                <p className="text-[10px] text-cyan-300 font-sans">Touchless Phone Control Tutorial</p>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Tutorial"
            >
              <X className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>

          {/* Step Progress Indicators */}
          <div className="px-5 pt-3 flex items-center gap-1.5">
            {steps.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_#22D3EE]'
                    : idx < currentStepIndex
                    ? 'bg-cyan-800/80'
                    : 'bg-white/15'
                }`}
              />
            ))}
          </div>

          {/* Interactive Visual Stage */}
          <div className="p-5 flex flex-col items-center text-center">
            
            {/* Visual Animated Canvas Display */}
            <div className="w-full h-44 rounded-2xl bg-black/60 border border-white/10 relative overflow-hidden flex items-center justify-center mb-4 shadow-inner">
              
              {/* Background grid dots */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />

              {/* 1. Double Tap Animation */}
              {currentStep.animationType === 'tap' && (
                <div className="relative flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 0.85, 1.2, 1], y: [0, -6, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative z-10"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center shadow-[0_0_24px_rgba(6,182,212,0.7)]">
                      <MousePointer className="w-8 h-8" />
                    </div>
                  </motion.div>

                  {/* Tap ripple waves */}
                  <motion.div
                    animate={{ scale: [0.6, 2.4], opacity: [1, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute w-16 h-16 rounded-full border-2 border-cyan-400 pointer-events-none"
                  />
                  <motion.div
                    animate={{ scale: [0.6, 3.2], opacity: [0.8, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.2 }}
                    className="absolute w-16 h-16 rounded-full border border-cyan-300/60 pointer-events-none"
                  />

                  <div className="absolute bottom-2 font-mono text-[9px] text-cyan-300 bg-black/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
                    CLICK TRIGGERED (x: 180, y: 340)
                  </div>
                </div>
              )}

              {/* 2. Swipe Up Animation */}
              {currentStep.animationType === 'swipe' && (
                <div className="relative flex flex-col items-center justify-center w-full">
                  <div className="w-48 h-32 rounded-xl bg-slate-900/90 border border-purple-500/40 p-2 flex flex-col gap-1.5 overflow-hidden relative">
                    {/* Simulated feed items moving up */}
                    <motion.div
                      animate={{ y: [0, -48, -96] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="space-y-1.5"
                    >
                      <div className="h-6 rounded bg-purple-500/20 border border-purple-500/30 flex items-center px-2 text-[8px] font-mono text-purple-200">
                        Post #1: Mayra Intelligence Feed
                      </div>
                      <div className="h-6 rounded bg-purple-500/20 border border-purple-500/30 flex items-center px-2 text-[8px] font-mono text-purple-200">
                        Post #2: Kotlin 2.0 Architectural Tips
                      </div>
                      <div className="h-6 rounded bg-purple-500/20 border border-purple-500/30 flex items-center px-2 text-[8px] font-mono text-purple-200">
                        Post #3: Memory Vault Synchronized
                      </div>
                      <div className="h-6 rounded bg-purple-500/20 border border-purple-500/30 flex items-center px-2 text-[8px] font-mono text-purple-200">
                        Post #4: Hand-Gesture Touchless Engine
                      </div>
                    </motion.div>
                  </div>

                  {/* Swipe hand trail */}
                  <motion.div
                    animate={{ y: [25, -25], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute right-8 flex flex-col items-center text-purple-300 drop-shadow-[0_0_10px_#A855F7]"
                  >
                    <ArrowUp className="w-7 h-7" />
                    <span className="text-[8px] font-mono font-bold">SWIPE</span>
                  </motion.div>
                </div>
              )}

              {/* 3. Hold In Place Animation */}
              {currentStep.animationType === 'hold' && (
                <div className="relative flex flex-col items-center justify-center">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* SVG charging progress ring */}
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <motion.path
                        animate={{ strokeDasharray: ['0, 100', '100, 100'] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="text-pink-500 drop-shadow-[0_0_8px_#EC4899]"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-pink-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="mt-2 font-mono text-[9px] text-pink-300 bg-pink-950/80 px-2 py-0.5 rounded-full border border-pink-500/40">
                    HOLD 800MS → CONTEXT MENU / LONG PRESS
                  </div>
                </div>
              )}

              {/* 4. Bubble & PiP Camera Animation */}
              {currentStep.animationType === 'bubble' && (
                <div className="relative flex items-center justify-center gap-4">
                  {/* Floating Bubble Mockup */}
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative"
                  >
                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 shadow-[0_0_20px_rgba(6,182,212,0.8)] flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-[#080C1E] flex items-center justify-center">
                        <Hand className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>
                    {/* Badge */}
                    <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold border border-white">
                      12
                    </div>
                  </motion.div>

                  {/* Mini PiP Camera Preview Mockup */}
                  <div className="w-24 h-16 rounded-xl bg-slate-950 border border-emerald-500/60 p-1 flex flex-col justify-between shadow-[0_0_16px_rgba(16,185,129,0.3)]">
                    <div className="flex items-center justify-between text-[7px] font-mono text-emerald-400">
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                        LIVE PiP
                      </span>
                      <span>18 FPS</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <Camera className="w-4 h-4 text-emerald-400/80" />
                    </div>
                    <div className="text-[6px] text-center font-mono text-slate-400">
                      Background Tracking
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Title & Badge */}
            <div className="mb-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300 mb-1">
                {currentStep.actionBadge}
              </span>
              <h3 className="text-base font-bold text-white font-sans">
                {currentStep.title}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {currentStep.subtitle}
              </p>
            </div>

            {/* Hindi Explanation Text */}
            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-white/[0.03] p-2.5 rounded-xl border border-white/5 text-left mb-2">
              {currentStep.hindiDescription}
            </p>

            {/* Pro Tip */}
            <div className="w-full flex items-start gap-1.5 text-[10px] text-amber-300/90 bg-amber-950/30 border border-amber-500/30 rounded-xl p-2 text-left">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <b>Pro Tip:</b> {currentStep.tip}
              </span>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between gap-2">
            {/* Left Action: Prev or Practice */}
            <div className="flex items-center gap-1.5">
              {currentStepIndex > 0 ? (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
                >
                  Skip
                </button>
              )}

              {/* Direct Practice Button */}
              {onOpenPracticeMode && (
                <button
                  onClick={handleLaunchPractice}
                  className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-mono flex items-center gap-1 transition-all"
                  title="Practice in Sandbox"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Practice</span>
                </button>
              )}
            </div>

            {/* Right Action: Next or Get Started */}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_0_16px_rgba(6,182,212,0.4)] active:scale-95 transition-all"
            >
              <span>{currentStepIndex === steps.length - 1 ? 'Got it, Let\'s Go!' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
