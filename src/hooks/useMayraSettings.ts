import { useState, useCallback } from 'react';
import { 
  UserPersonalConfig, AssistantConfig, VoiceGuardianConfig, 
  AdvancedConfig, SkillItem, SubAgentItem, IntegrationItem, 
  MemoryItem, AppearanceConfig, OrbStyleType, OrbColorType,
  AppThemePreset 
} from '../types';
import { 
  INITIAL_SKILLS, INITIAL_SUB_AGENTS, INITIAL_ENROLLED_VOICES, 
  INITIAL_INTEGRATIONS, INITIAL_MEMORIES 
} from '../data/defaultData';
import { APP_THEMES } from '../utils/themePresets';
import { MemoryVaultService } from '../services/memory/memoryVaultService';

// Storage Keys
const PERSONAL_CONFIG_STORAGE_KEY = 'mayra_personal_config';
const ASSISTANT_CONFIG_STORAGE_KEY = 'mayra_assistant_config';
const VOICE_GUARDIAN_CONFIG_STORAGE_KEY = 'mayra_voice_guardian_config';
const ADVANCED_CONFIG_STORAGE_KEY = 'mayra_advanced_config';
const SKILLS_CONFIG_STORAGE_KEY = 'mayra_skills_config';
const SUB_AGENTS_CONFIG_STORAGE_KEY = 'mayra_subagents_config';
const INTEGRATIONS_CONFIG_STORAGE_KEY = 'mayra_integrations_config';

const CHARACTER_SIZE_STORAGE_KEY = 'mayra_character_size';
const CHARACTER_ZOOM_STORAGE_KEY = 'mayra_character_zoom';
const CHARACTER_SKIN_TONE_STORAGE_KEY = 'mayra_character_skin_tone';

// Appearance Storage Keys
const DARK_MODE_STORAGE_KEY = 'mayra_dark_mode';
const ORB_STYLE_STORAGE_KEY = 'mayra_orb_style';
const ORB_COLOR_STORAGE_KEY = 'mayra_orb_color';
const ORB_SIZE_STORAGE_KEY = 'mayra_orb_size';
const USE_ORB_ON_HOME_STORAGE_KEY = 'mayra_use_orb_on_home';
const ORB_TYPE_STORAGE_KEY = 'mayra_orb_type';
const CUSTOM_HUE_STORAGE_KEY = 'mayra_custom_hue';
const VOICE_VISUALIZER_STORAGE_KEY = 'mayra_voice_visualizer';
const AURA_BORDER_STORAGE_KEY = 'mayra_aura_border';
const LAUNCHER_ICON_STORAGE_KEY = 'mayra_launcher_icon';
const APP_THEME_STORAGE_KEY = 'mayra_app_theme';
const HEADING_FONT_STORAGE_KEY = 'mayra_heading_font';
const CAMERA_ASPECT_RATIO_STORAGE_KEY = 'mayra_camera_aspect_ratio';

const DEFAULT_PERSONAL_CONFIG: UserPersonalConfig = {
  fullName: '',
  preferredName: '',
  email: '',
  countryDialCode: '+91',
  countryName: 'India',
  greetingStyle: 'warm',
  geminiApiKey: '',
  geminiModel: 'gemini-3.1-flash-lite',
  temperature: 0.7
};

function getInitialPersonalConfig(): UserPersonalConfig {
  if (typeof window === 'undefined') return DEFAULT_PERSONAL_CONFIG;
  try {
    const saved = localStorage.getItem(PERSONAL_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PERSONAL_CONFIG, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_PERSONAL_CONFIG;
}

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (saved !== null) return saved === 'true';
  } catch (e) {}
  return true; // Default Dark Mode
}

function getInitialHeadingFont(): 'system' | 'orbitron' | 'sora' | 'manrope' | 'space_grotesk' {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(HEADING_FONT_STORAGE_KEY);
    if (saved === 'system' || saved === 'orbitron' || saved === 'sora' || saved === 'manrope' || saved === 'space_grotesk') {
      return saved;
    }
  } catch (e) {}
  return 'system';
}

