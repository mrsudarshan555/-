import { AppThemePreset } from '../types';

export interface ThemePresetDefinition {
  id: AppThemePreset;
  name: string;
  subtitle: string;
  primaryHex: string;
  secondaryHex: string;
  accentGradient: string;
  iconBgGradient: string;
  previewSwatches: string[];
  activeText: string;
  activeBorder: string;
  activeBg: string;
  glowShadow: string;
  buttonGradient: string;
  ringColor: string;
}

export const APP_THEMES: Record<AppThemePreset, ThemePresetDefinition> = {
  cyan: {
    id: 'cyan',
    name: 'Cyan Pulse',
    subtitle: 'Luminous cyan, electric teal & neon sky blue (Default)',
    primaryHex: '#06b6d4',
    secondaryHex: '#0ea5e9',
    accentGradient: 'from-cyan-500 to-blue-600',
    iconBgGradient: 'from-cyan-500 via-sky-600 to-blue-700',
    previewSwatches: ['#06b6d4', '#0ea5e9', '#38bdf8', '#0284c7'],
    activeText: 'text-cyan-400',
    activeBorder: 'border-cyan-400/60',
    activeBg: 'bg-cyan-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(6,182,212,0.45)]',
    buttonGradient: 'from-cyan-500 via-sky-600 to-blue-600',
    ringColor: 'ring-cyan-400'
  },
  royal_blue: {
    id: 'royal_blue',
    name: 'Royal Sapphire',
    subtitle: 'Deep oceanic cobalt, electric azure & royal sapphire glow',
    primaryHex: '#2563eb',
    secondaryHex: '#3b82f6',
    accentGradient: 'from-blue-600 to-indigo-700',
    iconBgGradient: 'from-blue-500 via-indigo-600 to-blue-800',
    previewSwatches: ['#2563eb', '#3b82f6', '#60a5fa', '#1d4ed8'],
    activeText: 'text-blue-400',
    activeBorder: 'border-blue-400/60',
    activeBg: 'bg-blue-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(37,99,235,0.45)]',
    buttonGradient: 'from-blue-600 via-indigo-600 to-sky-600',
    ringColor: 'ring-blue-400'
  },
  aura_red: {
    id: 'aura_red',
    name: 'Aura Red',
    subtitle: 'Fiery crimson, ruby glow & warm dynamic pulse',
    primaryHex: '#ef4444',
    secondaryHex: '#f43f5e',
    accentGradient: 'from-red-500 to-rose-600',
    iconBgGradient: 'from-red-500 via-rose-600 to-pink-700',
    previewSwatches: ['#ef4444', '#f43f5e', '#fb7185', '#be123c'],
    activeText: 'text-rose-400',
    activeBorder: 'border-rose-400/60',
    activeBg: 'bg-rose-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(244,63,94,0.45)]',
    buttonGradient: 'from-red-500 via-rose-600 to-pink-600',
    ringColor: 'ring-rose-400'
  },
  purple: {
    id: 'purple',
    name: 'Cosmic Purple',
    subtitle: 'Deep royal purple, radiant violet & amethyst aura',
    primaryHex: '#a855f7',
    secondaryHex: '#8b5cf6',
    accentGradient: 'from-purple-500 to-indigo-600',
    iconBgGradient: 'from-purple-500 via-violet-600 to-indigo-700',
    previewSwatches: ['#a855f7', '#8b5cf6', '#c084fc', '#6d28d9'],
    activeText: 'text-purple-400',
    activeBorder: 'border-purple-400/60',
    activeBg: 'bg-purple-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(168,85,247,0.45)]',
    buttonGradient: 'from-purple-500 via-violet-600 to-indigo-600',
    ringColor: 'ring-purple-400'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Cyber',
    subtitle: 'Vivid neon emerald, jade glow & matrix cyber mint',
    primaryHex: '#10b981',
    secondaryHex: '#059669',
    accentGradient: 'from-emerald-500 to-teal-600',
    iconBgGradient: 'from-emerald-500 via-teal-600 to-green-700',
    previewSwatches: ['#10b981', '#059669', '#34d399', '#047857'],
    activeText: 'text-emerald-400',
    activeBorder: 'border-emerald-400/60',
    activeBg: 'bg-emerald-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.45)]',
    buttonGradient: 'from-emerald-500 via-teal-600 to-cyan-600',
    ringColor: 'ring-emerald-400'
  },
  amber: {
    id: 'amber',
    name: 'Sunset Amber',
    subtitle: 'Golden amber glow, warm topaz & solar twilight',
    primaryHex: '#f59e0b',
    secondaryHex: '#d97706',
    accentGradient: 'from-amber-500 to-orange-600',
    iconBgGradient: 'from-amber-500 via-orange-600 to-yellow-600',
    previewSwatches: ['#f59e0b', '#d97706', '#fbbf24', '#b45309'],
    activeText: 'text-amber-400',
    activeBorder: 'border-amber-400/60',
    activeBg: 'bg-amber-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(245,158,11,0.45)]',
    buttonGradient: 'from-amber-500 via-orange-500 to-yellow-500',
    ringColor: 'ring-amber-400'
  },
  rose_pink: {
    id: 'rose_pink',
    name: 'Cyber Magenta',
    subtitle: 'Vibrant neon magenta, electric rose & synthwave pink',
    primaryHex: '#ec4899',
    secondaryHex: '#d946ef',
    accentGradient: 'from-pink-500 to-fuchsia-600',
    iconBgGradient: 'from-pink-500 via-rose-500 to-fuchsia-700',
    previewSwatches: ['#ec4899', '#d946ef', '#f472b6', '#a21caf'],
    activeText: 'text-pink-400',
    activeBorder: 'border-pink-400/60',
    activeBg: 'bg-pink-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(236,72,153,0.45)]',
    buttonGradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
    ringColor: 'ring-pink-400'
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Obsidian',
    subtitle: 'Sleek indigo steel, deep sapphire & cyber nebula',
    primaryHex: '#6366f1',
    secondaryHex: '#3b82f6',
    accentGradient: 'from-indigo-500 to-sky-600',
    iconBgGradient: 'from-indigo-600 via-blue-700 to-slate-900',
    previewSwatches: ['#6366f1', '#3b82f6', '#818cf8', '#1e1b4b'],
    activeText: 'text-indigo-400',
    activeBorder: 'border-indigo-400/60',
    activeBg: 'bg-indigo-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(99,102,241,0.45)]',
    buttonGradient: 'from-indigo-500 via-blue-600 to-slate-800',
    ringColor: 'ring-indigo-400'
  },
  orange: {
    id: 'orange',
    name: 'Solar Flame',
    subtitle: 'Radiant citrus magma, neon orange & solar flare energy',
    primaryHex: '#f97316',
    secondaryHex: '#ea580c',
    accentGradient: 'from-orange-500 to-red-600',
    iconBgGradient: 'from-orange-500 via-amber-600 to-red-700',
    previewSwatches: ['#f97316', '#ea580c', '#fb923c', '#c2410c'],
    activeText: 'text-orange-400',
    activeBorder: 'border-orange-400/60',
    activeBg: 'bg-orange-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(249,115,22,0.45)]',
    buttonGradient: 'from-orange-500 via-amber-600 to-red-600',
    ringColor: 'ring-orange-400'
  },
  teal: {
    id: 'teal',
    name: 'Oceanic Teal',
    subtitle: 'Deep sea turquoise, crystalline teal & aqua matrix',
    primaryHex: '#14b8a6',
    secondaryHex: '#0d9488',
    accentGradient: 'from-teal-500 to-cyan-600',
    iconBgGradient: 'from-teal-500 via-emerald-600 to-cyan-700',
    previewSwatches: ['#14b8a6', '#0d9488', '#2dd4bf', '#0f766e'],
    activeText: 'text-teal-400',
    activeBorder: 'border-teal-400/60',
    activeBg: 'bg-teal-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(20,184,166,0.45)]',
    buttonGradient: 'from-teal-500 via-emerald-600 to-cyan-600',
    ringColor: 'ring-teal-400'
  },
  lime: {
    id: 'lime',
    name: 'Lime Matrix',
    subtitle: 'Acid cyber lime, electric chartreuse & radioactive glow',
    primaryHex: '#84cc16',
    secondaryHex: '#65a30d',
    accentGradient: 'from-lime-500 to-emerald-600',
    iconBgGradient: 'from-lime-500 via-green-600 to-emerald-700',
    previewSwatches: ['#84cc16', '#65a30d', '#a3e635', '#4d7c0f'],
    activeText: 'text-lime-400',
    activeBorder: 'border-lime-400/60',
    activeBg: 'bg-lime-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(132,204,22,0.45)]',
    buttonGradient: 'from-lime-500 via-green-500 to-emerald-600',
    ringColor: 'ring-lime-400'
  },
  gold: {
    id: 'gold',
    name: 'Champagne Gold',
    subtitle: 'Luxurious 24K gold luster, metallic bronze & warm aura',
    primaryHex: '#eab308',
    secondaryHex: '#ca8a04',
    accentGradient: 'from-yellow-500 via-amber-500 to-amber-600',
    iconBgGradient: 'from-yellow-400 via-amber-500 to-orange-600',
    previewSwatches: ['#eab308', '#ca8a04', '#fde047', '#a16207'],
    activeText: 'text-yellow-400',
    activeBorder: 'border-yellow-400/60',
    activeBg: 'bg-yellow-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(234,179,8,0.45)]',
    buttonGradient: 'from-yellow-400 via-amber-500 to-orange-500',
    ringColor: 'ring-yellow-400'
  },
  slate: {
    id: 'slate',
    name: 'Titanium Slate',
    subtitle: 'Minimalist stealth titanium, pure graphite & silver alloy',
    primaryHex: '#94a3b8',
    secondaryHex: '#64748b',
    accentGradient: 'from-slate-500 to-zinc-600',
    iconBgGradient: 'from-slate-500 via-zinc-600 to-slate-800',
    previewSwatches: ['#94a3b8', '#64748b', '#cbd5e1', '#334155'],
    activeText: 'text-slate-300',
    activeBorder: 'border-slate-400/60',
    activeBg: 'bg-slate-500/20',
    glowShadow: 'shadow-[0_0_20px_rgba(148,163,184,0.45)]',
    buttonGradient: 'from-slate-600 via-zinc-600 to-slate-700',
    ringColor: 'ring-slate-400'
  }
};

export function getThemePreset(themeId?: AppThemePreset): ThemePresetDefinition {
  if (themeId && APP_THEMES[themeId]) {
    return APP_THEMES[themeId];
  }
  return APP_THEMES.cyan;
}
