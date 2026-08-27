import { 
  CountryCodeItem, SkillItem, SubAgentItem, 
  IntegrationItem, EnrolledVoice, MemoryItem,
  PermissionItem, FamilyContact 
} from '../types';

export const DEFAULT_COUNTRIES: CountryCodeItem[] = [
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' }
];

export const INITIAL_SKILLS: SkillItem[] = [
  {
    id: 'skill-web-search',
    name: 'Web Intelligence & Grounding',
    description: 'Retrieves up-to-date real-time information and web search answers.',
    category: 'Intelligence',
    version: '1.2.0',
    enabled: true,
    author: 'MAYRA Core Team',
    permissionsRequired: ['INTERNET', 'NETWORK_STATE']
  },
  {
    id: 'skill-screen-vision',
    name: 'Screen Vision & OCR',
    description: 'Analyzes screen contents, extracts UI text, and parses visual layouts.',
    category: 'Vision',
    version: '1.0.4',
    enabled: true,
    author: 'MAYRA Vision Lab',
    permissionsRequired: ['MEDIA_PROJECTION', 'CAMERA']
  },
  {
    id: 'skill-file-doc',
    name: 'File & Document Analysis',
    description: 'Processes PDF documents, spreadsheets, code files, and local logs.',
    category: 'Productivity',
    version: '1.1.0',
    enabled: true,
    author: 'MAYRA System',
    permissionsRequired: ['READ_EXTERNAL_STORAGE']
  },
  {
    id: 'skill-device-automation',
    name: 'Android System Automation',
    description: 'Controls device brightness, volume, Wi-Fi toggles, and launches apps.',
    category: 'System',
    version: '2.0.0',
    enabled: true,
    author: 'MAYRA Core Team',
    permissionsRequired: ['WRITE_SETTINGS', 'ACCESS_NOTIFICATION_POLICY']
  },
  {
    id: 'skill-tasks-calendar',
    name: 'Tasks & Calendar Assistant',
    description: 'Schedules reminders, manages daily agendas, and tracks checklists.',
    category: 'Productivity',
    version: '1.0.2',
    enabled: false,
    author: 'MAYRA Workspace',
    permissionsRequired: ['READ_CALENDAR', 'WRITE_CALENDAR']
  },
  {
    id: 'skill-code-runner',
    name: 'Sandbox Code Interpreter',
    description: 'Safely parses and executes mathematical equations and code snippets.',
    category: 'Development',
    version: '0.9.1',
    enabled: false,
    author: 'MAYRA Developer Lab',
    permissionsRequired: ['INTERNAL_SANDBOX']
  }
];

export const INITIAL_SUB_AGENTS: SubAgentItem[] = [
  {
    id: 'agent-coding',
    name: 'Coding & Architecture Agent',
    role: 'Specialized Software Engineer',
    description: 'Writes, reviews, and refactors Kotlin, TypeScript, Python, and shell scripts.',
    enabled: true,
    priority: 'high',
    sandboxed: true,
    capabilities: ['Code Synthesis', 'Bug Detection', 'Git Diff Inspection']
  },
  {
    id: 'agent-research',
    name: 'Deep Research Agent',
    role: 'Synthesizer & Investigative Analyst',
    description: 'Conducts multi-step web queries, validates source citations, and creates executive briefs.',
    enabled: true,
    priority: 'medium',
    sandboxed: true,
    capabilities: ['Multi-Query Search', 'PDF Fact Extraction', 'Report Formatting']
  },
  {
    id: 'agent-sentinel',
    name: 'Background Sentinel Agent',
    role: 'Proactive System & Notification Guard',
    description: 'Monitors Android incoming priority alerts, battery anomalies, and scheduled triggers in background.',
    enabled: false,
    priority: 'low',
    sandboxed: true,
    capabilities: ['Battery Guard', 'Priority Filter', 'Periodic Alarm Checking']
  },
  {
    id: 'agent-vision',
    name: 'Vision & UI Analyst Agent',
    role: 'Multimodal Image & Video Inspector',
    description: 'Processes camera feeds, document scans, and UI mockups with pixel-level spatial reasoning.',
    enabled: true,
    priority: 'medium',
    sandboxed: true,
    capabilities: ['Object Detection', 'Document OCR', 'UI Hierarchy Parsing']
  }
];

