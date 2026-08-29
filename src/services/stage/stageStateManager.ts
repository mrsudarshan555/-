/**
 * Spatial State Persistence & Cross-Brain Voice Spoken Triggers (Phase H)
 * 
 * Manages:
 * - Local storage persistence for cards layout & configurations.
 * - Cross-Brain Voice Triggers ("Show workspace", "Stage kholo", "Clear canvas", "Sab saaf karo").
 * - Auto-arrange grid calculations for spatial nodes.
 */

import { SpatialCard, StageCanvasConfig } from './types';
import { StagePhysicsEngine } from './stagePhysicsEngine';
import { GestureVoiceBridge } from '../gestures/gestureVoiceBridge';

const STAGE_STORAGE_KEY = 'mayra_stage_workspace_state_v1';

export class StageStateManager {
  private static instance: StageStateManager | null = null;
  private physicsEngine: StagePhysicsEngine;

  private constructor() {
    this.physicsEngine = StagePhysicsEngine.getInstance();
    this.setupVoiceTriggerListener();
  }

  public static getInstance(): StageStateManager {
    if (!this.instance) {
      this.instance = new StageStateManager();
    }
    return this.instance;
  }

  /**
   * Initializes workspace state from localStorage or seeds defaults
   */
  public initializeWorkspace(): void {
    const saved = this.loadSavedState();
    if (saved && saved.length > 0) {
      this.physicsEngine.setCards(saved);
    } else {
      this.seedDefaultCards();
    }
  }

  /**
   * Seeds production-ready kinetic cards (Code Runner, Markdown Note, System Telemetry)
   */
  public seedDefaultCards(): void {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const defaultCards: SpatialCard[] = [
      // 1. Interactive TypeScript Code Snippet
      {
        id: 'card-code-simd',
        type: 'code_snippet',
        title: 'Kinetic Matrix 3D Accelerator',
        content: 'Hardware-accelerated DOM CSS transforms with 60 FPS requestAnimationFrame rendering.',
        codeSnippet: {
          language: 'typescript',
          filename: 'matrix3d_renderer.ts',
          code: `export function applyTransform3D(el: HTMLElement, x: number, y: number, s: number, r: number) {\n  el.style.transform = \`translate3d(\${x}px, \${y}px, 0px) scale(\${s}) rotate(\${r}deg)\`;\n  el.style.willChange = 'transform';\n}`
        },
        position: { x: Math.max(30, screenWidth * 0.08), y: Math.max(80, screenHeight * 0.14), z: 10 },
        velocity: { vx: 0, vy: 0 },
        scale: 1.0,
        rotation: -1.5,
        width: 380,
        height: 280,
        isGrabbed: false,
        isPinned: false,
        isSliding: false,
        colorTheme: '#06b6d4',
        timestamp: Date.now()
      },
      // 2. Shared Markdown Vault Note Card
      {
        id: 'card-markdown-vault',
        type: 'markdown_note',
        title: 'MEMORY.md // Spatial Workspace Note',
        content: `### Active Autonomous Directives\n- **Kinetic Physics**: 60 FPS RequestAnimationFrame loop\n- **Decay Factor**: $V \\leftarrow V \\times 0.92$\n- **Gesture Bus**: Throw, Clap-to-Clear, Fist-Hold freeze\n- **Avatar Safety**: Zero-Touch 3D Mesh Integrity`,
        position: { x: Math.max(30, screenWidth * 0.45), y: Math.max(80, screenHeight * 0.18), z: 12 },
        velocity: { vx: 0, vy: 0 },
        scale: 1.0,
        rotation: 1.2,
        width: 360,
        height: 260,
        isGrabbed: false,
        isPinned: false,
        isSliding: false,
        colorTheme: '#a855f7',
        timestamp: Date.now()
      }
    ];

    this.physicsEngine.setCards(defaultCards);
    this.saveState();
  }

  /**
   * Auto-arranges all active spatial cards into an ergonomic bento grid
   */
  public autoArrangeGrid(): void {
    const cards = this.physicsEngine.getCards();
    if (cards.length === 0) return;

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const startX = 60;
    const startY = 100;
    const gap = 24;
    const cols = Math.max(1, Math.floor((screenWidth - 120) / 400));

    cards.forEach((card, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      card.position.x = startX + col * (380 + gap);
      card.position.y = startY + row * (290 + gap);
      card.velocity = { vx: 0, vy: 0 };
      card.rotation = 0;
      card.scale = 1.0;
      card.isSliding = false;
      card.isGrabbed = false;
    });

    this.physicsEngine.setCards([...cards]);
    this.saveState();
  }

