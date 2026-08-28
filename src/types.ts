export type AppView = 'phone' | 'codebase' | 'settings_explorer' | 'memory' | 'tools' | 'architecture';

export type PhoneNavTab = 'home' | 'scan' | 'memories' | 'chat';
export type ActiveTab = PhoneNavTab;

export type SettingsSubScreen = 
  | 'root'
  | 'permissions'
  | 'native_integration'
  | 'personal'
  | 'country_code'
  | 'assistant'
  | 'appearance'
  | 'orb_customization'
  | 'skills'
  | 'sub_agents'
  | 'voice_guardian'
  | 'linked_devices'
  | 'whiteboard'
  | 'offline_models'
  | 'backup'
  | 'advanced'
  | 'optional_integrations'
  | 'privacy'
  | 'about';

export type AssistantStatus = 'READY' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'INTERRUPTED' | 'ERROR';
export type ConversationState = AssistantStatus;

export type MayraLanguage = 'en' | 'hi';

export type CharacterEmotion = 
  | 'idle'
  | 'happy'
  | 'excited'
  | 'curious'
  | 'thinking'
  | 'proud'
  | 'sad'
  | 'confused'
  | 'surprised'
  | 'embarrassed'
  | 'playful';

export type PermissionStatusType = 
  | 'granted' 
  | 'not_granted' 
  | 'denied'
  | 'restricted' 
  | 'requires_settings' 
  | 'not_available'
  | 'custom_action';

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  status: PermissionStatusType;
  statusLabel?: string;
  actionType: 'toggle' | 'dialog' | 'open_settings' | 'role_picker' | 'screen_capture_intent';
  actionLabel: string;
  androidManifestPermission?: string;
  androidSystemIntent?: string;
  minSdk?: number;
  isRequired?: boolean;
}

export interface ChatMessage {
  id: string;
  sender?: 'user' | 'mayra';
  role?: 'user' | 'assistant' | 'system';
  text?: string;
  content?: string;
  timestamp: number;
  image?: {
    url?: string;
    mimeType?: string;
    name?: string;
    base64?: string;
  };
  autoMemoryTag?: string;
}

export type MemoryCategory = 'preference' | 'personal' | 'system' | 'task' | 'general' | 'project' | 'episodic';

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: MemoryCategory;
  timestamp: number;
  isPinned?: boolean;
  
  // Advanced Memory Vault Extensions (Jarvis Architecture)
  importance?: number; // 1 to 5 scale
  tags?: string[];
  lastAccessedAt?: number;
  accessCount?: number;
  source?: 'user_explicit' | 'assistant_inferred' | 'project_context' | 'system';
  projectId?: string;
  confidenceScore?: number; // 0.0 to 1.0
  isArchived?: boolean;
}

export interface MemoryQueryOptions {
  query?: string;
  categories?: MemoryCategory[];
  projectId?: string;
  minImportance?: number;
  limit?: number;
  includeArchived?: boolean;
  recencyWeight?: number; // 0.0 to 1.0 (default 0.3)
}

export interface MemorySearchResult {
  item: MemoryItem;
  score: number;
  matchReasons: string[];
}

export interface MemoryExtractionResult {
  shouldMemorize: boolean;
  key?: string;
  value?: string;
  category?: MemoryCategory;
  importance?: number;
  tags?: string[];
  confidence: number;
  reason?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  enabled: boolean;
  author: string;
  permissionsRequired: string[];
}

export interface ToolItem {
  id?: string;
  name: string;
  description: string;
  category: string;
  enabled?: boolean;
}

export interface SubAgentItem {
  id: string;
  name: string;
  role: string;
  description: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  sandboxed: boolean;
  capabilities: string[];
}

export interface EnrolledVoice {
  id: string;
  name: string;
  role: 'owner' | 'family';
  samplesCount: number;
  confidenceScore: number;
  dateEnrolled: string;
}

export interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'unavailable' | 'not_configured' | 'configured' | 'enabled';
  icon: string;
}

