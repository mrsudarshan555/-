import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Mic, Volume2, ShieldCheck, X, Sparkles, 
  Key, Cpu, Brain, Lock, Bell, Sliders, Smartphone, Info, CheckCircle2, ShieldAlert
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('mayra_gemini_key') || '');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [voiceTone, setVoiceTone] = useState('Intelligent & Direct');
  const [sttEngine, setSttEngine] = useState('Android Native SpeechRecognizer Shell');
  const [ttsVoice, setTtsVoice] = useState('Mayra Neural Violet');
  const [micGranted, setMicGranted] = useState(true);
  const [notifGranted, setNotifGranted] = useState(true);
  const [accessService, setAccessService] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('mayra_gemini_key', apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-xl">
              <SettingsIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                MAYRA SYSTEM SETTINGS
              </h2>
              <p className="text-[10px] font-mono text-slate-400">Phase 1 UI Foundation & Settings Architecture Shells</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          
          {/* Section 1: Voice & Speech Settings */}
          <div className="p-4 bg-[#111118] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
              <Volume2 className="w-4 h-4" /> 1. Voice & Speech Settings Shell
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">STT Engine</label>
                <select 
                  value={sttEngine}
                  onChange={(e) => setSttEngine(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-slate-200 font-mono text-xs"
                >
                  <option>Android Native SpeechRecognizer Shell</option>
                  <option>Mayra Local Whisper STT Shell</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">TTS Voice Profile</label>
                <select 
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-slate-200 font-mono text-xs"
                >
                  <option>Mayra Neural Violet (Female)</option>
                  <option>Mayra Cyan Deep (Male)</option>
                  <option>System Default TTS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Assistant Behavior & Persona */}
          <div className="p-4 bg-[#111118] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase">
              <Sparkles className="w-4 h-4" /> 2. Assistant Behavior & Persona Shell
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Persona Tone</label>
              <select 
                value={voiceTone}
                onChange={(e) => setVoiceTone(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-slate-200 font-mono text-xs"
              >
                <option>Intelligent & Direct</option>
                <option>Friendly & Conversational</option>
                <option>Executive Assistant</option>
              </select>
            </div>
          </div>

          {/* Section 3: Appearance & Character */}
          <div className="p-4 bg-[#111118] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase">
              <Sliders className="w-4 h-4" /> 3. Appearance & Character Shell
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Theme Palette</label>
                <div className="p-2 bg-black/50 border border-white/10 rounded-lg text-slate-200 font-mono text-xs">
                  Dark Obsidian & Neon Violet (Default)
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Avatar Character Style</label>
                <div className="p-2 bg-black/50 border border-white/10 rounded-lg text-slate-200 font-mono text-xs">
                  Mayra Neural Core Orb
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Permissions & System Access */}
          <div className="p-4 bg-[#111118] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase">
              <ShieldCheck className="w-4 h-4" /> 4. Permissions & System Access Shell
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-white/5">
                <span className="text-slate-200 font-medium">Record Audio / Microphone</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                  GRANTED (UI Shell)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-white/5">
                <span className="text-slate-200 font-medium">Notification Posting</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                  GRANTED (UI Shell)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-white/5">
                <span className="text-slate-200 font-medium">Accessibility Automation Service</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                  PENDING PHASE 3
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: AI Provider Configuration */}
          <div className="p-4 bg-[#111118] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase">
              <Key className="w-4 h-4" /> 5. AI Provider Configuration Shell
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Gemini API Key Slot</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Future Phase Gemini API key slot..."
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">LLM Model Alias</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-slate-200 outline-none font-mono"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Target)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Target)</option>
              </select>
            </div>
          </div>

          {/* Section 6: Memory & Knowledge Controls */}
          <div className="p-4 bg-[#111118] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-pink-400 uppercase">
              <Brain className="w-4 h-4" /> 6. Memory & Knowledge Controls Shell
            </div>
            <p className="text-xs text-slate-400">
              Long-term context DB shell. Real SQLite / Room persistence will be connected in future phases.
            </p>
          </div>

          {/* Section 7: Automation & System Controls */}
          <div className="p-4 bg-[#111118] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
              <Cpu className="w-4 h-4" /> 7. Automation & System Controls Shell
            </div>
            <p className="text-xs text-slate-400">
              Device shortcuts, accessibility triggers, and background service controls shell.
            </p>
          </div>

          {/* Section 8: Privacy & Security */}
          <div className="p-4 bg-[#111118] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300 uppercase">
              <Lock className="w-4 h-4" /> 8. Privacy & Security Shell
            </div>
            <p className="text-xs text-slate-400">
              On-device data encryption and local processing rules.
            </p>
          </div>

          {/* Section 9: About MAYRA */}
          <div className="p-4 bg-[#111118] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
              <Info className="w-4 h-4" /> 9. About MAYRA
            </div>
            <div className="text-xs text-slate-300 font-mono">
              MAYRA v1.0.0 — Phase 1 UI Reconstruction
            </div>
            <div className="text-[11px] text-slate-500 font-sans">
              Native Android Assistant built with Kotlin & Jetpack Compose.
            </div>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2 justify-center">
              <ShieldCheck className="w-4 h-4" /> MAYRA Settings Configuration Saved
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-lg shadow-purple-600/30"
            >
              Save Settings Configuration
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
