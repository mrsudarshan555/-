import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RouterStateBus, EVENT_GLITCH_CIPHER, GlitchCipherPayload } from '../../services/router/routerStateBus';
import { Cpu, Terminal, Sparkles, ShieldAlert, Zap } from 'lucide-react';

export const CipherGlitchOverlay: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [cipherText, setCipherText] = useState('DECODING NEURAL MATRIX...');
  const [scrambleChars, setScrambleChars] = useState('');

  useEffect(() => {
    const unsubscribe = RouterStateBus.subscribe<GlitchCipherPayload>(EVENT_GLITCH_CIPHER, (payload) => {
      if (payload.active) {
        setIsActive(true);
        if (payload.cipherText) {
          setCipherText(payload.cipherText);
        }
        
        // Auto dismiss after duration
        setTimeout(() => {
          setIsActive(false);
        }, payload.durationMs || 800);
      } else {
        setIsActive(false);
      }
    });

    return unsubscribe;
  }, []);

  // Scramble effect
  useEffect(() => {
    if (!isActive) return;

    const chars = '01#%@$&*~<>[]{}!=+/\\⚡';
    const interval = setInterval(() => {
      let str = '';
      for (let i = 0; i < 28; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
      }
      setScrambleChars(str);
    }, 45);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="cipher-glitch-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-black/60 backdrop-blur-[2px] overflow-hidden select-none font-mono"
        >
          {/* Cyber Scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none" />

          {/* Central Decode Terminal HUD */}
          <motion.div
            initial={{ scale: 0.9, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            className="relative px-6 py-4 rounded-xl border border-cyan-500/40 bg-slate-950/90 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex flex-col items-center gap-3 text-center max-w-sm mx-4"
          >
            <div className="flex items-center gap-2 text-cyan-400">
              <Zap className="w-5 h-5 animate-pulse text-cyan-300" />
              <span className="text-xs tracking-widest font-bold uppercase text-cyan-300">
                Persona Handshake
              </span>
            </div>

            <div className="text-sm font-semibold text-slate-100 tracking-wide">
              {cipherText}
            </div>

            <div className="text-[11px] text-cyan-400/70 tracking-widest break-all font-mono">
              {scrambleChars || '01001001 01001110 01010100 01000101'}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-slate-400 border-t border-cyan-500/20 pt-2 w-full justify-between">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                3D Model: Locked
              </span>
              <span className="text-cyan-400 font-semibold">Router Bus Active</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