export interface CountryCodeItem {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export interface KotlinFile {
  path: string;
  name: string;
  category: 'core' | 'ui' | 'settings' | 'config' | 'build';
  content: string;
}

export interface UserPersonalConfig {
  fullName: string;
  preferredName: string;
  email: string;
  countryDialCode: string;
  countryName: string;
  greetingStyle: 'warm' | 'formal' | 'casual' | 'brief';
  geminiApiKey: string;
  geminiModel: string;
  temperature: number;
}

export type AssistantMode = 'mayra' | 'stonicx';

export interface AssistantConfig {
  activeMode?: AssistantMode; // 'mayra' | 'stonicx' (persisted active app-shell mode)
  personaTone: 'executive' | 'friendly' | 'technical' | 'concise';
  voiceProfile: string;
  language: string;
  speechRate: number;
  speechPitch: number;
  responseStyle: 'stream' | 'instant' | 'compact';
  hapticFeedback: boolean;
  audioChimes: boolean;
  autoReadback: boolean;
  contextWindowSize: number;
  // Voice Alerts for Incoming Calls & Messages
  voiceAlertCalls: boolean;
  voiceAlertMessages: boolean;
  voiceAlertAutoPrompt: boolean;
  // Proactive Mode
  proactiveIdleCheckin: boolean;
  // 3D Avatar Size & Sliders Setting
  characterSize: 'small' | 'medium' | 'large';
  characterScaleMultiplier?: number;
  characterZoom: number; // 70 to 140, default 100 (Medium)
  characterSkinTone: number; // 0 (Fair/Gora) to 100 (Dark/Kala), default 50 (Natural Medium)
}

export type OrbStyleType = 
  | 'particle_swirl'
  | 'galaxy_swirl'
  | 'pulse_reactor'
  | 'particle_swarm'
  | 'liquid_core'
  | 'grid_globe'
  | 'nova_ring'
  | 'soundwave_ripple'
  | 'cyber_matrix'
  | 'quantum_helix'
  | 'aurora_waves'
  | 'polyhedron_crystal'
  | 'supernova'
  | 'neural_synapse'
  | 'plasma_vortex'
  | 'luminous_glow'
  // Legacy aliases for backward compatibility
  | 'glow' 
  | 'nova' 
  | 'grid' 
  | 'pulse' 
  | 'nebula';

export type OrbColorType = 'spectrum' | 'cyan' | 'blue' | 'violet' | 'orange' | 'emerald' | 'pink' | 'gold';

export type OrbTypePreset = 'classic' | 'energy' | 'neon' | 'hologram';

export type AppLauncherIconVariant = 'cyan_default' | 'amber_gold' | 'violet_cosmic' | 'stealth_obsidian';

export type AppThemePreset = 
  | 'cyan' 
  | 'royal_blue' 
  | 'aura_red' 
  | 'purple' 
  | 'emerald' 
  | 'amber' 
  | 'rose_pink' 
  | 'midnight' 
  | 'orange' 
  | 'teal' 
  | 'lime' 
  | 'gold' 
  | 'slate';

export type HeadingFontType = 'system' | 'orbitron' | 'sora' | 'manrope' | 'space_grotesk';

export type CameraAspectRatio = '9:16' | '3:4' | '1:1' | '4:3' | 'full';

export interface AppearanceConfig {
  darkMode: boolean;
  orbStyle: OrbStyleType;
  orbColor: OrbColorType;
  orbSize: number; // Size in dp (44 to 140, default 64)
  useOrbOnHome: boolean; // Replace 3D character with animated orb on Home screen
  orbType?: OrbTypePreset; // 'classic' | 'energy' | 'neon' | 'hologram'
  customHue?: number; // 0 to 360 continuous hue, undefined = use orbColor preset
  voiceVisualizerEnabled?: boolean; // ambient orb dot grows when speaking
  auraBorderMode?: boolean; // rotating glowing border around phone screen edge
  launcherIconVariant?: AppLauncherIconVariant; // launcher icon theme
  appTheme?: AppThemePreset; // user-selectable accent theme ('cyan' | 'aura_red' | 'purple' | 'emerald' | 'midnight')
  headingFont?: HeadingFontType; // user-selectable text style font picker (default: 'system')
  cameraAspectRatio?: CameraAspectRatio; // Vision scanner frame aspect ratio ('9:16' | '3:4' | '1:1' | '4:3' | 'full')
}

export interface LinkedDeviceItem {
  id: string;
  name: string;
  model: string;
  type: 'smartphone' | 'tablet' | 'smartwatch' | 'laptop';
  status: 'online' | 'nearby_ble' | 'offline';
  batteryLevel: number;
  lastSync: string;
  location: string;
  isPrimary?: boolean;
}

export interface FamilyContact {
  id: string;
  relationship: 'Mother' | 'Father' | 'Sibling' | 'Spouse' | 'Other';
  name: string;
  whatsappNumber: string;
  notes?: string;
}

export interface VoiceGuardianConfig {
  enabled: boolean;
  awayGuardMode: boolean;
  listenMode: 'everyone' | 'owner_only' | 'owner_family';
  strictness: number; // 60 to 95
  enrolledVoices: EnrolledVoice[];
  ambientCalibration?: boolean;
}

export interface AdvancedConfig {
  safetyLevel: 'strict' | 'standard' | 'permissive';
  permissionMicrophone: boolean;
  permissionCamera: boolean;
  permissionNotifications: boolean;
  permissionOverlay: boolean;
  permissionAccessibility: boolean;
  backgroundServiceEnabled: boolean;
  batteryOptimizationExempt: boolean;
  developerDebugMode: boolean;
  verboseLogging: boolean;
  // Background Floating Hand-Gesture Overlay Feature
  backgroundHandGestureEnabled: boolean;
  backgroundCameraAutoStoppedOnLock?: boolean;
}

// 3D Character & Model Types for MAYRA
export type CharacterState = 'READY' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export type AppActionType = 
  | 'SAVE_MEMORY'
  | 'AUTO_MEMORY_SAVED'
  | 'DELETE_MEMORY'
  | 'CLEAR_MEMORIES'
  | 'NAVIGATE_TAB'
  | 'OPEN_SETTINGS'
  | 'TOGGLE_PERMISSION'
  | 'GRANT_PERMISSION'
  | 'TRIGGER_SCAN'
  | 'CLEAR_CHAT'
  | 'CONTACT_ACTION'
  | 'CHANGE_LANGUAGE'
  | 'TOGGLE_SKILL'
  | 'TOGGLE_SUB_AGENT';

export interface AppAction {
  type: AppActionType;
  payload?: any;
  statusMessage?: string;
}

export interface CharacterTransform {
  rotationY: number; // Horizontal orbital rotation (-180 to 180 degrees)
  pitchX: number;    // Vertical tilt angle (-45 to 45 degrees)
  zoom: number;      // Scale multiplier (0.6x to 2.5x)
  panY: number;      // Vertical camera/model center offset
}

export interface CharacterLockState {
  isLocked: boolean;
  lockTimestamp?: number;
}

export interface CharacterModelMetadata {
  modelName: string;
  sourceFile: string;
  format: 'PMX' | 'glTF' | 'GLB' | 'OBJ';
  version?: string;
  vendor?: string;
  vertexCount?: number;
  boneCount?: number;
  materialCount?: number;
  morphCount?: number;
  hasPhysics?: boolean;
  hasBones?: boolean;
  hasFacialMorphs?: boolean;
  textures: string[];
  status: 'source_ready' | 'conversion_pipeline' | 'loaded' | 'fallback_active';
}

// Agent V1 Types
export type AgentPermissionLevel = 'SAFE' | 'CONFIRMATION_REQUIRED' | 'BLOCKED';

export type AgentTaskStatus = 
  | 'IDLE'
  | 'PLANNING'
  | 'EXECUTING'
  | 'WAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export interface AgentToolCall {
  id?: string;
  name: string;
  args: Record<string, any>;
  step: number;
  timestamp: number;
}

export interface AgentToolResult {
  name: string;
  args?: Record<string, any>;
  result?: any;
  error?: string;
  step: number;
  timestamp: number;
}

export interface AgentPendingConfirmation {
  toolName: string;
  args: Record<string, any>;
  actionDescription: string;
  targetRecipient?: string;
  contentPreview?: string;
  impactLevel: 'low' | 'medium' | 'high';
}

export interface AgentTaskContext {
  taskId: string;
  originalUserRequest: string;
  status: AgentTaskStatus;
  currentStep: number;
  totalSteps?: number;
  stepDescription?: string;
  toolCalls: AgentToolCall[];
  toolResults: AgentToolResult[];
  pendingConfirmation: AgentPendingConfirmation | null;
  isCancelled: boolean;
  finalResult: string | null;
}