function getInitialOrbType(): 'classic' | 'energy' | 'neon' | 'hologram' {
  if (typeof window === 'undefined') return 'classic';
  try {
    const saved = localStorage.getItem(ORB_TYPE_STORAGE_KEY);
    if (saved === 'classic' || saved === 'energy' || saved === 'neon' || saved === 'hologram') return saved;
  } catch (e) {}
  return 'classic';
}

function getInitialCustomHue(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const saved = localStorage.getItem(CUSTOM_HUE_STORAGE_KEY);
    if (saved !== null) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val >= 0 && val <= 360) return val;
    }
  } catch (e) {}
  return undefined;
}

function getInitialVoiceVisualizer(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(VOICE_VISUALIZER_STORAGE_KEY);
    if (saved !== null) return saved === 'true';
  } catch (e) {}
  return true;
}

function getInitialAuraBorder(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(AURA_BORDER_STORAGE_KEY);
    if (saved !== null) return saved === 'true';
  } catch (e) {}
  return false;
}

function getInitialLauncherIcon(): 'cyan_default' | 'amber_gold' | 'violet_cosmic' | 'stealth_obsidian' {
  if (typeof window === 'undefined') return 'cyan_default';
  try {
    const saved = localStorage.getItem(LAUNCHER_ICON_STORAGE_KEY);
    if (saved === 'cyan_default' || saved === 'amber_gold' || saved === 'violet_cosmic' || saved === 'stealth_obsidian') return saved;
  } catch (e) {}
  return 'cyan_default';
}

function getInitialAppTheme(): AppThemePreset {
  if (typeof window === 'undefined') return 'cyan';
  try {
    const saved = localStorage.getItem(APP_THEME_STORAGE_KEY) as AppThemePreset;
    if (saved && APP_THEMES[saved]) return saved;
  } catch (e) {}
  return 'cyan';
}

function getInitialCameraAspectRatio(): '9:16' | '3:4' | '1:1' | '4:3' | 'full' {
  if (typeof window === 'undefined') return '9:16';
  try {
    const saved = localStorage.getItem(CAMERA_ASPECT_RATIO_STORAGE_KEY);
    if (saved === '9:16' || saved === '3:4' || saved === '1:1' || saved === '4:3' || saved === 'full') return saved;
  } catch (e) {}
  return '9:16'; // Default 9:16 (Portrait Full View)
}

const VALID_ORB_STYLES: OrbStyleType[] = [
  'particle_swirl',
  'galaxy_swirl',
  'pulse_reactor',
  'particle_swarm',
  'liquid_core',
  'grid_globe',
  'nova_ring',
  'soundwave_ripple',
  'cyber_matrix',
  'quantum_helix',
  'aurora_waves',
  'polyhedron_crystal',
  'supernova',
  'neural_synapse',
  'plasma_vortex',
  'luminous_glow',
  'glow',
  'nova',
  'grid',
  'pulse',
  'nebula'
];

const VALID_ORB_COLORS: OrbColorType[] = [
  'spectrum',
  'cyan',
  'blue',
  'violet',
  'orange',
  'emerald',
  'pink',
  'gold'
];

function getInitialOrbStyle(): OrbStyleType {
  if (typeof window === 'undefined') return 'particle_swirl';
  try {
    const saved = localStorage.getItem(ORB_STYLE_STORAGE_KEY);
    if (saved && (VALID_ORB_STYLES as string[]).includes(saved)) {
      return saved as OrbStyleType;
    }
  } catch (e) {}
  return 'particle_swirl';
}

function getInitialOrbColor(): OrbColorType {
  if (typeof window === 'undefined') return 'spectrum';
  try {
    const saved = localStorage.getItem(ORB_COLOR_STORAGE_KEY);
    if (saved && (VALID_ORB_COLORS as string[]).includes(saved)) {
      return saved as OrbColorType;
    }
  } catch (e) {}
  return 'spectrum';
}

function getInitialOrbSize(): number {
  if (typeof window === 'undefined') return 64;
  try {
    const saved = localStorage.getItem(ORB_SIZE_STORAGE_KEY);
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num >= 44 && num <= 96) return num;
    }
  } catch (e) {}
  return 64;
}

