import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Cpu, Sliders, Shield, Zap, RefreshCw, Volume2, Globe, Palette, 
  Terminal, Camera, Eye, Lock, HardDrive, Share2, Layers, CheckCircle2, 
  Trash2, User, ChevronRight, PenTool, Radio, Mic, Activity
} from 'lucide-react';
import { 
  StonicxFullSettingsState, StonicxThemeColor, StonicxFontStyle 
} from '../../types/stonicxSettings';
import { STONICX_PALETTES } from './CircuitBoardVisualizer';

interface StonicxSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToMayra: () => void;
  settings: StonicxFullSettingsState;
  onUpdateSettings: (updater: (prev: StonicxFullSettingsState) => StonicxFullSettingsState) => void;
  onOpenWhiteboard?: () => void;
  notesCount?: number;
  jobsCount?: number;
  dailyLogsCount?: number;
  onClearMemory?: () => void;
}

type SettingsTab = 
  | 'appearance' 
  | 'whiteboard'
  | 'permissions' 
  | 'personal' 
  | 'skills' 
  | 'voice_guardian' 
  | 'mesh_sync' 
  | 'memory_vault'
  | 'diagnostics';

const FONT_OPTIONS: { id: StonicxFontStyle; label: string; desc: string }[] = [
  { id: 'Orbitron', label: 'Orbitron', desc: 'Futuristic Cyber Geometric' },
  { id: 'JetBrains Mono', label: 'JetBrains Mono', desc: 'High-Density Developer Monospace' },
  { id: 'Space Grotesk', label: 'Space Grotesk', desc: 'Modern Aerospace Display' },
  { id: 'VT323', label: 'VT323', desc: 'Retro Cyberpunk Monospace' },
  { id: 'Sora', label: 'Sora', desc: 'Clean High-Tech Precision' },
  { id: 'Manrope', label: 'Manrope', desc: 'Sleek Minimalist Sans' }
];

const THEME_OPTIONS: { id: StonicxThemeColor; name: string; hex: string; desc: string }[] = [
  { id: 'cyan', name: 'Electric Cyan', hex: '#00F0FF', desc: 'Default Cyber Blue' },
  { id: 'emerald', name: 'Matrix Emerald', hex: '#00FF9D', desc: 'Neon Terminal Green' },
  { id: 'violet', name: 'Royal Violet', hex: '#C084FC', desc: 'Deep Synthwave Violet' },
  { id: 'amber', name: 'Solar Gold', hex: '#FBBF24', desc: 'High-Energy Amber' },
  { id: 'crimson', name: 'Crimson Pulse', hex: '#FB7185', desc: 'Overclocked Red' },
  { id: 'silver', name: 'Ice White', hex: '#E2E8F0', desc: 'Minimalist Clean Silver' }
];

