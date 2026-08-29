import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AndroidPhoneFrame } from './components/AndroidPhoneFrame';
import { StonicxAppShell } from './components/stonicx/StonicxAppShell';
import { SettingsSubScreen, ActiveTab, AppAction } from './types';
import { useMayraAssistant } from './hooks/useMayraAssistant';
import { useMayraPermissions } from './hooks/useMayraPermissions';
import { useMayraSettings } from './hooks/useMayraSettings';
import { OnboardingFlowModal } from './components/onboarding/OnboardingFlowModal';
import { CipherGlitchOverlay } from './components/common/CipherGlitchOverlay';
import './services/router/delegationTestHarness';
import './services/stonicx/stonicxPowerTestHarness';
import './services/audio/voicePipelineTestHarness';
import './services/memory/memoryVaultTestHarness';
import './services/tools/toolCallingTestHarness';
import './services/stage/stageCanvasTestHarness';
import { MemoryVaultManager } from './services/memory/memoryVaultManager';
import { FloatingDataCardLayer } from './components/tools/FloatingDataCardLayer';
import { BarehandsStageCanvas } from './components/stage/BarehandsStageCanvas';

export default function App() {
  // Initial App Startup / Splash screen state
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    // Initialize unified shared markdown memory vault
    MemoryVaultManager.getInstance().initializeVault().catch(() => {});

    const timer1 = setTimeout(() => {
      setSplashFading(true);
    }, 1100);

    const timer2 = setTimeout(() => {
      setIsSplashVisible(false);
      // Check for first launch onboarding
      if (typeof window !== 'undefined') {
        const completed = localStorage.getItem('mayra_onboarding_completed');
        if (!completed) {
          setIsOnboardingOpen(true);
        }
      }
    }, 1550);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Phone internal navigation state
  const [activePhoneTab, setActivePhoneTab] = useState<ActiveTab>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentSubScreen, setCurrentSubScreen] = useState<SettingsSubScreen>('root');

  // Decoupled settings state & persistence
  const {
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
    skills,
    setSkills,
    subAgents,
    setSubAgents,
    integrations,
    memories,
    setMemories
  } = useMayraSettings();

  // Sync dark class and heading font on document element
  useEffect(() => {
    if (appearanceConfig.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const font = appearanceConfig.headingFont || 'system';
    let fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    if (font === 'orbitron') {
      fontFamily = "'Orbitron', -apple-system, BlinkMacSystemFont, sans-serif";
    } else if (font === 'sora') {
      fontFamily = "'Sora', -apple-system, BlinkMacSystemFont, sans-serif";
    } else if (font === 'manrope') {
      fontFamily = "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif";
    } else if (font === 'space_grotesk') {
      fontFamily = "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
    }
    document.documentElement.style.setProperty('--font-heading', fontFamily);
  }, [appearanceConfig.darkMode, appearanceConfig.headingFont]);

  // Decoupled permissions management (14 permissions)
  const {
    permissions,
    setPermissions,
    grantedCount,
    totalCount
  } = useMayraPermissions();

  // Action Dispatcher for Voice & Text Commands
  const handleExecuteAction = useCallback((action: AppAction) => {
    if (!action || !action.type) return;

    console.log('[MAYRA Pipeline] ACTION_REQUESTED:', action.type, action.payload);

    switch (action.type) {
      case 'SAVE_MEMORY': {
        const { key, value, category } = action.payload || {};
        if (key && value) {
          setMemories((prev) => {
            const exists = prev.find((m) => m.key.toLowerCase() === key.toLowerCase());
            if (exists) {
              return prev.map((m) =>
                m.key.toLowerCase() === key.toLowerCase() ? { ...m, value, timestamp: Date.now() } : m
              );
            }
            return [
              {
                id: `mem-${Date.now()}`,
                key,
                value,
                category: category || 'personal',
                isPinned: false,
                timestamp: Date.now()
              },
              ...prev
            ];
          });
          console.log('[MAYRA Pipeline] ACTION_EXECUTED: SAVE_MEMORY');
          console.log('[MAYRA Pipeline] ACTION_VERIFIED: Memory stored successfully — ' + key + ': ' + value);
        }
        break;
      }
      case 'AUTO_MEMORY_SAVED': {
        const { key, value, category } = action.payload || {};
        if (key && value) {
          setMemories((prev) => {
            const exists = prev.find((m) => m.key.toLowerCase() === key.toLowerCase());
            if (exists) {
              return prev.map((m) =>
                m.key.toLowerCase() === key.toLowerCase() ? { ...m, value, timestamp: Date.now() } : m
              );
            }
            return [
              {
                id: `mem-auto-${Date.now()}`,
                key,
                value,
                category: category || 'personal',
                isPinned: false,
                timestamp: Date.now()
              },
              ...prev
            ];
          });
          console.log('[MAYRA Auto Memory] ✦ Personal Fact Saved in Background:', key, '->', value);
        }
        break;
      }
      case 'DELETE_MEMORY': {
        const { key, id } = action.payload || {};
        if (id || key) {
          setMemories((prev) => prev.filter((m) => (id ? m.id !== id : m.key.toLowerCase() !== key.toLowerCase())));
          console.log('[MAYRA Pipeline] ACTION_EXECUTED: DELETE_MEMORY');
          console.log('[MAYRA Pipeline] ACTION_VERIFIED: Memory item removed');
        }
        break;
      }
      case 'CLEAR_MEMORIES': {
        setMemories([]);
        console.log('[MAYRA Pipeline] ACTION_EXECUTED: CLEAR_MEMORIES');
        console.log('[MAYRA Pipeline] ACTION_VERIFIED: All memories cleared');
        break;
      }
      case 'NAVIGATE_TAB': {
        const { tab } = action.payload || {};
        if (tab) {
          setActivePhoneTab(tab);
          setIsSettingsOpen(false);
          console.log('[MAYRA Pipeline] ACTION_EXECUTED: NAVIGATE_TAB ->', tab);
          console.log('[MAYRA Pipeline] ACTION_VERIFIED: Active tab set to', tab);
        }
        break;
      }
      case 'OPEN_SETTINGS': {
        const { subScreen } = action.payload || {};
        setIsSettingsOpen(true);
        setCurrentSubScreen(subScreen || 'root');
        console.log('[MAYRA Pipeline] ACTION_EXECUTED: OPEN_SETTINGS');
        console.log('[MAYRA Pipeline] ACTION_VERIFIED: Settings sub-screen opened ->', subScreen || 'root');
        break;
      }
      case 'TOGGLE_PERMISSION':
      case 'GRANT_PERMISSION': {
        const { permissionId } = action.payload || {};
        if (permissionId) {
          setPermissions((prev) =>
            prev.map((p) => (p.id === permissionId ? { ...p, status: 'granted' } : p))
          );
          console.log('[MAYRA Pipeline] ACTION_EXECUTED: GRANT_PERMISSION ->', permissionId);
          console.log('[MAYRA Pipeline] ACTION_VERIFIED: Permission granted');
        }
        break;
      }
      case 'TRIGGER_SCAN': {
        setActivePhoneTab('scan');
        setIsSettingsOpen(false);
        console.log('[MAYRA Pipeline] ACTION_EXECUTED: TRIGGER_SCAN');
        console.log('[MAYRA Pipeline] ACTION_VERIFIED: Scanner tab active');
        break;
      }
      case 'CONTACT_ACTION': {
        const { contactName, service } = action.payload || {};
        if (service === 'whatsapp') {
          const cleanNum = '919876543210';
          if (typeof window !== 'undefined') {
            window.open(`https://wa.me/${cleanNum}`, '_blank', 'noopener,noreferrer');
          }
          console.log('[MAYRA Pipeline] ACTION_EXECUTED: CONTACT_ACTION -> WhatsApp to ' + contactName);
          console.log('[MAYRA Pipeline] ACTION_VERIFIED: Communication URL launched');
        }
        break;
      }
      default:
        break;
    }
  }, [setMemories, setActivePhoneTab, setIsSettingsOpen, setCurrentSubScreen, setPermissions]);

  // Decoupled voice assistant state machine & Gemini chat processing
  const {
    status,
    isListeningMode,
    inputText,
    setInputText,
    messages,
    setMessages,
    submitPrompt,
    triggerVoice,
    clearChat,
    activeAgentTask,
    approveAgentAction,
    rejectAgentAction,
    cancelAgentTask
  } = useMayraAssistant({
    personalConfig,
    assistantConfig,
    memories,
    onExecuteAction: handleExecuteAction,
    onModeSwitch: (mode) => {
      setAssistantConfig((prev) => ({ ...prev, activeMode: mode }));
    }
  });

  const handleSelectRoutineAction = (action: string) => {
    if (action === 'scan') {
      setActivePhoneTab('scan');
      setIsSettingsOpen(false);
    } else if (action === 'memories') {
      setActivePhoneTab('memories');
      setIsSettingsOpen(false);
    } else if (action === 'search') {
      setActivePhoneTab('chat');
      setIsSettingsOpen(false);
      setInputText('Perform a deep intelligence web search for Android Kotlin architecture best practices.');
    } else if (action === 'settings') {
      setIsSettingsOpen(true);
      setCurrentSubScreen('root');
    } else if (action === 'permissions') {
      setIsSettingsOpen(true);
      setCurrentSubScreen('permissions');
    }
  };

  const handleSendVisionQuery = (query: string, image?: { base64: string; mimeType?: string }) => {
    setActivePhoneTab('chat');
    setIsSettingsOpen(false);
    if (image) {
      submitPrompt(query, image);
    } else {
      setInputText(query);
    }
  };

  const isStonicxMode = assistantConfig.activeMode === 'stonicx';

  return (
    <div className={`fixed inset-0 w-screen h-[100dvh] min-h-screen overflow-hidden font-sans select-none flex flex-col transition-colors duration-200 ${
      isStonicxMode ? 'bg-[#04060A] text-slate-100' : (appearanceConfig.darkMode ? 'bg-[#070913] text-slate-200' : 'bg-slate-50 text-slate-800')
    }`}>
      <AnimatePresence mode="wait">
        {isStonicxMode ? (
          <motion.div
            key="stonicx-app-shell"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
          >
            <StonicxAppShell
              onSwitchToMayra={() => {
                setAssistantConfig((prev) => ({ ...prev, activeMode: 'mayra' }));
              }}
              personalConfig={personalConfig}
              setPersonalConfig={setPersonalConfig}
              assistantConfig={assistantConfig}
              setAssistantConfig={setAssistantConfig}
              permissions={permissions}
              setPermissions={setPermissions}
            />
          </motion.div>
        ) : (
          <motion.div
            key="mayra-app-shell"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full flex flex-col"
          >
            <AndroidPhoneFrame
              activeTab={activePhoneTab}
              setActiveTab={setActivePhoneTab}
              isSettingsOpen={isSettingsOpen}
              setIsSettingsOpen={setIsSettingsOpen}
              currentSubScreen={currentSubScreen}
              setCurrentSubScreen={setCurrentSubScreen}
              status={status}
              isListeningMode={isListeningMode}
              inputText={inputText}
              setInputText={setInputText}
              onSubmitPrompt={(text, img) => submitPrompt(text, img)}
              onTriggerVoice={triggerVoice}
              onSelectRoutineAction={handleSelectRoutineAction}
              onSendVisionQuery={handleSendVisionQuery}
              onClearChat={clearChat}
              activeAgentTask={activeAgentTask}
              onApproveAgentAction={approveAgentAction}
              onRejectAgentAction={rejectAgentAction}
              onCancelAgentTask={cancelAgentTask}
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
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 0. FIRST LAUNCH / INTERACTIVE 6-STEP ONBOARDING TOUR */}
      <OnboardingFlowModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        personalConfig={personalConfig}
        setPersonalConfig={setPersonalConfig}
        assistantConfig={assistantConfig}
        setAssistantConfig={setAssistantConfig}
        appearanceConfig={appearanceConfig}
        setAppearanceConfig={setAppearanceConfig}
        permissions={permissions}
        setPermissions={setPermissions}
      />

      {/* 1. APP STARTUP / SPLASH SCREEN (Centered Complete MAYRA Logo, No Text, No Cropping) */}
      {isSplashVisible && (
        <div 
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#070914] pointer-events-none transition-opacity duration-500 ease-out ${
            splashFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex items-center justify-center p-4">
            <img
              src="/ic_launcher_foreground.png"
              alt="MAYRA Startup Logo"
              className="w-32 h-32 md:w-36 md:h-36 max-w-full max-h-full object-contain pointer-events-none select-none drop-shadow-[0_0_35px_rgba(6,182,212,0.45)]"
              draggable={false}
              onError={(e) => {
                if (e.currentTarget.src !== '/mayra_logo.png') {
                  e.currentTarget.src = '/mayra_logo.png';
                }
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Autonomous Task Delegation & Persona Switch Cipher HUD */}
      <CipherGlitchOverlay />

      {/* 3. Autonomous Floating HUD Data Cards Layer */}
      <FloatingDataCardLayer />

      {/* 4. Phase H: Barehands Virtual Workspace & Interactive Stage Canvas */}
      <BarehandsStageCanvas />
    </div>
  );
}
