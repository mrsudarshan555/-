/**
 * Kinetic Multi-Touch Gesture Physics Engine (Phase H)
 * 
 * Ported from barehands-main: stage.html & server.py
 * 
 * Features:
 * - 60 FPS spatial transform loop using Hardware-Accelerated translate3d.
 * - Raycast Hit-Testing against spatial cards using Hand Landmarks 4 (Thumb) & 8 (Index).
 * - Velocity tracking on pinch drag & kinetic throw/fling with decay (V *= 0.92).
 * - Bimanual Two-Hand Zoom scaling.
 * - Integration with GestureEventBus for GESTURE_CLAP_CLEAR (workspace flush) & GESTURE_FIST_HOLD (kinetic freeze).
 * 
 * Console Outputs:
 * `[StageCanvas] Canvas initialized -> 60 FPS Kinetic Engine Active`
 * `[StagePhysics] Grab detected -> Card bound to Hand Landmark 8`
 * `[StagePhysics] Throw executed -> Decay active (V: x, y)`
 * `[StageCanvas] Workspace cleared via Clap`
 */

import { SpatialCard, StageParticle, StageCanvasConfig } from './types';
import { GestureEventBus } from '../gestures/gestureEventBus';
import { BarehandsTracker } from '../gestures/barehandsTracker';
import { BarehandsGestureState, DetectedHand } from '../../types/gestures';

export class StagePhysicsEngine {
  private static instance: StagePhysicsEngine | null = null;

  private cards: Map<string, SpatialCard> = new Map();
  private particles: StageParticle[] = [];
  private config: StageCanvasConfig = {
    isOpen: true,
    gravity: 0,
    friction: 0.92, // 0.92 decay factor per frame
    throwVelocityThreshold: 1.2, // 1.2 px/ms release velocity
    isFrozen: false,
    showGrid: true,
    enableSoundEffects: true
  };

  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;

  // Hand tracking state
  private activeGrabbedCardId: string | null = null;
  private grabOffset: { x: number; y: number } = { x: 0, y: 0 };
  private velocityHistory: Array<{ x: number; y: number; time: number }> = [];

  // Listeners for UI state synchronizations
  private cardListeners: Set<(cards: SpatialCard[]) => void> = new Set();
  private particleListeners: Set<(particles: StageParticle[]) => void> = new Set();
  private configListeners: Set<(config: StageCanvasConfig) => void> = new Set();

