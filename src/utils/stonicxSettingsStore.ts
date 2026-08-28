import { StonicxFullSettingsState } from '../types/stonicxSettings';

const STORAGE_KEY = 'stonicx_full_settings_v1';

export const DEFAULT_STONICX_SETTINGS: StonicxFullSettingsState = {
  appearance: {
    themeColor: 'cyan',
    fontStyle: 'Orbitron',
    haloIntensity: 0.85,
    edgeVignette: true,
    gridDensity: 'sparse',
    showDiagnosticsHud: true
  },
  permissions: [
    {
      id: 'mic',
      name: 'Real-time Audio Stream',
      category: 'Audio',
      description: 'Captures direct voice input for neural speech processing.',
      granted: true,
      requiredFor: 'Voice Commands & Live Audio Stream'
    },
    {
      id: 'camera',
      name: 'Optical Scanner & Circuit Lens',
      category: 'Vision',
      description: 'Inspects schematic diagrams, PCB physical boards, and text.',
      granted: true,
      requiredFor: 'Optical Scanner HUD'
    },
    {
      id: 'screen',
      name: 'Display Context Stream',
      category: 'System',
      description: 'Analyzes live visual workspace for real-time problem solving.',
      granted: false,
      requiredFor: 'Active Screen Analysis'
    },
    {
      id: 'storage',
      name: 'Local Vault & Priming Memory',
      category: 'Storage',
      description: 'Persists topic notes, daily logs, and customized system personas.',
      granted: true,
      requiredFor: 'Knowledge Vault Persistence'
    },
    {
      id: 'terminal',
      name: 'Autonomous Shell Command Bridge',
      category: 'Execution',
      description: 'Executes simulated developer diagnostic tasks.',
      granted: true,
      requiredFor: 'Cyber Terminal Commands'
    },
    {
      id: 'speech_synthesis',
      name: 'Neural Speech Output',
      category: 'Audio',
      description: 'Synthesizes real-time vocal feedback in STONICX synthetic tone.',
      granted: true,
      requiredFor: 'Voice Audio Feedback'
    }
  ],
  personal: {
    callSign: 'ARCHITECT-01',
    fullName: 'System Architect',
    technicalSpecialization: 'Hardware & Distributed Systems',
    countryDialCode: '+1',
    countryName: 'United States',
    communicationTone: 'direct_technical',
    autoIngestKnowledge: true
  },
  skills: [
    {
      id: 'cyber_shell',
      name: 'Autonomous Cyber Terminal',
      description: 'Direct interactive bash execution and live simulated shell pipelines.',
      category: 'code',
      enabled: true,
      icon: 'Terminal',
      badge: 'CORE'
    },
    {
      id: 'optic_inspector',
      name: 'Optical Circuit Inspector',
      description: 'Computer-vision schematic diagnostics and PCB trace recognition.',
      category: 'hardware',
      enabled: true,
      icon: 'Camera',
      badge: 'VISION'
    },
    {
      id: 'quantum_priming',
      name: 'Quantum Memory Priming',
      description: 'Adaptive vector priming tailored to complex technical workflows.',
      category: 'ai',
      enabled: true,
      icon: 'Cpu',
      badge: 'NEURAL'
    },
    {
      id: 'deep_ast_reasoner',
      name: 'Deep Code Reasoner',
      description: 'Multi-step static analysis and high-throughput logic validation.',
      category: 'code',
      enabled: true,
      icon: 'Zap'
    },
    {
      id: 'audio_synthesizer',
      name: 'Acoustic Synthesizer',
      description: 'High-frequency binaural tones and dynamic audio feedback.',
      category: 'audio',
      enabled: true,
      icon: 'Volume2'
    }
  ],
  subAgents: [
    {
      id: 'sub_optic',
      name: 'OpticScan-X8',
      role: 'Computer Vision & Optical Tracing',
      description: 'Processes schematic captures and OCR board labels asynchronously.',
      enabled: true,
      status: 'active',
      icon: 'Eye'
    },
    {
      id: 'sub_reasoner',
      name: 'MatrixReasoner-Core',
      role: 'Logic & State Evaluation',
      description: 'Maintains state transitions and verifies technical precision.',
      enabled: true,
      status: 'active',
      icon: 'Cpu'
    },
    {
      id: 'sub_executor',
      name: 'ShellExecutor-09',
      role: 'Sub-process Sandboxing',
      description: 'Executes simulated tool calls and terminal workflows.',
      enabled: false,
      status: 'standby',
      icon: 'Terminal'
    }
  ],
  voiceGuardian: {
    wakeWordEnabled: true,
    wakeWord: 'Hey Stonicx',
    noiseGateSensitivity: 75,
    frequencyCompression: true,
    voicePitch: 1.05,
    voiceSpeed: 1.0,
    voiceId: 'stonicx_synthetic_v1'
  },
  meshSync: {
    localMeshSync: true,
    peerEncryption: true,
    cloudMirrorBackup: false,
    nodeId: 'NODE-STONICX-7429',
    pairedDevicesCount: 2,
    syncIntervalMin: 15
  },
  whiteboard: {
    defaultColor: '#00F0FF',
    defaultLineWidth: 3,
    backgroundTheme: 'dark',
    gridOverlay: true,
    defaultTool: 'pen',
    autoAnalyzeOnSend: true
  }
};

export const loadStonicxSettings = (): StonicxFullSettingsState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STONICX_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STONICX_SETTINGS,
      ...parsed,
      appearance: { ...DEFAULT_STONICX_SETTINGS.appearance, ...(parsed.appearance || {}) },
      personal: { ...DEFAULT_STONICX_SETTINGS.personal, ...(parsed.personal || {}) },
      voiceGuardian: { ...DEFAULT_STONICX_SETTINGS.voiceGuardian, ...(parsed.voiceGuardian || {}) },
      meshSync: { ...DEFAULT_STONICX_SETTINGS.meshSync, ...(parsed.meshSync || {}) },
      whiteboard: { ...DEFAULT_STONICX_SETTINGS.whiteboard, ...(parsed.whiteboard || {}) }
    };
  } catch (e) {
    console.error('Failed to load STONICX settings:', e);
    return DEFAULT_STONICX_SETTINGS;
  }
};

export const saveStonicxSettings = (settings: StonicxFullSettingsState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save STONICX settings:', e);
  }
};
