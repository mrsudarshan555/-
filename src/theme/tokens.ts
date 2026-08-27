/**
 * MAYRA Theme & Design System Tokens
 * Extracted and calibrated design specifications for color palettes, gradients,
 * typography, shadows, borders, radii, and layouts.
 */

export const MAYRA_TOKENS = {
  colors: {
    background: {
      obsidian: '#030712',
      deviceBezel: '#000000',
      deviceInner: '#070913',
      surfaceDark: '#080B1C',
      surfaceCard: '#0C1021',
      surfaceElevated: '#11172E',
      surfaceHover: '#171F3D',
      surfaceGlass: 'rgba(15, 23, 42, 0.75)'
    },
    borders: {
      subtle: 'rgba(255, 255, 255, 0.07)',
      medium: 'rgba(255, 255, 255, 0.14)',
      active: 'rgba(6, 182, 212, 0.4)',
      activeViolet: 'rgba(139, 92, 246, 0.4)',
      glow: 'rgba(34, 211, 238, 0.25)'
    },
    brand: {
      cyan: '#06B6D4',
      cyanBright: '#22D3EE',
      cyanGlow: 'rgba(6, 182, 212, 0.35)',
      violet: '#8B5CF6',
      violetBright: '#A855F7',
      violetGlow: 'rgba(139, 92, 246, 0.35)',
      blue: '#3B82F6',
      blueBright: '#60A5FA',
      emerald: '#10B981',
      emeraldBright: '#34D399',
      amber: '#F59E0B',
      rose: '#F43F5E'
    },
    status: {
      ready: {
        text: '#22D3EE',
        bg: 'rgba(6, 182, 212, 0.12)',
        border: 'rgba(6, 182, 212, 0.3)',
        dot: '#06B6D4',
        label: 'ONLINE • READY'
      },
      listening: {
        text: '#C084FC',
        bg: 'rgba(168, 85, 247, 0.15)',
        border: 'rgba(168, 85, 247, 0.4)',
        dot: '#A855F7',
        label: 'LISTENING • SPEAK NOW'
      },
      thinking: {
        text: '#38BDF8',
        bg: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.4)',
        dot: '#38BDF8',
        label: 'REASONING • GEMINI'
      },
      speaking: {
        text: '#34D399',
        bg: 'rgba(52, 211, 153, 0.15)',
        border: 'rgba(52, 211, 153, 0.4)',
        dot: '#10B981',
        label: 'SPEAKING...'
      }
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#CBD5E1',
      muted: '#94A3B8',
      dim: '#64748B',
      accentCyan: '#22D3EE',
      accentViolet: '#C084FC',
      accentEmerald: '#34D399'
    }
  },
  gradients: {
    heroAura: 'radial-gradient(circle at 50% 35%, rgba(6, 182, 212, 0.22) 0%, rgba(139, 92, 246, 0.12) 45%, transparent 70%)',
    avatarStage: 'radial-gradient(circle at 50% 35%, #151A38 0%, #0C1026 60%, #050713 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(14, 18, 38, 0.9) 0%, rgba(10, 13, 28, 0.95) 100%)',
    actionButton: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
    voiceButton: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)'
  },
  shadows: {
    avatarHalo: '0 0 45px rgba(6, 182, 212, 0.25), 0 0 25px rgba(139, 92, 246, 0.2)',
    cardGlow: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    micPulse: '0 0 30px rgba(99, 102, 241, 0.45)'
  },
  radii: {
    phoneBezel: 'rounded-[48px]',
    phoneScreen: 'rounded-[36px]',
    card: 'rounded-2xl',
    cardSmall: 'rounded-xl',
    pill: 'rounded-full'
  },
  typography: {
    fontSans: 'font-sans',
    fontMono: 'font-mono',
    sizes: {
      badge: 'text-[9px]',
      caption: 'text-[10px]',
      subtext: 'text-xs',
      body: 'text-sm',
      title: 'text-base',
      display: 'text-xl'
    }
  },
  layout: {
    phoneMaxWidth: 'max-w-[390px]',
    phoneHeight: 'h-[780px]',
    statusBarHeight: 'h-9',
    quickBarHeight: 'h-11',
    bottomNavHeight: 'h-16',
    gestureBarHeight: 'h-4'
  }
} as const;

export type MayraTheme = typeof MAYRA_TOKENS;
