import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, Database, Camera, Mic, Sliders, X, 
  ChevronRight, RefreshCw, Cpu, Layers, Maximize2, Minimize2, Sparkles, MessageSquare, PenTool
} from 'lucide-react';
import { CircuitBoardVisualizer, STONICX_PALETTES } from './CircuitBoardVisualizer';
import { StonicxScanner } from './StonicxScanner';
import { StonicxVault } from './StonicxVault';
import { StonicxTerminal } from './StonicxTerminal';
import { StonicxSettingsModal } from './StonicxSettingsModal';
import { WhiteboardTool } from '../tools/WhiteboardTool';
import { useStonicxAssistant } from '../../hooks/useStonicxAssistant';
import { UserPersonalConfig, AssistantConfig, PermissionItem } from '../../types';
import { StonicxFullSettingsState } from '../../types/stonicxSettings';
import { loadStonicxSettings, saveStonicxSettings } from '../../utils/stonicxSettingsStore';

export type StonicxView = 'circuit' | 'terminal' | 'vault' | 'optical';

interface StonicxAppShellProps {
  onSwitchToMayra: () => void;
  personalConfig: UserPersonalConfig;
  setPersonalConfig: React.Dispatch<React.SetStateAction<UserPersonalConfig>>;
  assistantConfig: AssistantConfig;
  setAssistantConfig: React.Dispatch<React.SetStateAction<AssistantConfig>>;
  permissions: PermissionItem[];
  setPermissions: React.Dispatch<React.SetStateAction<PermissionItem[]>>;
}

