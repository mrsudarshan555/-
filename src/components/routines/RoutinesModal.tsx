import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Moon, Target, HeartPulse, Sparkles, 
  X, Play, Clock, CheckCircle2, ChevronRight, Zap 
} from 'lucide-react';

export interface RoutineItem {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  description: string;
  icon: any;
  accentColor: string;
  promptToExecute: string;
}

export const PREDEFINED_ROUTINES: RoutineItem[] = [
  {
    id: 'morning_briefing',
    nameHindi: 'Subah ki dinacharya',
    nameEnglish: 'Morning Comprehensive Briefing',
    description: 'Mausam, calendar events, aur zaroori reminders ek saath batayein',
    icon: Sun,
    accentColor: 'from-amber-500 to-orange-600',
    promptToExecute: 'Subah ki dinacharya: Mujhe aaj ka mausam, calendar events, zaroori reminders aur daily inspiration ek saath batao.'
  },
  {
    id: 'evening_routine',
    nameHindi: 'Raat ka routine',
    nameEnglish: 'Night Wind-down & Recap',
    description: 'Din bhar ka summary, kal ke zaroori kaam, aur calm sleep reminder',
    icon: Moon,
    accentColor: 'from-indigo-500 to-purple-600',
    promptToExecute: 'Raat ka routine: Aaj ke tasks ka recap, kal ke first tasks aur relax karne ke tips batao.'
  },
  {
    id: 'work_focus',
    nameHindi: 'Work Focus Sprint',
    nameEnglish: 'Productivity & Focus Block',
    description: '25-minute pomodoro focus, urgent priorities aur distraction-free setup',
    icon: Target,
    accentColor: 'from-blue-500 to-cyan-600',
    promptToExecute: 'Work Focus Sprint: 25-minute focus session shuru karo aur mere top 3 priority tasks set karo.'
  },
  {
    id: 'quick_health',
    nameHindi: 'Health & Workout Check',
    nameEnglish: 'Quick Stretch & Hydration',
    description: 'Paani peene ka reminder, quick posture stretch aur step goal update',
    icon: HeartPulse,
    accentColor: 'from-emerald-500 to-teal-600',
    promptToExecute: 'Health Check: Mere hydration goals aur 2-minute posture stretch guide karo.'
  }
];

interface RoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunRoutine: (prompt: string, routineName: string) => void;
}

export const RoutinesModal: React.FC<RoutinesModalProps> = ({
  isOpen,
  onClose,
  onRunRoutine
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md select-none animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm max-h-[85vh] flex flex-col rounded-3xl bg-[#0C1021] border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-950/50"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Zap className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-sans text-white">MAYRA Quick Routines</h3>
                <p className="text-[10px] text-slate-400">One-tap predefined smart shortcuts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>

          {/* List of Routines */}
          <div className="p-3 space-y-2.5 overflow-y-auto scrollbar-thin">
            {PREDEFINED_ROUTINES.map((routine) => {
              const Icon = routine.icon;
              return (
                <motion.div
                  key={routine.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onRunRoutine(routine.promptToExecute, routine.nameHindi);
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${routine.accentColor} text-white shadow-md shrink-0`}>
                      <Icon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {routine.nameHindi}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                        {routine.description}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 group-hover:bg-cyan-500 text-slate-400 group-hover:text-white transition-all shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current stroke-none" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Helper */}
          <div className="p-2.5 bg-black/30 border-t border-white/5 text-[10px] text-slate-400 text-center font-mono">
            Tip: Aap bolkar bhi keh sakte hain: <em>"Subah ki dinacharya"</em>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