function getInitialUseOrbOnHome(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(USE_ORB_ON_HOME_STORAGE_KEY);
    if (saved !== null) return saved === 'true';
  } catch (e) {}
  return false;
}

function getInitialCharacterSize(): 'small' | 'medium' | 'large' {
  if (typeof window === 'undefined') return 'medium';
  try {
    const saved = localStorage.getItem(CHARACTER_SIZE_STORAGE_KEY);
    if (saved === 'small' || saved === 'medium' || saved === 'large') return saved;
  } catch (e) {
    // Ignore storage errors
  }
  return 'medium';
}

function getInitialCharacterZoom(): number {
  if (typeof window === 'undefined') return 100;
  try {
    const saved = localStorage.getItem(CHARACTER_ZOOM_STORAGE_KEY);
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num >= 70 && num <= 140) return num;
    }
  } catch (e) {}
  return 100; // Default Medium (100%)
}

function getInitialCharacterSkinTone(): number {
  if (typeof window === 'undefined') return 50;
  try {
    const saved = localStorage.getItem(CHARACTER_SKIN_TONE_STORAGE_KEY);
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num >= 0 && num <= 100) return num;
    }
  } catch (e) {}
  return 50; // Default Medium (Natural Fair/Medium)
}

const DEFAULT_ASSISTANT_CONFIG: AssistantConfig = {
  activeMode: 'mayra',
  personaTone: 'executive',
  voiceProfile: 'Mayra Violet (Neural)',
  language: 'en-IN',
  speechRate: 1.0,
  speechPitch: 1.0,
  responseStyle: 'instant',
  hapticFeedback: true,
  audioChimes: true,
  autoReadback: false,
  contextWindowSize: 20,
  voiceAlertCalls: true,
  voiceAlertMessages: true,
  voiceAlertAutoPrompt: true,
  proactiveIdleCheckin: true,
  characterSize: 'medium',
  characterScaleMultiplier: 1.0,
  characterZoom: 100,
  characterSkinTone: 50
};

function getInitialAssistantConfig(): AssistantConfig {
  const initialCharSize = getInitialCharacterSize();
  const base: AssistantConfig = {
    ...DEFAULT_ASSISTANT_CONFIG,
    characterSize: initialCharSize,
    characterScaleMultiplier: initialCharSize === 'small' ? 0.85 : initialCharSize === 'large' ? 1.18 : 1.0,
    characterZoom: getInitialCharacterZoom(),
    characterSkinTone: getInitialCharacterSkinTone()
  };

  if (typeof window === 'undefined') return base;
  try {
    const saved = localStorage.getItem(ASSISTANT_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...base, ...parsed };
    }
  } catch (e) {}
  return base;
}

const DEFAULT_VOICE_GUARDIAN_CONFIG: VoiceGuardianConfig = {
  enabled: true,
  awayGuardMode: false,
  listenMode: 'owner_only',
  strictness: 85,
  enrolledVoices: INITIAL_ENROLLED_VOICES,
  ambientCalibration: true
};

