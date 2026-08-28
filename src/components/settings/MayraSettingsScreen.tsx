import React, { useState } from 'react';
import { AppLockConfig } from '../security/useAppLock';
import { HomeScreenWidgetModal } from '../widgets/HomeScreenWidgetModal';
import { 
  SettingsSubScreen, UserPersonalConfig, AssistantConfig, 
  VoiceGuardianConfig, AdvancedConfig, SkillItem, SubAgentItem, 
  IntegrationItem, MemoryItem, ChatMessage, CountryCodeItem,
  PermissionItem, AppearanceConfig
} from '../../types';
import { PersonalSettingsView } from './PersonalSettingsView';
import { CountryCodeView } from './CountryCodeView';
import { AssistantSettingsView } from './AssistantSettingsView';
import { AppearanceView } from './AppearanceView';
import { OrbCustomizationView } from './OrbCustomizationView';
import { VoiceGuardianView } from './VoiceGuardianView';
import { SkillsView } from './SkillsView';
import { SubAgentsView } from './SubAgentsView';
import { BackupView } from './BackupView';
import { AdvancedSettingsView } from './AdvancedSettingsView';
import { OptionalIntegrationsView } from './OptionalIntegrationsView';
import { PrivacyView } from './PrivacyView';
import { AboutView } from './AboutView';
import { PermissionsCenterView } from './PermissionsCenterView';
import { NativeIntegrationView } from './NativeIntegrationView';
import { LinkedDevicesView } from './LinkedDevicesView';
import { OfflineModelsView } from './OfflineModelsView';
import { WhiteboardTool } from '../tools/WhiteboardTool';
import { MayraLogo } from '../common/MayraLogo';
import { AppIconTile } from '../common/AppIconTile';
import { ORB_STYLES, ORB_COLORS } from '../character/MayraOrb';
import { 
  Settings as SettingsIcon, User, Globe, Sparkles, 
  Wrench, Bot, ShieldCheck, Database, Cpu, 
  Boxes, Lock, Info, ChevronRight, ArrowLeft, Search, X,
  Shield, CheckCircle2, Smartphone, PenTool, HardDrive,
  Palette, Moon, Sun
} from 'lucide-react';

interface MayraSettingsScreenProps {
  currentSubScreen: SettingsSubScreen;
  setCurrentSubScreen: (screen: SettingsSubScreen) => void;
  onCloseSettings: () => void;
  // State bindings
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
  appLockConfig?: AppLockConfig;
  onUpdateAppLock?: (updates: Partial<AppLockConfig>) => void;
  onLockAppNow?: () => void;
  onLaunchVoice?: () => void;
  onLaunchScan?: () => void;
  onLaunchChat?: () => void;
  onLaunchRoutine?: (prompt: string) => void;
}

