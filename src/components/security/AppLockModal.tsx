import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Fingerprint, Delete, ShieldCheck, Sparkles, Check, KeyRound } from 'lucide-react';
import { MayraLogo } from '../common/MayraLogo';

interface AppLockModalProps {
  isOpen: boolean;
  onVerifyPin: (pin: string) => boolean;
  onVerifyBiometric: () => Promise<boolean>;
  pinLength?: number;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({
  isOpen,
  onVerifyPin,
  onVerifyBiometric,
  pinLength = 4
}) => {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setIsError(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleKeyPress = (num: string) => {
    if (pin.length < pinLength && !isSuccess) {
      const nextPin = pin + num;
      setPin(nextPin);
      setIsError(false);

      if (nextPin.length === pinLength) {
        // Auto check PIN on 4th digit
        setTimeout(() => {
          const success = onVerifyPin(nextPin);
          if (success) {
            setIsSuccess(true);
          } else {
            setIsError(true);
            setTimeout(() => {
              setPin('');
            }, 600);
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !isSuccess) {
      setPin(prev => prev.slice(0, -1));
      setIsError(false);
    }
  };

  const handleBiometric = async () => {
    if (isBiometricScanning || isSuccess) return;
    setIsBiometricScanning(true);
    try {
      const success = await onVerifyBiometric();
      if (success) {
        setIsSuccess(true);
      }
    } finally {
      setIsBiometricScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#070914] text-white select-none"
      >
        {/* Ambient Security Glow */}
        <div className="absolute w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-xs flex flex-col items-center px-6 py-8 space-y-6">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <MayraLogo size={52} showGlow={true} variant="raw" />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-cyan-500/20 border border-cyan-400/60 text-cyan-300">
                <Lock className="w-3 h-3 stroke-[2]" />
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-base font-bold font-sans text-white tracking-wide">
                MAYRA Security Lock
              </h2>
              <p className="text-[11px] font-sans text-slate-400">
                Enter your 4-digit PIN or use Biometric
              </p>
            </div>
          </div>

          {/* PIN Dot Indicators with Shake on Error */}
          <motion.div
            animate={isError ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3.5"
          >
            {Array.from({ length: pinLength }).map((_, idx) => {
              const isFilled = idx < pin.length;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    isSuccess
                      ? 'bg-emerald-400 shadow-md shadow-emerald-400/50 scale-110'
                      : isError
                      ? 'bg-rose-500 shadow-md shadow-rose-500/50 scale-105'
                      : isFilled
                      ? 'bg-cyan-400 shadow-md shadow-cyan-400/50 scale-110'
                      : 'border-2 border-slate-600 bg-white/5'
                  }`}
                />
              );
            })}
          </motion.div>

          {/* Keypad Grid (3x4) */}
          <div className="w-full grid grid-cols-3 gap-3 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <motion.button
                key={num}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleKeyPress(num)}
                className="h-14 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-cyan-500/20 border border-white/10 flex items-center justify-center text-lg font-bold font-mono text-white transition-all shadow-sm cursor-pointer"
              >
                {num}
              </motion.button>
            ))}

            {/* Bottom Row: Biometric Scan, 0, Backspace */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleBiometric}
              className={`h-14 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
                isBiometricScanning
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 animate-pulse'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-cyan-400'
              }`}
              title="Unlock with Fingerprint"
            >
              <Fingerprint className="w-6 h-6 stroke-[1.8]" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => handleKeyPress('0')}
              className="h-14 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-cyan-500/20 border border-white/10 flex items-center justify-center text-lg font-bold font-mono text-white transition-all shadow-sm cursor-pointer"
            >
              0
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleDelete}
              className="h-14 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-rose-500/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer"
              title="Delete"
            >
              <Delete className="w-5 h-5 stroke-[1.8]" />
            </motion.button>
          </div>

          {/* Quick Helper for Test PIN */}
          <div className="text-[10px] font-mono text-slate-300 text-center flex items-center justify-center gap-1">
            <KeyRound className="w-3 h-3 text-slate-400 stroke-[1.8]" />
            <span>Default Test PIN: <strong>1234</strong></span>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
