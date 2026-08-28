import React from 'react';
import { Sparkles, Terminal, ShieldCheck, Heart, Info, Code2, ArrowLeft, RefreshCw } from 'lucide-react';
import { MayraLogo } from '../common/MayraLogo';

interface AboutViewProps {
  onBack: () => void;
  onOpenOnboarding?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack, onOpenOnboarding }) => {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070913] text-slate-200">
      
      {/* Header */}
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
            <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">About MAYRA</h2>
              <p className="text-[10px] text-slate-400 font-sans">System Architecture & Version Manifest</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* Brand Orb Hero */}
        <div className="p-6 bg-[#0C1021] border border-blue-500/30 rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
          <MayraLogo size={64} showGlow={true} />
          <div>
            <h1 className="text-lg font-extrabold text-white font-mono tracking-tight">★𝐌₳ᎽⱤ₳ ᥫ᭡</h1>
            <p className="text-xs text-cyan-400 font-mono">Personal AI Assistant</p>
          </div>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-slate-300">
            Version 2.0.0-phase2 (Settings & System UI)
          </div>

          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="mt-2 py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Onboarding Dobara Dekhein (Replay Tour)</span>
            </button>
          )}
        </div>

        {/* Technical Specs Card */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2.5">
          <div className="text-[11px] font-mono font-bold text-white uppercase flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-blue-400" /> Engineering Architecture
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
              <span className="text-slate-400">APPLICATION_ID</span>
              <span className="text-white font-semibold">com.mayra.assistant</span>
            </div>
            <div className="flex justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
              <span className="text-slate-400">UI FRAMEWORK</span>
              <span className="text-blue-400 font-semibold">Jetpack Compose (BOM 2024.12)</span>
            </div>
            <div className="flex justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
              <span className="text-slate-400">DESIGN SYSTEM</span>
              <span className="text-white font-semibold">Material 3 Dark Palette</span>
            </div>
            <div className="flex justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
              <span className="text-slate-400">TARGET ANDROID SDK</span>
              <span className="text-white font-semibold">Android 16 (API 36)</span>
            </div>
            <div className="flex justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
              <span className="text-slate-400">MINIMUM ANDROID SDK</span>
              <span className="text-white font-semibold">Android 8.0 (API 26)</span>
            </div>
          </div>
        </div>

        {/* Development Philosophy */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
          <div className="text-[11px] font-mono font-bold text-white uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Phase 2 Accomplishments
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            Phase 2 establishes a complete, production-grade Settings & System navigation architecture, Voice Guardian security layout, Personal/Country preferences, Multi-Agent pipelines, and local data governance.
          </p>
        </div>

      </div>
    </div>
  );
};
