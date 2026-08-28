import React, { useState } from 'react';
import { AdvancedConfig } from '../../types';
import { 
  ShieldAlert, Mic, Camera, Bell, 
  Layers, Accessibility, Cpu, Battery, 
  Terminal, Bug, AlertOctagon, CheckCircle2, Sliders, ArrowLeft,
  Hand, PlayCircle, HelpCircle, Flame, Activity, Sparkles
} from 'lucide-react';
import { GestureUsageService } from '../../services/gestures/gestureUsageService';
import { GestureTutorialModal } from '../gestures/GestureTutorialModal';
import { GesturePracticeModal } from '../gestures/GesturePracticeModal';

interface AdvancedSettingsViewProps {
  config: AdvancedConfig;
  onChange: (updated: Partial<AdvancedConfig>) => void;
  onBack: () => void;
}

export const AdvancedSettingsView: React.FC<AdvancedSettingsViewProps> = ({
  config,
  onChange,
  onBack
}) => {
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState<boolean>(false);
  const todayUsageCount = GestureUsageService.getTodayGestureCount();

  const handleToggleBackgroundGesture = (checked: boolean) => {
    onChange({ backgroundHandGestureEnabled: checked });
    if (checked && !GestureUsageService.hasCompletedGestureTutorial()) {
      setIsTutorialOpen(true);
    }
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
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Advanced System</h2>
              <p className="text-[10px] text-slate-400 font-sans">Permissions, Safety & Developer Controls</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* Background Floating Hand-Gesture Engine & Chat Head */}
        <div className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
          config.backgroundHandGestureEnabled 
            ? 'bg-[#080E24] border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
            : 'bg-[#0C1021] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                config.backgroundHandGestureEnabled 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40' 
                  : 'bg-white/[0.06] text-slate-400'
              }`}>
                <Hand className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Enable Background Hand Gesture</div>
                <div className="text-[10px] text-slate-400">Floating Chat-Head bubble & touchless gesture trigger</div>
              </div>
            </div>
            
            {/* Toggle */}
            <input
              type="checkbox"
              id="toggle-background-hand-gesture"
              checked={config.backgroundHandGestureEnabled}
              onChange={(e) => handleToggleBackgroundGesture(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          <p className="text-[10px] text-slate-300 leading-relaxed">
            Allows controlling MAYRA through a floating overlay bubble on the phone&apos;s home screen even when the app is in the background or closed. Waving or double-tapping near the bubble opens MAYRA or triggers voice commands.
          </p>

          {/* Today's Usage Counter Info */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-rose-950/30 via-purple-950/20 to-cyan-950/30 border border-rose-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-rose-500/20 text-rose-300">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-white block">Today&apos;s Gesture Usage</span>
                <span className="text-[8px] text-slate-400 font-mono">Live bubble badge counter</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 font-mono font-bold text-[11px]">
              {todayUsageCount} actions
            </span>
          </div>

          {/* Interactive Tutorial & Practice Sandbox Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Replay Tutorial Button */}
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="p-2.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-200 border border-cyan-500/30 flex items-center gap-2 transition-all text-left shadow-sm active:scale-98"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-xs font-bold block text-white">Visual Tutorial</span>
                <span className="text-[9px] text-cyan-300/80 font-mono">Gesture guide</span>
              </div>
            </button>

            {/* Practice Mode Sandbox Button */}
            <button
              onClick={() => setIsPracticeOpen(true)}
              className="p-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 text-purple-200 border border-purple-500/30 flex items-center gap-2 transition-all text-left shadow-sm active:scale-98"
            >
              <Flame className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-xs font-bold block text-white">Test / Practice</span>
                <span className="text-[9px] text-purple-300/80 font-mono">Zero-risk sandbox</span>
              </div>
            </button>
          </div>

          {/* Privacy & Always-Visible Camera Safety Indicators */}
          <div className="space-y-1.5 pt-1">
            <div className="p-2 bg-[#070913] rounded-xl border border-white/5 flex items-start gap-2 text-[10px]">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0 animate-ping" />
              <div>
                <span className="text-rose-400 font-mono font-bold uppercase">Always-Visible Camera Indicator & PiP:</span>
                <p className="text-slate-400 text-[9px] mt-0.5">
                  Whenever the background gesture camera is active, an un-hideable status indicator badge (<b className="text-white">&quot;MAYRA is watching&quot;</b>) and mini PiP camera preview remain active across the whole phone.
                </p>
              </div>
            </div>

            <div className="p-2 bg-[#070913] rounded-xl border border-white/5 flex items-start gap-2 text-[10px]">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-emerald-400 font-mono font-bold uppercase">Screen-Lock Auto Shut-Off:</span>
                <p className="text-slate-400 text-[9px] mt-0.5">
                  When the phone screen is locked or power button is pressed, the background camera immediately turns OFF. Upon unlock, it does NOT auto-restart and requires manual reactivation for privacy protection.
                </p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-white/5">
            <span>FOREGROUND SERVICE: <b className={config.backgroundHandGestureEnabled ? 'text-cyan-300' : 'text-slate-500'}>
              {config.backgroundHandGestureEnabled ? 'ACTIVE (OVERLAY ON)' : 'OFF'}
            </b></span>
            <span>OVERLAY: <b className="text-cyan-400">TYPE_APPLICATION_OVERLAY</b></span>
          </div>
        </div>

        {/* Safety & Moderation Level */}
        <div className="p-3.5 bg-[#0C1021] border border-blue-500/20 rounded-2xl space-y-3">
          <div className="text-[11px] font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Safety & Content Filtering
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'strict', label: 'Strict', desc: 'Max safety guards' },
              { id: 'standard', label: 'Standard', desc: 'Balanced filters' },
              { id: 'permissive', label: 'Permissive', desc: 'Dev/Uncensored' }
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => onChange({ safetyLevel: lvl.id as any })}
                className={`p-2.5 rounded-xl border text-center transition-colors ${
                  config.safetyLevel === lvl.id
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200 font-semibold'
                    : 'bg-[#070913] border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs">{lvl.label}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{lvl.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Android Permissions Manager */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="text-[11px] font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-400" /> Android Runtime Permissions
          </div>

          <p className="text-[10px] text-slate-400">
            Permissions are requested explicitly on user interaction and never granted silently.
          </p>

          <div className="space-y-2">
            {/* Mic */}
            <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
              <div className="flex items-center gap-2.5">
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <div className="text-white font-medium text-xs">Audio Recording / Mic</div>
                  <div className="text-[9px] text-slate-400">Required for speech recognition & voice guardian</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.permissionMicrophone}
                onChange={(e) => onChange({ permissionMicrophone: e.target.checked })}
                className="w-4 h-4 accent-blue-500 rounded"
              />
            </div>

            {/* Camera */}
            <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
              <div className="flex items-center gap-2.5">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <div>
                  <div className="text-white font-medium text-xs">Camera & Media Projection</div>
                  <div className="text-[9px] text-slate-400">Required for Scan vision & OCR analysis</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.permissionCamera}
                onChange={(e) => onChange({ permissionCamera: e.target.checked })}
                className="w-4 h-4 accent-blue-500 rounded"
              />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
              <div className="flex items-center gap-2.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <div className="text-white font-medium text-xs">Post Notifications</div>
                  <div className="text-[9px] text-slate-400">Foreground service indicator & reminder alerts</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.permissionNotifications}
                onChange={(e) => onChange({ permissionNotifications: e.target.checked })}
                className="w-4 h-4 accent-blue-500 rounded"
              />
            </div>

            {/* Overlay */}
            <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
              <div className="flex items-center gap-2.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <div className="text-white font-medium text-xs">Display Over Other Apps</div>
                  <div className="text-[9px] text-slate-400">Allows floating assistant trigger bubble</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.permissionOverlay}
                onChange={(e) => onChange({ permissionOverlay: e.target.checked })}
                className="w-4 h-4 accent-blue-500 rounded"
              />
            </div>
          </div>
        </div>

        {/* Sensitive Automation Permission Box */}
        <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-400" /> Accessibility Service (Sensitive)
            </div>
            <input
              type="checkbox"
              checked={config.permissionAccessibility}
              onChange={(e) => onChange({ permissionAccessibility: e.target.checked })}
              className="w-4 h-4 accent-amber-400 rounded"
            />
          </div>
          <p className="text-[10px] text-amber-200/80 leading-relaxed">
            Allows MAYRA to automate device clicks and read UI hierarchies on screen when explicitly requested. Disabled by default for maximum privacy.
          </p>
        </div>

        {/* Background Execution & Battery */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2.5">
          <div className="text-[11px] font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-emerald-400" /> Background Execution & Power
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
            <div>
              <div className="text-white font-medium text-xs">Background Service Keeper</div>
              <div className="text-[9px] text-slate-400">Keep assistant listening and timers active</div>
            </div>
            <input
              type="checkbox"
              checked={config.backgroundServiceEnabled}
              onChange={(e) => onChange({ backgroundServiceEnabled: e.target.checked })}
              className="w-4 h-4 accent-blue-500 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#070913] rounded-xl border border-white/5">
            <div>
              <div className="text-white font-medium text-xs">Battery Optimization Ignore</div>
              <div className="text-[9px] text-slate-400">Prevents Android OS from killing background tasks</div>
            </div>
            <input
              type="checkbox"
              checked={config.batteryOptimizationExempt}
              onChange={(e) => onChange({ batteryOptimizationExempt: e.target.checked })}
              className="w-4 h-4 accent-blue-500 rounded"
            />
          </div>
        </div>

        {/* Developer & Debug Options */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2.5">
          <div className="text-[11px] font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-purple-400" /> Developer & Debug Options
          </div>

          <div className="flex items-center justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <Bug className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <div className="text-white font-medium text-xs">Debug Diagnostics Mode</div>
                <div className="text-[9px] text-slate-400">Display API latency metrics & execution graph</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.developerDebugMode}
              onChange={(e) => onChange({ developerDebugMode: e.target.checked })}
              className="w-4 h-4 accent-purple-500 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-[#070913] rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <div className="text-white font-medium text-xs">Verbose Logcat Output</div>
                <div className="text-[9px] text-slate-400">Stream detailed execution logs</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.verboseLogging}
              onChange={(e) => onChange({ verboseLogging: e.target.checked })}
              className="w-4 h-4 accent-purple-500 rounded"
            />
          </div>
        </div>

      </div>

      {/* Tutorial Guide Modal */}
      <GestureTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onOpenPracticeMode={() => setIsPracticeOpen(true)}
      />

      {/* Practice Sandbox Modal */}
      <GesturePracticeModal
        isOpen={isPracticeOpen}
        onClose={() => setIsPracticeOpen(false)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />
    </div>
  );
};
