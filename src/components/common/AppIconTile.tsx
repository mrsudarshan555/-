import React from 'react';
import { LucideIcon } from 'lucide-react';
import { AppThemePreset } from '../../types';
import { getThemePreset } from '../../utils/themePresets';

export type IconTileColor = 
  | 'cyan' 
  | 'purple' 
  | 'blue' 
  | 'emerald' 
  | 'amber' 
  | 'rose' 
  | 'indigo' 
  | 'teal' 
  | 'pink' 
  | 'orange' 
  | 'slate' 
  | 'red'
  | 'theme';

export type IconTileSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AppIconTileProps {
  icon: LucideIcon | React.ReactNode;
  color?: IconTileColor;
  size?: IconTileSize;
  className?: string;
  glow?: boolean;
  themePreset?: AppThemePreset;
}

const COLOR_GRADIENTS: Record<Exclude<IconTileColor, 'theme'>, { bg: string; shadow: string }> = {
  cyan: {
    bg: 'bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700',
    shadow: 'shadow-cyan-500/25'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700',
    shadow: 'shadow-purple-500/25'
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-800',
    shadow: 'shadow-blue-500/25'
  },
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-green-800',
    shadow: 'shadow-emerald-500/25'
  },
  amber: {
    bg: 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700',
    shadow: 'shadow-amber-500/25'
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700',
    shadow: 'shadow-orange-500/25'
  },
  rose: {
    bg: 'bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700',
    shadow: 'shadow-rose-500/25'
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500 via-rose-600 to-red-700',
    shadow: 'shadow-red-500/25'
  },
  pink: {
    bg: 'bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600',
    shadow: 'shadow-pink-500/25'
  },
  indigo: {
    bg: 'bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-700',
    shadow: 'shadow-indigo-500/25'
  },
  teal: {
    bg: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-cyan-700',
    shadow: 'shadow-teal-500/25'
  },
  slate: {
    bg: 'bg-gradient-to-br from-slate-600 via-zinc-700 to-slate-800',
    shadow: 'shadow-slate-500/25'
  }
};

const SIZE_CONFIGS: Record<IconTileSize, { box: string; icon: string; rounded: string }> = {
  xs: { box: 'w-6 h-6', icon: 'w-3.5 h-3.5', rounded: 'rounded-lg' },
  sm: { box: 'w-8 h-8', icon: 'w-4 h-4', rounded: 'rounded-xl' },
  md: { box: 'w-10 h-10', icon: 'w-5 h-5', rounded: 'rounded-xl' },
  lg: { box: 'w-12 h-12', icon: 'w-6 h-6', rounded: 'rounded-2xl' },
  xl: { box: 'w-14 h-14', icon: 'w-7 h-7', rounded: 'rounded-2xl' }
};

export const AppIconTile: React.FC<AppIconTileProps> = ({
  icon,
  color = 'cyan',
  size = 'md',
  className = '',
  glow = false,
  themePreset
}) => {
  const sizeConfig = SIZE_CONFIGS[size];

  let bgClass = '';
  let shadowClass = '';

  if (color === 'theme') {
    const theme = getThemePreset(themePreset);
    bgClass = `bg-gradient-to-br ${theme.iconBgGradient}`;
    shadowClass = 'shadow-cyan-500/25';
  } else {
    const config = COLOR_GRADIENTS[color] || COLOR_GRADIENTS.cyan;
    bgClass = config.bg;
    shadowClass = config.shadow;
  }

  // Render icon whether it is a Lucide Icon component, React component, or JSX element
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, {
        className: `${sizeConfig.icon} text-white fill-white stroke-[1.25] drop-shadow-sm`,
        strokeWidth: 1.25,
        fill: 'currentColor'
      });
    }

    // Check if icon is a component (function, class, or forwardRef / memo object with $$typeof or render)
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && ('$$typeof' in icon || 'render' in icon))
    ) {
      const IconComponent = icon as React.ComponentType<any>;
      return (
        <IconComponent
          className={`${sizeConfig.icon} text-white fill-white stroke-[1.25] drop-shadow-sm`}
          strokeWidth={1.25}
          fill="currentColor"
        />
      );
    }

    if (icon && typeof icon === 'object') {
      return null;
    }

    return icon;
  };

  return (
    <div
      className={`
        ${sizeConfig.box}
        ${sizeConfig.rounded}
        ${bgClass}
        flex items-center justify-center
        shrink-0
        shadow-md
        border border-white/20
        relative
        overflow-hidden
        ${glow ? `${shadowClass} shadow-lg` : ''}
        ${className}
      `}
    >
      {/* Subtle top-light gradient sheen */}
      <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
      
      {/* Solid filled white icon */}
      <div className="relative z-10 flex items-center justify-center">
        {renderIcon()}
      </div>
    </div>
  );
};
