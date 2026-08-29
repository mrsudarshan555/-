/**
 * Spatial Card Node (Phase H)
 * 
 * Hardware-Accelerated 3D Transformed Card Component
 * - Supports Code Snippets with Live Run, Markdown Notes, and Memory Vault Views.
 * - Hardware CSS transforms: `translate3d(x, y, 0) scale(s) rotate(deg)`
 * - Zero layout thrashing via inline transform updates & will-change optimizations.
 */

import React, { useState, useRef } from 'react';
import { 
  Pin, X, Copy, Check, Play, Terminal, FileText, 
  Sparkles, Move, Maximize2, Minimize2, Activity, Zap 
} from 'lucide-react';
import { SpatialCard } from '../../services/stage/types';
import { StagePhysicsEngine } from '../../services/stage/stagePhysicsEngine';

interface SpatialCardNodeProps {
  card: SpatialCard;
  onRemove: (id: string) => void;
  onUpdate: (card: SpatialCard) => void;
}

export const SpatialCardNode: React.FC<SpatialCardNodeProps> = ({ card, onRemove, onUpdate }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  const physics = StagePhysicsEngine.getInstance();

  // Color styling based on theme
  const getThemeStyles = () => {
    switch (card.type) {
      case 'code_snippet':
        return {
          border: 'border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]',
          badgeBg: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300',
          icon: <Terminal className="w-3.5 h-3.5 text-cyan-400" />,
          tag: 'CODE SNIPPET'
        };
      case 'markdown_note':
        return {
          border: 'border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.25)]',
          badgeBg: 'bg-purple-950/80 border-purple-500/40 text-purple-300',
          icon: <FileText className="w-3.5 h-3.5 text-purple-400" />,
          tag: 'MARKDOWN NOTE'
        };
      default:
        return {
          border: 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.25)]',
          badgeBg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
          tag: 'SPATIAL NODE'
        };
    }
  };

  const theme = getThemeStyles();

  // Mouse / Touch Drag Fallback for Desktop & Touch Devices
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, pre, input, textarea')) return;
    
    card.isGrabbed = true;
    card.velocity = { vx: 0, vy: 0 };
    card.isSliding = false;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPosX = card.position.x;
    const initialPosY = card.position.y;
    let lastX = startX;
    let lastY = startY;
    let lastTime = performance.now();
    let computedVx = 0;
    let computedVy = 0;

    const onMouseMove = (ev: MouseEvent) => {
      const now = performance.now();
      const dt = now - lastTime || 1;
      card.position.x = initialPosX + (ev.clientX - startX);
      card.position.y = initialPosY + (ev.clientY - startY);

      computedVx = ((ev.clientX - lastX) / dt) * 16;
      computedVy = ((ev.clientY - lastY) / dt) * 16;

      lastX = ev.clientX;
      lastY = ev.clientY;
      lastTime = now;
    };

    const onMouseUp = () => {
      card.isGrabbed = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const speed = Math.hypot(computedVx, computedVy);
      if (speed > 1.2) {
        card.velocity = { vx: computedVx, vy: computedVy };
        card.isSliding = true;
        console.log(`[StagePhysics] Throw executed -> Decay active (V: ${computedVx.toFixed(2)}, ${computedVy.toFixed(2)})`);
        physics.spawnParticleBurst(card.position.x + card.width / 2, card.position.y + card.height / 2, '#38bdf8', 12);
      }
      onUpdate({ ...card });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleCopy = () => {
    const text = card.codeSnippet?.code || card.content;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleRunCode = () => {
    if (!card.codeSnippet?.code) return;
    setIsRunningCode(true);
    try {
      const sandbox = {
        Math,
        Date,
        JSON,
        Array,
        Object,
        Number,
        String,
        RegExp,
        console: {
          log: (...args: any[]) => args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        }
      };
      const fn = new Function(...Object.keys(sandbox), `"use strict"; return (${card.codeSnippet.code});`);
      const res = fn(...Object.values(sandbox));
      setTerminalOutput(typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res));
      physics.spawnParticleBurst(card.position.x + card.width / 2, card.position.y + card.height / 2, '#10b981', 10);
    } catch (err: any) {
      setTerminalOutput(`Error: ${err.message || 'Execution failed'}`);
      physics.spawnParticleBurst(card.position.x + card.width / 2, card.position.y + card.height / 2, '#f43f5e', 10);
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleTogglePin = () => {
    card.isPinned = !card.isPinned;
    onUpdate({ ...card });
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: `${card.width}px`,
        transform: `translate3d(${card.position.x}px, ${card.position.y}px, 0px) scale(${card.scale}) rotate(${card.rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: card.isGrabbed ? 100 : (card.isPinned ? 50 : 20),
        willChange: 'transform',
        touchAction: 'none'
      }}
      className={`rounded-2xl bg-[#090b14]/95 backdrop-blur-xl border ${theme.border} transition-[border-color,box-shadow] select-none overflow-hidden ${
        card.isGrabbed ? 'ring-2 ring-cyan-400/80 shadow-[0_0_45px_rgba(6,182,212,0.4)]' : ''
      }`}
    >
      {/* Header / Grab Bar */}
      <div className="px-3.5 py-2.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 ${theme.badgeBg}`}>
            {theme.icon}
            [{theme.tag}]
          </span>
          {card.isSliding && (
            <span className="text-[9px] font-mono text-cyan-400 animate-pulse flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              SLIDE
            </span>
          )}
        </div>

        {/* Card Controls */}
        <div className="flex items-center gap-1">
          {/* Pin Button */}
          <button
            onClick={handleTogglePin}
            className={`p-1 rounded-lg transition-colors ${
              card.isPinned ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title={card.isPinned ? 'Pinned (protected from clear)' : 'Pin Card'}
          >
            <Pin className={`w-3.5 h-3.5 ${card.isPinned ? 'rotate-45 fill-cyan-300' : ''}`} />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Copy Content"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Close Button */}
          <button
            onClick={() => onRemove(card.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Close Node"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3.5 space-y-2.5 font-sans text-xs max-h-[340px] overflow-y-auto">
        {/* Title */}
        <h4 className="text-white font-bold font-mono text-xs leading-tight">
          {card.title}
        </h4>

        {/* Note Text Content */}
        {card.content && (
          <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
            {card.content}
          </p>
        )}

        {/* Code Block Snippet */}
        {card.codeSnippet && (
          <div className="space-y-2">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-black/70 font-mono">
              <div className="px-2.5 py-1 bg-white/[0.04] border-b border-white/5 text-[9px] text-slate-400 flex items-center justify-between">
                <span>{card.codeSnippet.filename || 'snippet.ts'}</span>
                <span className="text-[8px] uppercase text-cyan-400">{card.codeSnippet.language}</span>
              </div>
              <pre className="p-2.5 text-[10px] text-cyan-300/90 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                <code>{card.codeSnippet.code}</code>
              </pre>
            </div>

            {/* Run Button for Code Snippets */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-500/40 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3 h-3 fill-cyan-300" />
                {isRunningCode ? 'EVALUATING...' : 'EXECUTE RUNNER'}
              </button>

              {terminalOutput && (
                <button
                  onClick={() => setTerminalOutput(null)}
                  className="text-[9px] text-slate-500 hover:text-slate-300 font-mono"
                >
                  Clear Output
                </button>
              )}
            </div>

            {/* Terminal Output Tray */}
            {terminalOutput && (
              <div className="p-2 rounded-xl bg-black/80 border border-emerald-500/30 font-mono text-[10px] text-emerald-400 space-y-1">
                <div className="text-[8px] text-slate-500 uppercase tracking-widest">OUTPUT:</div>
                <div className="whitespace-pre-wrap">{terminalOutput}</div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-slate-500">
          <span>Scale: {card.scale.toFixed(2)}x</span>
          <span>{new Date(card.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};
