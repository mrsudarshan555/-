import React, { useState } from 'react';
import { AppearanceConfig, OrbStyleType, OrbColorType, AppThemePreset, HeadingFontType, CameraAspectRatio } from '../../types';
import { MayraOrb, ORB_STYLES, ORB_COLORS, normalizeOrbStyle } from '../character/MayraOrb';
import { AppIconTile } from '../common/AppIconTile';
import { APP_THEMES, getThemePreset } from '../../utils/themePresets';
import { 
  ArrowLeft, Moon, Sun, Sparkles, 
  Palette, Sliders, CheckCircle2, LayoutTemplate, X, Grid2X2, Compass, Droplet, Type, Camera, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppearanceViewProps {
  config: AppearanceConfig;
  onChange: (updated: Partial<AppearanceConfig>) => void;
  onBack: () => void;
  onNavigateToOrbStudio?: () => void;
}

const CAMERA_ASPECT_RATIO_OPTIONS: { id: CameraAspectRatio; name: string; subtitle: string; iconLabel: string }[] = [
  {
    id: '9:16',
    name: '9:16 (Portrait)',
    subtitle: 'Tall mobile view (Default)',
    iconLabel: '9:16'
  },
  {
    id: '3:4',
    name: '3:4 (Classic Portrait)',
    subtitle: 'Standard portrait camera format',
    iconLabel: '3:4'
  },
  {
    id: '1:1',
    name: '1:1 (Square)',
    subtitle: 'Balanced square scan frame',
    iconLabel: '1:1'
  },
  {
    id: '4:3',
    name: '4:3 (Standard)',
    subtitle: 'Wide compact preview frame',
    iconLabel: '4:3'
  },
  {
    id: 'full',
    name: 'Full Screen',
    subtitle: 'Expands across entire scanner card',
    iconLabel: 'FULL'
  }
];

const FONT_OPTIONS: { id: HeadingFontType; name: string; subtitle: string; previewClass: string; sample: string }[] = [
  {
    id: 'system',
    name: 'System Default',
    subtitle: 'Native Roboto / San Francisco Clean Font',
    previewClass: 'font-system',
    sample: 'MAYRA 2.0 • AI ASSISTANT'
  },
  {
    id: 'orbitron',
    name: 'Orbitron',
    subtitle: 'Futuristic Cyberpunk Display Font',
    previewClass: 'font-orbitron',
    sample: 'MAYRA 2.0 • AI ASSISTANT'
  },
  {
    id: 'sora',
    name: 'Sora',
    subtitle: 'Modern Geometric Tech Interface Font',
    previewClass: 'font-sora',
    sample: 'MAYRA 2.0 • AI ASSISTANT'
  },
  {
    id: 'manrope',
    name: 'Manrope',
    subtitle: 'Contemporary Semi-rounded Grotesque',
    previewClass: 'font-manrope',
    sample: 'MAYRA 2.0 • AI ASSISTANT'
  },
  {
    id: 'space_grotesk',
    name: 'Space Grotesk',
    subtitle: 'Cybernetic Tech Monospaced Proportions',
    previewClass: 'font-space-grotesk',
    sample: 'MAYRA 2.0 • AI ASSISTANT'
  }
];

export const AppearanceView: React.FC<AppearanceViewProps> = ({
  config,
  onChange,
  onBack,
  onNavigateToOrbStudio
}) => {
  const [isMoreStylesOpen, setIsMoreStylesOpen] = useState(false);
  const isDark = config.darkMode;

  const currentNormalizedStyle = normalizeOrbStyle(config.orbStyle);
  const selectedThemeId: AppThemePreset = config.appTheme || 'cyan';
  const currentTheme = getThemePreset(selectedThemeId);
  const selectedFontId: HeadingFontType = config.headingFont || 'system';
  const currentFontDef = FONT_OPTIONS.find(f => f.id === selectedFontId) || FONT_OPTIONS[0];

  const handleToggleDarkMode = () => {
    onChange({ darkMode: !config.darkMode });
  };

  const handleSelectTheme = (themeId: AppThemePreset) => {
    onChange({ appTheme: themeId });
  };

  const handleSelectOrbStyle = (style: OrbStyleType) => {
    onChange({ orbStyle: style });
  };

  const handleSelectOrbColor = (color: OrbColorType) => {
    onChange({ orbColor: color, customHue: undefined });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ orbSize: parseInt(e.target.value, 10) });
  };

  const handleToggleHomeOrb = () => {
    onChange({ useOrbOnHome: !config.useOrbOnHome });
  };

  const colorEntries = Object.values(ORB_COLORS);
  const themeEntries = Object.values(APP_THEMES);

  // Show top 5 styles on main page + 6th slot is "More styles" card
  const primaryStyles = ORB_STYLES.slice(0, 5);
  const currentSelectedStyleDef = ORB_STYLES.find(s => s.id === currentNormalizedStyle) || ORB_STYLES[0];

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden select-none transition-colors duration-200 ${
      isDark ? 'bg-[#070914] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top App Bar */}
      <div className={`h-14 px-4 border-b flex items-center justify-between z-10 shrink-0 ${
        isDark ? 'bg-[#080B1C] border-white/5' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2 -ml-1 rounded-full transition-all active:scale-95 ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Back to Settings"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <AppIconTile icon={Palette} color="purple" size="sm" />
            <h1 className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Appearance & Display
            </h1>
          </div>
        </div>

        {onNavigateToOrbStudio && (
          <button
            onClick={onNavigateToOrbStudio}
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              isDark 
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                : 'bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span>Orb Studio</span>
          </button>
        )}
      </div>

      {/* Settings Scroll Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-none">

        {/* 1. APP THEME PRESET PICKER */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <AppIconTile icon={Droplet} color="theme" size="xs" themePreset={selectedThemeId} />
              <div>
                <h2 className={`font-bold text-[10px] uppercase tracking-widest ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  APP ACCENT THEME
                </h2>
                <p className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Recolor interface accents, icon tiles, and highlights app-wide
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${currentTheme.activeBg} ${currentTheme.activeText} ${currentTheme.activeBorder}`}>
              {currentTheme.name}
            </span>
          </div>

          {/* Theme Preset Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {themeEntries.map((themeItem) => {
              const isSelected = selectedThemeId === themeItem.id;
              return (
                <button
                  key={themeItem.id}
                  onClick={() => handleSelectTheme(themeItem.id)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between relative transition-all active:scale-[0.99] text-left ${
                    isSelected
                      ? isDark
                        ? `bg-[#10162E] ${themeItem.activeBorder} ${themeItem.glowShadow} ring-1 ${themeItem.ringColor}`
                        : `${themeItem.activeBg} ${themeItem.activeBorder} shadow-md ring-2 ${themeItem.ringColor}`
                      : isDark
                        ? 'bg-[#0C1021] border-white/10 hover:border-white/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Swatches Stack */}
                    <div className="flex -space-x-1.5 shrink-0">
                      {themeItem.previewSwatches.map((colorHex, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-full border-2 border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: colorHex }}
                        />
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${
                          isSelected ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-slate-200' : 'text-slate-800')
                        }`}>
                          {themeItem.name}
                        </span>
                        {themeItem.id === 'cyan' && (
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] font-normal mt-0.5 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {themeItem.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className={themeItem.activeText}>
                      <CheckCircle2 className="w-5 h-5 fill-current" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. FEATURED: ORB CUSTOMIZATION STUDIO PROMOTION CARD */}
        {onNavigateToOrbStudio && (
          <div 
            onClick={onNavigateToOrbStudio}
            className={`p-4 rounded-2xl border cursor-pointer relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] ${
              isDark 
                ? 'bg-gradient-to-r from-[#0C122C] via-[#101736] to-[#140E2A] border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.15)]' 
                : 'bg-gradient-to-r from-cyan-50 via-white to-purple-50 border-cyan-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                  <MayraOrb
                    style={config.orbStyle}
                    color={config.orbColor}
                    orbType={config.orbType}
                    customHue={config.customHue}
                    size={42}
                    status="SPEAKING"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Orb Customization Studio
                    </h3>
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      STUDIO
                    </span>
                  </div>
                  <p className={`text-xs font-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Continuous rainbow hue slider, voice visualizer & aura border
                  </p>
                </div>
              </div>
              <AppIconTile icon={Sparkles} color="cyan" size="sm" glow={true} />
            </div>
          </div>
        )}

        {/* 3. DARK MODE CARD */}
        <section className={`p-4 rounded-2xl border transition-all ${
          isDark 
            ? 'bg-[#0C1021] border-white/10 shadow-lg' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <AppIconTile 
                icon={isDark ? Moon : Sun} 
                color={isDark ? 'purple' : 'amber'} 
                size="md" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Dark Mode
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isDark ? 'Obsidian Dark' : 'Clean Light'}
                  </span>
                </div>
                <p className={`text-xs font-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Switch between Dark and Light themes across the entire app
                </p>
              </div>
            </div>

            {/* Switch Toggle */}
            <button
              onClick={handleToggleDarkMode}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out relative shrink-0 ${
                isDark ? 'bg-purple-600' : 'bg-slate-300'
              }`}
              title="Toggle Dark/Light Mode"
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isDark ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* 4. TEXT STYLE (HEADING FONT) PICKER */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <AppIconTile icon={Type} color="blue" size="xs" />
              <div>
                <h2 className={`font-bold text-[10px] uppercase tracking-widest ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  TEXT STYLE (HEADING FONT)
                </h2>
                <p className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Choose the typography style applied to headers and display titles
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
              isDark ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' : 'bg-cyan-50 text-cyan-700 border-cyan-300'
            }`}>
              {currentFontDef.name}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {FONT_OPTIONS.map((fontItem) => {
              const isSelected = selectedFontId === fontItem.id;
              return (
                <button
                  key={fontItem.id}
                  onClick={() => onChange({ headingFont: fontItem.id })}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between relative transition-all active:scale-[0.99] text-left ${
                    isSelected
                      ? isDark
                        ? 'bg-[#10162E] border-cyan-500/60 shadow-[0_0_16px_rgba(6,182,212,0.18)] ring-1 ring-cyan-400/40'
                        : 'bg-cyan-50/60 border-cyan-500 shadow-sm ring-2 ring-cyan-400/30'
                      : isDark
                        ? 'bg-[#0C1021] border-white/10 hover:border-white/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                        : isDark
                        ? 'bg-slate-800/60 border-white/10 text-slate-400'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      <span className={fontItem.previewClass}>Aa</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${
                          isSelected ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-slate-200' : 'text-slate-800')
                        }`}>
                          {fontItem.name}
                        </span>
                        {fontItem.id === 'system' && (
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] font-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {fontItem.subtitle}
                      </p>
                      <p className={`text-[11px] font-bold mt-1 tracking-wider ${fontItem.previewClass} ${
                        isSelected ? 'text-cyan-400' : isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {fontItem.sample}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="text-cyan-400 ml-2 shrink-0">
                      <CheckCircle2 className="w-5 h-5 fill-current" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. ORB STYLE PICKER */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className={`font-bold text-[10px] uppercase tracking-widest ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                ORB STYLE SELECTION
              </h2>
              <p className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Procedural animated canvas avatars with dynamic quantum physics
              </p>
            </div>
            <button
              onClick={() => setIsMoreStylesOpen(true)}
              className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-400/30 font-bold transition-colors"
            >
              <span>{currentSelectedStyleDef.name}</span>
              <span className="text-[10px] text-cyan-300/70">• Browse all</span>
            </button>
          </div>

          {/* Top 5 Orb Cards + 1 'More styles' Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {primaryStyles.map((styleItem) => {
              const isSelected = currentNormalizedStyle === styleItem.id;
              return (
                <button
                  key={styleItem.id}
                  onClick={() => handleSelectOrbStyle(styleItem.id)}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 relative transition-all active:scale-[0.98] ${
                    isSelected
                      ? isDark
                        ? 'bg-[#121832] border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                        : 'bg-cyan-50/80 border-cyan-500 shadow-md ring-2 ring-cyan-400/30'
                      : isDark
                        ? 'bg-[#0C1021] border-white/10 hover:border-white/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {/* Selected Indicator Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 text-cyan-400">
                      <CheckCircle2 className="w-4 h-4 fill-cyan-400/20" />
                    </div>
                  )}

                  {/* Live Animated Canvas Orb Preview */}
                  <div className="w-16 h-16 flex items-center justify-center">
                    <MayraOrb
                      style={styleItem.id}
                      color={config.orbColor}
                      orbType={config.orbType}
                      customHue={config.customHue}
                      size={58}
                      status="READY"
                    />
                  </div>

                  {/* Title & Short Description */}
                  <div className="text-center w-full">
                    <p className={`font-bold text-xs truncate ${
                      isSelected 
                        ? isDark ? 'text-cyan-300' : 'text-cyan-700' 
                        : isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                      {styleItem.name}
                    </p>
                    <p className={`text-[10px] font-normal mt-0.5 line-clamp-2 leading-tight ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {styleItem.description}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* 6th Card: More styles (Opens Sheet / Dialog) */}
            <button
              onClick={() => setIsMoreStylesOpen(true)}
              className={`p-3 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 relative transition-all active:scale-[0.98] group ${
                isDark 
                  ? 'bg-purple-950/20 border-purple-400/40 hover:border-purple-400 hover:bg-purple-950/40' 
                  : 'bg-purple-50/60 border-purple-300 hover:border-purple-500 hover:bg-purple-50'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-cyan-500/20 flex items-center justify-center border border-purple-400/30 group-hover:scale-105 transition-transform">
                <Grid2X2 className="w-7 h-7 text-purple-400 group-hover:text-purple-300 transition-colors" />
              </div>
              <div className="text-center w-full">
                <p className={`font-bold text-xs ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  More styles (+10)
                </p>
                <p className={`text-[10px] font-normal mt-0.5 leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Explore full library of 15 animated cores
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* 5. COLOUR SWATCHES */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className={`font-bold text-[10px] uppercase tracking-widest ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                PRESET PALETTES
              </h2>
              <p className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Select the energy resonance tint for the orb and aura
              </p>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
              config.orbColor === 'spectrum'
                ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                : 'bg-cyan-500/15 text-cyan-400 border-cyan-400/30'
            }`}>
              {ORB_COLORS[config.orbColor]?.name}
            </span>
          </div>

          {/* Color Swatch Row with Gradient First */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 overflow-x-auto scrollbar-none ${
            isDark ? 'bg-[#0C1021] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {colorEntries.map((colorItem) => {
              const isSelected = config.orbColor === colorItem.id && config.customHue === undefined;
              return (
                <button
                  key={colorItem.id}
                  onClick={() => handleSelectOrbColor(colorItem.id)}
                  className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all ${
                    isSelected ? 'scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title={colorItem.name}
                >
                  <div
                    className={`w-9 h-9 rounded-full relative flex items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-white shadow-lg'
                        : 'border border-white/20'
                    }`}
                    style={{
                      background: colorItem.cssGradient,
                      boxShadow: isSelected ? `0 0 14px ${colorItem.glow}` : 'none'
                    }}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                    )}
                  </div>
                  <span className={`text-[9px] font-mono truncate max-w-[52px] text-center ${
                    isSelected 
                      ? isDark ? 'text-white font-bold' : 'text-slate-900 font-bold'
                      : isDark ? 'text-slate-400 font-normal' : 'text-slate-500 font-normal'
                  }`}>
                    {colorItem.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 6. FLOATING ORB SIZE SLIDER */}
        <section className={`p-4 rounded-2xl border space-y-3.5 ${
          isDark ? 'bg-[#0C1021] border-white/10 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AppIconTile icon={Sliders} color="cyan" size="xs" />
              <div>
                <span className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Floating orb size
                </span>
                <p className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Adjust dimensions of the minimized floating overlay
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 font-mono text-xs font-bold">
              {config.orbSize} dp
            </div>
          </div>

          {/* Slider Input */}
          <div className="space-y-1.5">
            <input
              type="range"
              min="44"
              max="96"
              step="4"
              value={config.orbSize}
              onChange={handleSizeChange}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-700/50 rounded-lg appearance-none"
            />
            <div className={`flex justify-between text-[10px] font-mono font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Compact (44 dp)</span>
              <span>Default (64 dp)</span>
              <span>Large (96 dp)</span>
            </div>
          </div>

          {/* Live Floating Avatar Preview Box */}
          <div className={`p-4 rounded-xl border flex items-center justify-center min-h-[110px] relative overflow-hidden ${
            isDark ? 'bg-[#070914] border-white/5' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex flex-col items-center gap-2">
              <MayraOrb
                style={config.orbStyle}
                color={config.orbColor}
                orbType={config.orbType}
                customHue={config.customHue}
                size={config.orbSize}
                status="READY"
              />
              <span className={`text-[10px] font-mono font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentSelectedStyleDef.name} ({config.orbSize}×{config.orbSize} dp)
              </span>
            </div>
          </div>
        </section>

        {/* 7. USE ORB ON HOME TOGGLE */}
        <section className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#0C1021] border-white/10 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <AppIconTile icon={LayoutTemplate} color="blue" size="md" />
              <div className="max-w-[210px] sm:max-w-xs">
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Use the orb on Home
                </span>
                <p className={`text-xs font-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Replace the 3D character model on the Home screen with the selected orb
                </p>
              </div>
            </div>

            {/* Switch Toggle */}
            <button
              onClick={handleToggleHomeOrb}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out relative shrink-0 ${
                config.useOrbOnHome ? 'bg-cyan-500' : 'bg-slate-700/50'
              }`}
              title="Toggle Orb on Home screen"
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  config.useOrbOnHome ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* 8. VISION SCANNER CAMERA ASPECT RATIO */}
        <section className={`p-4 rounded-2xl border space-y-3.5 ${
          isDark ? 'bg-[#0C1021] border-white/10 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AppIconTile icon={Camera} color="cyan" size="xs" />
              <div>
                <span className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Vision Scanner Aspect Ratio
                </span>
                <p className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Configure camera viewfinder and scan area dimensions
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 font-mono text-xs font-bold">
              {config.cameraAspectRatio || '9:16'}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CAMERA_ASPECT_RATIO_OPTIONS.map((ratioOpt) => {
              const isSelected = (config.cameraAspectRatio || '9:16') === ratioOpt.id;
              return (
                <button
                  key={ratioOpt.id}
                  onClick={() => onChange({ cameraAspectRatio: ratioOpt.id })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                      : isDark
                      ? 'bg-[#070914] border-white/5 hover:border-white/15 text-slate-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {ratioOpt.iconLabel}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-slate-200' : 'text-slate-800')}`}>
                    {ratioOpt.name}
                  </span>
                  <span className={`text-[9px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {ratioOpt.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

      </div>

      {/* ALL 15 ORB STYLES MODAL SHEET / DIALOG */}
      <AnimatePresence>
        {isMoreStylesOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className={`w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
                isDark ? 'bg-[#0B0F22] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Header */}
              <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
                isDark ? 'bg-[#0E142C] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <AppIconTile icon={Sparkles} color="purple" size="sm" />
                  <div>
                    <h3 className="font-bold text-base">
                      Orb Styles Collection
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Select from all {ORB_STYLES.length} animated procedural designs
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMoreStylesOpen(false)}
                  className={`p-2 rounded-full transition-colors ${
                    isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Grid */}
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 scrollbar-none">
                {ORB_STYLES.map((styleItem) => {
                  const isSelected = currentNormalizedStyle === styleItem.id;
                  return (
                    <button
                      key={styleItem.id}
                      onClick={() => {
                        handleSelectOrbStyle(styleItem.id);
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-2.5 relative transition-all active:scale-[0.98] ${
                        isSelected
                          ? isDark
                            ? 'bg-[#141B3B] border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.4)]'
                            : 'bg-cyan-50 border-cyan-500 shadow-md ring-2 ring-cyan-400/40'
                          : isDark
                            ? 'bg-[#090D1E] border-white/5 hover:border-white/20'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Checkmark badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 text-cyan-400">
                          <CheckCircle2 className="w-4 h-4 fill-cyan-400/20" />
                        </div>
                      )}

                      {/* Live Animated Canvas */}
                      <div className="w-16 h-16 flex items-center justify-center">
                        <MayraOrb
                          style={styleItem.id}
                          color={config.orbColor}
                          orbType={config.orbType}
                          customHue={config.customHue}
                          size={58}
                          status="READY"
                        />
                      </div>

                      {/* Info */}
                      <div className="text-center w-full">
                        <p className={`font-bold text-xs truncate ${
                          isSelected 
                            ? isDark ? 'text-cyan-300' : 'text-cyan-700' 
                            : isDark ? 'text-white' : 'text-slate-800'
                        }`}>
                          {styleItem.name}
                        </p>
                        <p className={`text-[10px] mt-0.5 line-clamp-2 leading-tight ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {styleItem.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Action Footer */}
              <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
                isDark ? 'bg-[#0E142C] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Selected: <strong className="text-cyan-400">{currentSelectedStyleDef.name}</strong>
                </span>
                <button
                  onClick={() => setIsMoreStylesOpen(false)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