export const StonicxSettingsModal: React.FC<StonicxSettingsModalProps> = ({
  isOpen,
  onClose,
  onSwitchToMayra,
  settings,
  onUpdateSettings,
  onOpenWhiteboard,
  notesCount = 0,
  jobsCount = 0,
  dailyLogsCount = 0,
  onClearMemory
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const currentTheme = settings.appearance.themeColor;
  const currentFont = settings.appearance.fontStyle;
  const activePal = STONICX_PALETTES[currentTheme] || STONICX_PALETTES.cyan;

  const navTabs: { id: SettingsTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'appearance', label: 'HUD & Appearance', icon: Palette },
    { id: 'whiteboard', label: 'Whiteboard Studio', icon: PenTool },
    { id: 'permissions', label: 'Permissions Center', icon: Shield },
    { id: 'personal', label: 'Personal & Identity', icon: User },
    { id: 'skills', label: 'Skills & Sub-Agents', icon: Cpu },
    { id: 'voice_guardian', label: 'Voice Guardian', icon: Mic },
    { id: 'mesh_sync', label: 'Mesh & Devices', icon: Share2 },
    { id: 'memory_vault', label: 'Memory & Vault', icon: HardDrive },
    { id: 'diagnostics', label: 'Telemetry & Engine', icon: Activity }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          style={{
            borderColor: `${activePal.primary}40`,
            boxShadow: `0 0 50px ${activePal.primary}20`
          }}
          className="w-full max-w-4xl h-[88vh] bg-[#020713] border rounded-3xl overflow-hidden flex flex-col font-sans text-slate-200"
        >
          {/* Header Bar */}
          <div 
            style={{ borderColor: `${activePal.primary}25` }}
            className="p-3.5 sm:p-4 border-b bg-[#030C1E] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div 
                style={{ 
                  backgroundColor: `${activePal.primary}15`,
                  borderColor: `${activePal.primary}40`,
                  color: activePal.primary
                }}
                className="p-2 rounded-xl border"
              >
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 
                    style={{ fontFamily: currentFont, color: activePal.primary }}
                    className="text-xs sm:text-sm font-bold tracking-wider uppercase"
                  >
                    STONICX // SYSTEM PREFERENCES
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400">
                    v4.8 REV-2
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Hardware Visualizer, HUD Typography, Audio Shield & Knowledge Base
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onSwitchToMayra();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-200" /> Switch to MAYRA
              </button>

              <button
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content Body (Sidebar Tabs + View Panel) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Sidebar Navigation */}
            <div 
              style={{ borderColor: `${activePal.primary}20` }}
              className="w-full md:w-60 border-b md:border-b-0 md:border-r bg-[#020A19]/80 p-2 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none"
            >
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      backgroundColor: isActive ? `${activePal.primary}20` : 'transparent',
                      borderColor: isActive ? `${activePal.primary}50` : 'transparent',
                      color: isActive ? activePal.primary : '#94A3B8'
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer whitespace-nowrap text-left ${
                      isActive ? 'font-bold shadow-sm' : 'hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}

              {/* Quick Launch Whiteboard in Sidebar */}
              {onOpenWhiteboard && (
                <div className="mt-auto pt-2 hidden md:block">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenWhiteboard();
                    }}
                    className="w-full p-2.5 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" /> Open Tech Whiteboard
                  </button>
                </div>
              )}
            </div>

            {/* Sub-Screen Details View */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#020611] space-y-6">
              
              {/* TAB 1: HUD & APPEARANCE (Font Style, Color Theme, Halo, Vignette) */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h4 
                      style={{ fontFamily: currentFont, color: activePal.primary }}
                      className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <Palette className="w-4 h-4" /> HUD Visualizer & Typography Engine
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Customize fonts, PCB copper trace colors, energy radiance halos, and edge vignette depth.
                    </p>
                  </div>

                  {/* 1. FONT STYLE SELECTOR */}
                  <div className="p-4 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                        <span>1. HUD Typography / Font Style</span>
                      </div>
                      <span 
                        style={{ color: activePal.primary, fontFamily: currentFont }} 
                        className="text-[11px] font-bold"
                      >
                        Active: {currentFont}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {FONT_OPTIONS.map((f) => {
                        const isSelected = currentFont === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              onUpdateSettings((prev) => ({
                                ...prev,
                                appearance: { ...prev.appearance, fontStyle: f.id }
                              }));
                            }}
                            style={{
                              borderColor: isSelected ? activePal.primary : 'rgba(255,255,255,0.08)',
                              backgroundColor: isSelected ? `${activePal.primary}15` : 'rgba(255,255,255,0.02)'
                            }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between hover:border-slate-400 ${
                              isSelected ? 'shadow-[0_0_15px_rgba(0,229,255,0.15)]' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span 
                                style={{ fontFamily: f.id }} 
                                className="text-sm font-bold text-white tracking-wide"
                              >
                                {f.label}
                              </span>
                              {isSelected && (
                                <CheckCircle2 
                                  style={{ color: activePal.primary }} 
                                  className="w-4 h-4" 
                                />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1">{f.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. THEME COLOR PRESET SELECTOR */}
                  <div className="p-4 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                        <span>2. PCB Copper & Glow Color Theme</span>
                      </div>
                      <span 
                        style={{ color: activePal.primary }} 
                        className="text-[11px] font-mono font-bold uppercase"
                      >
                        {activePal.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {THEME_OPTIONS.map((t) => {
                        const isSelected = currentTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              onUpdateSettings((prev) => ({
                                ...prev,
                                appearance: { ...prev.appearance, themeColor: t.id }
                              }));
                            }}
                            style={{
                              borderColor: isSelected ? t.hex : 'rgba(255,255,255,0.08)',
                              backgroundColor: isSelected ? `${t.hex}18` : 'rgba(255,255,255,0.02)'
                            }}
                            className="p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 hover:border-slate-400"
                          >
                            <span 
                              style={{ backgroundColor: t.hex, boxShadow: `0 0 10px ${t.hex}` }}
                              className="w-4 h-4 rounded-full shrink-0" 
                            />
                            <div className="overflow-hidden">
                              <div className="text-xs font-bold text-white truncate">{t.name}</div>
                              <div className="text-[9px] text-slate-400 truncate">{t.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. HALO INTENSITY & VIGNETTE CONTROLS */}
                  <div className="p-4 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-4">
                    <div className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      <span>3. Optical Radiance & Vignette Settings</span>
                    </div>

                    {/* Halo Intensity Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Center Radial Halo Intensity</span>
                        <span style={{ color: activePal.primary }} className="font-mono font-bold">
                          {Math.round(settings.appearance.haloIntensity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.3"
                        max="1.0"
                        step="0.05"
                        value={settings.appearance.haloIntensity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateSettings((prev) => ({
                            ...prev,
                            appearance: { ...prev.appearance, haloIntensity: val }
                          }));
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Edge Vignette Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div>
                        <div className="text-xs font-medium text-white">Cinematic Edge Vignette</div>
                        <div className="text-[10px] text-slate-400">Soft dark lens falloff around screen perimeters</div>
                      </div>
                      <button
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            appearance: { ...prev.appearance, edgeVignette: !prev.appearance.edgeVignette }
                          }));
                        }}
                        style={{
                          backgroundColor: settings.appearance.edgeVignette ? activePal.primary : 'rgba(255,255,255,0.1)'
                        }}
                        className="w-12 h-6 rounded-full transition-colors relative cursor-pointer"
                      >
                        <span 
                          className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                            settings.appearance.edgeVignette ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WHITEBOARD STUDIO SETTINGS */}
              {activeTab === 'whiteboard' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 
                        style={{ fontFamily: currentFont, color: activePal.primary }}
                        className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                      >
                        <PenTool className="w-4 h-4" /> Tech Whiteboard & Canvas Settings
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Configure default pen color, stroke thickness, canvas background theme (Dark/CAD/PCB/Light), and tech grid overlay.
                      </p>
                    </div>

                    {onOpenWhiteboard && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenWhiteboard();
                        }}
                        style={{
                          backgroundColor: `${activePal.primary}20`,
                          borderColor: `${activePal.primary}60`,
                          color: activePal.primary
                        }}
                        className="px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-lg"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Launch Whiteboard</span>
                      </button>
                    )}
                  </div>

                  {/* 1. DEFAULT PEN COLOR */}
                  <div className="p-4 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                        1. Default Pen / Stroke Color
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300 font-bold">
                        {settings.whiteboard?.defaultColor || '#00F0FF'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { color: '#00F0FF', name: 'Electric Cyan', border: '#00F0FF' },
                        { color: '#00FF9D', name: 'Matrix Emerald', border: '#00FF9D' },
                        { color: '#C084FC', name: 'Synth Violet', border: '#C084FC' },
                        { color: '#FBBF24', name: 'Solar Gold', border: '#FBBF24' },
                        { color: '#FB7185', name: 'Crimson Rose', border: '#FB7185' },
                        { color: '#FFFFFF', name: 'Ice White', border: '#FFFFFF' },
                        { color: '#F59E0B', name: 'Amber Core', border: '#F59E0B' },
                        { color: '#0F172A', name: 'Slate Charcoal', border: '#64748B' }
                      ].map((item) => {
                        const isSelected = (settings.whiteboard?.defaultColor || '#00F0FF') === item.color;
                        return (
                          <button
                            key={item.color}
                            onClick={() => {
                              onUpdateSettings((prev) => ({
                                ...prev,
                                whiteboard: {
                                  ...prev.whiteboard,
                                  defaultColor: item.color
                                }
                              }));
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                              isSelected
                                ? 'bg-white/10 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                                : 'bg-black/20 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <span 
                              className="w-4 h-4 rounded-full border shrink-0"
                              style={{ backgroundColor: item.color, borderColor: item.border }}
                            />
                            <span className="text-xs font-mono truncate">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. DEFAULT STROKE THICKNESS */}
                  <div className="p-4 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                        2. Default Stroke Thickness ({settings.whiteboard?.defaultLineWidth || 3}px)
                      </span>
                      <div 
                        className="h-3 rounded-full bg-cyan-400"
                        style={{ width: `${Math.min(60, Math.max(10, (settings.whiteboard?.defaultLineWidth || 3) * 5))}px`, height: `${Math.max(2, (settings.whiteboard?.defaultLineWidth || 3))}px` }}
                      />
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={14}
                      step={1}
                      value={settings.whiteboard?.defaultLineWidth || 3}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSettings((prev) => ({
                          ...prev,
                          whiteboard: {
                            ...prev.whiteboard,
                            defaultLineWidth: val
                          }
                        }));
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />

                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>1px (Fine Precision)</span>
                      <span>3px (Default)</span>
                      <span>8px (Bold Marker)</span>
                      <span>14px (Heavy)</span>
                    </div>
                  </div>

                  {/* 3. CANVAS BACKGROUND THEME */}
                  <div className="p-4 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      3. Canvas Background Theme
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'dark', name: '🌌 Obsidian Dark', desc: 'Deep cybernetic dark backdrop', bg: '#070914' },
                        { id: 'blueprint', name: '📐 CAD Blueprint', desc: 'High-contrast engineering blue', bg: '#04152D' },
                        { id: 'pcb_green', name: '⚡ Matrix PCB Green', desc: 'Circuit matrix green substrate', bg: '#03170D' },
                        { id: 'light', name: '☀️ Crisp Daylight', desc: 'Maximum contrast daylight mode', bg: '#F8FAFC' }
                      ].map((th) => {
                        const isSelected = (settings.whiteboard?.backgroundTheme || 'dark') === th.id;
                        return (
                          <button
                            key={th.id}
                            onClick={() => {
                              onUpdateSettings((prev) => ({
                                ...prev,
                                whiteboard: {
                                  ...prev.whiteboard,
                                  backgroundTheme: th.id as any
                                }
                              }));
                            }}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                                : 'bg-black/20 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-200">{th.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{th.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. TECH GRID OVERLAY & DEFAULT TOOL */}
                  <div className="p-4 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-200">CAD / Matrix Grid Overlay</div>
                        <div className="text-[11px] text-slate-400">Display subtle alignment grid on whiteboard canvas</div>
                      </div>
                      <button
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            whiteboard: {
                              ...prev.whiteboard,
                              gridOverlay: !(prev.whiteboard?.gridOverlay ?? true)
                            }
                          }));
                        }}
                        style={{
                          backgroundColor: (settings.whiteboard?.gridOverlay ?? true) ? activePal.primary : 'rgba(255,255,255,0.1)'
                        }}
                        className="w-12 h-6 rounded-full transition-colors relative cursor-pointer"
                      >
                        <span 
                          className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                            (settings.whiteboard?.gridOverlay ?? true) ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-200">Default Selected Tool</div>
                        <div className="text-[11px] text-slate-400">Initial active tool when whiteboard opens</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {['pen', 'highlighter', 'rect', 'circle', 'arrow'].map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              onUpdateSettings((prev) => ({
                                ...prev,
                                whiteboard: {
                                  ...prev.whiteboard,
                                  defaultTool: t as any
                                }
                              }));
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono capitalize transition-all ${
                              (settings.whiteboard?.defaultTool || 'pen') === t
                                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 font-bold'
                                : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PERMISSIONS CENTER */}
              {activeTab === 'permissions' && (
                <div className="space-y-4">
                  <div>
                    <h4 
                      style={{ fontFamily: currentFont, color: activePal.primary }}
                      className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" /> Permissions & Hardware Access Bridge
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage browser & operating system device authorizations granted to the STONICX engine.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {settings.permissions.map((perm) => {
                      return (
                        <div
                          key={perm.id}
                          className="p-3.5 bg-[#030D22] border border-cyan-500/20 rounded-2xl flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{perm.name}</span>
                              <span className="px-2 py-0.5 bg-white/5 text-[9px] font-mono text-slate-400 rounded-full border border-white/10">
                                {perm.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{perm.description}</p>
                            <span className="text-[9px] text-cyan-500/80 font-mono">Used for: {perm.requiredFor}</span>
                          </div>

                          <button
                            onClick={() => {
                              onUpdateSettings((prev) => ({
                                ...prev,
                                permissions: prev.permissions.map((p) =>
                                  p.id === perm.id ? { ...p, granted: !p.granted } : p
                                )
                              }));
                            }}
                            style={{
                              backgroundColor: perm.granted ? `${activePal.primary}25` : 'rgba(255,255,255,0.05)',
                              borderColor: perm.granted ? activePal.primary : 'rgba(255,255,255,0.1)',
                              color: perm.granted ? activePal.primary : '#94A3B8'
                            }}
                            className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                          >
                            {perm.granted ? 'GRANTED' : 'REVOKED'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: PERSONAL & IDENTITY */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <div>
                    <h4 
                      style={{ fontFamily: currentFont, color: activePal.primary }}
                      className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <User className="w-4 h-4" /> Personal Call-Sign & User Profile
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Identity attributes used by STONICX for technical tailoring and vocal address.
                    </p>
                  </div>

                  <div className="p-4 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-4 text-xs">
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">User Call-Sign / Codename</label>
                      <input
                        type="text"
                        value={settings.personal.callSign}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateSettings((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, callSign: val }
                          }));
                        }}
                        className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded-xl text-cyan-200 font-mono focus:outline-none focus:border-cyan-400"
                        placeholder="e.g. ARCHITECT-01"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-medium block mb-1">Technical Specialization</label>
                      <input
                        type="text"
                        value={settings.personal.technicalSpecialization}
                        onChange={(e) => {
                          const val = e.target.value;
                          onUpdateSettings((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, technicalSpecialization: val }
                          }));
                        }}
                        className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400"
                        placeholder="e.g. Hardware Engineering & Microcontrollers"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-medium block mb-1">Country Dial Code</label>
                        <input
                          type="text"
                          value={settings.personal.countryDialCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            onUpdateSettings((prev) => ({
                              ...prev,
                              personal: { ...prev.personal, countryDialCode: val }
                            }));
                          }}
                          className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">Communication Protocol</label>
                        <select
                          value={settings.personal.communicationTone}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            onUpdateSettings((prev) => ({
                              ...prev,
                              personal: { ...prev.personal, communicationTone: val }
                            }));
                          }}
                          className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400"
                        >
                          <option value="direct_technical">Direct Technical (Dense & Concise)</option>
                          <option value="balanced">Balanced Analytical</option>
                          <option value="comprehensive">Comprehensive Explanatory</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SKILLS & AUTONOMOUS SUB-AGENTS */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div>
                    <h4 
                      style={{ fontFamily: currentFont, color: activePal.primary }}
                      className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <Cpu className="w-4 h-4" /> Skills & Execution Sub-Agents
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Autonomous background routines and cognitive tool pipelines attached to the visualizer.
                    </p>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Cognitive Skills</span>
                    {settings.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="p-3 bg-[#030D22] border border-cyan-500/20 rounded-2xl flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{skill.name}</span>
                            {skill.badge && (
                              <span 
                                style={{ color: activePal.primary, borderColor: `${activePal.primary}40` }}
                                className="px-2 py-0.5 bg-cyan-500/10 text-[9px] font-mono rounded-full border"
                              >
                                {skill.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{skill.description}</p>
                        </div>

                        <button
                          onClick={() => {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              skills: prev.skills.map((s) =>
                                s.id === skill.id ? { ...s, enabled: !s.enabled } : s
                              )
                            }));
                          }}
                          style={{
                            backgroundColor: skill.enabled ? `${activePal.primary}20` : 'rgba(255,255,255,0.05)',
                            borderColor: skill.enabled ? activePal.primary : 'rgba(255,255,255,0.1)',
                            color: skill.enabled ? activePal.primary : '#94A3B8'
                          }}
                          className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                        >
                          {skill.enabled ? 'ACTIVE' : 'DISABLED'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Sub-agents Section */}
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Autonomous Sub-Agents</span>
                    {settings.subAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="p-3 bg-[#030D22] border border-cyan-500/20 rounded-2xl flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{agent.name}</span>
                            <span className="text-[10px] text-cyan-400 font-mono">• {agent.role}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{agent.description}</p>
                        </div>

                        <button
                          onClick={() => {
                            onUpdateSettings((prev) => ({
                              ...prev,
                              subAgents: prev.subAgents.map((a) =>
                                a.id === agent.id ? { ...a, enabled: !a.enabled } : a
                              )
                            }));
                          }}
                          style={{
                            backgroundColor: agent.enabled ? `${activePal.primary}20` : 'rgba(255,255,255,0.05)',
                            borderColor: agent.enabled ? activePal.primary : 'rgba(255,255,255,0.1)',
                            color: agent.enabled ? activePal.primary : '#94A3B8'
                          }}
                          className="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer"
                        >
                          {agent.enabled ? 'ONLINE' : 'STANDBY'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: VOICE GUARDIAN */}
              {activeTab === 'voice_guardian' && (
                <div className="space-y-4">
                  <div>
                    <h4 
                      style={{ fontFamily: currentFont, color: activePal.primary }}
                      className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <Mic className="w-4 h-4" /> Voice Guardian & Acoustic Shield
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Offline wake word sensitivity, noise gate filters, and synthetic pitch modulation.
                    </p>
                  </div>

                  <div className="p-4 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-4 text-xs">
                    {/* Wake Word Switch */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Wake Word Engine ("{settings.voiceGuardian.wakeWord}")</div>
                        <div className="text-[10px] text-slate-400">Continuous local keyword activation without cloud ping</div>
                      </div>
                      <button
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            voiceGuardian: { ...prev.voiceGuardian, wakeWordEnabled: !prev.voiceGuardian.wakeWordEnabled }
                          }));
                        }}
                        style={{
                          backgroundColor: settings.voiceGuardian.wakeWordEnabled ? activePal.primary : 'rgba(255,255,255,0.1)'
                        }}
                        className="w-12 h-6 rounded-full transition-colors relative cursor-pointer"
                      >
                        <span 
                          className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                            settings.voiceGuardian.wakeWordEnabled ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Noise Gate Sensitivity */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">Acoustic Noise Gate Filter</span>
                        <span style={{ color: activePal.primary }} className="font-mono font-bold">
                          {settings.voiceGuardian.noiseGateSensitivity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={settings.voiceGuardian.noiseGateSensitivity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onUpdateSettings((prev) => ({
                            ...prev,
                            voiceGuardian: { ...prev.voiceGuardian, noiseGateSensitivity: val }
                          }));
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Frequency Compression */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div>
                        <div className="font-bold text-white">Dynamic Frequency Compression</div>
                        <div className="text-[10px] text-slate-400">Enhances voice clarity in noisy laboratory environments</div>
                      </div>
                      <button
                        onClick={() => {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            voiceGuardian: { ...prev.voiceGuardian, frequencyCompression: !prev.voiceGuardian.frequencyCompression }
                          }));
                        }}
                        style={{
                          backgroundColor: settings.voiceGuardian.frequencyCompression ? activePal.primary : 'rgba(255,255,255,0.1)'
                        }}
                        className="w-12 h-6 rounded-full transition-colors relative cursor-pointer"
                      >
                        <span 
                          className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                            settings.voiceGuardian.frequencyCompression ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: MESH SYNC & LINKED DEVICES */}
              {activeTab === 'mesh_sync' && (
                <div className="space-y-4">
                  <div>
                    <h4 
                      style={{ fontFamily: currentFont, color: activePal.primary }}
                      className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" /> Linked Devices & Local Mesh Synchronization
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      P2P encrypted local communication and hardware telemetry sync across workstations.
                    </p>
                  </div>

                  <div className="p-4 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Local Node ID</div>
                        <div className="text-[10px] font-mono text-cyan-400">{settings.meshSync.nodeId}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-mono font-bold">
                        ● MESH ACTIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                      <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/10">
                        <div className="text-slate-400 text-[10px]">PAIRED HARDWARE NODES</div>
                        <div className="text-sm font-bold text-white font-mono mt-0.5">
                          {settings.meshSync.pairedDevicesCount} Devices Linked
                        </div>
                      </div>

                      <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/10">
                        <div className="text-slate-400 text-[10px]">SYNC INTERVAL</div>
                        <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                          Every {settings.meshSync.syncIntervalMin}m
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: MEMORY & PRIMING VAULT */}
              {activeTab === 'memory_vault' && (
                <div className="space-y-4">
                  <div>
                    <h4 
                      style={{ fontFamily: currentFont, color: activePal.primary }}
                      className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <HardDrive className="w-4 h-4" /> Memory Vault & Priming Directives
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Inspect stored topic notes, job primers, and autonomous daily diagnostic logs.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 bg-[#030D22] border border-cyan-500/20 rounded-2xl text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Topic Notes</div>
                      <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{notesCount}</div>
                    </div>
                    <div className="p-3.5 bg-[#030D22] border border-cyan-500/20 rounded-2xl text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Job Primers</div>
                      <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{jobsCount}</div>
                    </div>
                    <div className="p-3.5 bg-[#030D22] border border-cyan-500/20 rounded-2xl text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Daily Logs</div>
                      <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{dailyLogsCount}</div>
                    </div>
                  </div>

                  {/* Purge Memory Confirmation */}
                  <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl space-y-2">
                    <div className="text-xs font-bold text-red-300 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Purge Isolated Knowledge Vault
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Permanently wipes all STONICX local notes and logs (does not affect MAYRA memories).
                    </p>

                    {showClearConfirm ? (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => {
                            if (onClearMemory) onClearMemory();
                            setShowClearConfirm(false);
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Yes, Confirm Wiping Vault
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Reset STONICX Memory
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: DIAGNOSTICS & TELEMETRY */}
              {activeTab === 'diagnostics' && (
                <div className="space-y-4">
                  <div>
                    <h4 
                      style={{ fontFamily: currentFont, color: activePal.primary }}
                      className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" /> System Telemetry & Engine Diagnostics
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Real-time computing metrics and IPC bridge status.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-1">
                      <span className="text-[10px] text-slate-400">GRAPHICS ENGINE</span>
                      <div className="font-bold text-cyan-300">HTML5 60FPS Canvas</div>
                    </div>
                    <div className="p-3 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-1">
                      <span className="text-[10px] text-slate-400">PROCEDURAL SEED</span>
                      <div className="font-bold text-cyan-400">133742 (Mulberry32)</div>
                    </div>
                    <div className="p-3 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-1">
                      <span className="text-[10px] text-slate-400">ACTIVE COLOR PALETTE</span>
                      <div className="font-bold text-white uppercase">{activePal.name}</div>
                    </div>
                    <div className="p-3 bg-[#030D22] border border-cyan-500/20 rounded-2xl space-y-1">
                      <span className="text-[10px] text-slate-400">ACTIVE FONT STYLE</span>
                      <div className="font-bold text-cyan-200">{currentFont}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer Actions */}
          <div 
            style={{ borderColor: `${activePal.primary}20` }}
            className="p-3 sm:p-4 bg-[#030C1E] border-t flex items-center justify-between"
          >
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Changes applied instantly & saved to local storage
            </div>

            <button
              onClick={onClose}
              style={{
                backgroundColor: activePal.primary,
                color: '#000000',
                boxShadow: `0 0 15px ${activePal.primary}60`
              }}
              className="px-6 py-2 rounded-xl text-xs font-bold tracking-wider uppercase cursor-pointer ml-auto transition-transform active:scale-95"
            >
              SAVE & EXIT
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