export const INITIAL_ENROLLED_VOICES: EnrolledVoice[] = [
  {
    id: 'voice-owner-zafer',
    name: 'Primary Owner (Zafer)',
    role: 'owner',
    samplesCount: 5,
    confidenceScore: 94,
    dateEnrolled: '2026-08-10'
  },
  {
    id: 'voice-family-1',
    name: 'Family Member (Sarah)',
    role: 'family',
    samplesCount: 4,
    confidenceScore: 88,
    dateEnrolled: '2026-08-12'
  }
];

export const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'integ-maps',
    name: 'Google Maps & Location Services',
    description: 'Provides navigation routes, real-time traffic queries, and location-aware assistant context.',
    category: 'Navigation',
    status: 'not_configured',
    icon: 'MapPin'
  },
  {
    id: 'integ-places',
    name: 'Places API (Local Search)',
    description: 'Discovers nearby restaurants, services, ratings, and operating hours.',
    category: 'Local Data',
    status: 'not_configured',
    icon: 'Building'
  },
  {
    id: 'integ-calendar',
    name: 'Google Workspace Calendar & Tasks',
    description: 'Synchronizes appointments, reminders, and daily planner schedules.',
    category: 'Productivity',
    status: 'unavailable',
    icon: 'Calendar'
  },
  {
    id: 'integ-iot-esp32',
    name: 'IoT & ESP32 Smart Device Bridge',
    description: 'Controls local home automation microcontrollers via BLE and MQTT protocols.',
    category: 'Hardware',
    status: 'unavailable',
    icon: 'Radio'
  },
  {
    id: 'integ-custom-webhook',
    name: 'Custom Webhook Pipeline',
    description: 'Dispatches assistant action events to an external custom HTTP endpoint.',
    category: 'Developer',
    status: 'configured',
    icon: 'Webhook'
  }
];

export const INITIAL_FAMILY_CONTACTS: FamilyContact[] = [];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    key: 'User Identity',
    value: 'Zafer - Lead Architect. Prefers concise, futuristic answers with high technical accuracy.',
    category: 'personal',
    timestamp: Date.now() - 3600000 * 24,
    isPinned: true
  },
  {
    id: 'mem-2',
    key: 'Country & Location',
    value: 'Default region: India (+91). Uses Metric units and 24-hour time.',
    category: 'preference',
    timestamp: Date.now() - 3600000 * 18,
    isPinned: true
  },
  {
    id: 'mem-3',
    key: 'MAYRA Voice Guardian Policy',
    value: 'Listen mode set to "Owner Only". Strictness threshold 85%. Voice matching verified.',
    category: 'system',
    timestamp: Date.now() - 3600000 * 12,
    isPinned: false
  },
  {
    id: 'mem-4',
    key: 'Tech Stack Preference',
    value: 'Primary framework: Android Jetpack Compose + Kotlin Coroutines + Clean MVVM Architecture.',
    category: 'preference',
    timestamp: Date.now() - 3600000 * 6,
    isPinned: false
  },
  {
    id: 'mem-5',
    key: 'Active Milestone',
    value: 'MAYRA UI + Home + Permission Center complete architecture with Jetpack Compose foundations.',
    category: 'task',
    timestamp: Date.now() - 3600000 * 2,
    isPinned: true
  }
];

