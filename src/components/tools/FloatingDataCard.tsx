/**
 * Floating Information Summary HUD Card (Phase G)
 * 
 * Ported from fullstack-agent-main:
 * - Cybernetic glassmorphic floating HUD card with glowing status borders.
 * - Displays tool telemetry, search citations, code snapshots, and execution latency.
 * - Draggable, pinnable, copyable, and gesture dismissible (Clap / Throw / Pinch).
 * 
 * Console Verification:
 * `[DataCard] Floating HUD Card mounted -> Target payload rendered`
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, Code, Database, Terminal, Pin, X, Copy, Check, 
  ExternalLink, Sparkles, Activity, ShieldCheck, Maximize2, Minimize2 
} from 'lucide-react';
import { FloatingCardPayload } from '../../services/tools/types';
import { ToolEventBus, EVENT_DISMISS_FLOATING_CARD } from '../../services/tools/toolEventBus';
import { GestureEventBus } from '../../services/gestures/gestureEventBus';

interface FloatingDataCardProps {
  card: FloatingCardPayload;
  onDismiss?: (cardId: string) => void;
  index?: number;
}

export const FloatingDataCard: React.FC<FloatingDataCardProps> = ({ card, onDismiss, index = 0 }) => {
  const [isPinned, setIsPinned] = useState(card.isPinned || false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({
    x: card.position?.x ?? (20 + (index % 3) * 24),
    y: card.position?.y ?? (80 + (index % 4) * 28)
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  useEffect(() => {
    console.log(`[DataCard] Floating HUD Card mounted -> Target payload rendered (${card.toolType})`);

    // Listen to physical gesture clap clear to dismiss unpinned cards
    const unsubClap = GestureEventBus.getInstance().on('GESTURE_CLAP_CLEAR', () => {
      if (!isPinned) {
        handleDismiss();
      }
    });

    return () => {
      unsubClap();
    };
  }, [isPinned]);

  const handleDismiss = () => {
    ToolEventBus.getInstance().emit(EVENT_DISMISS_FLOATING_CARD, { cardId: card.id });
    if (onDismiss) {
      onDismiss(card.id);
    }
  };

  const handleCopy = () => {
    const textToCopy = card.codeSnippet?.code || JSON.stringify(card.rawJson || card, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 360, dragStartRef.current.posX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 200, dragStartRef.current.posY + dy))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const getBadgeStyle = () => {
    switch (card.toolType) {
      case 'WEB SEARCH RESULTS':
        return {
          icon: <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />,
          badgeBg: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
          glow: 'shadow-[0_0_25px_rgba(6,182,212,0.25)] border-cyan-500/30'
        };
      case 'CODE INTEL':
        return {
          icon: <Code className="w-3.5 h-3.5 text-purple-400" />,
          badgeBg: 'bg-purple-950/70 border-purple-500/40 text-purple-300',
          glow: 'shadow-[0_0_25px_rgba(168,85,247,0.25)] border-purple-500/30'
        };
      case 'MEMORY VAULT INTEL':
        return {
          icon: <Database className="w-3.5 h-3.5 text-emerald-400" />,
          badgeBg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          glow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)] border-emerald-500/30'
        };
      case 'TERMINAL OUTPUT':
      default:
        return {
          icon: <Terminal className="w-3.5 h-3.5 text-amber-400" />,
          badgeBg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
          glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)] border-amber-500/30'
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isPinned ? 50 : 40,
        width: isExpanded ? '460px' : '360px',
        maxWidth: '92vw'
      }}
      className={`rounded-2xl bg-[#08080f]/95 backdrop-blur-xl border ${style.glow} transition-all duration-200 select-none overflow-hidden`}
    >
      {/* Header / Drag Bar */}
      <div 
        onMouseDown={handleMouseDown}
        className="px-3.5 py-2.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between cursor-move"
      >
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 ${style.badgeBg}`}>
            {style.icon}
            [{card.toolType}]
          </span>
          {card.metrics?.latencyMs !== undefined && (
            <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
              <Activity className="w-2.5 h-2.5 text-cyan-400" />
              {card.metrics.latencyMs}ms
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Pin Button */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`p-1 rounded-lg transition-colors ${
              isPinned ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title={isPinned ? 'Pinned (protected from clear)' : 'Pin to Workspace'}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'rotate-45 fill-cyan-300' : ''}`} />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Copy Payload"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Dismiss Card (or Gesture Clap)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3.5 space-y-2.5 max-h-[360px] overflow-y-auto font-sans text-xs">
        {/* Title & Query */}
        <div>
          <h4 className="text-white font-bold font-mono text-xs leading-tight mb-1">
            {card.title}
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {card.summary}
          </p>
        </div>

        {/* Key Takeaways */}
        {card.keyPoints && card.keyPoints.length > 0 && (
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            {card.keyPoints.map((point, idx) => (
              <p key={idx} className="text-[10px] text-slate-300 font-mono leading-tight">
                {point}
              </p>
            ))}
          </div>
        )}

        {/* Code Snippet */}
        {card.codeSnippet && (
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/60 font-mono">
            {card.codeSnippet.filename && (
              <div className="px-2.5 py-1 bg-white/[0.04] border-b border-white/5 text-[9px] text-slate-400 flex items-center justify-between">
                <span>{card.codeSnippet.filename}</span>
                <span className="text-[8px] uppercase text-cyan-400">{card.codeSnippet.language}</span>
              </div>
            )}
            <pre className="p-2.5 text-[10px] text-cyan-300/90 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              <code>{card.codeSnippet.code}</code>
            </pre>
          </div>
        )}

        {/* Metrics Footer */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-slate-500">
          <span>Source: {card.metrics?.source || 'Autonomous Engine'}</span>
          <span className="text-slate-400">{new Date(card.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};
