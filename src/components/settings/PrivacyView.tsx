import React from 'react';
import { 
  ShieldCheck, Lock, HardDrive, Cpu, 
  Mic, Eye, Bell, Key, Ban, Trash2, ArrowLeft
} from 'lucide-react';

interface PrivacyViewProps {
  onBack: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ onBack }) => {
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
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Privacy Policy</h2>
              <p className="text-[10px] text-slate-400 font-sans">MAYRA Security & Data Governance Charter</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-[11px] text-emerald-200/90 leading-relaxed">
          <strong>Privacy by Architecture:</strong> MAYRA is engineered from the ground up to respect user sovereignty. Your data belongs exclusively to you.
        </div>

        {/* Section 1: On-Device Storage */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
          <div className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" /> 1. On-Device Storage
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            All context memories, custom preferences, voice guardian biometric profiles, and chat transcripts are stored locally in on-device SQLite databases. They are never synchronized to external telemetry clouds without your explicit direction.
          </p>
        </div>

        {/* Section 2: AI Provider Transmission */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
          <div className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> 2. AI Provider Transmission
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            When you initiate a query or command, only the active text prompt and immediate conversational context are transmitted to your configured AI provider (e.g. Gemini API). Data is encrypted via HTTPS in transit.
          </p>
        </div>

        {/* Section 3: Audio & Microphone */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
          <div className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-purple-400" /> 3. Microphone & Voice Guardian Audio
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            Microphone audio is accessed solely during active speech input or when Voice Guardian mode is enabled. Audio samples used for acoustic calibration are transformed into acoustic embeddings locally on-device and never uploaded.
          </p>
        </div>

        {/* Section 4: Screen & Vision Data */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
          <div className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-400" /> 4. Screen Capture & Camera Feeds
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            Camera snapshots and screen captures occur only when you trigger OCR or vision scanning manually. No silent background camera recording is ever executed.
          </p>
        </div>

        {/* Section 5: Zero Ads & No Telemetry */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
          <div className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5 text-red-400" /> 5. Zero Advertising & No Data Brokerage
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            MAYRA contains zero advertising SDKs, zero cross-site trackers, and zero third-party data analytics trackers.
          </p>
        </div>

        {/* Section 6: Right to Erasure */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
          <div className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 text-emerald-400" /> 6. Complete Data Control
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            You maintain full sovereignty to export your data as JSON or perform an instant, permanent wipe of all stored memories directly from the Backup settings screen.
          </p>
        </div>

      </div>
    </div>
  );
};
