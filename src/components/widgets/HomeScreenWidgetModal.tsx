import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, Mic, Camera, MessageSquare, 
  Sparkles, X, Sun, CheckCircle2, Info, ArrowRight, ShieldCheck, 
  ExternalLink, Layers, Terminal
} from 'lucide-react';
import { MayraLogo } from '../common/MayraLogo';

interface HomeScreenWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchVoice: () => void;
  onLaunchScan: () => void;
  onLaunchChat: () => void;
  onLaunchRoutine: (routinePrompt: string) => void;
}

export const HomeScreenWidgetModal: React.FC<HomeScreenWidgetModalProps> = ({
  isOpen,
  onClose,
  onLaunchVoice,
  onLaunchScan,
  onLaunchChat,
  onLaunchRoutine
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'technical'>('preview');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md select-none animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm max-h-[90vh] flex flex-col rounded-3xl bg-[#0C1021] border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-950/50"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Smartphone className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-sans text-white">MAYRA Home Screen Widget</h3>
                <p className="text-[10px] text-slate-400">Android Launcher 4x2 Quick Widget</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>

          {/* Segment Tabs */}
          <div className="flex border-b border-white/10 bg-black/20 p-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'preview' ? 'bg-white/10 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive Widget Preview
            </button>
            <button
              onClick={() => setActiveTab('technical')}
              className={`flex-1 py-1.5 text-xs font-sans font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'technical' ? 'bg-white/10 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Technical Explanation & APK
            </button>
          </div>

          {/* Body Content */}
          <div className="p-3.5 space-y-4 overflow-y-auto scrollbar-thin">
            
            {activeTab === 'preview' ? (
              <div className="space-y-3.5">
                <p className="text-[11px] text-slate-300 font-sans">
                  Yeh simulation hai ki jab MAYRA Android Home Screen par widget ke roop mein placed hoti hai, tab kaisa dikhti hai:
                </p>

                {/* Simulated Android Home Screen Wall & 4x2 Widget */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-white/15 shadow-xl relative overflow-hidden space-y-3">
                  {/* Top Bar of Widget */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MayraLogo size={24} showGlow={true} variant="raw" />
                      <div>
                        <span className="text-xs font-bold text-white tracking-wide">★ MAYRA Quick</span>
                        <div className="text-[9px] font-mono text-emerald-400">Online • 26°C Sunny</div>
                      </div>
                    </div>

                    <span className="text-[8px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                      4x2 WIDGET
                    </span>
                  </div>

                  {/* Routine Quick Pill */}
                  <button
                    onClick={() => {
                      onLaunchRoutine('Subah ki dinacharya: Mujhe aaj ka mausam, calendar events aur reminders ek saath batao.');
                      onClose();
                    }}
                    className="w-full p-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-left flex items-center justify-between text-xs text-white transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-sans font-medium">Subah ki dinacharya suniye</span>
                    </div>
                    <span className="text-[9px] text-cyan-300 group-hover:underline">Start →</span>
                  </button>

                  {/* 3 Action Buttons: Voice, Scan, Chat */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        onLaunchVoice();
                        onClose();
                      }}
                      className="py-2.5 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                    >
                      <Mic className="w-4 h-4 stroke-[2]" />
                      <span className="text-[9px] font-mono font-bold">Voice Mic</span>
                    </button>

                    <button
                      onClick={() => {
                        onLaunchScan();
                        onClose();
                      }}
                      className="py-2.5 px-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4 stroke-[2]" />
                      <span className="text-[9px] font-mono font-bold">Vision Scan</span>
                    </button>

                    <button
                      onClick={() => {
                        onLaunchChat();
                        onClose();
                      }}
                      className="py-2.5 px-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4 stroke-[2]" />
                      <span className="text-[9px] font-mono font-bold">Quick Chat</span>
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Widgets se ek tap mein seedha MAYRA se audio/vision chat shuru ho sakti hai.
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-[11px] font-sans text-slate-300 leading-relaxed">
                
                {/* Clear Technical Explanation */}
                <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-1.5 text-blue-200">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-white">
                    <Info className="w-4 h-4 text-cyan-400 stroke-[2]" />
                    <span>Android OS & Web Browser Limitation</span>
                  </div>
                  <p>
                    Standard web browser (Chrome/Safari) ya web iframe sandbox security policy ki wajah se <strong>web pages phone ke Android Launcher (desktop screen) par seedha OS widget register nahi kar sakte</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#070914] border border-white/10 space-y-2">
                  <div className="font-bold font-mono text-white text-[11px] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    How It Works in Native Android / APK:
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[10px] text-slate-300">
                    <li>
                      <strong>AppWidgetProvider:</strong> Android Native Java/Kotlin mein <code className="text-cyan-300">MayraWidgetProvider.kt</code> declare hota hai.
                    </li>
                    <li>
                      <strong>Jetpack Glance / RemoteViews:</strong> Android OS home screen ke layout ko <code className="text-cyan-300">RemoteViews</code> ke through 4x2 grid mein render karta hai.
                    </li>
                    <li>
                      <strong>PendingIntent:</strong> Mic ya Scan tap karne par seedha <code className="text-cyan-300">DeepLink ("mayra://voice")</code> se app background se foreground mein invoke ho jaati hai.
                    </li>
                  </ol>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[10px] text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2]" />
                  <span>PWA Web Shortcuts (<code className="font-mono">manifest.json shortcuts</code>) live ready hain!</span>
                </div>

              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
