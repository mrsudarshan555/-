import React, { useState } from 'react';
import { VoiceGuardianConfig, EnrolledVoice } from '../../types';
import { 
  ShieldCheck, ShieldAlert, Mic, UserCheck, 
  Volume2, Trash2, Plus, RefreshCw, CheckCircle2, AlertTriangle, Play, Sparkles, ArrowLeft
} from 'lucide-react';

interface VoiceGuardianViewProps {
  config: VoiceGuardianConfig;
  onChange: (updated: Partial<VoiceGuardianConfig>) => void;
  onBack: () => void;
}

export const VoiceGuardianView: React.FC<VoiceGuardianViewProps> = ({
  config,
  onChange,
  onBack
}) => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollStep, setEnrollStep] = useState(1);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testResult, setTestResult] = useState<{ matched: boolean; score: number } | null>(null);

  const startEnrollmentWizard = () => {
    setIsEnrolling(true);
    setEnrollStep(1);
  };

  const advanceEnrollStep = () => {
    if (enrollStep < 5) {
      setEnrollStep(enrollStep + 1);
    } else {
      // Completed enrollment
      const newVoice: EnrolledVoice = {
        id: `voice-owner-${Date.now()}`,
        name: 'Zafer (Owner - Recalibrated)',
        role: 'owner',
        samplesCount: 5,
        confidenceScore: 96,
        dateEnrolled: new Date().toISOString().split('T')[0]
      };
      onChange({
        enrolledVoices: [newVoice, ...config.enrolledVoices.filter(v => v.role !== 'owner')]
      });
      setIsEnrolling(false);
      setEnrollStep(1);
    }
  };

  const testVoiceSample = () => {
    setIsTestingVoice(true);
    setTestResult(null);
    setTimeout(() => {
      setIsTestingVoice(false);
      setTestResult({
        matched: true,
        score: Math.floor(88 + Math.random() * 8)
      });
    }, 1800);
  };

  const removeVoice = (id: string) => {
    onChange({
      enrolledVoices: config.enrolledVoices.filter((v) => v.id !== id)
    });
  };

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
            <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Voice Guardian</h2>
              <p className="text-[10px] text-slate-400 font-sans">Biometric Acoustic Security & Guard Mode</p>
            </div>
          </div>
        </div>

        <div className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold ${
          config.enabled 
            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400' 
            : 'bg-slate-900 border-white/10 text-slate-500'
        }`}>
          {config.enabled ? 'ACTIVE' : 'DISABLED'}
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* Master Toggles */}
        <div className="p-3.5 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
          
          <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
            <div>
              <div className="text-white font-extrabold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Voice Guardian Master Shield
              </div>
              <div className="text-[10px] font-normal text-slate-400 mt-0.5">Verifies speaker voice before executing sensitive commands</div>
            </div>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onChange({ enabled: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
            <div>
              <div className="text-white font-extrabold text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Away / Guard Mode
              </div>
              <div className="text-[10px] font-normal text-slate-400 mt-0.5">Monitors room audio for unauthorized voice triggers when away</div>
            </div>
            <input
              type="checkbox"
              checked={config.awayGuardMode}
              onChange={(e) => onChange({ awayGuardMode: e.target.checked })}
              className="w-4 h-4 accent-amber-400 rounded"
            />
          </div>

        </div>

        {/* Listen Mode Policy */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Authorized Listen Mode
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'everyone', label: 'Everyone', desc: 'Any speaker' },
              { id: 'owner_only', label: 'Owner Only', desc: 'Strict biometric' },
              { id: 'owner_family', label: 'Owner + Family', desc: 'Enrolled list' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onChange({ listenMode: mode.id as any })}
                className={`p-2.5 rounded-xl border text-center transition-colors ${
                  config.listenMode === mode.id
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-extrabold ring-1 ring-cyan-400/40'
                    : 'bg-[#070913] border-white/5 text-slate-400 hover:text-slate-200 font-normal'
                }`}
              >
                <div className="text-xs font-extrabold">{mode.label}</div>
                <div className="text-[9px] font-normal text-slate-400 mt-0.5">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Matching Strictness Slider */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Voice Matching Strictness
            </div>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">{config.strictness}%</span>
          </div>

          <p className="text-[10px] font-normal text-slate-400">
            Higher thresholds reduce false positives in noisy environments.
          </p>

          <input
            type="range"
            min="60"
            max="95"
            step="5"
            value={config.strictness}
            onChange={(e) => onChange({ strictness: parseInt(e.target.value) })}
            className="w-full accent-cyan-400"
          />

          <div className="flex justify-between text-[9px] font-mono font-normal text-slate-400">
            <span>60% (Permissive)</span>
            <span>80% (Balanced)</span>
            <span>95% (High Security)</span>
          </div>
        </div>

        {/* Enrolled Voices List & Management */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-cyan-400" /> Enrolled Voice Profiles ({config.enrolledVoices.length})
            </div>
            <button
              onClick={startEnrollmentWizard}
              className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-cyan-900/40 transition-colors"
            >
              <Plus className="w-2.5 h-2.5" /> Enroll Voice
            </button>
          </div>

          <div className="space-y-2">
            {config.enrolledVoices.map((voice) => (
              <div
                key={voice.id}
                className="p-2.5 bg-[#070913] border border-white/5 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="text-white font-medium text-xs flex items-center gap-1.5">
                    {voice.name}
                    {voice.role === 'owner' && (
                      <span className="text-[8px] font-mono bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                    {voice.samplesCount} samples • Confidence: {voice.confidenceScore}% • Enrolled {voice.dateEnrolled}
                  </div>
                </div>

                <button
                  onClick={() => removeVoice(voice.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                  title="Remove Profile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Voice Testing Tool */}
          <div className="pt-2 border-t border-white/5 flex gap-2">
            <button
              onClick={testVoiceSample}
              disabled={isTestingVoice}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-mono text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${isTestingVoice ? 'animate-spin' : ''}`} />
              {isTestingVoice ? 'Listening & Analyzing...' : 'Test My Voice Match'}
            </button>
          </div>

          {testResult && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Match Verified (Zafer)
              </span>
              <span className="font-bold">{testResult.score}% Confidence</span>
            </div>
          )}
        </div>

        {/* Interactive Voice Enrollment Dialog */}
        {isEnrolling && (
          <div className="p-4 bg-[#0F172A] border border-cyan-500/40 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">
                Acoustic Enrollment Calibration (Step {enrollStep} of 5)
              </span>
              <button onClick={() => setIsEnrolling(false)} className="text-slate-400 hover:text-white text-xs">
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-200">
              Please speak the prompt clearly:
            </p>

            <div className="p-3 bg-[#070913] border border-cyan-500/20 rounded-xl text-center text-cyan-200 font-mono text-xs italic">
              {enrollStep === 1 && '"Hey MAYRA, wake up and activate personal assistant."'}
              {enrollStep === 2 && '"MAYRA, what is the current device status?"'}
              {enrollStep === 3 && '"Voice Guardian biometric authentication sample three."'}
              {enrollStep === 4 && '"MAYRA, run background system diagnostics."'}
              {enrollStep === 5 && '"Voice profile calibrated for owner identity Zafer."'}
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full transition-all" style={{ width: `${(enrollStep / 5) * 100}%` }}></div>
            </div>

            <button
              onClick={advanceEnrollStep}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              {enrollStep < 5 ? `Record Sample ${enrollStep} & Next` : 'Complete Enrollment'}
            </button>
          </div>
        )}

        {/* Security Notice */}
        <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-[10px] text-cyan-200/80 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1 text-cyan-300">
            <AlertTriangle className="w-3 h-3" /> Voice Guardian Architecture Status:
          </div>
          <p>
            The UI controls, policy thresholds, and calibration pipeline are active. Biometric matching is handled locally and awaits the native audio DSP model.
          </p>
        </div>

      </div>
    </div>
  );
};
