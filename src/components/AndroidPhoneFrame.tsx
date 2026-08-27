import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AssistantStatus, UserPersonalConfig, AssistantConfig, 
  VoiceGuardianConfig, AdvancedConfig, SkillItem, SubAgentItem, 
  IntegrationItem, MemoryItem, ChatMessage, SettingsSubScreen, ActiveTab,
  PermissionItem, AppearanceConfig, AgentTaskContext
} from '../types';
import { HomeScreen } from './screens/HomeScreen';
import { ScannerScreen } from './screens/ScannerScreen';
import { MemoriesScreen } from './screens/MemoriesScreen';
import { ChatScreen } from './screens/ChatScreen';
import { MayraSettingsScreen } from './settings/MayraSettingsScreen';
import { MayraLogo } from './common/MayraLogo';
import { VoiceControlOrb } from './voice/VoiceControlOrb';
import { useMayraWakeWord } from '../hooks/useMayraWakeWord';
import { FloatingMayraOverlay } from './overlay/FloatingMayraOverlay';
import { BackgroundGestureOverlayBubble } from './overlay/BackgroundGestureOverlayBubble';
import { AgentTaskHUD } from './agent/AgentTaskHUD';
import { 
  Home, Camera, Brain, MessageSquare, 
  Settings as SettingsIcon, Shield,
  Trash2, Plus
} from 'lucide-react';
import { getThemePreset } from '../utils/themePresets';

interface AndroidPhoneFrameProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  currentSubScreen: SettingsSubScreen;
  setCurrentSubScreen: (screen: SettingsSubScreen) => void;
  status: AssistantStatus;
  isListeningMode?: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  onSubmitPrompt: (customText?: string, image?: { base64: string; mimeType?: string; name?: string; size?: string }) => void;
  onTriggerVoice: () => void;
  onSelectRoutineAction: (action: string) => void;
  onSendVisionQuery: (query: string, image?: { base64: string; mimeType?: string }) => void;
  onClearChat: () => void;
  // Agent V1 Props
  activeAgentTask?: AgentTaskContext | null;
  onApproveAgentAction?: () => void;
  onRejectAgentAction?: () => void;
  onCancelAgentTask?: () => void;
  // Configs
  personalConfig: UserPersonalConfig;
  setPersonalConfig: React.Dispatch<React.SetStateAction<UserPersonalConfig>>;
  assistantConfig: AssistantConfig;
  setAssistantConfig: React.Dispatch<React.SetStateAction<AssistantConfig>>;
  appearanceConfig: AppearanceConfig;
  setAppearanceConfig: React.Dispatch<React.SetStateAction<AppearanceConfig>>;
  voiceGuardianConfig: VoiceGuardianConfig;
  setVoiceGuardianConfig: React.Dispatch<React.SetStateAction<VoiceGuardianConfig>>;
  advancedConfig: AdvancedConfig;
  setAdvancedConfig: React.Dispatch<React.SetStateAction<AdvancedConfig>>;
  permissions: PermissionItem[];
  setPermissions: React.Dispatch<React.SetStateAction<PermissionItem[]>>;
  skills: SkillItem[];
  setSkills: React.Dispatch<React.SetStateAction<SkillItem[]>>;
  subAgents: SubAgentItem[];
  setSubAgents: React.Dispatch<React.SetStateAction<SubAgentItem[]>>;
  integrations: IntegrationItem[];
  memories: MemoryItem[];
  setMemories: React.Dispatch<React.SetStateAction<MemoryItem[]>>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onOpenOnboarding?: () => void;
}

