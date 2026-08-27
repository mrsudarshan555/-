import React, { useRef, useEffect } from 'react';
import { OrbStyleType, OrbColorType, OrbTypePreset, AssistantStatus } from '../../types';

export interface OrbColorDefinition {
  id: OrbColorType;
  name: string;
  isGradient?: boolean;
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary?: string;
  palette: string[];
  glow: string;
  glowFaint: string;
  textClass: string;
  cssGradient: string;
}

export function generateCustomHueColorDef(hue: number): OrbColorDefinition {
  const h = ((Math.round(hue) % 360) + 360) % 360;
  const primary = `hsl(${h}, 95%, 55%)`;
  const secondary = `hsl(${(h + 35) % 360}, 95%, 65%)`;
  const tertiary = `hsl(${(h + 70) % 360}, 100%, 75%)`;
  const quaternary = `hsl(${(h - 35 + 360) % 360}, 90%, 55%)`;
  const glow = `hsla(${h}, 95%, 55%, 0.65)`;
  const glowFaint = `hsla(${h}, 95%, 55%, 0.2)`;
  return {
    id: 'spectrum',
    name: `Custom Hue (${h}°)`,
    isGradient: true,
    primary,
    secondary,
    tertiary,
    quaternary,
    palette: [
      primary,
      secondary,
      tertiary,
      quaternary,
      `hsl(${(h + 100) % 360}, 95%, 65%)`,
      `hsl(${(h - 60 + 360) % 360}, 90%, 50%)`
    ],
    glow,
    glowFaint,
    textClass: 'text-transparent bg-clip-text',
    cssGradient: `linear-gradient(135deg, ${primary} 0%, ${secondary} 50%, ${tertiary} 100%)`
  };
}

export const ORB_COLORS: Record<OrbColorType, OrbColorDefinition> = {
  spectrum: {
    id: 'spectrum',
    name: 'Spectrum (Aurora)',
    isGradient: true,
    primary: '#06B6D4',
    secondary: '#8B5CF6',
    tertiary: '#EC4899',
    quaternary: '#FB923C',
    palette: ['#00D2FF', '#6366F1', '#A855F7', '#EC4899', '#FB923C', '#FBBF24'],
    glow: 'rgba(168, 85, 247, 0.65)',
    glowFaint: 'rgba(6, 182, 212, 0.25)',
    textClass: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400',
    cssGradient: 'linear-gradient(135deg, #00D2FF 0%, #6366F1 25%, #A855F7 50%, #EC4899 75%, #FB923C 100%)'
  },
  cyan: {
    id: 'cyan',
    name: 'Cyan Bright',
    primary: '#06B6D4',
    secondary: '#22D3EE',
    tertiary: '#67E8F9',
    palette: ['#06B6D4', '#22D3EE', '#67E8F9', '#A5F3FC'],
    glow: 'rgba(6, 182, 212, 0.55)',
    glowFaint: 'rgba(6, 182, 212, 0.15)',
    textClass: 'text-cyan-400',
    cssGradient: 'radial-gradient(circle at 35% 35%, #67E8F9 0%, #06B6D4 70%, #083344 100%)'
  },
  blue: {
    id: 'blue',
    name: 'Royal Blue',
    primary: '#2563EB',
    secondary: '#60A5FA',
    tertiary: '#93C5FD',
    palette: ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'],
    glow: 'rgba(37, 99, 235, 0.55)',
    glowFaint: 'rgba(37, 99, 235, 0.15)',
    textClass: 'text-blue-400',
    cssGradient: 'radial-gradient(circle at 35% 35%, #93C5FD 0%, #2563EB 70%, #0F172A 100%)'
  },
  violet: {
    id: 'violet',
    name: 'Electric Violet',
    primary: '#8B5CF6',
    secondary: '#A855F7',
    tertiary: '#D8B4FE',
    palette: ['#7C3AED', '#8B5CF6', '#A855F7', '#D8B4FE'],
    glow: 'rgba(139, 92, 246, 0.55)',
    glowFaint: 'rgba(139, 92, 246, 0.15)',
    textClass: 'text-purple-400',
    cssGradient: 'radial-gradient(circle at 35% 35%, #D8B4FE 0%, #8B5CF6 70%, #1E1B4B 100%)'
  },
  orange: {
    id: 'orange',
    name: 'Sunset Orange',
    primary: '#EA580C',
    secondary: '#FB923C',
    tertiary: '#FDBA74',
    palette: ['#C2410C', '#EA580C', '#FB923C', '#FDBA74'],
    glow: 'rgba(234, 88, 12, 0.55)',
    glowFaint: 'rgba(234, 88, 12, 0.15)',
    textClass: 'text-orange-400',
    cssGradient: 'radial-gradient(circle at 35% 35%, #FDBA74 0%, #EA580C 70%, #431407 100%)'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    primary: '#059669',
    secondary: '#34D399',
    tertiary: '#6EE7B7',
    palette: ['#047857', '#059669', '#34D399', '#6EE7B7'],
    glow: 'rgba(5, 150, 105, 0.55)',
    glowFaint: 'rgba(5, 150, 105, 0.15)',
    textClass: 'text-emerald-400',
    cssGradient: 'radial-gradient(circle at 35% 35%, #6EE7B7 0%, #059669 70%, #022C22 100%)'
  },
  pink: {
    id: 'pink',
    name: 'Neon Pink',
    primary: '#DB2777',
    secondary: '#F472B6',
    tertiary: '#F9A8D4',
    palette: ['#BE185D', '#DB2777', '#F472B6', '#F9A8D4'],
    glow: 'rgba(219, 39, 119, 0.55)',
    glowFaint: 'rgba(219, 39, 119, 0.15)',
    textClass: 'text-pink-400',
    cssGradient: 'radial-gradient(circle at 35% 35%, #F9A8D4 0%, #DB2777 70%, #500724 100%)'
  },
  gold: {
    id: 'gold',
    name: 'Solar Gold',
    primary: '#D97706',
    secondary: '#FBBF24',
    tertiary: '#FDE68A',
    palette: ['#B45309', '#D97706', '#FBBF24', '#FDE68A'],
    glow: 'rgba(217, 119, 6, 0.55)',
    glowFaint: 'rgba(217, 119, 6, 0.15)',
    textClass: 'text-amber-400',
    cssGradient: 'radial-gradient(circle at 35% 35%, #FDE68A 0%, #D97706 70%, #451A03 100%)'
  }
};

export interface OrbStyleDefinition {
  id: OrbStyleType;
  name: string;
  description: string;
  category?: 'cosmic' | 'cyber' | 'fluid' | 'harmonic' | 'energy';
}

