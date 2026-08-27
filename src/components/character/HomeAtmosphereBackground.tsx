import React, { useEffect, useRef } from 'react';
import { AssistantStatus, AppearanceConfig } from '../../types';

interface HomeAtmosphereBackgroundProps {
  status: AssistantStatus;
  appearanceConfig?: AppearanceConfig;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  phase: number;
  phaseSpeed: number;
  colorType: 'cyan' | 'blue' | 'purple' | 'white';
}

export const HomeAtmosphereBackground: React.FC<HomeAtmosphereBackgroundProps> = ({
  status,
  appearanceConfig
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Status-based glow intensity multiplier
  const isSpeaking = status === 'SPEAKING';
  const isListening = status === 'LISTENING';
  const isThinking = status === 'THINKING';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate ambient drifting particles - subtle & delicate
    const particleCount = 22;
    const particles: Particle[] = [];
    const colorTypes: ('cyan' | 'blue' | 'purple' | 'white')[] = ['cyan', 'cyan', 'blue', 'purple', 'white'];

    for (let i = 0; i < particleCount; i++) {
      const radius = 0.8 + Math.random() * 2.0;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        baseRadius: radius,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.15 + Math.random() * 0.35), // Slow gentle upward drift
        alpha: 0.08 + Math.random() * 0.28,
        baseAlpha: 0.1 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.012 + Math.random() * 0.02,
        colorType: colorTypes[Math.floor(Math.random() * colorTypes.length)]
      });
    }

    const getColorString = (type: string, a: number) => {
      switch (type) {
        case 'cyan':
          return `rgba(6, 182, 212, ${a})`;
        case 'blue':
          return `rgba(59, 130, 246, ${a})`;
        case 'purple':
          return `rgba(168, 85, 247, ${a})`;
        case 'white':
        default:
          return `rgba(224, 242, 254, ${a})`;
      }
    };

    let tick = 0;

    const render = () => {
      tick += 1;
      ctx.clearRect(0, 0, width, height);

      // Draw each drifting particle with a delicate glow bloom
      particles.forEach((p) => {
        p.phase += p.phaseSpeed;
        p.x += p.vx + Math.sin(p.phase) * 0.25;
        p.y += p.vy;

        // Wrap around top/bottom edges
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Pulsing twinkle
        const pulse = Math.sin(p.phase);
        const currentAlpha = Math.max(0.03, Math.min(0.55, p.baseAlpha + pulse * 0.15));
        const currentRadius = p.baseRadius * (1 + pulse * 0.15);

        // Soft glow halo around larger particles
        if (p.baseRadius > 1.6) {
          const glowGradient = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            currentRadius * 3.0
          );
          glowGradient.addColorStop(0, getColorString(p.colorType, currentAlpha * 0.4));
          glowGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius * 3.0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Particle core
        ctx.fillStyle = getColorString(p.colorType, currentAlpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* 1. Base Deep Cosmic Nebula Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060919] via-[#040612] to-[#020308]" />

      {/* 2. Primary Glowing Radial Gradient Behind Avatar Head & Chest (Dimmed by 35-40% for subtle depth) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isSpeaking
            ? 'opacity-65 scale-105'
            : isListening
            ? 'opacity-55 animate-pulse'
            : isThinking
            ? 'opacity-50'
            : 'opacity-40'
        }`}
        style={{
          background:
            'radial-gradient(ellipse 85% 65% at 50% 40%, rgba(6, 182, 212, 0.16) 0%, rgba(37, 99, 235, 0.10) 32%, rgba(79, 70, 229, 0.05) 58%, rgba(2, 6, 23, 0) 80%)'
        }}
      />

      {/* 3. Secondary Warm Indigo & Violet Atmosphere Halo (Soft subtle depth) */}
      <div
        className="absolute inset-0 opacity-30 animate-[pulse_7s_ease-in-out_infinite]"
        style={{
          background:
            'radial-gradient(circle 380px at 50% 36%, rgba(139, 92, 246, 0.10) 0%, rgba(14, 165, 233, 0.08) 40%, transparent 75%)'
        }}
      />

      {/* 4. Subtle Volumetric God Rays & Light Shimmer from Top */}
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-[160%] h-[75%] opacity-20 blur-3xl pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.20) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 70%)'
        }}
      />

      {/* 5. Subtle Orbital Rings & Cyber Horizon Arc */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full border border-cyan-500/10 opacity-25 blur-[0.5px] pointer-events-none" />
      <div className="absolute top-[23%] left-1/2 -translate-x-1/2 w-[440px] h-[440px] rounded-full border border-blue-500/5 opacity-18 pointer-events-none" />

      {/* 6. Subtle Floor Reflection Glow (Platform Ambience) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 opacity-22 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% 100%, rgba(6, 182, 212, 0.10) 0%, rgba(30, 58, 138, 0.06) 45%, transparent 80%)'
        }}
      />

      {/* 7. Animated 2D Floating Ambient Dust / Micro-Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-55" />
    </div>
  );
};
