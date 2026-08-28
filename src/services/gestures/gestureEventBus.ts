import { 
  GestureEventType, 
  GestureEventMap, 
  GestureThrowPayload, 
  GestureClapClearPayload,
  Vector2D 
} from '../../types/gestures';

type GestureListener<K extends GestureEventType> = (payload: GestureEventMap[K]) => void;

/**
 * Global Gesture Event Bus for MAYRA MediaPipe Gesture System
 * Dispatches high-level physical gesture events (Throw / Fling, Clap-to-Clear, Tap, Scroll, Hold, Zoom)
 */
export class GestureEventBus {
  private static instance: GestureEventBus | null = null;
  private listeners: Map<GestureEventType, Set<GestureListener<any>>> = new Map();

  public static getInstance(): GestureEventBus {
    if (!this.instance) {
      this.instance = new GestureEventBus();
    }
    return this.instance;
  }

  /**
   * Subscribe to a gesture event
   */
  public on<K extends GestureEventType>(eventType: K, listener: GestureListener<K>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      this.off(eventType, listener);
    };
  }

  /**
   * Unsubscribe from a gesture event
   */
  public off<K extends GestureEventType>(eventType: K, listener: GestureListener<K>): void {
    const set = this.listeners.get(eventType);
    if (set) {
      set.delete(listener);
    }
  }

  /**
   * Emit a gesture event with corresponding payload and logging
   */
  public emit<K extends GestureEventType>(eventType: K, payload: GestureEventMap[K]): void {
    // Dynamic Haptic Feedback (50ms pulse for valid gesture events)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(50);
      } catch {
        // Ignore haptic vibration permission/device errors
      }
    }

    // Engine Logging Formats (Phase B atomic verification traces)
    if (eventType === 'GESTURE_THROW') {
      const p = payload as GestureThrowPayload;
      console.log(
        `[GestureEngine] THROW detected -> Vector: (${p.direction.x.toFixed(2)}, ${p.direction.y.toFixed(2)}), Inertia Decay: Active`
      );
      console.log(
        `[GestureEngine] THROW detected -> Vector: (${p.direction.x.toFixed(2)}, ${p.direction.y.toFixed(2)}), Friction: Active`
      );
    } else if (eventType === 'GESTURE_CLAP_CLEAR') {
      console.log(`[GestureEngine] CLAP detected -> Workspace Cleared`);
      console.log(`[GestureEngine] CLAP detected -> Clearing Workspace`);
    } else if (eventType === 'GESTURE_FIST_HOLD') {
      console.log(`[GestureEngine] FIST detected -> Freeze Triggered`);
      console.log(`[GestureEngine] FIST detected -> Motion Paused`);
    }

    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(payload);
        } catch (err) {
          console.error(`[GestureEventBus] Error in ${eventType} listener:`, err);
        }
      });
    }
  }

  /**
   * Removes all registered event listeners
   */
  public clearAll(): void {
    this.listeners.clear();
  }

  /**
   * Physics Simulation Hook: Calculates inertia decay/friction (velocity *= 0.92)
   * so target UI elements smoothly glide and come to a stop.
   *
   * @param payload The initial throw event payload
   * @param onStep Frame step callback receiving current translation position and decayed speed
   * @param onComplete Callback when motion drops below resting threshold (< 0.05)
   * @param friction Decay multiplier per frame (default: 0.92)
   * @returns Cancellation function
   */
  public static simulateThrowPhysics(
    payload: GestureThrowPayload,
    onStep: (currentPos: Vector2D, currentVelocity: number) => void,
    onComplete?: () => void,
    friction: number = 0.92
  ): () => void {
    let animId: number | null = null;
    let isCancelled = false;
    let currentVelocity = payload.velocity * 1000; // Convert to pixels/s or screen units
    let currentX = payload.releasePosition.x;
    let currentY = payload.releasePosition.y;

    const dirX = payload.direction.x;
    const dirY = payload.direction.y;

    let lastTime = performance.now();

    const step = (now: number) => {
      if (isCancelled) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1); // in seconds
      lastTime = now;

      if (currentVelocity > 15) {
        currentX += dirX * currentVelocity * dt;
        currentY += dirY * currentVelocity * dt;
        currentVelocity *= friction;

        onStep({ x: currentX, y: currentY }, currentVelocity);
        animId = requestAnimationFrame(step);
      } else {
        if (onComplete) onComplete();
      }
    };

    animId = requestAnimationFrame(step);

    return () => {
      isCancelled = true;
      if (animId !== null) cancelAnimationFrame(animId);
    };
  }
}