export const MayraSettingsScreen: React.FC<MayraSettingsScreenProps> = ({
  currentSubScreen,
  setCurrentSubScreen,
  onCloseSettings,
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
  onOpenOnboarding,
  appLockConfig,
  onUpdateAppLock,
  onLockAppNow,
  onLaunchVoice,
  onLaunchScan,
  onLaunchChat,
  onLaunchRoutine
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const isDark = appearanceConfig?.darkMode ?? true;

  // Handle toggles
  const handleToggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleToggleAgent = (id: string) => {
    setSubAgents(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleSelectCountry = (country: CountryCodeItem) => {
    setPersonalConfig(prev => ({
      ...prev,
      countryDialCode: country.dialCode,
      countryName: country.name
    }));
  };

  const handleClearAllData = () => {
    setMemories([]);
    setMessages([]);
  };

  const handleRestoreData = (restored: MemoryItem[]) => {
    setMemories(restored);
  };

  // Sub-screen routing
  if (currentSubScreen === 'permissions') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PermissionsCenterView
          permissions={permissions}
          setPermissions={setPermissions}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'native_integration') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <NativeIntegrationView
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'appearance') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AppearanceView
          config={appearanceConfig}
          onChange={(updated) => setAppearanceConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => setCurrentSubScreen('root')}
          onNavigateToOrbStudio={() => setCurrentSubScreen('orb_customization')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'orb_customization') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <OrbCustomizationView
          config={appearanceConfig}
          onChange={(updated) => setAppearanceConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => setCurrentSubScreen('root')}
          onNavigateToAppearance={() => setCurrentSubScreen('appearance')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'personal') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PersonalSettingsView
          config={personalConfig}
          onChange={(updated) => setPersonalConfig(prev => ({ ...prev, ...updated }))}
          onOpenCountryPicker={() => setCurrentSubScreen('country_code')}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'country_code') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <CountryCodeView
          selectedDialCode={personalConfig.countryDialCode}
          onSelectCountry={handleSelectCountry}
          onBack={() => setCurrentSubScreen('personal')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'assistant') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AssistantSettingsView
          config={assistantConfig}
          onChange={(updated) => setAssistantConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'voice_guardian') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <VoiceGuardianView
          config={voiceGuardianConfig}
          onChange={(updated) => setVoiceGuardianConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'skills') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <SkillsView
          skills={skills}
          onToggleSkill={handleToggleSkill}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'sub_agents') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <SubAgentsView
          subAgents={subAgents}
          onToggleAgent={handleToggleAgent}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'backup') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <BackupView
          memories={memories}
          messages={messages}
          onClearAllData={handleClearAllData}
          onRestoreData={handleRestoreData}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'advanced') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AdvancedSettingsView
          config={advancedConfig}
          onChange={(updated) => setAdvancedConfig(prev => ({ ...prev, ...updated }))}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'optional_integrations') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <OptionalIntegrationsView
          integrations={integrations}
          onBack={() => setCurrentSubScreen('root')}
        />
      </div>
    );
  }

  if (currentSubScreen === 'privacy') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PrivacyView 
          onBack={() => setCurrentSubScreen('root')} 
          permissions={permissions}
          setPermissions={setPermissions}
          memories={memories}
          setMemories={setMemories}
          messages={messages}
          setMessages={setMessages}
          appLockConfig={appLockConfig}
          onUpdateAppLock={onUpdateAppLock}
          onLockAppNow={onLockAppNow}
        />
      </div>
    );
  }

  if (currentSubScreen === 'linked_devices') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <LinkedDevicesView onBack={() => setCurrentSubScreen('root')} />
      </div>
    );
  }

  if (currentSubScreen === 'offline_models') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <OfflineModelsView onBack={() => setCurrentSubScreen('root')} />
      </div>
    );
  }

  if (currentSubScreen === 'whiteboard') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <WhiteboardTool 
          onClose={() => setCurrentSubScreen('root')} 
          onSendToChat={(text) => {
            setMessages(prev => [
              ...prev,
              { id: `msg-${Date.now()}`, sender: 'user', role: 'user', text, timestamp: Date.now() }
            ]);
            setCurrentSubScreen('root');
            onCloseSettings();
          }}
        />
      </div>
    );
  }

  if (currentSubScreen === 'about') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AboutView 
          onBack={() => setCurrentSubScreen('root')} 
          onOpenOnboarding={onOpenOnboarding}
        />
      </div>
    );
  }

interface SettingCategoryItem {
  id: SettingsSubScreen;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  onClick?: () => void;
}