export const ORB_STYLES: OrbStyleDefinition[] = [
  {
    id: 'particle_swirl',
    name: 'Particle Swirl',
    description: 'Hundreds of cosmic particles orbiting and drifting with faint ring trails',
    category: 'cosmic'
  },
  {
    id: 'galaxy_swirl',
    name: 'Galaxy Swirl',
    description: 'Swirling cosmic nebula vortex with multi-arm stardust particles spiraling into a stellar core',
    category: 'cosmic'
  },
  {
    id: 'pulse_reactor',
    name: 'Pulse Reactor',
    description: 'Rotating hexagonal frame with status-arc segments and glowing core',
    category: 'cyber'
  },
  {
    id: 'particle_swarm',
    name: 'Particle Swarm',
    description: 'Dense cloud of micro-particles breathing in a spherical formation',
    category: 'cosmic'
  },
  {
    id: 'liquid_core',
    name: 'Liquid Core',
    description: 'Continuous morphing organic fluid blob with gradient refraction',
    category: 'fluid'
  },
  {
    id: 'grid_globe',
    name: 'Wireframe Globe',
    description: '3D rotating latitude/longitude matrix sphere with glowing nodes',
    category: 'cyber'
  },
  {
    id: 'nova_ring',
    name: 'Ring / Nova',
    description: 'Starburst singularity with thin multi-axis orbital rings and flare accents',
    category: 'cosmic'
  },
  {
    id: 'soundwave_ripple',
    name: 'Soundwave Ripple',
    description: 'Concentric acoustic resonance waves pulsating with audio spectrum',
    category: 'harmonic'
  },
  {
    id: 'cyber_matrix',
    name: 'Cyber Matrix',
    description: 'Holographic radar scanner with 360° laser sweep and telemetry data',
    category: 'cyber'
  },
  {
    id: 'quantum_helix',
    name: 'Quantum Helix',
    description: 'Intertwining 3D double helix ribbons with energetic photon nodes',
    category: 'energy'
  },
  {
    id: 'aurora_waves',
    name: 'Aurora Waves',
    description: 'Ethereal undulating luminous plasma curtains and chromatic refraction',
    category: 'fluid'
  },
  {
    id: 'polyhedron_crystal',
    name: 'Prism Crystal',
    description: 'Rotating 3D geometric gem with specular refraction vertex flares',
    category: 'energy'
  },
  {
    id: 'supernova',
    name: 'Supernova',
    description: 'Gravitational vortex drawing in stardust before coronal flare bursts',
    category: 'cosmic'
  },
  {
    id: 'neural_synapse',
    name: 'Neural Synapse',
    description: 'Bio-electric neural network firing glowing synaptic impulses',
    category: 'cyber'
  },
  {
    id: 'plasma_vortex',
    name: 'Tachyon Vortex',
    description: 'Hyper-speed relativistic light funnel spiraling into event horizon',
    category: 'energy'
  },
  {
    id: 'luminous_glow',
    name: 'Luminous Core',
    description: 'Multi-layered gyroscopic astrolabe sphere with diamond sparkle',
    category: 'harmonic'
  }
];

// Helper to normalize style id (handles legacy names)
export function normalizeOrbStyle(style?: string): OrbStyleType {
  if (!style) return 'particle_swirl';
  if (style === 'glow') return 'luminous_glow';
  if (style === 'nova') return 'nova_ring';
  if (style === 'grid') return 'grid_globe';
  if (style === 'pulse') return 'pulse_reactor';
  if (style === 'nebula') return 'particle_swirl';
  const found = ORB_STYLES.some(s => s.id === style);
  return found ? (style as OrbStyleType) : 'particle_swirl';
}

