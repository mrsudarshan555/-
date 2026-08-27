import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, MessageSquare, Brain, Compass, LucideIcon } from 'lucide-react';

interface EmptyStateIllustrationProps {
  type?: 'chat' | 'memories' | 'search' | 'generic';
  title?: string;
  subtitle?: string;
  suggestions?: string[];
  onSelectSuggestion?: (text: string) => void;
  icon?: LucideIcon;
}

export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  type = 'chat',
  title,
  subtitle,
  suggestions = [],
  onSelectSuggestion,
  icon: CustomIcon
}) => {
  const getIcon = () => {
    if (CustomIcon) return <CustomIcon className="w-8 h-8 text-cyan-400" />;
    switch (type) {
      case 'memories':
        return <Brain className="w-8 h-8 text-purple-400" />;
      case 'search':
        return <Compass className="w-8 h-8 text-amber-400" />;
      case 'chat':
      default:
        return <MessageSquare className="w-8 h-8 text-cyan-400" />;
    }
  };

  const defaultTitle = title || (
    type === 'memories'
      ? 'No Memories Logged Yet'
      : type === 'search'
      ? 'No Matches Found'
      : 'Start a Conversation with MAYRA'
  );

  const defaultSubtitle = subtitle || (
    type === 'memories'
      ? 'MAYRA automatically remembers your preferences, routines, and family contacts.'
      : type === 'search'
      ? 'Try adjusting your search terms or filters.'
      : 'Ask any question, analyze photos & documents, or speak naturally via voice.'
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto my-auto space-y-4 select-none"
    >
      {/* Animated Floating Cosmic Core */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Pulsing Galactic Ring 1 */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], rotate: 360, opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-dashed border-cyan-400/30 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-transparent"
        />

        {/* Orbiting Stardust Satellite Dot */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 flex items-start justify-center"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22D3EE] -mt-1" />
        </motion.div>

        {/* Inner Glowing Orb Icon Backdrop */}
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-950/80 via-[#0C122C] to-purple-950/80 border border-white/15 flex items-center justify-center shadow-[0_8px_32px_rgba(6,182,212,0.3)] backdrop-blur-xl"
        >
          {getIcon()}
        </motion.div>

        {/* Floating Sparkle Micro-badges */}
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-cyan-500/30 border border-cyan-400/40 text-cyan-300"
        >
          <Sparkles className="w-3 h-3" />
        </motion.div>
      </div>

      {/* Typography */}
      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-sm font-bold text-white font-sans tracking-wide">
          {defaultTitle}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          {defaultSubtitle}
        </p>
      </div>

      {/* Quick Suggestions Chips */}
      {suggestions.length > 0 && onSelectSuggestion && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          {suggestions.map((item) => (
            <motion.button
              key={item}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectSuggestion(item)}
              className="px-3 py-1.5 bg-white/[0.06] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 rounded-full text-[11px] text-slate-300 hover:text-cyan-200 transition-all font-sans"
            >
              {item}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