export const INITIAL_PERMISSIONS: PermissionItem[] = [
  {
    id: 'default_assistant',
    name: 'Default assistant',
    description: "Make MAYRA the phone's digital assistant (replaces Google Assistant) — long-press power / swipe from a corner opens her instantly, even on the lock screen. Pick 'MAYRA' as the assistant app.",
    status: 'custom_action',
    statusLabel: 'MAYRA',
    actionType: 'role_picker',
    actionLabel: 'MAYRA',
    androidSystemIntent: 'android.settings.VOICE_INPUT_SETTINGS',
    isRequired: false
  },
  {
    id: 'microphone',
    name: 'Microphone',
    description: 'So you can talk to Mayra (required).',
    status: 'granted',
    statusLabel: 'Granted',
    actionType: 'dialog',
    actionLabel: 'Granted',
    androidManifestPermission: 'android.permission.RECORD_AUDIO',
    isRequired: true
  },
  {
    id: 'camera',
    name: 'Camera',
    description: 'So Mayra can take your photo (front/back) and record video.',
    status: 'granted',
    statusLabel: 'Granted',
    actionType: 'dialog',
    actionLabel: 'Granted',
    androidManifestPermission: 'android.permission.CAMERA',
    isRequired: false
  },
  {
    id: 'phone_calls',
    name: 'Phone calls',
    description: 'So Mayra can place calls for you.',
    status: 'granted',
    statusLabel: 'Granted',
    actionType: 'dialog',
    actionLabel: 'Granted',
    androidManifestPermission: 'android.permission.CALL_PHONE',
    isRequired: false
  },
  {
    id: 'location',
    name: 'Location',
    description: 'So Mayra can give you location, navigation and weather.',
    status: 'granted',
    statusLabel: 'Granted',
    actionType: 'dialog',
    actionLabel: 'Granted',
    androidManifestPermission: 'android.permission.ACCESS_FINE_LOCATION',
    isRequired: false
  },
  {
    id: 'contacts',
    name: 'Contacts',
    description: "So Mayra can look up a contact's number when you say a name (for calls/SMS).",
    status: 'granted',
    statusLabel: 'Granted',
    actionType: 'dialog',
    actionLabel: 'Granted',
    androidManifestPermission: 'android.permission.READ_CONTACTS',
    isRequired: false
  },
  {
    id: 'sms',
    name: 'SMS',
    description: 'So Mayra can send text messages.',
    status: 'granted',
    statusLabel: 'Granted',
    actionType: 'dialog',
    actionLabel: 'Granted',
    androidManifestPermission: 'android.permission.SEND_SMS',
    isRequired: false
  },
  {
    id: 'gallery_files',
    name: 'Gallery & files',
    description: 'So Mayra can find your photos/videos/files and send them to someone (on WhatsApp or any app).',
    status: 'granted',
    statusLabel: 'Granted',
    actionType: 'dialog',
    actionLabel: 'Granted',
    androidManifestPermission: 'android.permission.READ_MEDIA_IMAGES',
    isRequired: false
  },
  {
    id: 'manage_calls',
    name: 'Answer & manage calls',
    description: "So Mayra can announce every incoming call and answer/reject/end it — Call Log is also needed to tell you the caller's name. (Note: she can't talk to the caller herself on a cellular call.)",
    status: 'granted',
    statusLabel: 'Granted',
    actionType: 'dialog',
    actionLabel: 'Granted',
    androidManifestPermission: 'android.permission.ANSWER_PHONE_CALLS',
    isRequired: false
  },
  {
    id: 'notification_access',
    name: 'Notification access',
    description: "To read notifications from all apps (and WhatsApp messages). Also how Mayra knows the caller's name when announcing a call — Android hides it from apps otherwise.",
    status: 'granted',
    statusLabel: 'Granted',
    actionType: 'open_settings',
    actionLabel: 'Granted',
    androidSystemIntent: 'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS',
    isRequired: false
  },
  {
    id: 'accessibility_service',
    name: 'Accessibility service',
    description: "For WhatsApp/YouTube control and screen reading (enable 'Mayra' in the list).",
    status: 'not_granted',
    statusLabel: 'Grant',
    actionType: 'open_settings',
    actionLabel: 'Grant',
    androidSystemIntent: 'android.settings.ACCESSIBILITY_SETTINGS',
    isRequired: false
  },
  {
    id: 'battery_optimization',
    name: 'Battery — no optimization',
    description: 'So Mayra keeps running with the screen off / in the background — exempt her from battery optimization.',
    status: 'not_granted',
    statusLabel: 'Grant',
    actionType: 'open_settings',
    actionLabel: 'Grant',
    androidSystemIntent: 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
    isRequired: false
  },
  {
    id: 'overlay',
    name: 'Display over other apps',
    description: 'So Mayra can work on top of other apps.',
    status: 'not_granted',
    statusLabel: 'Grant',
    actionType: 'open_settings',
    actionLabel: 'Grant',
    androidSystemIntent: 'android.settings.action.MANAGE_OVERLAY_PERMISSION',
    isRequired: false
  },
  {
    id: 'screen_capture',
    name: 'Screen capture',
    description: 'So Mayra can watch your screen live (screen share). She asks for this herself whenever she needs it — every time. You can also test it once here.',
    status: 'not_granted',
    statusLabel: 'Grant',
    actionType: 'screen_capture_intent',
    actionLabel: 'Grant',
    androidSystemIntent: 'android.media.projection.MediaProjectionManager',
    isRequired: false
  }
];

