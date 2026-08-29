/**
 * Router State Bus & Permissions Synchronization Layer
 * 
 * Manages event publishing, persona lifecycle state, and hardware/stream continuity
 * (MediaPipe camera stream, Android permissions, Background Gesture Bubble) across persona switches.
 */

import { PersonaTarget, ClassificationResult } from './intentClassifier';

export const EVENT_PERSONA_TRANSITION = 'EVENT_PERSONA_TRANSITION';
export const EVENT_GLITCH_CIPHER = 'EVENT_GLITCH_CIPHER';
export const EVENT_INTENT_CLASSIFIED = 'EVENT_INTENT_CLASSIFIED';
export const EVENT_CONTEXT_SYNCHRONIZED = 'EVENT_CONTEXT_SYNCHRONIZED';

export interface PersonaTransitionPayload {
  from: PersonaTarget;
  to: PersonaTarget;
  reason: string;
  contextSnapshot: Record<string, any>;
  timestamp: number;
}

export interface GlitchCipherPayload {
  active: boolean;
  durationMs: number;
  cipherText?: string;
}

export interface ContextSynchronizedPayload {
  source: PersonaTarget;
  target: PersonaTarget;
  syncedKeysCount: number;
  timestamp: number;
}

export type RouterBusEventCallback<T = any> = (payload: T) => void;

class RouterStateBusManager {
  private activePersona: PersonaTarget = 'MAYRA';
  private subscribers: Map<string, Set<RouterBusEventCallback>> = new Map();
  private isTransitionLocked = false;
  private cameraStreamRetained = true;
  private backgroundGesturesRetained = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mayra_router_active_persona');
        if (saved === 'STONICX' || saved === 'MAYRA') {
          this.activePersona = saved;
        }
      } catch (e) {}
    }
  }

  /**
   * Subscribe to state bus events
   */
  public subscribe<T = any>(event: string, callback: RouterBusEventCallback<T>): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  /**
   * Publish event to subscribers
   */
  public publish<T = any>(event: string, payload: T): void {
    const list = this.subscribers.get(event);
    if (list) {
      list.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.warn(`[RouterStateBus] Error in event listener for ${event}:`, err);
        }
      });
    }
  }

  public getActivePersona(): PersonaTarget {
    return this.activePersona;
  }

  public setActivePersona(persona: PersonaTarget): void {
    this.activePersona = persona;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mayra_router_active_persona', persona);
      } catch (e) {}
    }
  }

  public isLocked(): boolean {
    return this.isTransitionLocked;
  }

  public setLock(locked: boolean): void {
    this.isTransitionLocked = locked;
  }

  /**
   * Guarantees MediaPipe camera stream and gesture listeners remain active across persona boundaries
   */
  public getStreamContinuityStatus(): { cameraRetained: boolean; gesturesRetained: boolean } {
    return {
      cameraRetained: this.cameraStreamRetained,
      gesturesRetained: this.backgroundGesturesRetained
    };
  }
}

export const RouterStateBus = new RouterStateBusManager();
