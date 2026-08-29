/**
 * Barehands Virtual Workspace & Interactive Stage Canvas (Phase H)
 * 
 * Ported from barehands-main: stage.html & server.py
 * 
 * Features:
 * - 60 FPS Hardware-Accelerated Kinetic Canvas
 * - Real-time MediaPipe Hand Gesture grabbing, inertia throw, two-hand bimanual zoom, clap-clear & fist-freeze.
 * - Particle physics effects canvas overlay.
 * - Translucent Spatial Toolbar (+ Note, + Code Terminal, Auto-Arrange Grid, Reset Canvas, Fist Lock).
 * 
 * Console Verification Outputs:
 * `[StageCanvas] Canvas initialized -> 60 FPS Kinetic Engine Active`
 * `[StagePhysics] Grab detected -> Card bound to Hand Landmark 8`
 * `[StagePhysics] Throw executed -> Decay active (V: x, y)`
 * `[StageCanvas] Workspace cleared via Clap`
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Grid, Plus, Terminal, FileText, RotateCcw, 
  Lock, Unlock, Eye, EyeOff, Activity, Hand, Move, Layers 
} from 'lucide-react';
import { SpatialCard, StageParticle, StageCanvasConfig } from '../../services/stage/types';
import { StagePhysicsEngine } from '../../services/stage/stagePhysicsEngine';
import { StageStateManager } from '../../services/stage/stageStateManager';
import { SpatialCardNode } from './SpatialCardNode';
import { BarehandsTracker } from '../../services/gestures/barehandsTracker';
import { BarehandsGestureState } from '../../types/gestures';

export const BarehandsStageCanvas: React.FC = () => {
  const [cards, setCards] = useState<SpatialCard[]>([]);
  const [config, setConfig] = useState<StageCanvasConfig>({
    isOpen: true,
    gravity: 0,
    friction: 0.92,
    throwVelocityThreshold: 1.2,
    isFrozen: false,
    showGrid: true,
    enableSoundEffects: true
  });
  const [handState, setHandState] = useState<BarehandsGestureState | null>(null);

  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const physics = StagePhysicsEngine.getInstance();
  const stateManager = StageStateManager.getInstance();

  useEffect(() => {
    // 1. Initialize Stage State & 60 FPS Physics Engine
    stateManager.initializeWorkspace();
    physics.start();

    // 2. Subscribe to Cards & Config State
    const unsubCards = physics.subscribeCards((updatedCards) => {
      setCards([...updatedCards]);
    });

    const unsubConfig = physics.subscribeConfig((updatedConfig) => {
      setConfig({ ...updatedConfig });
    });

    // 3. Subscribe to Hand Tracker telemetry for cursor overlay
    const tracker = BarehandsTracker.getInstance();
    const unsubTracker = tracker.subscribe((state) => {
      setHandState({ ...state });
    });

    // 4. Start Particle Canvas Animation Frame Loop
    let particleAnimId: number;
    const renderParticles = () => {
      const canvas = particleCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const particles = physics.getParticles();

          particles.forEach((p) => {
            ctx.save();
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }
      }
      particleAnimId = requestAnimationFrame(renderParticles);
    };

    particleAnimId = requestAnimationFrame(renderParticles);

    // Resize handler for canvas
    const handleResize = () => {
      if (particleCanvasRef.current) {
        particleCanvasRef.current.width = window.innerWidth;
        particleCanvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      unsubCards();
      unsubConfig();
      unsubTracker();
      cancelAnimationFrame(particleAnimId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!config.isOpen) {
    return (
      <button
        onClick={() => physics.setConfig({ isOpen: true })}
        className="fixed bottom-24 right-6 z-40 px-3.5 py-2 rounded-xl bg-[#090b14]/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:scale-105 transition-all"
        title="Open Barehands Stage Workspace"
      >
        <Layers className="w-4 h-4 text-cyan-400" />
        <span>WORKSPACE STAGE</span>
      </button>
    );
  }

  const handleCardUpdate = (updatedCard: SpatialCard) => {
    const list = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    physics.setCards(list);
    stateManager.saveState();
  };

  const handleRemoveCard = (id: string) => {
    physics.removeCard(id);
    stateManager.saveState();
  };

  const toggleFreeze = () => {
    if (config.isFrozen) {
      physics.unfreezeWorkspace();
    } else {
      physics.freezeWorkspace();
    }
  };

  // Get primary hand landmark screen coords for visual pointer indicator
  const primaryHand = handState?.hands?.[0];
  const indexTip = primaryHand?.landmarks?.[8] || primaryHand?.indexTip;
  const isPinching = primaryHand?.isPinching || false;
  const handScreenPos = indexTip
    ? {
        x: (1 - indexTip.x) * (typeof window !== 'undefined' ? window.innerWidth : 1280),
        y: indexTip.y * (typeof window !== 'undefined' ? window.innerHeight : 800)
      }
    : null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {/* 1. Spatial Cybernetic Grid Background */}
      {config.showGrid && (
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      )}

      {/* 2. Hardware-Accelerated Particle Canvas Layer */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 3. Floating Spatial Card Nodes */}
      <div className="absolute inset-0 pointer-events-auto">
        {cards.map((card) => (
          <SpatialCardNode
            key={card.id}
            card={card}
            onRemove={handleRemoveCard}
            onUpdate={handleCardUpdate}
          />
        ))}
      </div>

      {/* 4. Real-time Hand Landmark Pointer Overlay */}
      {handScreenPos && handState?.isActive && (
        <div
          style={{
            position: 'absolute',
            left: `${handScreenPos.x}px`,
            top: `${handScreenPos.y}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 150
          }}
          className="flex items-center justify-center transition-transform duration-75"
        >
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isPinching
                ? 'border-cyan-400 bg-cyan-500/40 shadow-[0_0_20px_#22d3ee] scale-125'
                : 'border-white/50 bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isPinching ? 'bg-white' : 'bg-cyan-400'}`} />
          </div>
          {isPinching && (
            <span className="absolute -top-5 text-[9px] font-mono font-bold text-cyan-300 bg-black/80 px-1.5 py-0.5 rounded border border-cyan-500/40 whitespace-nowrap">
              PINCH GRAB
            </span>
          )}
        </div>
      )}

      {/* 5. Translucent Floating Spatial Workspace Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto z-50 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#080912]/85 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(0,0,0,0.7)]">
        {/* Workspace Title & Indicator */}
        <div className="flex items-center gap-2 pr-2.5 border-r border-white/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" />
          <span className="text-[11px] font-mono font-bold text-white tracking-wider">
            STAGE CANVAS
          </span>
          {config.isFrozen && (
            <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> FROZEN
            </span>
          )}
        </div>

        {/* Action: Add Note */}
        <button
          onClick={() => stateManager.spawnNoteCard()}
          className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold flex items-center gap-1.5 transition-colors"
          title="Add Markdown Note"
        >
          <FileText className="w-3 h-3 text-purple-400" />
          <span>+ Note</span>
        </button>

        {/* Action: Spawn Code Runner */}
        <button
          onClick={() => stateManager.spawnCodeCard()}
          className="px-2.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1.5 transition-colors"
          title="Spawn Code Terminal"
        >
          <Terminal className="w-3 h-3 text-cyan-400" />
          <span>+ Code</span>
        </button>

        {/* Action: Auto-Arrange Grid */}
        <button
          onClick={() => stateManager.autoArrangeGrid()}
          className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] font-mono font-bold flex items-center gap-1.5 transition-colors"
          title="Auto-Arrange Bento Grid"
        >
          <Grid className="w-3 h-3 text-cyan-400" />
          <span>Arrange</span>
        </button>

        {/* Action: Freeze / Fist Lock */}
        <button
          onClick={toggleFreeze}
          className={`p-1.5 rounded-xl border transition-colors ${
            config.isFrozen
              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
              : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10'
          }`}
          title={config.isFrozen ? 'Unfreeze Motion' : 'Fist Hold Freeze'}
        >
          {config.isFrozen ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        {/* Action: Reset Canvas */}
        <button
          onClick={() => stateManager.resetWorkspace()}
          className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-950/30 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 transition-colors"
          title="Reset Workspace (or Gesture Clap)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Action: Minimize Stage */}
        <button
          onClick={() => physics.setConfig({ isOpen: false })}
          className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
          title="Minimize Workspace"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
