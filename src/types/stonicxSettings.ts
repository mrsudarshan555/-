export type StonicxThemeColor = 'cyan' | 'emerald' | 'violet' | 'amber' | 'crimson' | 'silver';

export type StonicxFontStyle = 
  | 'Orbitron'
  | 'JetBrains Mono'
  | 'Space Grotesk'
  | 'VT323'
  | 'Sora'
  | 'Manrope';

export interface StonicxAppearanceConfig {
  themeColor: StonicxThemeColor;
  fontStyle: StonicxFontStyle;
  haloIntensity: number; // 0.1 to 1.0
  edgeVignette: boolean;
  gridDensity: 'sparse' | 'normal' | 'dense';
  showDiagnosticsHud: boolean;
}

export interface StonicxPermissionItem {
  id: string;
  name: string;
  category: string;
  description: string;
  granted: boolean;
  requiredFor: string;
}

export interface StonicxSkillItem {
  id: string;
  name: string;
  description: string;
  category: 'code' | 'hardware' | 'ai' | 'audio' | 'system';
  enabled: boolean;
  icon: string;
  badge?: string;
}

export interface StonicxSubAgentItem {
  id: string;
  name: string;
  role: string;
  description: string;
  enabled: boolean;
  status: 'active' | 'standby' | 'running';
  icon: string;
}

export interface StonicxVoiceGuardianConfig {
  wakeWordEnabled: boolean;
  wakeWord: string;
  noiseGateSensitivity: number; // 0-100
  frequencyCompression: boolean;
  voicePitch: number; // 0.5 - 1.5
  voiceSpeed: number; // 0.7 - 1.5
  voiceId: string;
}

export interface StonicxMeshSyncConfig {
  localMeshSync: boolean;
  peerEncryption: boolean;
  cloudMirrorBackup: boolean;
  nodeId: string;
  pairedDevicesCount: number;
  syncIntervalMin: number;
}

export interface StonicxWhiteboardConfig {
  defaultColor: string;
  defaultLineWidth: number;
  backgroundTheme: 'dark' | 'blueprint' | 'pcb_green' | 'light';
  gridOverlay: boolean;
  defaultTool: 'pen' | 'highlighter' | 'rect' | 'circle' | 'arrow' | 'text';
  autoAnalyzeOnSend: boolean;
}

export interface StonicxPersonalSettings {
  callSign: string;
  fullName: string;
  technicalSpecialization: string;
  countryDialCode: string;
  countryName: string;
  communicationTone: 'direct_technical' | 'balanced' | 'comprehensive';
  autoIngestKnowledge: boolean;
}

export interface StonicxFullSettingsState {
  appearance: StonicxAppearanceConfig;
  permissions: StonicxPermissionItem[];
  personal: StonicxPersonalSettings;
  skills: StonicxSkillItem[];
  subAgents: StonicxSubAgentItem[];
  voiceGuardian: StonicxVoiceGuardianConfig;
  meshSync: StonicxMeshSyncConfig;
  whiteboard: StonicxWhiteboardConfig;
}