export const AndroidPhoneFrame: React.FC<AndroidPhoneFrameProps> = ({
  activeTab,
  setActiveTab,
  isSettingsOpen,
  setIsSettingsOpen,
  currentSubScreen,
  setCurrentSubScreen,
  status,
  isListeningMode = false,
  inputText,
  setInputText,
  onSubmitPrompt,
  onTriggerVoice,
  onSelectRoutineAction,
  onSendVisionQuery,
  onClearChat,
  activeAgentTask,
  onApproveAgentAction,
  onRejectAgentAction,
  onCancelAgentTask,
  personalConfig,
  setPersonalConfig,
  assistantConfig,
  setAssistantConfig,
  appearanceConfig,
  setAppearanceConfig,
  voiceGuardianConfig,
  setVoiceGuardianConfig,
  advancedConfig,
  setAdvancedConfig,
  permissions,
  setPermissions,
  skills,
  setSkills,
  subAgents,
  setSubAgents,
  integrations,
  memories,
  setMemories,
  messages,
  setMessages,
  onOpenOnboarding
}) => {
  const [isFloatingOverlayOpen, setIsFloatingOverlayOpen] = useState<boolean>(false);
  const [scanCaptureSignal, setScanCaptureSignal] = useState<number>(0);
  const [memoriesAddSignal, setMemoriesAddSignal] = useState<number>(0);
  const [isGearRotating, setIsGearRotating] = useState<boolean>(false);

  const isDark = appearanceConfig?.darkMode ?? true;

  const handleOpenSettingsWithSpring = () => {
    setIsGearRotating(true);
    setTimeout(() => {
      setIsSettingsOpen(true);
      setCurrentSubScreen('root');
      setIsGearRotating(false);
    }, 200);
  };

  // Background Wake-Word activation ("Mayra", "Hey Mayra", "Mayra utho") & continuous listening
  const { isListeningForWakeWord } = useMayraWakeWord({
    status,
    isListeningMode,
    enabled: true,
    onSpeechCaptured: (text) => {
      setInputText(text);
      onSubmitPrompt(text);
    },
    onWakeWordDetected: (query) => {
      setIsFloatingOverlayOpen(true);
      if (query && query.length > 1) {
        setInputText(query);
        onSubmitPrompt(query);
      } else {
        onTriggerVoice();
      }
    }
  });

  const handleOpenPermissions = () => {
    setIsSettingsOpen(true);
    setCurrentSubScreen('permissions');
  };

  const handleCenterAction = () => {
    if (activeTab === 'scan') {
      // Trigger Vision Shutter
      setScanCaptureSignal(prev => prev + 1);
    } else if (activeTab === 'memories') {
      // Trigger Memories Add Context Menu
      setMemoriesAddSignal(prev => prev + 1);
    } else {
      // Trigger Voice Engine
      console.log('[MAYRA Pipeline] MIC_CLICK: Center Action Button pressed on tab:', activeTab);
      onTriggerVoice();
    }
  };

  const lastAssistantMessage = messages.filter(m => m.sender === 'mayra').slice(-1)[0]?.text;
  const currentTheme = getThemePreset(appearanceConfig.appTheme);

  return (
    <div 
      className={`w-full h-full flex flex-col relative overflow-hidden bg-[#070913] select-none ${
        appearanceConfig.auraBorderMode ? `ring-1 ring-inset ${currentTheme.activeBorder} ${currentTheme.glowShadow}` : ''
      }`}
      style={{
        '--theme-primary': currentTheme.primaryHex,
        '--theme-secondary': currentTheme.secondaryHex
      } as React.CSSProperties}
    >

      {/* Aura Border Pulse Effect */}
      {appearanceConfig.auraBorderMode && (
        <div className={`absolute inset-0 pointer-events-none z-50 border ${currentTheme.activeBorder} rounded-none shadow-[inset_0_0_24px_rgba(255,255,255,0.15)] animate-pulse`} />
      )}
      
      {/* Top Floating Quick Controls Bar (Visible on Memories and Chat screens) */}
      {!isSettingsOpen && (activeTab === 'memories' || activeTab === 'chat') && (
        <div className="h-11 px-3 bg-slate-950/65 backdrop-blur-2xl flex items-center justify-between border-b border-white/10 z-20 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MayraLogo size={20} showGlow={false} iconVariant={appearanceConfig.launcherIconVariant} />
            <span className="font-sans font-extrabold text-xs text-white tracking-wide truncate">
              ★𝐌₳ᎽⱤ₳ ᥫ᭡
            </span>
            {appearanceConfig.voiceVisualizerEnabled && status === 'SPEAKING' && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>VOICE</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Backup button ONLY on Memories and Chat screens */}
            {(activeTab === 'memories' || activeTab === 'chat') && (
              <button
                onClick={handleOpenPermissions}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xl border border-white/15 rounded-xl text-[10px] font-mono text-cyan-300 transition-all whitespace-nowrap shadow-sm"
                title="Data Backup & Permissions"
              >
                <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Backup</span>
              </button>
            )}

            {/* If on Chat screen, place Delete / Trash icon right next to Settings */}
            {activeTab === 'chat' && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClearChat}
                className="p-1.5 text-slate-300 hover:text-red-400 bg-white/[0.06] hover:bg-white/[0.14] rounded-xl border border-white/15 backdrop-blur-xl transition-all shrink-0 cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleOpenSettingsWithSpring}
              className="p-1.5 text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 rounded-xl border border-cyan-400/30 backdrop-blur-xl shadow-[0_0_10px_rgba(6,182,212,0.25)] transition-all shrink-0 group cursor-pointer"
              title="Settings"
            >
              <SettingsIcon className={`w-3.5 h-3.5 text-cyan-400 transition-transform duration-300 ${isGearRotating ? 'rotate-180 scale-110' : 'animate-[spin_10s_linear_infinite]'}`} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Screen Body Viewport with AnimatePresence Transitions */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Settings Full View */}
          {isSettingsOpen ? (
            <motion.div
              key="settings-screen"
              initial={{ opacity: 0, x: 20, scale: 0.99 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full h-full flex flex-col"
            >
              <MayraSettingsScreen
                currentSubScreen={currentSubScreen}
                setCurrentSubScreen={setCurrentSubScreen}
                onCloseSettings={() => setIsSettingsOpen(false)}
                personalConfig={personalConfig}
                setPersonalConfig={setPersonalConfig}
                assistantConfig={assistantConfig}
                setAssistantConfig={setAssistantConfig}
                appearanceConfig={appearanceConfig}
                setAppearanceConfig={setAppearanceConfig}
                voiceGuardianConfig={voiceGuardianConfig}
                setVoiceGuardianConfig={setVoiceGuardianConfig}
                advancedConfig={advancedConfig}
                setAdvancedConfig={setAdvancedConfig}
                permissions={permissions}
                setPermissions={setPermissions}
                skills={skills}
                setSkills={setSkills}
                subAgents={subAgents}
                setSubAgents={setSubAgents}
                integrations={integrations}
                memories={memories}
                setMemories={setMemories}
                messages={messages}
                setMessages={setMessages}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.985, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.985, y: -8 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full h-full flex flex-col"
            >
              {/* Tab 1: Home Screen (Character 3D Engine & Interactive Stage) */}
              {activeTab === 'home' && (
                <HomeScreen
                  status={status}
                  personalConfig={personalConfig}
                  assistantConfig={assistantConfig}
                  appearanceConfig={appearanceConfig}
                  permissions={permissions}
                  messages={messages}
                  inputText={inputText}
                  setInputText={setInputText}
                  onSubmitPrompt={onSubmitPrompt}
                  onTriggerVoice={onTriggerVoice}
                  onSelectAction={onSelectRoutineAction}
                  onOpenSettings={handleOpenSettingsWithSpring}
                  onOpenPermissions={handleOpenPermissions}
                  proactiveEnabled={(assistantConfig as any)?.proactiveSuggestions ?? true}
                />
              )}

              {/* Tab 2: Vision Scanner (Full bleed with transformed shutter) */}
              {activeTab === 'scan' && (
                <ScannerScreen 
                  aspectRatio={appearanceConfig.cameraAspectRatio || '9:16'}
                  onSendVisionQuery={(query, image) => {
                    onSendVisionQuery(query, image);
                    setActiveTab('chat');
                  }}
                  triggerCaptureSignal={scanCaptureSignal}
                />
              )}

              {/* Tab 3: Memories Database Screen */}
              {activeTab === 'memories' && (
                <MemoriesScreen
                  memories={memories}
                  triggerAddSignal={memoriesAddSignal}
                  onAddMemory={(newMem) => {
                    const createdItem: MemoryItem = {
                      ...newMem,
                      id: `mem-${Date.now()}`,
                      timestamp: Date.now()
                    };
                    setMemories(prev => [createdItem, ...prev]);
                  }}
                  onDeleteMemory={(id) => {
                    setMemories(prev => prev.filter(m => m.id !== id));
                  }}
                  onTogglePin={(id) => {
                    setMemories(prev => prev.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m));
                  }}
                  onTriggerDirectMessage={(contactName, type) => {
                    if (type === 'whatsapp') {
                      setInputText(`Send a WhatsApp message to ${contactName}: `);
                    } else {
                      setInputText(`Call ${contactName} on phone`);
                    }
                    setActiveTab('chat');
                  }}
                />
              )}

              {/* Tab 4: Chat Stream */}
              {activeTab === 'chat' && (
                <ChatScreen
                  messages={messages}
                  status={status}
                  inputText={inputText}
                  setInputText={setInputText}
                  onSubmitPrompt={onSubmitPrompt}
                  onTriggerVoice={onTriggerVoice}
                  onClearChat={onClearChat}
                  onOpenVisionScanner={() => setActiveTab('scan')}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Android Bottom Navigation Bar (Equal 5-column grid with icon-only minimalist tabs) */}
      {!isSettingsOpen && (
        <div className={`h-16 border-t px-1 z-20 shrink-0 grid grid-cols-5 items-center transition-colors duration-200 ${
          isDark 
            ? 'bg-slate-950/70 backdrop-blur-2xl border-white/10 text-slate-400' 
            : 'bg-white/95 backdrop-blur-2xl border-slate-200 text-slate-600 shadow-lg'
        }`}>
          
          {/* Tab 1: Home */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => setActiveTab('home')}
            aria-label="Home"
            title="Home"
            className={`flex items-center justify-center w-full min-w-0 h-full bg-transparent border-0 outline-none focus:outline-none transition-colors cursor-pointer ${
              activeTab === 'home' 
                ? isDark 
                  ? currentTheme.activeText 
                  : currentTheme.activeText
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home 
              className="w-5 h-5 shrink-0" 
              style={activeTab === 'home' && isDark ? { filter: `drop-shadow(0 0 6px ${currentTheme.primaryHex})` } : undefined}
            />
          </motion.button>

          {/* Tab 2: Scan */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => setActiveTab('scan')}
            aria-label="Scan"
            title="Scan"
            className={`flex items-center justify-center w-full min-w-0 h-full bg-transparent border-0 outline-none focus:outline-none transition-colors cursor-pointer ${
              activeTab === 'scan' 
                ? isDark 
                  ? currentTheme.activeText 
                  : currentTheme.activeText
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera 
              className="w-5 h-5 shrink-0" 
              style={activeTab === 'scan' && isDark ? { filter: `drop-shadow(0 0 6px ${currentTheme.primaryHex})` } : undefined}
            />
          </motion.button>

          {/* Tab 3: Center Large Dynamic Action Button */}
          <div className="flex flex-col items-center justify-center w-full min-w-0 -mt-2">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleCenterAction}
              className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all shrink-0 overflow-hidden relative cursor-pointer ${
                activeTab === 'scan'
                  ? `bg-gradient-to-tr ${currentTheme.buttonGradient} text-white ${currentTheme.glowShadow} border-2 border-white`
                  : activeTab === 'memories'
                  ? 'bg-gradient-to-tr from-purple-500 via-indigo-600 to-cyan-500 text-white shadow-[0_0_18px_rgba(168,85,247,0.6)] border-2 border-white/90'
                  : isListeningMode || status === 'LISTENING'
                  ? 'bg-[#050e1f] text-white shadow-[0_0_24px_rgba(6,182,212,0.9)] border-2 border-cyan-400'
                  : status === 'SPEAKING'
                  ? 'bg-[#070e24] text-white shadow-[0_0_24px_rgba(56,189,248,0.85)] border-2 border-sky-400'
                  : status === 'THINKING'
                  ? 'bg-[#140b22] text-white shadow-[0_0_22px_rgba(245,158,11,0.75)] border-2 border-amber-400'
                  : isDark
                  ? `bg-[#060b19] hover:bg-[#0a1226] text-slate-200 hover:text-white border-2 ${currentTheme.activeBorder} shadow-[0_4px_16px_rgba(0,0,0,0.6)]`
                  : `bg-slate-900 hover:bg-slate-800 text-white border-2 ${currentTheme.activeBorder} shadow-lg`
              }`}
              title={
                activeTab === 'scan'
                  ? 'Tap to Capture and Analyze'
                  : activeTab === 'memories'
                  ? 'Add Memory or Family Contact'
                  : isListeningMode || status === 'LISTENING'
                  ? 'Listening... Tap to stop'
                  : status === 'SPEAKING'
                  ? 'Mayra Speaking... Tap to interrupt'
                  : 'Tap to speak'
              }
            >
              {activeTab === 'scan' ? (
                <Camera className="w-6 h-6 stroke-[2.2] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              ) : activeTab === 'memories' ? (
                <Plus className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <VoiceControlOrb
                  status={status}
                  isListeningMode={isListeningMode}
                  appearanceConfig={appearanceConfig}
                  size={48}
                />
              )}
            </motion.button>
          </div>

          {/* Tab 4: Memories */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => setActiveTab('memories')}
            aria-label="Memories"
            title="Memories"
            className={`flex items-center justify-center w-full min-w-0 h-full bg-transparent border-0 outline-none focus:outline-none transition-colors cursor-pointer ${
              activeTab === 'memories' 
                ? isDark 
                  ? 'text-purple-400' 
                  : 'text-purple-600'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Brain 
              className="w-5 h-5 shrink-0" 
              style={activeTab === 'memories' && isDark ? { filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))' } : undefined}
            />
          </motion.button>

          {/* Tab 5: Chat */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => setActiveTab('chat')}
            aria-label="Chat"
            title="Chat"
            className={`flex items-center justify-center w-full min-w-0 h-full bg-transparent border-0 outline-none focus:outline-none transition-colors cursor-pointer ${
              activeTab === 'chat' 
                ? isDark 
                  ? currentTheme.activeText 
                  : currentTheme.activeText
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare 
              className="w-5 h-5 shrink-0" 
              style={activeTab === 'chat' && isDark ? { filter: `drop-shadow(0 0 6px ${currentTheme.primaryHex})` } : undefined}
            />
          </motion.button>
        </div>
      )}

      {/* Android Gesture Bar */}
      <div className={`h-4 flex items-center justify-center shrink-0 transition-colors ${
        isDark ? 'bg-[#070913]' : 'bg-slate-100'
      }`}>
        <div className={`w-28 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-slate-400'}`}></div>
      </div>

      {/* Agent V1 Task HUD & Permission Gate Approval UI */}
      <AgentTaskHUD
        taskContext={activeAgentTask || null}
        onApprove={onApproveAgentAction || (() => {})}
        onReject={onRejectAgentAction || (() => {})}
        onCancel={onCancelAgentTask || (() => {})}
      />

      {/* iOS Magnifying Glass / Glassmorphism Floating Assistant Overlay */}
      <FloatingMayraOverlay
        isOpen={isFloatingOverlayOpen}
        onClose={() => setIsFloatingOverlayOpen(false)}
        status={status}
        inputText={inputText}
        setInputText={setInputText}
        onSubmitPrompt={onSubmitPrompt}
        onTriggerVoice={onTriggerVoice}
        onSelectAction={onSelectRoutineAction}
        lastResponse={lastAssistantMessage}
        appearanceConfig={appearanceConfig}
      />

      {/* Background Hand-Gesture Floating Overlay Bubble & Always-Visible Camera Indicator */}
      <BackgroundGestureOverlayBubble
        isEnabled={advancedConfig.backgroundHandGestureEnabled}
        onToggleEnabled={(enabled) => setAdvancedConfig(prev => ({ ...prev, backgroundHandGestureEnabled: enabled }))}
        status={status}
        appearanceConfig={appearanceConfig}
        onTriggerVoice={onTriggerVoice}
        onOpenApp={() => {
          setIsSettingsOpen(false);
          setActiveTab('home');
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          setCurrentSubScreen('advanced');
        }}
      />

    </div>
  );
};