interface SettingCategorySection {
  category: string;
  items: SettingCategoryItem[];
}

  const grantedPermissionsCount = permissions.filter(p => p.status === 'granted' || p.id === 'default_assistant').length;

  const currentOrbStyleName = ORB_STYLES.find(s => s.id === appearanceConfig.orbStyle)?.name || 'Mayra Glow';
  const currentOrbColorName = ORB_COLORS[appearanceConfig.orbColor]?.name || 'Cyan';

  const settingSections: SettingCategorySection[] = [
    {
      category: 'APPEARANCE & PERSONALIZATION',
      items: [
        {
          id: 'orb_customization' as SettingsSubScreen,
          title: 'Orb Customization Studio',
          subtitle: `Rendering physics • Rainbow hue spectrum • Voice visualizer & aura edge`,
          badge: 'STUDIO',
          icon: <AppIconTile icon={Sparkles} color="cyan" size="md" />
        },
        {
          id: 'appearance' as SettingsSubScreen,
          title: 'Appearance & Display',
          subtitle: `${isDark ? 'Dark Mode' : 'Light Mode'} • ${currentOrbStyleName} • Theme Presets`,
          badge: isDark ? 'DARK' : 'LIGHT',
          icon: <AppIconTile icon={Palette} color="purple" size="md" />
        }
      ]
    },
    {
      category: 'PERMISSIONS & SYSTEM ACCESS',
      items: [
        {
          id: 'native_integration' as SettingsSubScreen,
          title: 'Android System Integration',
          subtitle: 'Calls • Direct SMS • WhatsApp auto-tap • Notifications',
          badge: 'KOTLIN',
          icon: <AppIconTile icon={Smartphone} color="blue" size="md" />
        },
        {
          id: 'permissions' as SettingsSubScreen,
          title: 'Permissions Center',
          subtitle: `${grantedPermissionsCount} of ${permissions.length} active • Assistant, Screen, Mic, Overlay`,
          badge: `${grantedPermissionsCount}/${permissions.length}`,
          icon: <AppIconTile icon={Shield} color="emerald" size="md" />
        }
      ]
    },
    {
      category: 'ACCOUNT',
      items: [
        {
          id: 'personal' as SettingsSubScreen,
          title: 'Personal',
          subtitle: `${personalConfig.preferredName || personalConfig.fullName} • API configuration`,
          icon: <AppIconTile icon={User} color="indigo" size="md" />
        },
        {
          id: 'country_code' as SettingsSubScreen,
          title: 'Country Code',
          subtitle: `${personalConfig.countryName} (${personalConfig.countryDialCode})`,
          icon: <AppIconTile icon={Globe} color="teal" size="md" />
        }
      ]
    },
    {
      category: 'ASSISTANT',
      items: [
        {
          id: 'assistant' as SettingsSubScreen,
          title: 'AI Assistant Core Engine',
          subtitle: assistantConfig.activeMode === 'stonicx' 
            ? 'STONICX Active • Living Circuit • Quantum Terminal' 
            : `MAYRA Active • ${assistantConfig.personaTone.toUpperCase()} • 3D Avatar`,
          badge: assistantConfig.activeMode === 'stonicx' ? '⚡ STONICX' : '⭐ MAYRA',
          icon: <AppIconTile icon={Sparkles} color={assistantConfig.activeMode === 'stonicx' ? 'amber' : 'purple'} size="md" />
        },
        {
          id: 'offline_models' as SettingsSubScreen,
          title: 'Offline AI Models',
          subtitle: 'Local GGUF models • LFM 2.5, Qwen, SmolLM2, Llama',
          badge: 'GGUF',
          icon: <AppIconTile icon={HardDrive} color="slate" size="md" />
        },
        {
          id: 'skills' as SettingsSubScreen,
          title: 'Skills',
          subtitle: `${skills.filter(s => s.enabled).length} of ${skills.length} active`,
          icon: <AppIconTile icon={Wrench} color="amber" size="md" />
        },
        {
          id: 'sub_agents' as SettingsSubScreen,
          title: 'Sub-agents',
          subtitle: `${subAgents.filter(a => a.enabled).length} active agents`,
          icon: <AppIconTile icon={Bot} color="pink" size="md" />
        }
      ]
    },
    {
      category: 'VOICE GUARDIAN',
      items: [
        {
          id: 'voice_guardian' as SettingsSubScreen,
          title: 'Voice Guardian',
          subtitle: voiceGuardianConfig.enabled ? 'ACTIVE • Owner Only' : 'DISABLED',
          badge: voiceGuardianConfig.enabled ? 'SHIELD ON' : 'OFF',
          icon: <AppIconTile icon={ShieldCheck} color="cyan" size="md" />
        }
      ]
    },
    {
      category: 'MULTI-DEVICE & CREATIVE TOOLS',
      items: [
        {
          id: 'linked_devices' as SettingsSubScreen,
          title: 'Linked Devices & Sync',
          subtitle: '4 connected • Pixel Watch, Tablet, MacBook relay',
          badge: 'MESH ON',
          icon: <AppIconTile icon={Smartphone} color="blue" size="md" />
        },
        {
          id: 'whiteboard' as SettingsSubScreen,
          title: 'Interactive Whiteboard',
          subtitle: 'Canvas drawing, wireframing & Vision AI analysis',
          badge: 'NEW',
          icon: <AppIconTile icon={PenTool} color="rose" size="md" />
        },
        {
          id: 'widget_guide' as SettingsSubScreen,
          title: 'Home Screen Widget',
          subtitle: 'Android 4x2 Launcher Quick Widget • 1-tap Voice & Scan',
          badge: 'PREVIEW',
          icon: <AppIconTile icon={Smartphone} color="cyan" size="md" />,
          onClick: () => setIsWidgetModalOpen(true)
        }
      ]
    },
    {
      category: 'MEMORY & DATA',
      items: [
        {
          id: 'backup' as SettingsSubScreen,
          title: 'Backup & Storage',
          subtitle: `${memories.length} memories • Export / Reset`,
          icon: <AppIconTile icon={Database} color="blue" size="md" />
        }
      ]
    },
    {
      category: 'SYSTEM & INTEGRATIONS',
      items: [
        {
          id: 'advanced' as SettingsSubScreen,
          title: 'Advanced Settings',
          subtitle: 'Safety filters • Debug logs • Background tasks',
          icon: <AppIconTile icon={Cpu} color="slate" size="md" />
        },
        {
          id: 'optional_integrations' as SettingsSubScreen,
          title: 'Optional Integrations',
          subtitle: `${integrations.filter(i => i.status === 'configured').length} configured • Workspace, Maps, IoT`,
          icon: <AppIconTile icon={Boxes} color="orange" size="md" />
        },
        {
          id: 'privacy' as SettingsSubScreen,
          title: 'Privacy & Security',
          subtitle: 'Zero data sales • On-device biometric shield',
          icon: <AppIconTile icon={Lock} color="rose" size="md" />
        },
        {
          id: 'about' as SettingsSubScreen,
          title: 'About MAYRA',
          subtitle: 'v2.4.0 • Android Jetpack Compose Architecture',
          icon: <AppIconTile icon={Info} color="slate" size="md" />
        }
      ]
    }
  ];

  const filteredSections = settingSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className={`flex-1 flex flex-col h-full relative select-none transition-colors duration-200 ${
      isDark ? 'bg-[#070914] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Header */}
      <div className={`h-14 px-4 border-b flex items-center justify-between z-10 shrink-0 ${
        isDark ? 'bg-[#080B1C] border-white/5' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onCloseSettings}
            className={`p-2 -ml-1 rounded-full transition-all active:scale-95 cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Back to Home"
          >
            <ArrowLeft className={`w-5 h-5 stroke-[1.8] ${isDark ? 'text-white' : 'text-slate-800'}`} />
          </button>

          <div className="flex items-center gap-2">
            <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Settings
            </h1>
          </div>
        </div>

        {/* Quick Dark Mode Switch & MAYRA Logo Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAppearanceConfig(prev => ({ ...prev, darkMode: !prev.darkMode }))}
            className={`p-1.5 rounded-full border transition-all cursor-pointer ${
              isDark 
                ? 'bg-white/5 border-white/10 text-purple-300 hover:bg-white/10' 
                : 'bg-slate-100 border-slate-200 text-amber-600 hover:bg-slate-200'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Moon className="w-4 h-4 stroke-[1.8]" /> : <Sun className="w-4 h-4 stroke-[1.8]" />}
          </button>

          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${
            isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <MayraLogo size={18} showGlow={false} />
            <span className="text-[10px] font-bold tracking-wider">
              MAYRA
            </span>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className={`p-3 border-b shrink-0 ${
        isDark ? 'bg-[#080B1C]/50 border-white/5' : 'bg-white border-slate-200'
      }`}>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 stroke-[1.8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className={`w-full pl-9 pr-8 py-1.5 border rounded-xl text-xs transition-colors focus:outline-hidden ${
              isDark 
                ? 'bg-[#0D1124] border-white/5 text-white placeholder-slate-500 focus:border-blue-500/50' 
                : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3 h-3 stroke-[1.8]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Settings List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {filteredSections.map((section) => (
          <div key={section.category} className="space-y-1">
            <h3 className={`text-[10px] font-bold tracking-widest px-2 uppercase ${
              isDark ? 'text-cyan-400' : 'text-cyan-600'
            }`}>
              {section.category}
            </h3>

            <div className={`border rounded-2xl overflow-hidden divide-y ${
              isDark 
                ? 'bg-[#0C1021] border-white/5 divide-white/5 shadow-lg' 
                : 'bg-white border-slate-200 divide-slate-100 shadow-xs'
            }`}>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if ((item as any).onClick) {
                      (item as any).onClick();
                    } else {
                      setCurrentSubScreen(item.id);
                    }
                  }}
                  className={`w-full p-3 flex items-center justify-between active:scale-[0.99] transition-colors text-left group ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold tracking-tight transition-colors ${
                          isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-cyan-700'
                        }`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            item.badge === 'STUDIO'
                              ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-400/40'
                              : item.badge === 'DARK'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                              : item.badge === 'LIGHT'
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : item.badge.includes('OFF') || item.badge.includes('0/') 
                              ? isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] font-normal font-sans line-clamp-1 mt-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 group-hover:translate-x-0.5 transition-all ${
                    isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-700'
                  }`} />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Quick Replay Welcome Tour Card */}
        {onOpenOnboarding && (
          <div className="pt-2 pb-6">
            <button
              onClick={() => {
                onCloseSettings();
                onOpenOnboarding();
              }}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-cyan-950/60 to-purple-950/60 border border-cyan-500/30 hover:border-cyan-400/60 flex items-center justify-between transition-all group active:scale-[0.98] shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                    <span>Onboarding Dobara Dekhein</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      TOUR
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Replay 6-step Welcome Tour, Language & Permissions
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Home Screen Widget Guide & Preview Modal */}
      <HomeScreenWidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        onLaunchVoice={() => {
          setIsWidgetModalOpen(false);
          onCloseSettings();
          if (onLaunchVoice) onLaunchVoice();
        }}
        onLaunchScan={() => {
          setIsWidgetModalOpen(false);
          onCloseSettings();
          if (onLaunchScan) onLaunchScan();
        }}
        onLaunchChat={() => {
          setIsWidgetModalOpen(false);
          onCloseSettings();
          if (onLaunchChat) onLaunchChat();
        }}
        onLaunchRoutine={(routinePrompt) => {
          setIsWidgetModalOpen(false);
          onCloseSettings();
          if (onLaunchRoutine) onLaunchRoutine(routinePrompt);
        }}
      />

    </div>
  );
};

