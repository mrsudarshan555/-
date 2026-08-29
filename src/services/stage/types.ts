/**
 * Types & Interfaces for Barehands Virtual Workspace & Stage Canvas (Phase H)
 */

export type SpatialCardType = 'code_snippet' | 'markdown_note' | 'tool_card' | 'terminal_runner';

export interface SpatialCard {
  id: string;
  type: SpatialCardType;
  title: string;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
    filename?: string;
  };
  position: {
    x: number;
    y: number;
    z: number;
  };
  velocity: {
    vx: number;
    vy: number;
  };
  scale: number;
  rotation: number;
  width: number;
  height: number;
  isGrabbed: boolean;
  isPinned: boolean;
  isSliding: boolean;
  colorTheme?: string;
  timestamp: number;
}

export interface StageParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface StageCanvasConfig {
  isOpen: boolean;
  gravity: number;
  friction: number; // 0.92 default
  throwVelocityThreshold: number; // 1.2 px/ms
  isFrozen: boolean;
  showGrid: boolean;
  enableSoundEffects: boolean;
}

export interface StageEventMap {
  'STAGE_CARD_GRABBED': { cardId: string; handX: number; handY: number };
  'STAGE_CARD_RELEASED': { cardId: string; velocity: { vx: number; vy: number } };
  'STAGE_CARD_FLUNG': { cardId: string; velocity: { vx: number; vy: number } };
  'STAGE_WORKSPACE_CLEARED': void;
  'STAGE_FIST_FREEZE': void;
  'STAGE_CANVAS_TOGGLE': { isOpen: boolean };
}