  private unsubTracker: (() => void) | null = null;
  private unsubClap: (() => void) | null = null;
  private unsubFist: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): StagePhysicsEngine {
    if (!this.instance) {
      this.instance = new StagePhysicsEngine();
    }
    return this.instance;
  }

  /**
   * Initializes the 60 FPS Kinetic Physics Loop & Event Subscriptions
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[StageCanvas] Canvas initialized -> 60 FPS Kinetic Engine Active`);

    // Subscribe to BarehandsTracker hand telemetry
    const tracker = BarehandsTracker.getInstance();
    this.unsubTracker = tracker.subscribe((state: BarehandsGestureState) => {
      this.handleHandState(state);
    });

    // Subscribe to Physical Gesture Events
    const gestureBus = GestureEventBus.getInstance();

    // 1. Clap to Clear Workspace
    this.unsubClap = gestureBus.on('GESTURE_CLAP_CLEAR', () => {
      this.handleClapClear();
    });

    // 2. Fist Hold Kinetic Freeze
    this.unsubFist = gestureBus.on('GESTURE_FIST_HOLD', (payload) => {
      if (payload.isHolding) {
        this.freezeWorkspace();
      } else {
        this.unfreezeWorkspace();
      }
    });

    // Start 60 FPS Render Loop
    this.lastFrameTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.unsubTracker) {
      this.unsubTracker();
      this.unsubTracker = null;
    }
    if (this.unsubClap) {
      this.unsubClap();
      this.unsubClap = null;
    }
    if (this.unsubFist) {
      this.unsubFist();
      this.unsubFist = null;
    }
  }

  // --------------------------------------------------------------------------
  // 60 FPS KINETIC LOOP & INERTIA SIMULATION
  // --------------------------------------------------------------------------

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1); // in seconds
    this.lastFrameTime = currentTime;

    if (!this.config.isFrozen) {
      this.updateCardPhysics(dt);
      this.updateParticles(dt);
    }

    this.notifyCardListeners();
    this.notifyParticleListeners();

    this.animFrameId = requestAnimationFrame(this.loop);
  }

  private updateCardPhysics(dt: number): void {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    this.cards.forEach((card) => {
      if (card.isGrabbed) return; // Managed by hand cursor directly

      // If card has velocity, apply decay
      if (Math.abs(card.velocity.vx) > 0.05 || Math.abs(card.velocity.vy) > 0.05) {
        card.isSliding = true;
        card.position.x += card.velocity.vx * dt * 60;
        card.position.y += card.velocity.vy * dt * 60;

        // Apply friction decay (V *= 0.92)
        card.velocity.vx *= this.config.friction;
        card.velocity.vy *= this.config.friction;

        // Slight natural spin on throw
        card.rotation += card.velocity.vx * 0.08;

        // Screen boundary soft bounce / clamp
        const minX = 10;
        const maxX = Math.max(10, screenWidth - card.width * card.scale - 10);
        const minY = 60;
        const maxY = Math.max(60, screenHeight - card.height * card.scale - 60);

        if (card.position.x < minX) {
          card.position.x = minX;
          card.velocity.vx = -card.velocity.vx * 0.5;
        } else if (card.position.x > maxX) {
          card.position.x = maxX;
          card.velocity.vx = -card.velocity.vx * 0.5;
        }

        if (card.position.y < minY) {
          card.position.y = minY;
          card.velocity.vy = -card.velocity.vy * 0.5;
        } else if (card.position.y > maxY) {
          card.position.y = maxY;
          card.velocity.vy = -card.velocity.vy * 0.5;
        }

        // Spawn subtle trailing particles during fast glide
        const speed = Math.hypot(card.velocity.vx, card.velocity.vy);
        if (speed > 8 && Math.random() < 0.3) {
          this.spawnParticle(
            card.position.x + card.width / 2,
            card.position.y + card.height / 2,
            -card.velocity.vx * 0.2 + (Math.random() - 0.5) * 2,
            -card.velocity.vy * 0.2 + (Math.random() - 0.5) * 2,
            '#06b6d4'
          );
        }
      } else {
        card.velocity.vx = 0;
        card.velocity.vy = 0;
        card.isSliding = false;
        // Smoothly settle rotation to nearest 0deg when stationary
        card.rotation *= 0.85;
      }
    });
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt * 60;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // MEDIA-PIPE HAND INTERACTION & RAYCAST HIT-TESTING
  // --------------------------------------------------------------------------

  public handleHandState(state: BarehandsGestureState): void {
    if (!state.isActive || state.hands.length === 0) {
      if (this.activeGrabbedCardId) {
        this.releaseGrabbedCard();
      }
      return;
    }

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const primaryHand = state.hands[0];
    const indexTip = primaryHand.landmarks[8] || primaryHand.indexTip;
    const thumbTip = primaryHand.landmarks[4] || primaryHand.thumbTip;

    if (!indexTip) return;

    // Convert normalized [0, 1] landmark to screen pixel coordinates
    const handX = (1 - indexTip.x) * screenWidth; // Mirrored for natural selfie view
    const handY = indexTip.y * screenHeight;

    // 1. PINCH-TO-GRAB (Thumb & Index within pinch threshold)
    const isPinching = primaryHand.isPinching || (thumbTip && Math.hypot((1 - thumbTip.x) * screenWidth - handX, thumbTip.y * screenHeight - handY) < 65);

    if (isPinching) {
      if (!this.activeGrabbedCardId) {
        // Perform raycast hit test
        const hitCard = this.hitTest(handX, handY);
        if (hitCard) {
          this.activeGrabbedCardId = hitCard.id;
          hitCard.isGrabbed = true;
          hitCard.velocity = { vx: 0, vy: 0 };
          this.grabOffset = {
            x: handX - hitCard.position.x,
            y: handY - hitCard.position.y
          };
          this.velocityHistory = [{ x: handX, y: handY, time: performance.now() }];

          console.log(`[StagePhysics] Grab detected -> Card bound to Hand Landmark 8`);

          // Spawn grab particle ripple
          this.spawnParticleBurst(handX, handY, '#22d3ee', 8);
        }
      } else {
        // Drag active grabbed card
        const card = this.cards.get(this.activeGrabbedCardId);
        if (card) {
          card.position.x = handX - this.grabOffset.x;
          card.position.y = handY - this.grabOffset.y;

          // Track velocity buffer for fling calculation
          const now = performance.now();
          this.velocityHistory.push({ x: handX, y: handY, time: now });
          if (this.velocityHistory.length > 5) {
            this.velocityHistory.shift();
          }
        }
      }
    } else {
      // Pinch released
      if (this.activeGrabbedCardId) {
        this.releaseGrabbedCard();
      }
    }

    // 2. TWO-HAND BIMANUAL ZOOM
    if (state.hands.length >= 2 && state.twoHandScaleDelta && state.twoHandScaleDelta !== 1.0) {
      if (this.activeGrabbedCardId) {
        const card = this.cards.get(this.activeGrabbedCardId);
        if (card) {
          card.scale = Math.max(0.6, Math.min(2.5, card.scale * state.twoHandScaleDelta));
        }
      }
    }
  }

  /**
   * Raycasts point (x, y) against all active spatial cards (topmost z-index first)
   */
  public hitTest(x: number, y: number): SpatialCard | null {
    const sortedCards = Array.from(this.cards.values()).sort((a, b) => b.position.z - a.position.z);

    for (const card of sortedCards) {
      const cardWidth = card.width * card.scale;
      const cardHeight = card.height * card.scale;

      if (
        x >= card.position.x &&
        x <= card.position.x + cardWidth &&
        y >= card.position.y &&
        y <= card.position.y + cardHeight
      ) {
        return card;
      }
    }
    return null;
  }

  /**
   * Releases currently grabbed card, calculating release velocity and fling inertia
   */
  public releaseGrabbedCard(): void {
    if (!this.activeGrabbedCardId) return;

    const card = this.cards.get(this.activeGrabbedCardId);
    this.activeGrabbedCardId = null;

    if (!card) return;
    card.isGrabbed = false;

    // Calculate instantaneous release velocity from history buffer
    if (this.velocityHistory.length >= 2) {
      const first = this.velocityHistory[0];
      const last = this.velocityHistory[this.velocityHistory.length - 1];
      const dt = (last.time - first.time) || 1;
      const vx = ((last.x - first.x) / dt) * 16; // scaled to 60fps unit
      const vy = ((last.y - first.y) / dt) * 16;
      const speed = Math.hypot(vx, vy);

      if (speed >= this.config.throwVelocityThreshold) {
        card.velocity = { vx, vy };
        card.isSliding = true;
        console.log(`[StagePhysics] Throw executed -> Decay active (V: ${vx.toFixed(2)}, ${vy.toFixed(2)})`);
        this.spawnParticleBurst(card.position.x + card.width / 2, card.position.y + card.height / 2, '#38bdf8', 12);
      } else {
        card.velocity = { vx: 0, vy: 0 };
        card.isSliding = false;
      }
    }
    this.velocityHistory = [];
  }

  // --------------------------------------------------------------------------
  // GESTURE ACTIONS: CLAP CLEAR & FIST HOLD
  // --------------------------------------------------------------------------

  public handleClapClear(): void {
    console.log(`[StageCanvas] Workspace cleared via Clap`);

    // Particle burst on all cards before removing
    this.cards.forEach((card) => {
      this.spawnParticleBurst(
        card.position.x + card.width / 2,
        card.position.y + card.height / 2,
        '#f43f5e',
        16
      );
    });

    // Clear non-pinned cards
    const retainedCards = new Map<string, SpatialCard>();
    this.cards.forEach((card, id) => {
      if (card.isPinned) {
        retainedCards.set(id, card);
      }
    });

    this.cards = retainedCards;
    this.activeGrabbedCardId = null;
    this.notifyCardListeners();
  }

  public freezeWorkspace(): void {
    this.config.isFrozen = true;
    this.cards.forEach((card) => {
      card.velocity = { vx: 0, vy: 0 };
      card.isSliding = false;
    });
    this.notifyConfigListeners();
    console.log(`[StagePhysics] Fist Hold -> Workspace motion frozen`);
  }

  public unfreezeWorkspace(): void {
    this.config.isFrozen = false;
    this.notifyConfigListeners();
  }

  // --------------------------------------------------------------------------
  // PARTICLE EMITTER
  // --------------------------------------------------------------------------

  public spawnParticle(x: number, y: number, vx: number, vy: number, color: string): void {
    this.particles.push({
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x,
      y,
      vx,
      vy,
      life: 25,
      maxLife: 25,
      color,
      size: Math.random() * 3 + 2
    });
  }

  public spawnParticleBurst(x: number, y: number, color: string, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color
      );
    }
  }

  // --------------------------------------------------------------------------
  // CARD & CONFIG MANAGEMENT
  // --------------------------------------------------------------------------

  public setCards(cardsList: SpatialCard[]): void {
    this.cards.clear();
    cardsList.forEach((c) => this.cards.set(c.id, c));
    this.notifyCardListeners();
  }

  public addCard(card: SpatialCard): void {
    this.cards.set(card.id, card);
    this.spawnParticleBurst(card.position.x + card.width / 2, card.position.y + card.height / 2, '#a855f7', 12);
    this.notifyCardListeners();
  }

  public removeCard(id: string): void {
    const card = this.cards.get(id);
    if (card) {
      this.spawnParticleBurst(card.position.x + card.width / 2, card.position.y + card.height / 2, '#f43f5e', 8);
    }
    this.cards.delete(id);
    if (this.activeGrabbedCardId === id) {
      this.activeGrabbedCardId = null;
    }
    this.notifyCardListeners();
  }

  public getCards(): SpatialCard[] {
    return Array.from(this.cards.values());
  }

  public getParticles(): StageParticle[] {
    return this.particles;
  }

  public getConfig(): StageCanvasConfig {
    return { ...this.config };
  }

  public setConfig(configUpdate: Partial<StageCanvasConfig>): void {
    this.config = { ...this.config, ...configUpdate };
    this.notifyConfigListeners();
  }

  // --------------------------------------------------------------------------
  // LISTENER SUBSCRIPTIONS
  // --------------------------------------------------------------------------

  public subscribeCards(listener: (cards: SpatialCard[]) => void): () => void {
    this.cardListeners.add(listener);
    listener(this.getCards());
    return () => this.cardListeners.delete(listener);
  }

  public subscribeParticles(listener: (particles: StageParticle[]) => void): () => void {
    this.particleListeners.add(listener);
    return () => this.particleListeners.delete(listener);
  }

  public subscribeConfig(listener: (config: StageCanvasConfig) => void): () => void {
    this.configListeners.add(listener);
    listener(this.getConfig());
    return () => this.configListeners.delete(listener);
  }

  private notifyCardListeners(): void {
    const cards = this.getCards();
    this.cardListeners.forEach((l) => l(cards));
  }

  private notifyParticleListeners(): void {
    this.particleListeners.forEach((l) => l(this.particles));
  }

  private notifyConfigListeners(): void {
    this.configListeners.forEach((l) => l(this.getConfig()));
  }
}
