import React from 'react';
import { AppLauncherIconVariant } from '../../types';

interface MayraLogoProps {
  size?: number | string;
  className?: string;
  showGlow?: boolean;
  variant?: 'app_icon' | 'badge' | 'vector_only' | 'raw';
  iconVariant?: AppLauncherIconVariant;
}

export const LAUNCHER_ICONS: Record<AppLauncherIconVariant, {
  id: AppLauncherIconVariant;
  name: string;
  subtitle: string;
  accent: string;
  glow: string;
  bgGradient: string;
  borderClass: string;
  filterClass: string;
}> = {
  cyan_default: {
    id: 'cyan_default',
    name: 'Quantum Cyan',
    subtitle: 'Original Cyber Matrix',
    accent: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.45)',
    bgGradient: 'from-cyan-950 via-slate-900 to-[#070914]',
    borderClass: 'border-cyan-500/40',
    filterClass: ''
  },
  amber_gold: {
    id: 'amber_gold',
    name: 'Solar Amber',
    subtitle: 'Golden Flare Power Core',
    accent: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.45)',
    bgGradient: 'from-amber-950 via-slate-900 to-[#120B03]',
    borderClass: 'border-amber-500/40',
    filterClass: 'hue-rotate-[140deg] saturate-150'
  },
  violet_cosmic: {
    id: 'violet_cosmic',
    name: 'Cosmic Violet',
    subtitle: 'Deep Nebula Singularity',
    accent: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.45)',
    bgGradient: 'from-purple-950 via-slate-900 to-[#10071C]',
    borderClass: 'border-purple-500/40',
    filterClass: 'hue-rotate-[240deg] saturate-125'
  },
  stealth_obsidian: {
    id: 'stealth_obsidian',
    name: 'Obsidian Stealth',
    subtitle: 'Monochrome Titanium',
    accent: '#94A3B8',
    glow: 'rgba(148, 163, 184, 0.35)',
    bgGradient: 'from-slate-900 via-neutral-950 to-black',
    borderClass: 'border-slate-500/40',
    filterClass: 'grayscale contrast-125'
  }
};

export const MayraLogo: React.FC<MayraLogoProps> = ({
  size = 48,
  className = '',
  showGlow = true,
  variant = 'raw',
  iconVariant = 'cyan_default'
}) => {
  const numericSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 48;
  const currentIconDef = LAUNCHER_ICONS[iconVariant] || LAUNCHER_ICONS.cyan_default;

  // Unclipped transparent logo for In-App UI (Header, About, Permissions, etc.)
  if (variant === 'raw' || variant === 'vector_only') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
        style={{
          width: numericSize,
          height: numericSize,
          filter: showGlow ? `drop-shadow(0 2px 8px ${currentIconDef.glow})` : undefined
        }}
      >
        <img
          src="/ic_launcher_foreground.png"
          alt="MAYRA Logo"
          className={`w-full h-full max-w-full max-h-full object-contain pointer-events-none select-none ${currentIconDef.filterClass}`}
          draggable={false}
          onError={(e) => {
            if (e.currentTarget.src !== '/mayra_logo.png') {
              e.currentTarget.src = '/mayra_logo.png';
            }
          }}
        />
      </div>
    );
  }

  // Android Adaptive Icon Safe-Zone Container (For Launcher Icon & Icon Theme Switcher)
  // Safe zone is centered 66-72dp within 108dp canvas (~72%).
  // Padding of ~14% guarantees the complete logo artwork stays fully visible inside any circular or squircle launcher mask with zero edge cropping.
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-[22%] bg-gradient-to-br ${currentIconDef.bgGradient} border ${currentIconDef.borderClass} ${className}`}
      style={{
        width: numericSize,
        height: numericSize,
        boxShadow: showGlow ? `0 4px 16px ${currentIconDef.glow}, inset 0 1px 0 rgba(255,255,255,0.15)` : 'inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-radial from-white/[0.08] to-transparent pointer-events-none" />

      {/* Exact MAYRA Logo Asset scaled safely within Android Adaptive Zone */}
      <img
        src="/ic_launcher_foreground.png"
        alt="MAYRA App Icon"
        className={`w-[74%] h-[74%] object-contain pointer-events-none select-none relative z-10 transition-transform duration-200 ${currentIconDef.filterClass}`}
        draggable={false}
        onError={(e) => {
          if (e.currentTarget.src !== '/mayra_logo.png') {
            e.currentTarget.src = '/mayra_logo.png';
          }
        }}
      />
    </div>
  );
};




