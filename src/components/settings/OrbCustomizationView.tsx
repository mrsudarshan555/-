import React, { useState } from 'react';
import { AppearanceConfig, OrbStyleType, OrbColorType, OrbTypePreset, AppLauncherIconVariant, AssistantStatus } from '../../types';
import { MayraOrb, ORB_STYLES, ORB_COLORS, normalizeOrbStyle } from '../character/MayraOrb';
import { LAUNCHER_ICONS, MayraLogo } from '../common/MayraLogo';
import { AppIconTile } from '../common/AppIconTile';
import { 
  ArrowLeft, Sparkles, Sliders, 
  Palette, Radio, Eye, Volume2, ShieldCheck, 
  RotateCcw, CheckCircle2, Zap, Sun, Orbit, Layers, Flame, LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrbCustomizationViewProps {
  config: AppearanceConfig;
  onChange: (updated: Partial<AppearanceConfig>) => void;
  onBack: () => void;
  onNavigateToAppearance?: () => void;
}

export const OrbCustomizationView: React.FC<OrbCustomizationViewProps> = ({
  config,
  onChange,
  onBack,
  onNavigateToAppearance
}) => {
  const isDark = config.darkMode ?? true;
  const [previewStatus, setPreviewStatus] = useState<AssistantStatus>('SPEAKING');

  const currentOrbType: OrbTypePreset = config.orbType || 'classic';
  const currentHue = config.customHue ?? 190;
  const hasCustomHue = config.customHue !== undefined;
  const currentLauncherIcon: AppLauncherIconVariant = config.launcherIconVariant || 'cyan_default';
  const currentNormalizedStyle = normalizeOrbStyle(config.orbStyle);
  const currentStyleDef = ORB_STYLES.find(s => s.id === currentNormalizedStyle) || ORB_STYLES[0];

  const handleOrbTypeSelect = (type: OrbTypePreset) => {
    onChange({ orbType: type });
  };

  const handleHueSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange({ customHue: val });
  };

  const handleResetHueToPreset = () => {
    onChange({ customHue: undefined });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ orbSize: parseInt(e.target.value, 10) });
  };

  const handleToggleVoiceVisualizer = () => {
    onChange({ voiceVisualizerEnabled: !(config.voiceVisualizerEnabled ?? true) });
  };

  const handleToggleAuraBorder = () => {
    onChange({ auraBorderMode: !(config.auraBorderMode ?? false) });
  };

  const handleSelectLauncherIcon = (variant: AppLauncherIconVariant) => {
    onChange({ launcherIconVariant: variant });
  };

  const orbTypesList: { id: OrbTypePreset; label: string; desc: string; icon: LucideIcon; color: 'cyan' | 'amber' | 'pink' | 'purple' }[] = [
    { 
      id: 'classic', 
      label: 'Classic', 
      desc: 'Pure harmonic geometry & natural core radiance',
      icon: Orbit,
      color: 'cyan'
    },
    { 
      id: 'energy', 
      label: 'Energy', 
      desc: 'Coronal plasma flares & high-velocity particle spikes',
      icon: Zap,
      color: 'amber'
    },
    { 
      id: 'neon', 
      label: 'Neon', 
      desc: 'High-luminescence electric halo & chromatic boundary ring',
      icon: Flame,
      color: 'pink'
    },
    { 
      id: 'hologram', 
      label: 'Hologram', 
      desc: 'Tactical HUD scanlines, telemetry ticks & digital matrix',
      icon: Layers,
      color: 'purple'
    }
  ];

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
            <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-800'}`} />
          </button>
          <div className="flex items-center gap-2.5">
            <AppIconTile icon={Sparkles} color="cyan" size="sm" />
            <div>
              <h1 className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Orb Customization Studio
              </h1>
              <p className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Rendering Engine & Aura Presence
              </p>
            </div>
          </div>
        </div>

        {onNavigateToAppearance && (
          <button
            onClick={onNavigateToAppearance}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
              isDark 
                ? 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/50' 
                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Styles
          </button>
        )}
      </div>

      {/* Main Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">

        {/* (a) LARGE LIVE PREVIEW BOX */}
        <section className={`p-4 rounded-2xl border relative overflow-hidden transition-all ${
          isDark 
            ? 'bg-gradient-to-b from-[#0e142c] via-[#090d1f] to-[#060815] border-cyan-500/25 shadow-[0_8px_30px_rgba(6,182,212,0.15)]' 
            : 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white border-slate-700 shadow-md'
        }`}>
          {/* Subtle Ambient Radial Glow */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40 blur-2xl transition-all duration-500"
            style={{
              background: hasCustomHue 
                ? `radial-gradient(circle at center, hsl(${currentHue}, 90%, 55%) 0%, transparent 70%)`
                : 'radial-gradient(circle at center, rgba(6,182,212,0.6) 0%, transparent 70%)'
            }}
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Header Badge */}
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  LIVE REAL-TIME ENGINE PREVIEW
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15">
                {currentStyleDef.name} • {currentOrbType.toUpperCase()}
              </span>
            </div>

            {/* Central Orb Stage */}
            <div className="py-5 flex items-center justify-center min-h-[170px]">
              <MayraOrb
                style={config.orbStyle}
                color={config.orbColor}
                orbType={config.orbType || 'classic'}
                customHue={config.customHue}
                size={Math.min(Math.max(config.orbSize * 1.5, 96), 160)}
                status={previewStatus}
                interactive={true}
                onClick={() => {
                  const statuses: AssistantStatus[] = ['SPEAKING', 'LISTENING', 'THINKING', 'READY'];
                  const next = statuses[(statuses.indexOf(previewStatus) + 1) % statuses.length];
                  setPreviewStatus(next);
                }}
              />
            </div>

            {/* Simulation Status Controls */}
            <div className="w-full pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Simulate Status:
              </span>
              <div className="flex items-center gap-1">
                {(['READY', 'LISTENING', 'THINKING', 'SPEAKING'] as AssistantStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPreviewStatus(st)}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all ${
                      previewStatus === st
                        ? 'bg-cyan-500 text-slate-950 shadow-sm font-extrabold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* (b) 'ORB TYPE' QUICK-SELECT BUTTONS */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest ${
              isDark ? 'text-cyan-400' : 'text-cyan-600'
            }`}>
              ORB RENDERING TYPE
            </h3>
            <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Visual Treatment Layer
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {orbTypesList.map((type) => {
              const isSelected = currentOrbType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleOrbTypeSelect(type.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? isDark
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                        : 'bg-cyan-50 border-cyan-500 shadow-sm ring-1 ring-cyan-500'
                      : isDark
                      ? 'bg-[#0C1021] border-white/5 hover:bg-white/5 hover:border-white/15'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <AppIconTile icon={type.icon} color={type.color} size="xs" />
                      <span className={`font-bold text-xs tracking-tight ${
                        isSelected 
                          ? isDark ? 'text-white' : 'text-cyan-950'
                          : isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {type.label}
                      </span>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </div>

                  <p className={`text-[10px] font-normal leading-relaxed mt-1 line-clamp-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {type.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* (c) ADJUST ORB SIZE SLIDER */}
        <section className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#0C1021] border-white/10 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <AppIconTile icon={Sliders} color="blue" size="xs" />
              <div>
                <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Adjust Orb Size
                </h4>
                <p className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Continuous scaling for home stage & widget
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
              isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-100 text-cyan-800'
            }`}>
              {config.orbSize} dp
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="44"
              max="120"
              step="2"
              value={config.orbSize}
              onChange={handleSizeChange}
              className="w-full h-2 bg-slate-700/60 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] font-mono font-normal text-slate-400 px-1">
              <span>Compact (44dp)</span>
              <span>Standard (64dp)</span>
              <span>Large (96dp)</span>
              <span>Immersive (120dp)</span>
            </div>
          </div>
        </section>

        {/* (d) ADJUST COLOR HUE: CONTINUOUS RAINBOW GRADIENT SLIDER */}
        <section className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#0C1021] border-white/10 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <AppIconTile icon={Palette} color="pink" size="xs" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Adjust Color Hue
                  </h4>
                  {hasCustomHue && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      SPECTRUM HUE
                    </span>
                  )}
                </div>
                <p className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Full 360° continuous rainbow spectrum slider
                </p>
              </div>
            </div>

            {hasCustomHue ? (
              <button
                onClick={handleResetHueToPreset}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  isDark ? 'bg-white/10 hover:bg-white/15 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Reset to preset color swatch"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}>
                Preset: {config.orbColor.toUpperCase()}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* Rainbow Spectrum Track */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={currentHue}
                onChange={handleHueSliderChange}
                className="w-full h-4 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                }}
              />
            </div>

            {/* Current Selected Color Swatch & Value */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: `hsl(${currentHue}, 95%, 55%)` }}
                />
                <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Hue: {currentHue}°
                </span>
              </div>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {hasCustomHue ? 'Continuous Custom Palette' : 'Sliding overrides preset'}
              </span>
            </div>
          </div>
        </section>

        {/* (e & f) SYSTEM PRESENCE & INTERACTIVE VISUALIZERS */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest ${
              isDark ? 'text-cyan-400' : 'text-cyan-600'
            }`}>
              SYSTEM PRESENCE & VISUALIZERS
            </h3>
            <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Voice Reactivity & Edge Glow
            </span>
          </div>

          <div className={`border rounded-2xl overflow-hidden divide-y ${
            isDark 
              ? 'bg-[#0C1021] border-white/5 divide-white/5 shadow-lg' 
              : 'bg-white border-slate-200 divide-slate-100 shadow-xs'
          }`}>
            
            {/* (e) Voice Visualizer Toggle */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3 pr-2">
                <AppIconTile icon={Volume2} color="cyan" size="xs" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Voice Visualizer Presence
                    </span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      (config.voiceVisualizerEnabled ?? true)
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {(config.voiceVisualizerEnabled ?? true) ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                  <p className={`text-[10px] font-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Ambient orb dot sits quietly at idle and dynamically expands in real-time while MAYRA is speaking
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleVoiceVisualizer}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative shrink-0 ${
                  (config.voiceVisualizerEnabled ?? true) ? 'bg-cyan-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  (config.voiceVisualizerEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* (f) Aura Border Mode Toggle */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3 pr-2">
                <AppIconTile icon={ShieldCheck} color="purple" size="xs" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Aura Border Mode
                    </span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      (config.auraBorderMode ?? false)
                        ? 'bg-purple-950/80 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {(config.auraBorderMode ?? false) ? 'AURA ON' : 'OFF'}
                    </span>
                  </div>
                  <p className={`text-[10px] font-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Shows a thin, rotating glowing chromatic aura border around the phone screen bezel
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleAuraBorder}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative shrink-0 ${
                  (config.auraBorderMode ?? false) ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  (config.auraBorderMode ?? false) ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

          </div>
        </section>

        {/* 3. ALTERNATE APP LAUNCHER ICON VARIANTS */}
        <section className="space-y-2 pb-6">
          <div className="flex items-center justify-between px-1">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest ${
              isDark ? 'text-cyan-400' : 'text-cyan-600'
            }`}>
              APP LAUNCHER ICON THEMES
            </h3>
            <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Dynamic Insignia Styling
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {Object.values(LAUNCHER_ICONS).map((iconDef) => {
              const isSelected = currentLauncherIcon === iconDef.id;
              return (
                <button
                  key={iconDef.id}
                  onClick={() => handleSelectLauncherIcon(iconDef.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col items-center text-center ${
                    isSelected
                      ? isDark
                        ? 'bg-[#0E152D] border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : 'bg-cyan-50 border-cyan-500 shadow-sm ring-1 ring-cyan-500'
                      : isDark
                      ? 'bg-[#0C1021] border-white/5 hover:bg-white/5'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="mb-2">
                    <MayraLogo 
                      size={44} 
                      iconVariant={iconDef.id} 
                      showGlow={isSelected} 
                    />
                  </div>

                  <span className={`font-bold text-xs tracking-tight ${
                    isSelected 
                      ? isDark ? 'text-white font-extrabold' : 'text-cyan-950 font-extrabold'
                      : isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {iconDef.name}
                  </span>

                  <p className={`text-[9px] font-normal mt-0.5 line-clamp-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {iconDef.subtitle}
                  </p>

                  {isSelected && (
                    <div className="mt-1.5 flex items-center gap-1 text-[9px] font-mono font-bold text-cyan-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
