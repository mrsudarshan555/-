import React, { useState } from 'react';
import { UserPersonalConfig } from '../../types';
import { 
  User, Mail, Globe, Sparkles, Key, 
  Eye, EyeOff, Check, Cpu, Lock, ShieldCheck, ChevronRight, ArrowLeft
} from 'lucide-react';

interface PersonalSettingsProps {
  config: UserPersonalConfig;
  onChange: (updated: Partial<UserPersonalConfig>) => void;
  onOpenCountryPicker: () => void;
  onBack: () => void;
}

export const PersonalSettingsView: React.FC<PersonalSettingsProps> = ({
  config,
  onChange,
  onOpenCountryPicker,
  onBack
}) => {
  const [showKey, setShowKey] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  const triggerSaveNotification = () => {
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070913] text-slate-200">
      
      {/* Top Header with Back Arrow */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center active:scale-95"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Personal Settings</h2>
              <p className="text-[10px] text-slate-400 font-sans">Account & Identity Preferences</p>
            </div>
          </div>
        </div>
        {savedBadge && (
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* User Identity Section */}
        <div className="p-3.5 bg-[#0C1021] border border-blue-500/20 rounded-2xl space-y-3">
          <div className="text-[11px] font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> User Profile
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Full Name</label>
            <input
              type="text"
              value={config.fullName}
              onChange={(e) => {
                onChange({ fullName: e.target.value });
                triggerSaveNotification();
              }}
              placeholder="e.g. Zafer"
              className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Preferred Name / Pronoun</label>
            <input
              type="text"
              value={config.preferredName}
              onChange={(e) => {
                onChange({ preferredName: e.target.value });
                triggerSaveNotification();
              }}
              placeholder="e.g. Zafer"
              className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Email (Optional)</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                value={config.email}
                onChange={(e) => {
                  onChange({ email: e.target.value });
                  triggerSaveNotification();
                }}
                placeholder="e.g. zafer@example.com"
                className="w-full bg-[#070913] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white font-sans text-xs outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Country Code Trigger Card */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Country & Region</label>
            <button
              onClick={onOpenCountryPicker}
              className="w-full bg-[#070913] hover:bg-white/5 border border-white/10 hover:border-blue-500/40 rounded-xl px-3 py-2.5 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-white font-medium">{config.countryName}</span>
                <span className="text-blue-400 font-mono font-bold text-[11px]">{config.countryDialCode}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Assistant Greeting Style */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Greeting Preference
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              { id: 'warm', title: 'Warm & Helpful', desc: 'Friendly welcome' },
              { id: 'formal', title: 'Executive', desc: 'Concise & formal' },
              { id: 'casual', title: 'Casual', desc: 'Relaxed tone' },
              { id: 'brief', title: 'Brief / Silent', desc: 'Minimal words' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onChange({ greetingStyle: item.id as any });
                  triggerSaveNotification();
                }}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  config.greetingStyle === item.id
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                    : 'bg-[#070913] border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-white">{item.title}</div>
                <div className="text-[9px] text-slate-400">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Provider & API Key Configuration */}
        <div className="p-3.5 bg-[#0C1021] border border-blue-500/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" /> AI Engine Configuration
            </div>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
              Secure Local Storage
            </span>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            API keys are masked and encrypted locally on the device. Keys are never transmitted in plain text.
          </p>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Gemini API Key Slot</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.geminiApiKey}
                onChange={(e) => {
                  onChange({ geminiApiKey: e.target.value });
                  triggerSaveNotification();
                }}
                placeholder="AIzaSy... (Managed via environment or local key)"
                className="w-full bg-[#070913] border border-white/10 rounded-xl pl-3 pr-9 py-2 text-white font-mono text-xs outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Target Model</label>
              <select
                value={config.geminiModel}
                onChange={(e) => {
                  onChange({ geminiModel: e.target.value });
                  triggerSaveNotification();
                }}
                className="w-full bg-[#070913] border border-white/10 rounded-xl p-2 text-white font-mono text-xs outline-none focus:border-blue-500"
              >
                <option value="gemini-3.7-flash">Gemini 3.7 Flash (Default • Fast)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Fast)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Reasoning)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Temperature</label>
                <span className="text-[10px] font-mono text-blue-400">{config.temperature.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => {
                  onChange({ temperature: parseFloat(e.target.value) });
                  triggerSaveNotification();
                }}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