function getInitialVoiceGuardianConfig(): VoiceGuardianConfig {
  if (typeof window === 'undefined') return DEFAULT_VOICE_GUARDIAN_CONFIG;
  try {
    const saved = localStorage.getItem(VOICE_GUARDIAN_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_VOICE_GUARDIAN_CONFIG, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_VOICE_GUARDIAN_CONFIG;
}

const DEFAULT_ADVANCED_CONFIG: AdvancedConfig = {
  safetyLevel: 'standard',
  permissionMicrophone: true,
  permissionCamera: true,
  permissionNotifications: true,
  permissionOverlay: true,
  permissionAccessibility: false,
  backgroundServiceEnabled: true,
  batteryOptimizationExempt: true,
  developerDebugMode: false,
  verboseLogging: false,
  backgroundHandGestureEnabled: false,
  backgroundCameraAutoStoppedOnLock: false
};

function getInitialAdvancedConfig(): AdvancedConfig {
  if (typeof window === 'undefined') return DEFAULT_ADVANCED_CONFIG;
  try {
    const saved = localStorage.getItem(ADVANCED_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_ADVANCED_CONFIG, ...parsed };
    }
  } catch (e) {}
  return DEFAULT_ADVANCED_CONFIG;
}

function getInitialSkills(): SkillItem[] {
  if (typeof window === 'undefined') return INITIAL_SKILLS;
  try {
    const saved = localStorage.getItem(SKILLS_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_SKILLS;
}

function getInitialSubAgents(): SubAgentItem[] {
  if (typeof window === 'undefined') return INITIAL_SUB_AGENTS;
  try {
    const saved = localStorage.getItem(SUB_AGENTS_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_SUB_AGENTS;
}

function getInitialIntegrations(): IntegrationItem[] {
  if (typeof window === 'undefined') return INITIAL_INTEGRATIONS;
  try {
    const saved = localStorage.getItem(INTEGRATIONS_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_INTEGRATIONS;
}

export function useMayraSettings() {
  const [personalConfig, setPersonalConfigState] = useState<UserPersonalConfig>(getInitialPersonalConfig);

  const setPersonalConfig = useCallback((update: React.SetStateAction<UserPersonalConfig> | Partial<UserPersonalConfig>) => {
    setPersonalConfigState((prev) => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
      try {
        localStorage.setItem(PERSONAL_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const [assistantConfig, setAssistantConfigState] = useState<AssistantConfig>(getInitialAssistantConfig);

  // Appearance State (Dark Mode, Orb Style, Orb Color, Orb Size, Use Orb On Home, Orb Type, Custom Hue, Voice Visualizer, Aura Border, Launcher Icon)
  const [appearanceConfig, setAppearanceConfigState] = useState<AppearanceConfig>(() => ({
    darkMode: getInitialDarkMode(),
    orbStyle: getInitialOrbStyle(),
    orbColor: getInitialOrbColor(),
    orbSize: getInitialOrbSize(),
    useOrbOnHome: getInitialUseOrbOnHome(),
    orbType: getInitialOrbType(),
    customHue: getInitialCustomHue(),
    voiceVisualizerEnabled: getInitialVoiceVisualizer(),
    auraBorderMode: getInitialAuraBorder(),
    launcherIconVariant: getInitialLauncherIcon(),
    appTheme: getInitialAppTheme(),
    headingFont: getInitialHeadingFont(),
    cameraAspectRatio: getInitialCameraAspectRatio()
  }));

  const setAppearanceConfig = useCallback((update: React.SetStateAction<AppearanceConfig> | Partial<AppearanceConfig>) => {
    setAppearanceConfigState((prev) => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
      if (next.darkMode !== undefined && next.darkMode !== prev.darkMode) {
        try {
          localStorage.setItem(DARK_MODE_STORAGE_KEY, String(next.darkMode));
        } catch (e) {}
      }
      if (next.orbStyle && next.orbStyle !== prev.orbStyle) {
        try {
          localStorage.setItem(ORB_STYLE_STORAGE_KEY, next.orbStyle);
        } catch (e) {}
      }
      if (next.orbColor && next.orbColor !== prev.orbColor) {
        try {
          localStorage.setItem(ORB_COLOR_STORAGE_KEY, next.orbColor);
        } catch (e) {}
      }
      if (next.orbSize !== undefined && next.orbSize !== prev.orbSize) {
        try {
          localStorage.setItem(ORB_SIZE_STORAGE_KEY, String(next.orbSize));
        } catch (e) {}
      }
      if (next.useOrbOnHome !== undefined && next.useOrbOnHome !== prev.useOrbOnHome) {
        try {
          localStorage.setItem(USE_ORB_ON_HOME_STORAGE_KEY, String(next.useOrbOnHome));
        } catch (e) {}
      }
      if (next.orbType && next.orbType !== prev.orbType) {
        try {
          localStorage.setItem(ORB_TYPE_STORAGE_KEY, next.orbType);
        } catch (e) {}
      }
      if (next.customHue !== undefined) {
        try {
          if (next.customHue === null || isNaN(next.customHue)) {
            localStorage.removeItem(CUSTOM_HUE_STORAGE_KEY);
          } else {
            localStorage.setItem(CUSTOM_HUE_STORAGE_KEY, String(next.customHue));
          }
        } catch (e) {}
      }
      if (next.voiceVisualizerEnabled !== undefined && next.voiceVisualizerEnabled !== prev.voiceVisualizerEnabled) {
        try {
          localStorage.setItem(VOICE_VISUALIZER_STORAGE_KEY, String(next.voiceVisualizerEnabled));
        } catch (e) {}
      }
      if (next.auraBorderMode !== undefined && next.auraBorderMode !== prev.auraBorderMode) {
        try {
          localStorage.setItem(AURA_BORDER_STORAGE_KEY, String(next.auraBorderMode));
        } catch (e) {}
      }
      if (next.launcherIconVariant && next.launcherIconVariant !== prev.launcherIconVariant) {
        try {
          localStorage.setItem(LAUNCHER_ICON_STORAGE_KEY, next.launcherIconVariant);
        } catch (e) {}
      }
      if (next.appTheme && next.appTheme !== prev.appTheme) {
        try {
          localStorage.setItem(APP_THEME_STORAGE_KEY, next.appTheme);
        } catch (e) {}
      }
      if (next.headingFont && next.headingFont !== prev.headingFont) {
        try {
          localStorage.setItem(HEADING_FONT_STORAGE_KEY, next.headingFont);
        } catch (e) {}
      }
      if (next.cameraAspectRatio && next.cameraAspectRatio !== prev.cameraAspectRatio) {
        try {
          localStorage.setItem(CAMERA_ASPECT_RATIO_STORAGE_KEY, next.cameraAspectRatio);
        } catch (e) {}
      }
      return next;
    });
  }, []);

  const setAssistantConfig = useCallback((update: React.SetStateAction<AssistantConfig> | Partial<AssistantConfig>) => {
    setAssistantConfigState((prev) => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
      if (next.characterSize && next.characterSize !== prev.characterSize) {
        try {
          localStorage.setItem(CHARACTER_SIZE_STORAGE_KEY, next.characterSize);
        } catch (e) {}
        next.characterScaleMultiplier = next.characterSize === 'small' ? 0.85 : next.characterSize === 'large' ? 1.18 : 1.0;
      }
      if (next.characterZoom !== undefined && next.characterZoom !== prev.characterZoom) {
        try {
          localStorage.setItem(CHARACTER_ZOOM_STORAGE_KEY, String(next.characterZoom));
        } catch (e) {}
      }
      if (next.characterSkinTone !== undefined && next.characterSkinTone !== prev.characterSkinTone) {
        try {
          localStorage.setItem(CHARACTER_SKIN_TONE_STORAGE_KEY, String(next.characterSkinTone));
        } catch (e) {}
      }
      try {
        localStorage.setItem(ASSISTANT_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const [voiceGuardianConfig, setVoiceGuardianConfigState] = useState<VoiceGuardianConfig>(getInitialVoiceGuardianConfig);

  const setVoiceGuardianConfig = useCallback((update: React.SetStateAction<VoiceGuardianConfig> | Partial<VoiceGuardianConfig>) => {
    setVoiceGuardianConfigState((prev) => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
      try {
        localStorage.setItem(VOICE_GUARDIAN_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const [advancedConfig, setAdvancedConfigState] = useState<AdvancedConfig>(getInitialAdvancedConfig);

  const setAdvancedConfig = useCallback((update: React.SetStateAction<AdvancedConfig> | Partial<AdvancedConfig>) => {
    setAdvancedConfigState((prev) => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
      try {
        localStorage.setItem(ADVANCED_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const [skills, setSkillsState] = useState<SkillItem[]>(getInitialSkills);

  const setSkills = useCallback((update: React.SetStateAction<SkillItem[]>) => {
    setSkillsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      try {
        localStorage.setItem(SKILLS_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const [subAgents, setSubAgentsState] = useState<SubAgentItem[]>(getInitialSubAgents);

  const setSubAgents = useCallback((update: React.SetStateAction<SubAgentItem[]>) => {
    setSubAgentsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      try {
        localStorage.setItem(SUB_AGENTS_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const [integrations, setIntegrationsState] = useState<IntegrationItem[]>(getInitialIntegrations);

  const setIntegrations = useCallback((update: React.SetStateAction<IntegrationItem[]>) => {
    setIntegrationsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      try {
        localStorage.setItem(INTEGRATIONS_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const [memories, setMemoriesState] = useState<MemoryItem[]>(() => MemoryVaultService.loadPersistedMemories(INITIAL_MEMORIES));

  const setMemories = useCallback((update: React.SetStateAction<MemoryItem[]>) => {
    setMemoriesState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      MemoryVaultService.savePersistedMemories(next);
      return next;
    });
  }, []);

  const addMemory = useCallback((newMemory: Omit<MemoryItem, 'id' | 'timestamp'>) => {
    setMemoriesState((prev) => {
      const conflict = MemoryVaultService.findConflictOrDuplicate(prev, newMemory.key, newMemory.value);
      if (conflict.status === 'EXACT_DUPLICATE') {
        console.log('[MemoryVault] Exact duplicate avoided for:', newMemory.key);
        return prev;
      }
      if (conflict.status === 'UPDATE_EXISTING' && conflict.existingItem) {
        console.log('[MemoryVault] Updated existing memory record:', newMemory.key);
        const updated = prev.map((m) =>
          m.id === conflict.existingItem!.id
            ? {
                ...m,
                ...newMemory,
                value: newMemory.value,
                timestamp: Date.now(),
                lastAccessedAt: Date.now(),
                accessCount: (m.accessCount || 0) + 1
              }
            : m
        );
        MemoryVaultService.savePersistedMemories(updated);
        return updated;
      }
      const updated = [
        {
          ...newMemory,
          id: `mem-${Date.now()}`,
          timestamp: Date.now(),
          importance: newMemory.importance ?? (newMemory.isPinned ? 5 : 3),
          tags: newMemory.tags ?? [newMemory.category],
          accessCount: 0,
          lastAccessedAt: Date.now(),
          source: newMemory.source ?? 'user_explicit'
        },
        ...prev
      ];
      MemoryVaultService.savePersistedMemories(updated);
      return updated;
    });
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemoriesState((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      MemoryVaultService.savePersistedMemories(updated);
      return updated;
    });
  }, []);

  const togglePinMemory = useCallback((id: string) => {
    setMemoriesState((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, isPinned: !m.isPinned } : m));
      MemoryVaultService.savePersistedMemories(updated);
      return updated;
    });
  }, []);

  const toggleSkill = useCallback((id: string) => {
    setSkillsState((prev) => {
      const updated = prev.map((skill) => (skill.id === id ? { ...skill, enabled: !skill.enabled } : skill));
      try {
        localStorage.setItem(SKILLS_CONFIG_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const toggleSubAgent = useCallback((id: string) => {
    setSubAgentsState((prev) => {
      const updated = prev.map((agent) => (agent.id === id ? { ...agent, enabled: !agent.enabled } : agent));
      try {
        localStorage.setItem(SUB_AGENTS_CONFIG_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const exportBackupJson = useCallback(() => {
    const data = {
      personalConfig,
      assistantConfig,
      appearanceConfig,
      voiceGuardianConfig,
      advancedConfig,
      memories,
      skills,
      subAgents,
      exportDate: new Date().toISOString(),
      appVersion: '2.4.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mayra_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [personalConfig, assistantConfig, appearanceConfig, voiceGuardianConfig, advancedConfig, memories, skills, subAgents]);

  const resetAllData = useCallback(() => {
    setMemoriesState([]);
    MemoryVaultService.savePersistedMemories([]);
    setSkillsState(INITIAL_SKILLS);
    try {
      localStorage.setItem(SKILLS_CONFIG_STORAGE_KEY, JSON.stringify(INITIAL_SKILLS));
      localStorage.setItem(SUB_AGENTS_CONFIG_STORAGE_KEY, JSON.stringify(INITIAL_SUB_AGENTS));
    } catch (e) {}
    setSubAgentsState(INITIAL_SUB_AGENTS);
  }, []);

  return {
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
    toggleSkill,
    subAgents,
    setSubAgents,
    toggleSubAgent,
    integrations,
    setIntegrations,
    memories,
    setMemories,
    addMemory,
    deleteMemory,
    togglePinMemory,
    exportBackupJson,
    resetAllData
  };
}
