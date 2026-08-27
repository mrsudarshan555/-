import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface SuccessConfettiToastProps {
  message: string | null;
  onClose?: () => void;
  variant?: 'success' | 'magic' | 'warning';
}

export const SuccessConfettiToast: React.FC<SuccessConfettiToastProps> = ({
  message,
  onClose,
  variant = 'success'
}) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9990] pointer-events-auto select-none"
        >
          <div className="relative flex items-center gap-2.5 px-4 py-2.5 bg-[#0A1028]/95 backdrop-blur-2xl border border-cyan-400/40 rounded-2xl shadow-[0_8px_32px_rgba(6,182,212,0.35),0_0_12px_rgba(6,182,212,0.2)] text-white text-xs font-sans">
            
            {/* Animated Particle Sparkles */}
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="p-1 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>

            {/* Checkmark Icon with pop animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1, stiffness: 500 }}
              className="text-emerald-400 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
            </motion.div>

            <span className="font-semibold text-slate-100 tracking-wide pr-1">
              {message}
            </span>

            {/* Micro Sparkle Dots */}
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-300 animate-ping opacity-75" />
            <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-purple-400 animate-pulse opacity-75" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