  /**
   * Adds a new customized Markdown Note card
   */
  public spawnNoteCard(title: string = 'Quick Workspace Note', text: string = 'Type note content here...'): SpatialCard {
    const card: SpatialCard = {
      id: `note-${Date.now()}`,
      type: 'markdown_note',
      title,
      content: text,
      position: {
        x: 100 + Math.random() * 80,
        y: 120 + Math.random() * 80,
        z: 20
      },
      velocity: { vx: 0, vy: 0 },
      scale: 1.0,
      rotation: (Math.random() - 0.5) * 4,
      width: 340,
      height: 240,
      isGrabbed: false,
      isPinned: false,
      isSliding: false,
      colorTheme: '#10b981',
      timestamp: Date.now()
    };

    this.physicsEngine.addCard(card);
    this.saveState();
    return card;
  }

  /**
   * Adds a new Terminal / Code Snippet card
   */
  public spawnCodeCard(title: string = 'Terminal Sandbox', code: string = 'console.log("Barehands Virtual Stage Active");'): SpatialCard {
    const card: SpatialCard = {
      id: `code-${Date.now()}`,
      type: 'code_snippet',
      title,
      content: 'Sandboxed code execution node.',
      codeSnippet: {
        language: 'javascript',
        filename: 'workspace_script.js',
        code
      },
      position: {
        x: 140 + Math.random() * 80,
        y: 140 + Math.random() * 80,
        z: 22
      },
      velocity: { vx: 0, vy: 0 },
      scale: 1.0,
      rotation: (Math.random() - 0.5) * 3,
      width: 380,
      height: 280,
      isGrabbed: false,
      isPinned: false,
      isSliding: false,
      colorTheme: '#f59e0b',
      timestamp: Date.now()
    };

    this.physicsEngine.addCard(card);
    this.saveState();
    return card;
  }

  /**
   * Saves current cards state to LocalStorage
   */
  public saveState(): void {
    if (typeof window === 'undefined') return;
    try {
      const cards = this.physicsEngine.getCards();
      localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      console.warn('[StageStateManager] Failed to persist workspace state:', e);
    }
  }

  /**
   * Loads saved cards state from LocalStorage
   */
  public loadSavedState(): SpatialCard[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STAGE_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * Reset workspace to factory state
   */
  public resetWorkspace(): void {
    this.seedDefaultCards();
    this.physicsEngine.spawnParticleBurst(window.innerWidth / 2, window.innerHeight / 2, '#06b6d4', 25);
  }

  // --------------------------------------------------------------------------
  // VOICE SPOKEN TRIGGERS ("Show workspace", "Stage kholo", "Clear canvas", "Sab saaf karo")
  // --------------------------------------------------------------------------

  private setupVoiceTriggerListener(): void {
    // Check incoming voice transcript or intent hooks
    if (typeof window !== 'undefined') {
      (window as any).__MAYRA_DISPATCH_STAGE_VOICE__ = (transcript: string) => {
        this.handleVoiceCommand(transcript);
      };
    }
  }

  public handleVoiceCommand(transcript: string): boolean {
    if (!transcript) return false;
    const lower = transcript.toLowerCase().trim();

    // 1. OPEN / SHOW WORKSPACE TRIGGERS
    if (
      lower.includes('show workspace') ||
      lower.includes('open workspace') ||
      lower.includes('stage kholo') ||
      lower.includes('open stage') ||
      lower.includes('workspace kholo') ||
      lower.includes('stage canvas')
    ) {
      this.physicsEngine.setConfig({ isOpen: true });
      return true;
    }

    // 2. CLEAR WORKSPACE TRIGGERS
    if (
      lower.includes('clear canvas') ||
      lower.includes('clear workspace') ||
      lower.includes('sab saaf karo') ||
      lower.includes('canvas saaf karo') ||
      lower.includes('workspace reset karo') ||
      lower.includes('reset canvas')
    ) {
      this.physicsEngine.handleClapClear();
      return true;
    }

    // 3. AUTO-ARRANGE GRID
    if (
      lower.includes('arrange workspace') ||
      lower.includes('arrange canvas') ||
      lower.includes('grid me lagao') ||
      lower.includes('auto arrange')
    ) {
      this.autoArrangeGrid();
      return true;
    }

    return false;
  }
}