export const StonicxAppShell: React.FC<StonicxAppShellProps> = ({
  onSwitchToMayra,
  personalConfig,
  setPersonalConfig,
  assistantConfig,
  setAssistantConfig,
  permissions,
  setPermissions
}) => {
  const [activeView, setActiveView] = useState<StonicxView>('circuit');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [manualStateOverride, setManualStateOverride] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | null>(null);

  // Full STONICX Settings with Instant Persistence
  const [stonicxSettings, setStonicxSettings] = useState<StonicxFullSettingsState>(() => loadStonicxSettings());

  const handleUpdateSettings = (updater: (prev: StonicxFullSettingsState) => StonicxFullSettingsState) => {
    setStonicxSettings((prev) => {
      const next = updater(prev);
      saveStonicxSettings(next);
      return next;
    });
  };

  const activeTheme = stonicxSettings.appearance.themeColor;
  const activeFont = stonicxSettings.appearance.fontStyle;
  const activePal = STONICX_PALETTES[activeTheme] || STONICX_PALETTES.cyan;

  // Live Timer Tracker (00:00:00)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stonicx isolated intelligence engine
  const {
    status,
    messages,
    inputText,
    setInputText,
    isProcessing,
    submitPrompt,
    triggerVoice,
    clearChat,
    profile,
    updateProfile,
    topicNotes,
    addTopicNote,
    updateTopicNote,
    deleteTopicNote,
    togglePinTopicNote,
    jobs,
    activeJobId,
    selectActiveJob,
    addJob,
    updateJob,
    deleteJob,
    dailyLogs,
    deleteDailyLog
  } = useStonicxAssistant({ personalConfig, assistantConfig });

  const activeDisplayState = manualStateOverride || (
    status === 'LISTENING' ? 'listening' :
    status === 'THINKING' ? 'thinking' :
    status === 'SPEAKING' ? 'speaking' :
    'idle'
  );

  const handleOpticalScanSubmit = (prompt: string, image: { base64: string; mimeType: string; name?: string }) => {
    setActiveView('terminal');
    submitPrompt(prompt, image);
  };

  const handleClearMemory = () => {
    topicNotes.forEach((n) => deleteTopicNote(n.id));
    dailyLogs.forEach((l) => deleteDailyLog(l.date));
  };

  return (
    <div 
      style={{ fontFamily: activeFont }}
      className="relative w-full h-full flex flex-col bg-[#020611] text-cyan-100 font-mono overflow-hidden select-none"
    >
      
      {/* 1. CINEMATIC BACKGROUND — DENSE LIVING PRINTED CIRCUIT BOARD */}
      <div className="absolute inset-0 w-full h-full z-0">
        <CircuitBoardVisualizer
          status={activeDisplayState}
          overrideState={manualStateOverride || undefined}
          onCoreClick={triggerVoice}
          themeColor={stonicxSettings.appearance.themeColor}
          fontStyle={stonicxSettings.appearance.fontStyle}
          haloIntensity={stonicxSettings.appearance.haloIntensity}
          edgeVignette={stonicxSettings.appearance.edgeVignette}
          className="w-full h-full"
        />
      </div>

      {/* 2. ULTRA-MINIMAL CORNER READOUTS & TEST CONTROLS */}
      <div className="absolute inset-0 pointer-events-none z-20 p-4 sm:p-6 flex flex-col justify-between">
        
        {/* Top Bar Readouts */}
        <div className="flex items-center justify-between w-full">
          {/* Top-Left: Minimal Monospace System ID */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div 
              style={{ borderColor: `${activePal.primary}30` }}
              className="flex items-center gap-2 bg-[#020B1A]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              <span 
                style={{ backgroundColor: activePal.primary, boxShadow: `0 0 8px ${activePal.primary}` }}
                className="w-1.5 h-1.5 rounded-full animate-pulse" 
              />
              <span 
                style={{ color: activePal.primary }}
                className="text-[11px] font-bold tracking-widest"
              >
                STONICX
              </span>
              <span className="text-[10px] text-slate-500">·</span>
              <span className="text-[10px] text-slate-300 font-mono">ONLINE</span>
              <span className="text-[9px] text-slate-500 hidden sm:inline">• {activePal.name.toUpperCase()}</span>
            </div>
          </div>

          {/* Top-Right: State + Live Timer Display */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div 
              style={{ borderColor: `${activePal.primary}30` }}
              className="flex items-center gap-2 bg-[#020B1A]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              <span 
                style={{ backgroundColor: activePal.primary }}
                className={`w-2 h-2 rounded-full ${
                  activeDisplayState === 'thinking' ? 'animate-spin' :
                  activeDisplayState === 'speaking' ? 'animate-ping' :
                  activeDisplayState === 'listening' ? 'animate-pulse' :
                  ''
                }`} 
              />
              <span 
                style={{ color: activePal.primary }}
                className="text-[10px] font-bold tracking-wider uppercase"
              >
                {activeDisplayState}
              </span>
              <span className="text-[10px] text-slate-500">•</span>
              <span className="text-[10px] text-slate-300 font-mono tracking-tight">
                {formatTimer(elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Area: State Testing Strip & Action HUD */}
        <div className="flex items-end justify-between w-full">
          
          {/* Bottom-Left: Interactive 4-State Behavior Testing Bar */}
          <div className="pointer-events-auto flex flex-col gap-1.5">
            <div className="text-[8px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>STATE SIMULATION CONTROLLER</span>
              {manualStateOverride && (
                <button
                  onClick={() => setManualStateOverride(null)}
                  style={{ color: activePal.primary }}
                  className="text-[8px] underline hover:text-white cursor-pointer"
                >
                  [SYNC AUTO]
                </button>
              )}
            </div>
            <div 
              style={{ borderColor: `${activePal.primary}30` }}
              className="flex items-center bg-[#020B1A]/90 backdrop-blur-md p-1 rounded-xl border shadow-[0_0_15px_rgba(0,0,0,0.5)] gap-1 text-[9px]"
            >
              {(['idle', 'listening', 'thinking', 'speaking'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setManualStateOverride(st)}
                  style={{
                    backgroundColor: activeDisplayState === st ? activePal.primary : 'transparent',
                    color: activeDisplayState === st ? '#000000' : '#94A3B8'
                  }}
                  className={`px-2.5 py-1 rounded-lg uppercase font-bold transition-all cursor-pointer ${
                    activeDisplayState === st
                      ? 'shadow-[0_0_12px_rgba(0,229,255,0.4)] scale-102 font-bold'
                      : 'hover:text-white hover:bg-white/5'
                  }`}
                  title={`Test ${st.toUpperCase()} mode`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom-Right: Minimal HUD Navigation & Stream Trigger */}
          <div className="pointer-events-auto flex items-center gap-2.5 ml-auto">
            
            {/* Direct Quick Mic Trigger Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setManualStateOverride(null);
                triggerVoice();
              }}
              style={{
                backgroundColor: status === 'LISTENING' || activeDisplayState === 'listening' ? activePal.primary : 'rgba(2,11,26,0.9)',
                color: status === 'LISTENING' || activeDisplayState === 'listening' ? '#000000' : activePal.primary,
                borderColor: `${activePal.primary}40`
              }}
              className="p-3 rounded-2xl border transition-all cursor-pointer shadow-lg backdrop-blur-xl"
              title="Activate Voice Stream"
            >
              <Mic className="w-4 h-4" />
            </motion.button>

            {/* Quick Whiteboard Trigger Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsWhiteboardOpen(true)}
              style={{
                borderColor: `${activePal.primary}40`,
                color: activePal.primary
              }}
              className="p-3 bg-[#020B1A]/90 hover:bg-[#061530] rounded-2xl border transition-all cursor-pointer shadow-lg backdrop-blur-xl"
              title="Open Hardware Whiteboard"
            >
              <PenTool className="w-4 h-4" />
            </motion.button>

            {/* Subtle Expanding HUD Menu Trigger */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMenuOpen((prev) => !prev)}
                style={{
                  backgroundColor: isMenuOpen ? activePal.primary : 'rgba(2,11,26,0.9)',
                  color: isMenuOpen ? '#000000' : activePal.primary,
                  borderColor: `${activePal.primary}40`
                }}
                className="p-3 rounded-2xl border transition-all cursor-pointer shadow-lg backdrop-blur-xl"
                title="Open STONICX HUD Navigation"
              >
                <Layers className="w-4 h-4" />
              </motion.button>

              {/* Minimalist Floating HUD Drawer / Popover */}
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsMenuOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.92 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      style={{ borderColor: `${activePal.primary}30` }}
                      className="absolute right-0 bottom-14 z-40 w-60 p-2.5 bg-[#020B1A]/95 backdrop-blur-2xl border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] font-sans"
                    >
                      <div 
                        style={{ borderColor: `${activePal.primary}20` }}
                        className="px-2.5 py-1 text-[9px] font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center justify-between border-b pb-1.5 mb-1.5"
                      >
                        <span style={{ color: activePal.primary }}>STONICX NAVIGATION</span>
                        <span className="text-[8px] text-slate-400">HUD v4.8</span>
                      </div>

                      <div className="space-y-1">
                        {/* 1. Terminal (Chat) */}
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setActiveView('terminal');
                          }}
                          className="w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer hover:bg-white/5 text-slate-200 border border-transparent hover:border-white/10"
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              style={{ color: activePal.primary, backgroundColor: `${activePal.primary}15`, borderColor: `${activePal.primary}30` }}
                              className="p-1.5 border rounded-lg"
                            >
                              <Terminal className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100">TERMINAL</div>
                              <div className="text-[9px] text-slate-400 font-mono">Stream & code console</div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>

                        {/* 2. Vault (AI Priming Memory) */}
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setActiveView('vault');
                          }}
                          className="w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer hover:bg-white/5 text-slate-200 border border-transparent hover:border-white/10"
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              style={{ color: activePal.primary, backgroundColor: `${activePal.primary}15`, borderColor: `${activePal.primary}30` }}
                              className="p-1.5 border rounded-lg"
                            >
                              <Database className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100">VAULT</div>
                              <div className="text-[9px] text-slate-400 font-mono">Notes, profile, jobs</div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>

                        {/* 3. Optical Scanner */}
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setActiveView('optical');
                          }}
                          className="w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer hover:bg-white/5 text-slate-200 border border-transparent hover:border-white/10"
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              style={{ color: activePal.primary, backgroundColor: `${activePal.primary}15`, borderColor: `${activePal.primary}30` }}
                              className="p-1.5 border rounded-lg"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100">OPTICAL SCANNER</div>
                              <div className="text-[9px] text-slate-400 font-mono">Vision & camera OCR</div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>

                        {/* 4. Diagnostics / Settings */}
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsSettingsOpen(true);
                          }}
                          className="w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer hover:bg-white/5 text-slate-200 border border-transparent hover:border-white/10"
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              style={{ color: activePal.primary, backgroundColor: `${activePal.primary}15`, borderColor: `${activePal.primary}30` }}
                              className="p-1.5 border rounded-lg"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100">SETTINGS & HUD</div>
                              <div className="text-[9px] text-slate-400 font-mono">Fonts, colors, permissions</div>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </div>

                      {/* Assistant Switch Option */}
                      <div 
                        style={{ borderColor: `${activePal.primary}20` }}
                        className="mt-2 pt-2 border-t"
                      >
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onSwitchToMayra();
                          }}
                          className="w-full p-2 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer hover:bg-purple-500/10 text-slate-300 border border-purple-500/20"
                        >
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-xs font-bold text-purple-200">Switch to MAYRA 3D</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                            COMPANION
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODAL / EXPANDED WORKSPACE VIEWS (Terminal, Vault, Scanner) */}
      <AnimatePresence>
        {activeView !== 'circuit' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-30 bg-[#020611]/95 backdrop-blur-2xl flex flex-col overflow-hidden"
          >
            {/* View Sub-Header with Close / Back Button */}
            <div 
              style={{ borderColor: `${activePal.primary}20` }}
              className="h-12 px-4 bg-[#030B1C] border-b flex items-center justify-between shrink-0 shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <span 
                  style={{ backgroundColor: activePal.primary }}
                  className="w-2 h-2 rounded-full animate-pulse" 
                />
                <span 
                  style={{ color: activePal.primary }}
                  className="text-xs font-bold font-mono tracking-wider uppercase"
                >
                  STONICX // {activeView}
                </span>
              </div>

              {/* View Switchers & Close Button */}
              <div className="flex items-center gap-2 font-mono">
                <button
                  onClick={() => setActiveView('terminal')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] transition-colors cursor-pointer ${
                    activeView === 'terminal'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-cyan-200'
                  }`}
                >
                  TERMINAL
                </button>
                <button
                  onClick={() => setActiveView('vault')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] transition-colors cursor-pointer ${
                    activeView === 'vault'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-cyan-200'
                  }`}
                >
                  VAULT
                </button>
                <button
                  onClick={() => setActiveView('optical')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] transition-colors cursor-pointer ${
                    activeView === 'optical'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-cyan-200'
                  }`}
                >
                  OPTICAL
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  onClick={() => setActiveView('circuit')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg border border-white/10 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Close to Circuit Board"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>CLOSE</span>
                </button>
              </div>
            </div>

            {/* Viewport Content */}
            <div className="flex-1 overflow-hidden relative">
              {activeView === 'terminal' && (
                <StonicxTerminal
                  messages={messages}
                  status={status}
                  inputText={inputText}
                  setInputText={setInputText}
                  onSubmitPrompt={submitPrompt}
                  onTriggerVoice={triggerVoice}
                  onClearChat={clearChat}
                  onOpenScanner={() => setActiveView('optical')}
                  activeJobName={jobs.find(j => j.id === activeJobId)?.name}
                  onClearActiveJob={() => selectActiveJob(null)}
                />
              )}

              {activeView === 'vault' && (
                <StonicxVault
                  profile={profile}
                  onUpdateProfile={updateProfile}
                  topicNotes={topicNotes}
                  onAddTopicNote={addTopicNote}
                  onUpdateTopicNote={updateTopicNote}
                  onDeleteTopicNote={deleteTopicNote}
                  onTogglePinTopicNote={togglePinTopicNote}
                  jobs={jobs}
                  activeJobId={activeJobId}
                  onSelectActiveJob={selectActiveJob}
                  onAddJob={addJob}
                  onUpdateJob={updateJob}
                  onDeleteJob={deleteJob}
                  dailyLogs={dailyLogs}
                  onDeleteDailyLog={deleteDailyLog}
                  onTriggerPrompt={(prompt) => {
                    setInputText(prompt);
                    submitPrompt(prompt);
                    setActiveView('terminal');
                  }}
                />
              )}

              {activeView === 'optical' && (
                <StonicxScanner
                  onAnalyzeImage={handleOpticalScanSubmit}
                  onClose={() => setActiveView('circuit')}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Full STONICX Settings Modal */}
      <StonicxSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSwitchToMayra={onSwitchToMayra}
        settings={stonicxSettings}
        onUpdateSettings={handleUpdateSettings}
        onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
        notesCount={topicNotes.length}
        jobsCount={jobs.length}
        dailyLogsCount={dailyLogs.length}
        onClearMemory={handleClearMemory}
      />

      {/* 5. Integrated Hardware Whiteboard */}
      {isWhiteboardOpen && (
        <WhiteboardTool
          config={stonicxSettings.whiteboard}
          assistantName="STONICX"
          onClose={() => setIsWhiteboardOpen(false)}
          onSendToChat={(msg) => {
            setIsWhiteboardOpen(false);
            setActiveView('terminal');
            submitPrompt(msg);
          }}
        />
      )}
    </div>
  );
};