interface MayraOrbProps {
  style?: OrbStyleType | string;
  color?: OrbColorType;
  orbType?: OrbTypePreset;
  customHue?: number;
  size?: number;
  status?: AssistantStatus;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const MayraOrb: React.FC<MayraOrbProps> = ({
  style = 'particle_swirl',
  color = 'spectrum',
  orbType = 'classic',
  customHue,
  size = 64,
  status = 'READY',
  interactive = false,
  onClick,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const normalizedStyle = normalizeOrbStyle(style);
  const colorDef = (customHue !== undefined && !isNaN(customHue))
    ? generateCustomHueColorDef(customHue)
    : (ORB_COLORS[color] || ORB_COLORS.spectrum);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = performance.now();

    // Scale canvas for high-DPI displays
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const canvasWidth = size * dpr;
    const canvasHeight = size * dpr;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = (canvasWidth / 2) * 0.86;

    // Pre-initialize particles / mesh points for styles that need persistent state
    const particleCount = normalizedStyle === 'particle_swirl' ? 120 
      : normalizedStyle === 'galaxy_swirl' ? 160
      : normalizedStyle === 'particle_swarm' ? 90 
      : normalizedStyle === 'supernova' ? 80
      : normalizedStyle === 'neural_synapse' ? 24
      : normalizedStyle === 'plasma_vortex' ? 60 : 40;

    const particles = Array.from({ length: particleCount }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.95;
      const speed = (0.2 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1);
      const rad = 0.8 + Math.random() * 2.2;
      const colorIdx = i % colorDef.palette.length;
      return {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        baseAngle: angle,
        orbitRadius: dist,
        orbitSpeed: speed,
        size: rad,
        color: colorDef.palette[colorIdx],
        alpha: 0.3 + Math.random() * 0.7,
        pulseOffset: Math.random() * Math.PI * 2,
        z: (Math.random() - 0.5) * 2
      };
    });

    // Galaxy Swirl stardust spiral particles (dense purple/blue/pink/orange vortex)
    const galaxyStardust = normalizedStyle === 'galaxy_swirl'
      ? Array.from({ length: 160 }, (_, i) => {
          const armIndex = i % 3; // 3 spiral vortex arms
          const armOffset = armIndex * ((Math.PI * 2) / 3);
          const distFactor = Math.pow(Math.random(), 0.75);
          const startDist = (0.16 + distFactor * 0.78) * radius;
          const speed = 0.35 + Math.random() * 0.45;
          const rad = 0.7 + Math.random() * 2.2;
          const cosmicPalette = ['#A855F7', '#6366F1', '#00D2FF', '#EC4899', '#FB923C', '#F472B6', '#FDE68A', '#FFFFFF'];
          return {
            armOffset,
            dist: startDist,
            spiralTightness: 3.4 + (Math.random() - 0.5) * 0.6,
            speed,
            size: rad,
            color: cosmicPalette[i % cosmicPalette.length],
            alpha: 0.4 + Math.random() * 0.6,
            orbitOffset: Math.random() * Math.PI * 2,
            radialSpeed: 0.08 + Math.random() * 0.06
          };
        })
      : [];

    // Synapse Nodes
    const synapseNodes = Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * Math.PI * 2 + (Math.random() * 0.3);
      const dist = (0.25 + Math.random() * 0.65) * radius;
      return {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        color: colorDef.palette[i % colorDef.palette.length],
        pulse: Math.random() * Math.PI * 2,
        size: 2.2 + Math.random() * 1.8
      };
    });

    // 3D Continuous Volumetric Particle Cloud (450 particles across 3D sphere volume)
    const swarm3DCount = 450;
    const swarm3D = Array.from({ length: swarm3DCount }, (_, i) => {
      // Uniform volumetric 3D spherical coordinate distribution
      const u = Math.random();
      const v = Math.random();
      const w = Math.random();
      
      const theta = Math.acos(2 * u - 1); // Polar angle [0, PI]
      const phi = 2 * Math.PI * v; // Azimuthal angle [0, 2PI]
      // Cube-root distribution ensures uniform volumetric density throughout the sphere volume
      // with a soft galactic core
      const distRatio = Math.pow(w, 0.58) * 0.94 + 0.06;

      // Individual organic drift frequencies (living random walk)
      const driftSpeedX = (0.22 + Math.random() * 0.45) * (Math.random() > 0.5 ? 1 : -1);
      const driftSpeedY = (0.22 + Math.random() * 0.45) * (Math.random() > 0.5 ? 1 : -1);
      const driftSpeedZ = (0.22 + Math.random() * 0.45) * (Math.random() > 0.5 ? 1 : -1);
      const driftPhaseX = Math.random() * Math.PI * 2;
      const driftPhaseY = Math.random() * Math.PI * 2;
      const driftPhaseZ = Math.random() * Math.PI * 2;
      const driftAmp = 0.035 + Math.random() * 0.065;

      // Orbital drift around sphere axes
      const speedTheta = (0.1 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1);
      const speedPhi = (0.15 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1);
      
      const baseSize = 0.65 + Math.random() * 1.85;
      const twinkleOffset = Math.random() * Math.PI * 2;
      const twinkleSpeed = 2.0 + Math.random() * 3.5;

      return {
        theta,
        phi,
        distRatio,
        driftSpeedX,
        driftSpeedY,
        driftSpeedZ,
        driftPhaseX,
        driftPhaseY,
        driftPhaseZ,
        driftAmp,
        speedTheta,
        speedPhi,
        baseSize,
        twinkleOffset,
        twinkleSpeed,
        colorIndex: i,
        prevPx: 0,
        prevPy: 0,
        hasPrev: false
      };
    });

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Reactivity multipliers based on status
      const isSpeaking = status === 'SPEAKING';
      const isListening = status === 'LISTENING';
      const isThinking = status === 'THINKING';

      const speedFactor = isSpeaking ? 1.9 : isListening ? 1.45 : isThinking ? 0.75 : 1.0;
      
      // Multi-layered harmonic breathing & voice ripple pulse
      const breathSine = Math.sin(elapsed * 2.2);
      const voiceSine = Math.sin(elapsed * 8.5);
      const audioRipple = Math.sin(elapsed * 14) * Math.cos(elapsed * 7);
      
      const energyPulse = isSpeaking 
        ? 1.08 + voiceSine * 0.12 + audioRipple * 0.05
        : isListening 
        ? 1.04 + Math.sin(elapsed * 5.5) * 0.08
        : isThinking
        ? 1.02 + Math.sin(elapsed * 3.5) * 0.05
        : 1.0 + breathSine * 0.045; // Gentle life-like breathing in idle

      // Rich layered ambient background glow & dynamic voice aura
      const auraExpand = isSpeaking ? 1.45 : isListening ? 1.35 : 1.25;
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * auraExpand);
      if (isSpeaking) {
        bgGrad.addColorStop(0, colorDef.isGradient ? 'rgba(34, 211, 238, 0.45)' : `${colorDef.primary}66`);
        bgGrad.addColorStop(0.35, colorDef.isGradient ? 'rgba(168, 85, 247, 0.28)' : `${colorDef.secondary}33`);
        bgGrad.addColorStop(0.7, colorDef.isGradient ? 'rgba(236, 72, 153, 0.12)' : `${colorDef.tertiary}18`);
        bgGrad.addColorStop(1, 'transparent');
      } else if (isListening) {
        bgGrad.addColorStop(0, colorDef.isGradient ? 'rgba(6, 182, 212, 0.38)' : `${colorDef.primary}55`);
        bgGrad.addColorStop(0.45, colorDef.isGradient ? 'rgba(139, 92, 246, 0.22)' : `${colorDef.secondary}25`);
        bgGrad.addColorStop(1, 'transparent');
      } else if (isThinking) {
        bgGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
        bgGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.15)');
        bgGrad.addColorStop(1, 'transparent');
      } else {
        // Idle breathing aura
        const idleAlpha1 = 0.22 + breathSine * 0.06;
        const idleAlpha2 = 0.08 + breathSine * 0.03;
        bgGrad.addColorStop(0, colorDef.isGradient ? `rgba(168, 85, 247, ${idleAlpha1})` : `${colorDef.primary}33`);
        bgGrad.addColorStop(0.6, colorDef.isGradient ? `rgba(6, 182, 212, ${idleAlpha2})` : `${colorDef.secondary}15`);
        bgGrad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * auraExpand, 0, Math.PI * 2);
      ctx.fill();

      // Soundwave / Acoustic Voice Resonance Ripples (Active when speaking or listening)
      if (isSpeaking || isListening) {
        ctx.save();
        const rippleCount = isSpeaking ? 3 : 2;
        for (let r = 0; r < rippleCount; r++) {
          const rawProgress = (elapsed * (isSpeaking ? 1.2 : 0.8) + r / rippleCount) % 1;
          const progress = (rawProgress + 1) % 1;
          const rippleRadius = Math.max(1, radius * (0.55 + progress * 0.65));
          const rippleAlpha = Math.max(0.01, (1 - progress) * (isSpeaking ? 0.45 : 0.3));
          ctx.beginPath();
          ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
          ctx.strokeStyle = colorDef.isGradient 
            ? (r % 2 === 0 ? `rgba(6, 182, 212, ${rippleAlpha})` : `rgba(168, 85, 247, ${rippleAlpha})`)
            : `${colorDef.secondary}${Math.round(rippleAlpha * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = Math.max(0.5, (2.2 - progress * 1.5) * dpr);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Dynamic 3D Swarm Color Palette mapped to current assistant state
      let stateSwarmPalette: string[];
      let glowHex: string;
      if (status === 'LISTENING') {
        // Electric Cyan & Deep Sky Blue
        stateSwarmPalette = ['#00D2FF', '#22D3EE', '#67E8F9', '#38BDF8', '#E0F2FE', '#06B6D4', '#FFFFFF'];
        glowHex = '#06B6D4';
      } else if (status === 'SPEAKING') {
        // Radiant Magenta / Purple / Pink
        stateSwarmPalette = ['#EC4899', '#A855F7', '#D946EF', '#F472B6', '#C084FC', '#22D3EE', '#FFFFFF'];
        glowHex = '#A855F7';
      } else if (status === 'THINKING') {
        // Solar Amber / Gold
        stateSwarmPalette = ['#F59E0B', '#FBBF24', '#FB923C', '#FCD34D', '#FDE68A', '#FEF08A', '#FFFFFF'];
        glowHex = '#F59E0B';
      } else {
        // Ready / Idle State: Soft Luminous Blue-White & Celestial Cyan Stardust Galaxy
        stateSwarmPalette = colorDef.isGradient 
          ? ['#FFFFFF', '#E0F2FE', '#BAE6FD', '#38BDF8', '#00D2FF', '#818CF8', '#A5B4FC', '#67E8F9', '#C7D2FE']
          : colorDef.palette;
        glowHex = colorDef.glow;
      }

      // Continuous 3-Axis 3D Rotation Matrix Calculations (Majestic, organic rotation in all states)
      const rotX = elapsed * 0.24 * speedFactor;
      const rotY = elapsed * 0.46 * speedFactor;
      const rotZ = elapsed * 0.16 * speedFactor;

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

      // Pre-calculate transformed 3D particles with organic drift and perspective projection
      const projected3DParticles = swarm3D.map((p) => {
        // Living organic drift displacement
        const driftX = Math.sin(elapsed * p.driftSpeedX + p.driftPhaseX) * (radius * p.driftAmp);
        const driftY = Math.cos(elapsed * p.driftSpeedY + p.driftPhaseY) * (radius * p.driftAmp);
        const driftZ = Math.sin(elapsed * p.driftSpeedZ + p.driftPhaseZ) * (radius * p.driftAmp);

        const currentTheta = p.theta + elapsed * p.speedTheta * 0.28 * speedFactor;
        const currentPhi = p.phi + elapsed * p.speedPhi * 0.42 * speedFactor;
        const dynamicRadius = radius * p.distRatio * (energyPulse * 0.94 + 0.06);

        // Spherical -> 3D Cartesian + Organic Random Walk Displacement
        const rawX = dynamicRadius * Math.sin(currentTheta) * Math.cos(currentPhi) + driftX;
        const rawY = dynamicRadius * Math.cos(currentTheta) + driftY;
        const rawZ = dynamicRadius * Math.sin(currentTheta) * Math.sin(currentPhi) + driftZ;

        // 3D Euler Rotation across X, Y, Z
        const y1 = rawY * cosX - rawZ * sinX;
        const z1 = rawY * sinX + rawZ * cosX;
        const x2 = rawX * cosY + z1 * sinY;
        const z2 = -rawX * sinY + z1 * cosY;
        const x3 = x2 * cosZ - y1 * sinZ;
        const y3 = x2 * sinZ + y1 * cosZ;
        const z3 = z2;

        // Perspective camera projection
        const cameraDist = radius * 3.6;
        const perspective = cameraDist / Math.max(10, cameraDist - z3);
        const px = centerX + x3 * perspective;
        const py = centerY + y3 * perspective;

        // Twinkle and depth-scaled alpha
        const twinkle = 0.5 + Math.sin(elapsed * p.twinkleSpeed + p.twinkleOffset) * 0.5;
        const depthAlpha = Math.max(0.15, Math.min(1.0, 0.48 + (z3 / (radius * 1.5)) * 0.52));
        const finalAlpha = depthAlpha * (0.62 + twinkle * 0.38);
        const particleSize = Math.max(0.65 * dpr, p.baseSize * perspective * dpr);
        const particleColor = stateSwarmPalette[p.colorIndex % stateSwarmPalette.length];

        return {
          p,
          px,
          py,
          z3,
          particleSize,
          finalAlpha,
          particleColor,
          perspective
        };
      });

      const back3DParticles = projected3DParticles.filter(item => item.z3 < 0);
      const front3DParticles = projected3DParticles.filter(item => item.z3 >= 0);

      const renderSwarmBatch = (batch: typeof projected3DParticles, isFront: boolean) => {
        ctx.save();
        batch.forEach(item => {
          // Subtle micro-trail streak from previous frame
          if (item.p.hasPrev && isFront && item.particleSize > 1.1 * dpr) {
            ctx.beginPath();
            ctx.moveTo(item.p.prevPx, item.p.prevPy);
            ctx.lineTo(item.px, item.py);
            ctx.strokeStyle = item.particleColor;
            ctx.lineWidth = Math.max(0.3 * dpr, item.particleSize * 0.6);
            ctx.globalAlpha = item.finalAlpha * 0.35;
            ctx.stroke();
          }
          item.p.prevPx = item.px;
          item.p.prevPy = item.py;
          item.p.hasPrev = true;

          // Outer luminous atmospheric soft glow halo
          ctx.beginPath();
          ctx.arc(item.px, item.py, item.particleSize * (isFront ? 2.3 : 1.7), 0, Math.PI * 2);
          ctx.fillStyle = item.particleColor;
          ctx.globalAlpha = item.finalAlpha * (isFront ? 0.32 : 0.16);
          ctx.fill();

          // Particle body with specular core
          ctx.beginPath();
          ctx.arc(item.px, item.py, item.particleSize, 0, Math.PI * 2);
          ctx.fillStyle = (isFront && item.p.distRatio < 0.65) ? '#FFFFFF' : item.particleColor;
          ctx.globalAlpha = item.finalAlpha;
          if (isFront) {
            ctx.shadowColor = item.particleColor;
            ctx.shadowBlur = Math.max(2, 6 * dpr);
          }
          ctx.fill();
        });
        ctx.restore();
      };

      // Render BACK 3D particles (passing behind the orb sphere)
      renderSwarmBatch(back3DParticles, false);

      // ========================================================
      // 1. PARTICLE SWIRL / NEBULA
      // ========================================================
      if (normalizedStyle === 'particle_swirl') {
        // Faint orbital rings
        ctx.save();
        ctx.strokeStyle = colorDef.isGradient ? 'rgba(236, 72, 153, 0.18)' : `${colorDef.secondary}22`;
        ctx.lineWidth = 1 * dpr;
        for (let r = 0.35; r <= 0.85; r += 0.25) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // Particles with trails
        particles.forEach((p, idx) => {
          const currentAngle = p.baseAngle + elapsed * p.orbitSpeed * 0.8 * speedFactor;
          const currentRadius = p.orbitRadius * energyPulse + Math.sin(elapsed * 3 + p.pulseOffset) * 4 * dpr;
          const px = centerX + Math.cos(currentAngle) * currentRadius;
          const py = centerY + Math.sin(currentAngle) * currentRadius;

          // Tail trail
          const prevAngle = currentAngle - p.orbitSpeed * 0.12;
          const prevX = centerX + Math.cos(prevAngle) * currentRadius;
          const prevY = centerY + Math.sin(prevAngle) * currentRadius;

          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(px, py);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size * dpr * 0.8;
          ctx.globalAlpha = p.alpha * 0.6;
          ctx.stroke();

          // Particle head
          ctx.beginPath();
          ctx.arc(px, py, p.size * dpr * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = p.alpha;
          ctx.fill();
        });

        // Bright Luminous Core
        ctx.globalAlpha = 1;
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.38 * energyPulse);
        coreGrad.addColorStop(0, '#FFFFFF');
        coreGrad.addColorStop(0.35, colorDef.isGradient ? '#67E8F9' : colorDef.tertiary);
        coreGrad.addColorStop(0.75, colorDef.isGradient ? '#A855F7' : colorDef.primary);
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.38 * energyPulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // ========================================================
      // GALAXY SWIRL / NEBULA VORTEX (Dense multi-colored spiral vortex)
      // ========================================================
      else if (normalizedStyle === 'galaxy_swirl') {
        const galaxyRot = elapsed * 0.9 * speedFactor;

        // 1. Multi-layered rotating cosmic nebula gas clouds
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-galaxyRot * 0.4);

        // Violet-purple outer cloud
        const neb1 = ctx.createRadialGradient(-radius * 0.22, -radius * 0.15, 0, 0, 0, radius * 0.95);
        neb1.addColorStop(0, 'rgba(168, 85, 247, 0.32)');
        neb1.addColorStop(0.5, 'rgba(99, 102, 241, 0.16)');
        neb1.addColorStop(1, 'transparent');
        ctx.fillStyle = neb1;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
        ctx.fill();

        // Neon Pink & Cyan opposing gas cloud
        const neb2 = ctx.createRadialGradient(radius * 0.25, radius * 0.2, 0, 0, 0, radius * 0.88);
        neb2.addColorStop(0, 'rgba(236, 72, 153, 0.28)');
        neb2.addColorStop(0.45, 'rgba(6, 182, 212, 0.15)');
        neb2.addColorStop(1, 'transparent');
        ctx.fillStyle = neb2;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Faint Spiral Arm Guide Streaks
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(galaxyRot);
        for (let arm = 0; arm < 3; arm++) {
          const armAngle = (arm * (Math.PI * 2 / 3));
          ctx.beginPath();
          for (let step = 0; step < 40; step++) {
            const r = (0.12 + (step / 40) * 0.82) * radius;
            const theta = armAngle + Math.log(r * 0.1 + 1) * 3.4;
            const sx = Math.cos(theta) * r;
            const sy = Math.sin(theta) * r;
            if (step === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.strokeStyle = arm === 0 ? 'rgba(168, 85, 247, 0.22)' : arm === 1 ? 'rgba(0, 210, 255, 0.18)' : 'rgba(236, 72, 153, 0.18)';
          ctx.lineWidth = 2.4 * dpr;
          ctx.stroke();
        }
        ctx.restore();

        // 3. Dense Inward Swirling Galaxy Particles with Spiral Trails
        galaxyStardust.forEach((gp) => {
          const totalLifeSpan = 5.5 / (gp.speed * speedFactor);
          const progress = ((elapsed * gp.speed * 0.45 + gp.orbitOffset) % totalLifeSpan) / totalLifeSpan;
          // Inward spiral radius from outer edge (~0.92 radius) down to core (~0.12 radius)
          const currentR = (0.92 - progress * 0.78) * radius * energyPulse;
          const currentTheta = gp.armOffset + Math.log(currentR * 0.08 + 1) * gp.spiralTightness + galaxyRot * gp.speed;

          const px = centerX + Math.cos(currentTheta) * currentR;
          const py = centerY + Math.sin(currentTheta) * currentR;

          // Trail segment
          const prevR = Math.min(radius * 0.94, currentR + 4.5 * dpr);
          const prevTheta = currentTheta - 0.16 * (gp.speed / (currentR / radius + 0.15));
          const prevX = centerX + Math.cos(prevTheta) * prevR;
          const prevY = centerY + Math.sin(prevTheta) * prevR;

          const fade = Math.sin(progress * Math.PI);
          const dynamicAlpha = gp.alpha * fade;

          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(px, py);
          ctx.strokeStyle = gp.color;
          ctx.lineWidth = gp.size * dpr * 0.8;
          ctx.globalAlpha = dynamicAlpha * 0.65;
          ctx.stroke();

          // Particle Head
          ctx.beginPath();
          ctx.arc(px, py, gp.size * dpr * 0.85, 0, Math.PI * 2);
          ctx.fillStyle = gp.color;
          ctx.globalAlpha = dynamicAlpha;
          ctx.fill();

          // Specular Glint Center
          if (gp.size > 1.2) {
            ctx.beginPath();
            ctx.arc(px, py, gp.size * dpr * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = dynamicAlpha * 0.95;
            ctx.fill();
          }
        });

        // 4. Luminous Galactic Singularity & Starburst Core
        ctx.globalAlpha = 1;
        const coreR = radius * 0.32 * energyPulse;
        const starGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreR);
        starGrad.addColorStop(0, '#FFFFFF');
        starGrad.addColorStop(0.2, '#FDE68A');
        starGrad.addColorStop(0.45, '#EC4899');
        starGrad.addColorStop(0.75, '#8B5CF6');
        starGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = starGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreR, 0, Math.PI * 2);
        ctx.fill();

        // Starburst cross diffraction rays
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-galaxyRot * 1.4);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.4 * dpr;
        const rayLen = radius * 0.48 * energyPulse;
        ctx.beginPath();
        ctx.moveTo(-rayLen, 0); ctx.lineTo(rayLen, 0);
        ctx.moveTo(0, -rayLen); ctx.lineTo(0, rayLen);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
        ctx.lineWidth = 1.0 * dpr;
        const diagLen = rayLen * 0.65;
        ctx.beginPath();
        ctx.moveTo(-diagLen, -diagLen); ctx.lineTo(diagLen, diagLen);
        ctx.moveTo(-diagLen, diagLen); ctx.lineTo(diagLen, -diagLen);
        ctx.stroke();
        ctx.restore();
      }

      // ========================================================
      // 2. PULSE REACTOR (Hexagonal cyber frame + status arcs + pulsing core)
      // ========================================================
      else if (normalizedStyle === 'pulse_reactor') {
        const hexRadius = radius * 0.82;
        const rotAngle = elapsed * 0.6 * speedFactor;

        // Rotating Hexagon
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotAngle);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const hx = Math.cos(a) * hexRadius;
          const hy = Math.sin(a) * hexRadius;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.strokeStyle = colorDef.isGradient ? '#A855F7' : colorDef.secondary;
        ctx.lineWidth = 1.6 * dpr;
        ctx.stroke();

        // Corner tick dots
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * hexRadius, Math.sin(a) * hexRadius, 2.2 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }
        ctx.restore();

        // Status Segment Arcs (counter-rotating)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-rotAngle * 1.4);
        ctx.lineWidth = 2.4 * dpr;
        for (let i = 0; i < 3; i++) {
          const start = (i / 3) * Math.PI * 2;
          const end = start + Math.PI * 0.45;
          ctx.beginPath();
          ctx.arc(0, 0, hexRadius * 0.68, start, end);
          ctx.strokeStyle = colorDef.palette[i % colorDef.palette.length];
          ctx.stroke();
        }
        ctx.restore();

        // High Energy Core Reactor Sphere
        const coreR = radius * 0.36 * energyPulse;
        const reactorGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreR);
        reactorGrad.addColorStop(0, '#FFFFFF');
        reactorGrad.addColorStop(0.4, colorDef.isGradient ? '#00D2FF' : colorDef.secondary);
        reactorGrad.addColorStop(0.8, colorDef.isGradient ? '#EC4899' : colorDef.primary);
        reactorGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = reactorGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreR, 0, Math.PI * 2);
        ctx.fill();

        // Core Sparkle Diamond
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotAngle * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-2 * dpr, -2 * dpr, 4 * dpr, 4 * dpr);
        ctx.restore();
      }

      // ========================================================
      // 3. PARTICLE SWARM (Dense breathing 3D spherical cloud)
      // ========================================================
      else if (normalizedStyle === 'particle_swarm') {
        const swarmRotY = elapsed * 0.8 * speedFactor;
        const swarmRotX = Math.sin(elapsed * 0.5) * 0.4;

        particles.forEach((p) => {
          // 3D sphere coordinate projection
          const phi = p.baseAngle;
          const theta = p.pulseOffset;
          const sphereR = radius * 0.72 * energyPulse;

          // 3D coordinates
          const x0 = Math.cos(phi) * Math.sin(theta) * sphereR;
          const y0 = Math.cos(theta) * sphereR;
          const z0 = Math.sin(phi) * Math.sin(theta) * sphereR;

          // Rotate around Y and X
          const x1 = x0 * Math.cos(swarmRotY) + z0 * Math.sin(swarmRotY);
          const z1 = -x0 * Math.sin(swarmRotY) + z0 * Math.cos(swarmRotY);
          const y1 = y0 * Math.cos(swarmRotX) - z1 * Math.sin(swarmRotX);
          const z2 = y0 * Math.sin(swarmRotX) + z1 * Math.cos(swarmRotX);

          // Perspective projection
          const focal = radius * 1.5;
          const denom = focal + z2;
          const scale = denom > 0.1 ? focal / denom : 0.01;
          const px = centerX + x1;
          const py = centerY + y1;

          if (scale > 0.01) {
            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.6, p.size * scale * dpr), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(1, Math.max(0.15, (z2 / radius + 1) * 0.5));
            ctx.fill();
          }
        });

        // Center Beacon / Brightest Singularity Node
        ctx.globalAlpha = 1;
        const bGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(1, radius * 0.22));
        bGrad.addColorStop(0, '#FFFFFF');
        bGrad.addColorStop(0.5, colorDef.isGradient ? '#67E8F9' : colorDef.tertiary);
        bGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(1, radius * 0.22), 0, Math.PI * 2);
        ctx.fill();
      }

      // ========================================================
      // 4. LIQUID CORE (Continuous organic fluid morphing blob)
      // ========================================================
      else if (normalizedStyle === 'liquid_core') {
        const numPoints = 12;
        const baseBlobRadius = radius * 0.62 * energyPulse;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Fluid polygon with cubic bezier smoothing
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const wave1 = Math.sin(angle * 3 + elapsed * 3 * speedFactor) * 8 * dpr;
          const wave2 = Math.cos(angle * 2 - elapsed * 2 * speedFactor) * 6 * dpr;
          const r = baseBlobRadius + wave1 + wave2;
          points.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r
          });
        }

        ctx.beginPath();
        ctx.moveTo((points[0].x + points[numPoints - 1].x) / 2, (points[0].y + points[numPoints - 1].y) / 2);
        for (let i = 0; i < numPoints; i++) {
          const next = points[(i + 1) % numPoints];
          const midX = (points[i].x + next.x) / 2;
          const midY = (points[i].y + next.y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        ctx.closePath();

        // Liquid Multi-gradient fill
        const blobGrad = ctx.createRadialGradient(-radius * 0.2, -radius * 0.2, 0, 0, 0, baseBlobRadius * 1.2);
        if (colorDef.isGradient) {
          blobGrad.addColorStop(0, '#FFFFFF');
          blobGrad.addColorStop(0.25, '#67E8F9');
          blobGrad.addColorStop(0.55, '#A855F7');
          blobGrad.addColorStop(0.85, '#EC4899');
          blobGrad.addColorStop(1, '#FB923C');
        } else {
          blobGrad.addColorStop(0, '#FFFFFF');
          blobGrad.addColorStop(0.3, colorDef.tertiary);
          blobGrad.addColorStop(0.7, colorDef.primary);
          blobGrad.addColorStop(1, '#020617');
        }
        ctx.fillStyle = blobGrad;
        ctx.fill();

        // Surface sheen / specular crescent highlight
        ctx.beginPath();
        ctx.ellipse(-baseBlobRadius * 0.3, -baseBlobRadius * 0.35, baseBlobRadius * 0.32, baseBlobRadius * 0.16, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fill();

        ctx.restore();
      }

      // ========================================================
      // 5. WIREFRAME GLOBE (3D latitude/longitude rotating matrix)
      // ========================================================
      else if (normalizedStyle === 'grid_globe') {
        const globeRadius = radius * 0.75 * energyPulse;
        const rotY = elapsed * 0.9 * speedFactor;
        const tiltX = 0.35; // 20-deg camera tilt

        ctx.save();
        ctx.translate(centerX, centerY);

        // Latitude circles
        ctx.lineWidth = 1 * dpr;
        for (let lat = -60; lat <= 60; lat += 30) {
          const latRad = (lat * Math.PI) / 180;
          const rLat = globeRadius * Math.cos(latRad);
          const yLat = globeRadius * Math.sin(latRad) * Math.cos(tiltX);
          const hLat = rLat * Math.sin(tiltX) * 0.6;

          ctx.beginPath();
          ctx.ellipse(0, yLat, rLat, Math.max(1, Math.abs(hLat)), 0, 0, Math.PI * 2);
          ctx.strokeStyle = colorDef.isGradient ? 'rgba(6, 182, 212, 0.4)' : `${colorDef.secondary}44`;
          ctx.stroke();
        }

        // Longitude ellipses rotating in 3D
        for (let lon = 0; lon < 6; lon++) {
          const lonAngle = (lon / 6) * Math.PI + rotY;
          const rx = Math.cos(lonAngle) * globeRadius;

          ctx.beginPath();
          ctx.ellipse(0, 0, Math.abs(rx), globeRadius, tiltX, 0, Math.PI * 2);
          ctx.strokeStyle = colorDef.isGradient 
            ? lon % 2 === 0 ? 'rgba(168, 85, 247, 0.55)' : 'rgba(236, 72, 153, 0.45)' 
            : `${colorDef.primary}66`;
          ctx.stroke();
        }

        // Glowing Surface Matrix Nodes
        for (let i = 0; i < 12; i++) {
          const nodeLon = (i / 12) * Math.PI * 2 + rotY;
          const nodeLat = Math.sin(i * 1.7) * 50 * (Math.PI / 180);
          const nx = Math.cos(nodeLon) * Math.cos(nodeLat) * globeRadius;
          const ny = Math.sin(nodeLat) * globeRadius * Math.cos(tiltX) + Math.sin(nodeLon) * Math.cos(nodeLat) * globeRadius * Math.sin(tiltX) * 0.4;
          const nz = Math.sin(nodeLon) * Math.cos(nodeLat);

          if (nz > -0.2) {
            ctx.beginPath();
            ctx.arc(nx, ny, 2.2 * dpr, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
          }
        }

        // Core Matrix Node
        ctx.beginPath();
        ctx.arc(0, 0, 4 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.restore();
      }

      // ========================================================
      // 6. RING / NOVA (Starburst with multi-axis orbital rings)
      // ========================================================
      else if (normalizedStyle === 'nova_ring') {
        const ringAngle = elapsed * 1.2 * speedFactor;

        // Outer Chromatic Halo Boundary Ring
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.92 * energyPulse, 0, Math.PI * 2);
        ctx.strokeStyle = colorDef.isGradient ? 'rgba(34, 211, 238, 0.35)' : `${colorDef.secondary}33`;
        ctx.lineWidth = 1.8 * dpr;
        ctx.shadowColor = colorDef.glow;
        ctx.shadowBlur = 12 * dpr;
        ctx.stroke();
        ctx.restore();

        // Orbital Ring 1 (Smooth Primary Cyan/Purple Ring with gradient bevel)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(Math.PI / 5 + Math.sin(elapsed * 0.8) * 0.05);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.88, radius * 0.36, ringAngle * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = colorDef.isGradient ? '#22D3EE' : colorDef.secondary;
        ctx.lineWidth = 2.4 * dpr;
        ctx.shadowColor = '#06B6D4';
        ctx.shadowBlur = 10 * dpr;
        ctx.stroke();

        // Orbital Node 1 (Glowing Cyan Quantum Sphere)
        const n1X = Math.cos(ringAngle) * radius * 0.88;
        const n1Y = Math.sin(ringAngle) * radius * 0.36;
        ctx.beginPath();
        ctx.arc(n1X, n1Y, 4.2 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#22D3EE';
        ctx.shadowBlur = 8 * dpr;
        ctx.fill();
        ctx.restore();

        // Orbital Ring 2 (Cross Tilt Violet/Pink Ring)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-Math.PI / 3.8 + Math.cos(elapsed * 0.7) * 0.05);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.84, radius * 0.32, -ringAngle * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = colorDef.isGradient ? '#A855F7' : colorDef.primary;
        ctx.lineWidth = 2.0 * dpr;
        ctx.shadowColor = '#8B5CF6';
        ctx.shadowBlur = 8 * dpr;
        ctx.stroke();

        // Orbital Node 2 (Glowing Violet Quantum Sphere)
        const n2X = Math.cos(-ringAngle * 1.3) * radius * 0.84;
        const n2Y = Math.sin(-ringAngle * 1.3) * radius * 0.32;
        ctx.beginPath();
        ctx.arc(n2X, n2Y, 3.6 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#EC4899';
        ctx.shadowBlur = 8 * dpr;
        ctx.fill();
        ctx.restore();

        // Orbital Ring 3 (Equatorial Nanotech Ring)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ringAngle * 0.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.72, radius * 0.72, 0, 0, Math.PI * 2);
        ctx.strokeStyle = colorDef.isGradient ? 'rgba(236, 72, 153, 0.45)' : `${colorDef.tertiary}44`;
        ctx.lineWidth = 1.2 * dpr;
        ctx.setLineDash([4 * dpr, 8 * dpr]);
        ctx.stroke();
        ctx.restore();

        // Radiant Nova Starburst Flare Rays & Diffraction Spikes
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ringAngle * 0.35);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.8 * dpr;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 12 * dpr;
        // Primary cross
        const rayLen = radius * 0.72 * energyPulse;
        ctx.beginPath();
        ctx.moveTo(-rayLen, 0); ctx.lineTo(rayLen, 0);
        ctx.moveTo(0, -rayLen); ctx.lineTo(0, rayLen);
        ctx.stroke();
        // Diagonal soft rays
        ctx.strokeStyle = colorDef.isGradient ? 'rgba(251, 146, 60, 0.5)' : `${colorDef.secondary}66`;
        ctx.lineWidth = 1.2 * dpr;
        const diagLen = rayLen * 0.65;
        ctx.beginPath();
        ctx.moveTo(-diagLen, -diagLen); ctx.lineTo(diagLen, diagLen);
        ctx.moveTo(-diagLen, diagLen); ctx.lineTo(diagLen, -diagLen);
        ctx.stroke();
        ctx.restore();

        // Nova Core Sphere with Multi-Stop Luminous Refraction
        const novaCoreR = radius * 0.42 * energyPulse;
        const novaGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, novaCoreR);
        novaGrad.addColorStop(0, '#FFFFFF');
        novaGrad.addColorStop(0.2, '#E0F2FE');
        novaGrad.addColorStop(0.45, colorDef.isGradient ? '#67E8F9' : colorDef.tertiary);
        novaGrad.addColorStop(0.75, colorDef.isGradient ? '#8B5CF6' : colorDef.primary);
        novaGrad.addColorStop(0.92, colorDef.isGradient ? '#EC4899' : colorDef.glow);
        novaGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = novaGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, novaCoreR, 0, Math.PI * 2);
        ctx.fill();

        // Specular Center Flares
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3.5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 6 * dpr;
        ctx.fill();
        ctx.restore();
      }

      // ========================================================
      // 7. SOUNDWAVE RIPPLE (Concentric acoustic frequency rings)
      // ========================================================
      else if (normalizedStyle === 'soundwave_ripple') {
        const numRipples = 4;
        for (let i = 0; i < numRipples; i++) {
          const rawProgress = (elapsed * 0.8 * speedFactor + i / numRipples) % 1;
          const progress = (rawProgress + 1) % 1;
          const r = Math.max(1, radius * (0.25 + progress * 0.65));
          const alpha = Math.max(0.01, (1 - progress) * (isSpeaking ? 0.9 : 0.6));

          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          ctx.strokeStyle = colorDef.palette[i % colorDef.palette.length];
          ctx.lineWidth = Math.max(0.5, (2.2 - progress * 1.5) * dpr);
          ctx.globalAlpha = alpha;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Central Audio Waveform Bars
        const barCount = 7;
        const barWidth = 2.5 * dpr;
        const barSpacing = 4.5 * dpr;
        const totalW = barCount * barSpacing;
        const startX = centerX - totalW / 2 + barWidth / 2;

        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < barCount; i++) {
          const barHeightFactor = Math.sin(elapsed * 6 * speedFactor + i * 0.9) * 0.4 + 0.6;
          const bh = (isSpeaking ? 22 : isListening ? 14 : 8) * barHeightFactor * dpr;
          ctx.fillRect(startX + i * barSpacing, centerY - bh / 2, barWidth, bh);
        }
      }

      // ========================================================
      // 8. CYBER MATRIX (Holographic radar scanner with 360° laser sweep)
      // ========================================================
      else if (normalizedStyle === 'cyber_matrix') {
        const sweepAngle = elapsed * 2.2 * speedFactor;

        // Radar Target Concentric Rings
        ctx.lineWidth = 1 * dpr;
        for (let r = 0.3; r <= 0.85; r += 0.28) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
          ctx.strokeStyle = colorDef.isGradient ? 'rgba(6, 182, 212, 0.35)' : `${colorDef.secondary}44`;
          ctx.stroke();
        }

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(centerX - radius * 0.85, centerY);
        ctx.lineTo(centerX + radius * 0.85, centerY);
        ctx.moveTo(centerX, centerY - radius * 0.85);
        ctx.lineTo(centerX, centerY + radius * 0.85);
        ctx.strokeStyle = colorDef.isGradient ? 'rgba(168, 85, 247, 0.35)' : `${colorDef.primary}33`;
        ctx.stroke();

        // 360° Radar Sweeper Sector Gradient
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(sweepAngle);
        const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.85);
        sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        sweepGrad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 0.35);
        ctx.closePath();
        ctx.fillStyle = colorDef.isGradient ? 'rgba(6, 182, 212, 0.25)' : `${colorDef.secondary}33`;
        ctx.fill();

        // Sweeper Line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radius * 0.85, 0);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
        ctx.restore();

        // Center Processing Node
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3.5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }

      // ========================================================
      // 9. QUANTUM HELIX (Intertwined 3D double helix ribbons)
      // ========================================================
      else if (normalizedStyle === 'quantum_helix') {
        const helixSteps = 16;
        const helixH = radius * 1.5;
        const rot = elapsed * 2 * speedFactor;

        ctx.save();
        ctx.translate(centerX, centerY);

        for (let i = 0; i < helixSteps; i++) {
          const t = (i / (helixSteps - 1)) - 0.5;
          const y = t * helixH;
          const a1 = t * Math.PI * 3 + rot;
          const a2 = a1 + Math.PI;

          const x1 = Math.cos(a1) * radius * 0.48;
          const x2 = Math.cos(a2) * radius * 0.48;
          const z1 = Math.sin(a1);
          const z2 = Math.sin(a2);

          // Rung connecting strand
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.strokeStyle = colorDef.isGradient ? 'rgba(255, 255, 255, 0.3)' : `${colorDef.secondary}33`;
          ctx.lineWidth = 1 * dpr;
          ctx.stroke();

          // Strand 1 Node
          ctx.beginPath();
          ctx.arc(x1, y, Math.max(0.5, (2.2 + z1 * 0.8) * dpr), 0, Math.PI * 2);
          ctx.fillStyle = colorDef.isGradient ? '#22D3EE' : colorDef.secondary;
          ctx.fill();

          // Strand 2 Node
          ctx.beginPath();
          ctx.arc(x2, y, Math.max(0.5, (2.2 + z2 * 0.8) * dpr), 0, Math.PI * 2);
          ctx.fillStyle = colorDef.isGradient ? '#EC4899' : colorDef.tertiary;
          ctx.fill();
        }
        ctx.restore();
      }

      // ========================================================
      // 10. AURORA WAVES (Undulating luminous plasma curtains)
      // ========================================================
      else if (normalizedStyle === 'aurora_waves') {
        const waveCount = 4;
        ctx.save();
        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          ctx.moveTo(centerX - radius * 0.85, centerY + radius * 0.85);

          for (let x = -radius * 0.85; x <= radius * 0.85; x += 4 * dpr) {
            const progress = (x + radius * 0.85) / (radius * 1.7);
            const waveY = Math.sin(progress * Math.PI * 3 + elapsed * 2.5 * speedFactor + w * 1.2) * (8 + w * 3) * dpr;
            ctx.lineTo(centerX + x, centerY - radius * 0.2 + waveY + w * 6 * dpr);
          }

          ctx.lineTo(centerX + radius * 0.85, centerY + radius * 0.85);
          ctx.closePath();

          const auroraGrad = ctx.createLinearGradient(centerX, centerY - radius * 0.6, centerX, centerY + radius * 0.8);
          auroraGrad.addColorStop(0, colorDef.palette[w % colorDef.palette.length]);
          auroraGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = auroraGrad;
          ctx.globalAlpha = 0.45;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // ========================================================
      // 11. PRISM CRYSTAL (Rotating 3D geometric polyhedron gem)
      // ========================================================
      else if (normalizedStyle === 'polyhedron_crystal') {
        const gemRot = elapsed * 1.1 * speedFactor;
        const gemRadius = radius * 0.68 * energyPulse;

        ctx.save();
        ctx.translate(centerX, centerY);

        // 3D Octahedron vertices
        const vertices = [
          { x: 0, y: -gemRadius, z: 0 }, // Top
          { x: 0, y: gemRadius, z: 0 },  // Bottom
          { x: Math.cos(gemRot) * gemRadius * 0.8, y: 0, z: Math.sin(gemRot) * gemRadius * 0.8 },
          { x: Math.cos(gemRot + Math.PI / 2) * gemRadius * 0.8, y: 0, z: Math.sin(gemRot + Math.PI / 2) * gemRadius * 0.8 },
          { x: Math.cos(gemRot + Math.PI) * gemRadius * 0.8, y: 0, z: Math.sin(gemRot + Math.PI) * gemRadius * 0.8 },
          { x: Math.cos(gemRot + (3 * Math.PI) / 2) * gemRadius * 0.8, y: 0, z: Math.sin(gemRot + (3 * Math.PI) / 2) * gemRadius * 0.8 }
        ];

        // Draw facet edges
        ctx.lineWidth = 1.4 * dpr;
        for (let i = 2; i < 6; i++) {
          const next = i === 5 ? 2 : i + 1;
          // Equator edge
          ctx.beginPath();
          ctx.moveTo(vertices[i].x, vertices[i].y);
          ctx.lineTo(vertices[next].x, vertices[next].y);
          ctx.strokeStyle = colorDef.isGradient ? '#67E8F9' : colorDef.secondary;
          ctx.stroke();

          // Top apex edges
          ctx.beginPath();
          ctx.moveTo(vertices[0].x, vertices[0].y);
          ctx.lineTo(vertices[i].x, vertices[i].y);
          ctx.strokeStyle = colorDef.isGradient ? '#C084FC' : colorDef.primary;
          ctx.stroke();

          // Bottom apex edges
          ctx.beginPath();
          ctx.moveTo(vertices[1].x, vertices[1].y);
          ctx.lineTo(vertices[i].x, vertices[i].y);
          ctx.strokeStyle = colorDef.isGradient ? '#F472B6' : colorDef.tertiary;
          ctx.stroke();
        }

        // Specular Vertex Flare
        ctx.beginPath();
        ctx.arc(vertices[0].x, vertices[0].y, 3 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.restore();
      }

      // ========================================================
      // 12. SUPERNOVA SINGULARITY (Gravitational vortex)
      // ========================================================
      else if (normalizedStyle === 'supernova') {
        // Gravitational inward dust spiral
        particles.forEach((p) => {
          const spiralAngle = p.baseAngle + elapsed * 2.5 * speedFactor;
          const maxR = Math.max(1, radius * 0.85);
          const rawMod = (p.orbitRadius + elapsed * 25) % maxR;
          const spiralR = Math.max(1, (rawMod + maxR) % maxR);
          const sx = centerX + Math.cos(spiralAngle) * spiralR;
          const sy = centerY + Math.sin(spiralAngle) * spiralR;

          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.5, p.size * dpr), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 0.8;
          ctx.fill();
        });

        // Coronal Singularity Event Horizon
        ctx.globalAlpha = 1;
        const snGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.35 * energyPulse);
        snGrad.addColorStop(0, '#FFFFFF');
        snGrad.addColorStop(0.3, colorDef.isGradient ? '#FB923C' : colorDef.secondary);
        snGrad.addColorStop(0.7, colorDef.isGradient ? '#9333EA' : colorDef.primary);
        snGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = snGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.35 * energyPulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // ========================================================
      // 13. NEURAL SYNAPSE (Bio-electric neural network)
      // ========================================================
      else if (normalizedStyle === 'neural_synapse') {
        // Synaptic connection paths
        ctx.lineWidth = 1 * dpr;
        for (let i = 0; i < synapseNodes.length; i++) {
          for (let j = i + 1; j < synapseNodes.length; j++) {
            const dx = synapseNodes[i].x - synapseNodes[j].x;
            const dy = synapseNodes[i].y - synapseNodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius * 0.6) {
              ctx.beginPath();
              ctx.moveTo(synapseNodes[i].x, synapseNodes[i].y);
              ctx.lineTo(synapseNodes[j].x, synapseNodes[j].y);
              ctx.strokeStyle = colorDef.isGradient ? 'rgba(168, 85, 247, 0.25)' : `${colorDef.primary}22`;
              ctx.stroke();

              // Action potential impulse travelling between nodes
              const impulsePos = (elapsed * 1.5 + (i + j) * 0.2) % 1;
              const ix = synapseNodes[i].x + (synapseNodes[j].x - synapseNodes[i].x) * impulsePos;
              const iy = synapseNodes[i].y + (synapseNodes[j].y - synapseNodes[i].y) * impulsePos;
              ctx.beginPath();
              ctx.arc(ix, iy, 1.4 * dpr, 0, Math.PI * 2);
              ctx.fillStyle = '#FFFFFF';
              ctx.fill();
            }
          }
        }

        // Synapse Nodes
        synapseNodes.forEach((node) => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size * dpr, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.fill();
        });
      }

      // ========================================================
      // 14. TACHYON VORTEX (Hyper-speed relativistic light funnel)
      // ========================================================
      else if (normalizedStyle === 'plasma_vortex') {
        const vortexRings = 7;
        for (let r = 0; r < vortexRings; r++) {
          const ringRad = radius * ((r + 1) / vortexRings) * 0.85;
          const rotOffset = elapsed * (vortexRings - r) * 0.4 * speedFactor;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(rotOffset);
          ctx.beginPath();
          ctx.ellipse(0, 0, ringRad, ringRad * 0.4, 0, 0, Math.PI * 2);
          ctx.strokeStyle = colorDef.palette[r % colorDef.palette.length];
          ctx.lineWidth = (1 + (r / vortexRings) * 1.5) * dpr;
          ctx.stroke();
          ctx.restore();
        }

        // Center singularity
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3.5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }

      // ========================================================
      // 15. LUMINOUS CORE / ASTROLABE GLOW
      // ========================================================
      else {
        // Gyroscopic Outer Rings
        const ringRot1 = elapsed * 0.8 * speedFactor;
        const ringRot2 = -elapsed * 0.6 * speedFactor;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ringRot1);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
        ctx.strokeStyle = colorDef.isGradient ? '#22D3EE' : colorDef.secondary;
        ctx.lineWidth = 1.2 * dpr;
        ctx.setLineDash([6 * dpr, 4 * dpr]);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ringRot2);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
        ctx.strokeStyle = colorDef.isGradient ? '#EC4899' : colorDef.tertiary;
        ctx.lineWidth = 1 * dpr;
        ctx.setLineDash([4 * dpr, 6 * dpr]);
        ctx.stroke();
        ctx.restore();

        // Multi-frequency Core Sphere
        const lumR = radius * 0.45 * energyPulse;
        const lumGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, lumR);
        lumGrad.addColorStop(0, '#FFFFFF');
        lumGrad.addColorStop(0.3, colorDef.isGradient ? '#67E8F9' : colorDef.tertiary);
        lumGrad.addColorStop(0.7, colorDef.isGradient ? '#8B5CF6' : colorDef.primary);
        lumGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = lumGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, lumR, 0, Math.PI * 2);
        ctx.fill();

        // Diamond Specular Glint
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(elapsed * 1.5);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-2 * dpr, -2 * dpr, 4 * dpr, 4 * dpr);
        ctx.restore();
      }

      // Render post-processing visual treatment based on orbType
      if (orbType === 'neon') {
        // Neon: high-luminance chromatic halo & vibrant outer boundary ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.94 * energyPulse, 0, Math.PI * 2);
        ctx.strokeStyle = colorDef.primary;
        ctx.lineWidth = 2.4 * dpr;
        ctx.shadowColor = colorDef.glow;
        ctx.shadowBlur = 14 * dpr;
        ctx.globalAlpha = 0.75;
        ctx.stroke();
        ctx.restore();
      } else if (orbType === 'energy') {
        // Energy: dynamic coronal plasma flares and lightning spikes
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(elapsed * 2.2);
        for (let i = 0; i < 6; i++) {
          const arcAngle = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          const r1 = radius * 0.78;
          const r2 = radius * (1.02 + Math.sin(elapsed * 6 + i) * 0.12);
          ctx.moveTo(Math.cos(arcAngle) * r1, Math.sin(arcAngle) * r1);
          ctx.lineTo(Math.cos(arcAngle) * r2, Math.sin(arcAngle) * r2);
          ctx.strokeStyle = colorDef.palette[i % colorDef.palette.length];
          ctx.lineWidth = 2 * dpr;
          ctx.shadowColor = colorDef.glow;
          ctx.shadowBlur = 8 * dpr;
          ctx.globalAlpha = 0.8;
          ctx.stroke();
        }
        ctx.restore();
      } else if (orbType === 'hologram') {
        // Hologram: futuristic scanlines and HUD tick marks
        ctx.save();
        ctx.globalAlpha = 0.16;
        const lineSpacing = 4.5 * dpr;
        ctx.fillStyle = colorDef.primary;
        for (let y = 0; y < canvasHeight; y += lineSpacing) {
          ctx.fillRect(0, y, canvasWidth, 1 * dpr);
        }
        // Digital frame corners
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = colorDef.secondary;
        ctx.lineWidth = 1.4 * dpr;
        const pad = radius * 0.18;
        // top-left tick
        ctx.beginPath();
        ctx.moveTo(centerX - radius + pad, centerY - radius + pad + 7 * dpr);
        ctx.lineTo(centerX - radius + pad, centerY - radius + pad);
        ctx.lineTo(centerX - radius + pad + 7 * dpr, centerY - radius + pad);
        ctx.stroke();
        // bottom-right tick
        ctx.beginPath();
        ctx.moveTo(centerX + radius - pad, centerY + radius - pad - 7 * dpr);
        ctx.lineTo(centerX + radius - pad, centerY + radius - pad);
        ctx.lineTo(centerX + radius - pad - 7 * dpr, centerY + radius - pad);
        ctx.stroke();
        ctx.restore();
      }

      // Render FRONT 3D particles (passing in front of the orb sphere with glowing flares & trails)
      renderSwarmBatch(front3DParticles, true);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [normalizedStyle, color, orbType, customHue, size, status, colorDef]);

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`relative flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer active:scale-95 transition-transform' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block pointer-events-none"
      />
    </div>
  );
};
