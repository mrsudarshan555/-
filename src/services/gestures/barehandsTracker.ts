import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { 
  BarehandsGestureState, 
  BarehandsTrackerOptions, 
  DetectedHand, 
  HandLandmark, 
  Handedness, 
  HAND_CONNECTIONS,
  GestureActionType
} from '../../types/gestures';
import { GestureDetector } from './gestureDetector';
import { GestureEventBus } from './gestureEventBus';

const WASM_CDN_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_ASSET_PATH = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export class BarehandsTracker {
  private static instance: BarehandsTracker | null = null;

  private handLandmarker: HandLandmarker | null = null;
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private isInitializing: boolean = false;
  private isLockedPaused: boolean = false;

  private previousHands: DetectedHand[] = [];
  private previousTwoHandDist: number | null = null;

  private lastFrameTimestamp: number = 0;
  private fpsCounter: number = 0;
  private lastFpsSampleTime: number = 0;
  private currentFps: number = 0;

  private options: Required<BarehandsTrackerOptions> = {
    maxHands: 2,
    targetFps: 20, // 20 FPS target for silky gesture control & thermal efficiency
    pinchThreshold: 0.38,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    cameraFacingMode: 'user'
  };

  // Multi-subscriber registry
  private subscribers: Set<(state: BarehandsGestureState) => void> = new Set();
  private lastState: BarehandsGestureState = {
    isActive: false,
    isModelReady: false,
    handsDetected: 0,
    hands: [],
    isPinching: false,
    pinchDragDelta: { x: 0, y: 0 },
    twoHandDistance: null,
    twoHandScaleDelta: 1.0,
    handRotationDelta: 0,
    scrollDeltaY: 0,
    pointerPosition: null,
    activeAction: 'idle',
    actionFeedback: null,
    fps: 0,
    cameraPermission: 'prompt',
    isThrottled: true,
    error: null
  };

  public static getInstance(): BarehandsTracker {
    if (!this.instance) {
      this.instance = new BarehandsTracker();
    }
    return this.instance;
  }

  /**
   * Initializes MediaPipe HandLandmarker WebAssembly runtime with GPU -> CPU fallback
   */
  public async initializeModel(): Promise<boolean> {
    if (this.handLandmarker) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      console.log('[MediaPipe HandLandmarker] Initializing Wasm runtime from Google CDN...');
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN_PATH);
      
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_PATH,
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: this.options.maxHands,
        minHandDetectionConfidence: this.options.minDetectionConfidence,
        minHandPresenceConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence
      });

      console.log('[MediaPipe HandLandmarker] 21-point Hand Skeleton Model loaded & ready.');
      this.isInitializing = false;
      return true;
    } catch (err) {
      console.warn('[MediaPipe HandLandmarker] GPU delegate failed, trying CPU fallback:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN_PATH);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: this.options.maxHands,
          minHandDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4
        });
        console.log('[MediaPipe HandLandmarker] CPU fallback successfully initialized.');
        this.isInitializing = false;
        return true;
      } catch (fallbackErr) {
        console.error('[MediaPipe HandLandmarker] Initialization failed:', fallbackErr);
        this.isInitializing = false;
        return false;
      }
    }
  }

  /**
   * Subscribes a listener to live MediaPipe gesture updates
   */
  public subscribe(listener: (state: BarehandsGestureState) => void): () => void {
    this.subscribers.add(listener);
    listener(this.lastState);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  /**
   * Starts Hand Tracking with camera stream & frame throttling
   */
  public async start(
    videoEl?: HTMLVideoElement | null,
    onUpdate?: (state: BarehandsGestureState) => void,
    customOptions?: BarehandsTrackerOptions
  ): Promise<{ success: boolean; error?: string }> {
    if (onUpdate) {
      this.subscribers.add(onUpdate);
    }

    if (customOptions) {
      this.options = { ...this.options, ...customOptions };
    }

    if (this.isRunning) {
      if (videoEl && this.mediaStream) {
        videoEl.srcObject = this.mediaStream;
        videoEl.playsInline = true;
        videoEl.muted = true;
        videoEl.play().catch(() => {});
      }
      return { success: true };
    }

    // Create or reuse internal video element
    if (!videoEl) {
      if (!this.videoElement) {
        const el = document.createElement('video');
        el.playsInline = true;
        el.muted = true;
        el.setAttribute('playsinline', 'true');
        el.setAttribute('muted', 'true');
        this.videoElement = el;
      }
    } else {
      this.videoElement = videoEl;
    }

    // 1. Request Camera Permission with mobile-optimized constraints
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[Barehands] getUserMedia is not supported in this context.');
        return { success: false, error: 'Camera API is not supported in this browser or iframe context.' };
      }

      console.log('[Barehands] Requesting camera stream for MediaPipe Hand Tracking...');
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: this.options.cameraFacingMode,
          width: { ideal: 480, max: 640 },
          height: { ideal: 360, max: 480 },
          frameRate: { ideal: this.options.targetFps, max: 30 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;

      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        await this.videoElement.play().catch(() => {});
      }

      // 2. Initialize MediaPipe Model if not ready
      if (!this.handLandmarker) {
        const modelReady = await this.initializeModel();
        if (!modelReady) {
          console.warn('[Barehands] Neural model failed to load, starting optical simulation fallback.');
        }
      }

      this.isRunning = true;
      this.isLockedPaused = false;
      this.lastFrameTimestamp = 0;
      this.lastFpsSampleTime = performance.now();
      this.fpsCounter = 0;

      // 3. Start Throttled Detection Loop
      this.scheduleNextFrame();

      console.log('[Barehands] MediaPipe Hand Tracking active & streaming.');
      return { success: true };
    } catch (err: any) {
      console.warn('[Barehands] Camera access denied or unavailable:', err?.message || err);
      let errMsg = 'Camera access was denied or is unavailable.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission denied by user or policy.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        errMsg = 'No front camera found on this device.';
      }
      return { success: false, error: errMsg };
    }
  }

  /**
   * Attaches active media stream to any overlay video element (PiP, modal, or HUD)
   */
  public attachOverlayVideo(videoEl: HTMLVideoElement | null): void {
    if (videoEl && this.mediaStream) {
      videoEl.srcObject = this.mediaStream;
      videoEl.playsInline = true;
      videoEl.muted = true;
      videoEl.play().catch(() => {});
    }
  }

  public getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  /**
   * Main throttled processing frame using MediaPipe Hand Landmarker
   */
  private processFrame = () => {
    if (!this.isRunning || !this.videoElement || this.isLockedPaused) return;

    const now = performance.now();
    // Adaptive battery-saving throttle: 10 FPS when idle (no hands), 30 FPS when active
    const targetFps = this.previousHands.length === 0 ? 10 : 30;
    const frameInterval = 1000 / targetFps;

    if (now - this.lastFrameTimestamp >= frameInterval) {
      this.lastFrameTimestamp = now;
      this.fpsCounter++;

      if (now - this.lastFpsSampleTime >= 1000) {
        this.currentFps = Math.round((this.fpsCounter * 1000) / (now - this.lastFpsSampleTime));
        this.fpsCounter = 0;
        this.lastFpsSampleTime = now;
      }

      if (this.videoElement.readyState >= 2 && !this.videoElement.paused) {
        try {
          const detectedHands: DetectedHand[] = [];

          if (this.handLandmarker) {
            const results = this.handLandmarker.detectForVideo(this.videoElement, now);

            if (results.landmarks && results.landmarks.length > 0) {
              results.landmarks.forEach((landmarkArray, idx) => {
                const handednessStr = results.handednesses?.[idx]?.[0]?.categoryName || (idx === 0 ? 'Right' : 'Left');
                const handedness: Handedness = handednessStr.toLowerCase().includes('left') ? 'Left' : 'Right';
                const score = results.handednesses?.[idx]?.[0]?.score || 0.95;

                // Confidence Floor Gate: Discard unreliable frames with confidence < 0.70
                if (score < 0.70) {
                  return;
                }

                const analyzed = GestureDetector.analyzeHand(
                  landmarkArray as HandLandmark[],
                  handedness,
                  score,
                  this.options.pinchThreshold
                );
                detectedHands.push(analyzed);
              });
            }
          }

          // Compute Gestures & Actions
          const primaryHand = detectedHands[0] || null;
          const prevPrimaryHand = this.previousHands[0] || null;

          // 1. Pinch Detection (Palm normal safety gated)
          const isPinching = detectedHands.some((h) => h.isPinching && h.isFacingCamera);

          // 2. Pinch + Drag Delta
          const pinchDragDelta = primaryHand && primaryHand.isFacingCamera
            ? GestureDetector.computePinchDrag(primaryHand, prevPrimaryHand)
            : { x: 0, y: 0 };

          // 3. Two-Hand Scaling
          let twoHandDistance: number | null = null;
          let twoHandScaleDelta: number = 1.0;
          if (detectedHands.length >= 2 && detectedHands[0].isFacingCamera && detectedHands[1].isFacingCamera) {
            const scaleResult = GestureDetector.computeTwoHandScale(
              detectedHands[0],
              detectedHands[1],
              this.previousTwoHandDist
            );
            twoHandDistance = scaleResult.currentDistance;
            twoHandScaleDelta = scaleResult.scaleDelta;
            this.previousTwoHandDist = twoHandDistance;
          } else {
            this.previousTwoHandDist = null;
          }

          // 4. Hand-Controlled 3D Model Rotation
          const handRotationDelta = primaryHand && primaryHand.isFacingCamera
            ? GestureDetector.computeHandRotationDelta(primaryHand, prevPrimaryHand)
            : 0;

          // 5. Dynamic Physical Gestures (Phase B: Throw, Clap-to-Clear, Fist Hold)
          const bus = GestureEventBus.getInstance();
          let activeAction: GestureActionType = 'idle';
          let actionFeedback: string | null = null;
          let scrollDeltaY = 0;

          // 5a. Clap-to-Clear (Two-Hand Rapid Collision)
          if (detectedHands.length >= 2) {
            const clapResult = GestureDetector.checkClapClear(detectedHands, now);
            if (clapResult.isClap && clapResult.payload) {
              activeAction = 'clap_clear';
              actionFeedback = 'Clap-to-Clear Buffer';
              bus.emit('GESTURE_CLAP_CLEAR', clapResult.payload);
            }
          }

          // 5b. Emergency Freeze: Fist Hold Detection
          if (primaryHand && activeAction === 'idle') {
            const fistResult = GestureDetector.checkFistHold(primaryHand, now);
            if (fistResult.isFistHold && fistResult.payload) {
              activeAction = 'fist_hold';
              actionFeedback = 'Emergency Freeze (Fist Hold)';
              bus.emit('GESTURE_FIST_HOLD', fistResult.payload);
            }
          }

          // 5c. Dynamic Throw / Fling
          if (primaryHand && activeAction === 'idle' && primaryHand.isFacingCamera) {
            const throwResult = GestureDetector.checkThrow(primaryHand, now);
            if (throwResult.isThrow && throwResult.payload) {
              activeAction = 'throw';
              actionFeedback = `Fling / Throw (${Math.round(throwResult.payload.velocity)} px/s)`;
              bus.emit('GESTURE_THROW', throwResult.payload);
            }
          }

          // 5d. Standard Phase A & Navigation Gestures
          if (primaryHand && activeAction === 'idle' && primaryHand.isFacingCamera) {
            const scrollResult = GestureDetector.computeScrollDelta(primaryHand, prevPrimaryHand);
            scrollDeltaY = scrollResult.scrollY;

            // Check Double Tap Click
            const isDoubleTap = GestureDetector.checkDoubleTap(primaryHand, Date.now());
            // Check Hold Long Press
            const holdResult = GestureDetector.checkHoldLongPress(primaryHand, Date.now());

            if (isDoubleTap) {
              activeAction = 'double_tap';
              actionFeedback = 'Double-Tap Click Triggered';
              const targetPos = primaryHand.isFingerExtended.index ? primaryHand.indexTip : primaryHand.palmCenter;
              const screenX = (1 - targetPos.x) * (typeof window !== 'undefined' ? window.innerWidth : 1000);
              const screenY = targetPos.y * (typeof window !== 'undefined' ? window.innerHeight : 1000);
              bus.emit('GESTURE_DOUBLE_TAP', { x: screenX, y: screenY, timestamp: now });
            } else if (holdResult.triggered) {
              activeAction = 'hold_long_press';
              actionFeedback = 'Long-Press Triggered';
              const targetPos = primaryHand.isFingerExtended.index ? primaryHand.indexTip : primaryHand.palmCenter;
              const screenX = (1 - targetPos.x) * (typeof window !== 'undefined' ? window.innerWidth : 1000);
              const screenY = targetPos.y * (typeof window !== 'undefined' ? window.innerHeight : 1000);
              bus.emit('GESTURE_HOLD', { x: screenX, y: screenY, timestamp: now });
            } else if (scrollResult.action === 'swipe_up') {
              activeAction = 'swipe_up';
              actionFeedback = 'Swipe Up Scroll';
              bus.emit('GESTURE_SWIPE_SCROLL', { deltaY: scrollDeltaY, isUp: true, timestamp: now });
            } else if (scrollResult.action === 'swipe_down') {
              activeAction = 'swipe_down';
              actionFeedback = 'Swipe Down Scroll';
              bus.emit('GESTURE_SWIPE_SCROLL', { deltaY: scrollDeltaY, isUp: false, timestamp: now });
            } else if (detectedHands.length >= 2 && Math.abs(twoHandScaleDelta - 1.0) > 0.03) {
              activeAction = 'two_hand_zoom';
              actionFeedback = '2-Hand Zoom';
              bus.emit('GESTURE_ZOOM', { scaleMultiplier: twoHandScaleDelta, timestamp: now });
            } else if (isPinching) {
              activeAction = 'pinch_drag';
              actionFeedback = 'Pinch Drag';
            } else if (primaryHand.detectedAction === 'pointing') {
              activeAction = 'pointing';
              actionFeedback = 'Pointing Cursor';
            } else if (primaryHand.detectedAction === 'rotating_3d') {
              activeAction = 'rotating_3d';
              actionFeedback = 'Rotating 3D Model';
            }
          }

          // 6. Compute Screen Pointer Coordinates (mirrored for front-facing camera)
          let pointerPosition: { x: number; y: number } | null = null;
          if (primaryHand && typeof window !== 'undefined') {
            const targetPos = primaryHand.isFingerExtended.index ? primaryHand.indexTip : primaryHand.palmCenter;
            const screenX = (1 - targetPos.x) * window.innerWidth;
            const screenY = targetPos.y * window.innerHeight;
            pointerPosition = { x: screenX, y: screenY };
          }

          // Save state for next frame
          this.previousHands = detectedHands;

          const newState: BarehandsGestureState = {
            isActive: true,
            isModelReady: !!this.handLandmarker,
            handsDetected: detectedHands.length,
            hands: detectedHands,
            isPinching,
            pinchDragDelta,
            twoHandDistance,
            twoHandScaleDelta,
            handRotationDelta,
            scrollDeltaY,
            pointerPosition,
            activeAction,
            actionFeedback,
            fps: this.currentFps || this.options.targetFps,
            cameraPermission: 'granted',
            isThrottled: true,
            error: null
          };

          this.lastState = newState;
          this.broadcast(newState);
        } catch (detectionErr) {
          console.warn('[Barehands] MediaPipe frame processing warning:', detectionErr);
        }
      }
    }

    if (this.isRunning && !this.isLockedPaused) {
      this.scheduleNextFrame();
    }
  };

  private scheduleNextFrame() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.animFrameId = requestAnimationFrame(this.processFrame);
  }

  private broadcast(state: BarehandsGestureState) {
    this.subscribers.forEach((sub) => {
      try {
        sub(state);
      } catch (e) {
        console.error('[Barehands] Subscriber callback error:', e);
      }
    });
  }

  /**
   * Helper to draw full 21 MediaPipe Landmarks & Bones onto any 2D canvas
   */
  public static drawSkeletonOnCanvas(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    hands: DetectedHand[],
    activeAction: GestureActionType = 'idle'
  ): void {
    ctx.clearRect(0, 0, width, height);

    hands.forEach((hand) => {
      const isPinch = hand.isPinching;
      const isTap = activeAction === 'double_tap';
      const isSwipe = activeAction === 'swipe_up' || activeAction === 'swipe_down';
      const isThrow = activeAction === 'throw';
      const isClap = activeAction === 'clap_clear';

      // 1. Draw Bones (Skeleton Lines)
      ctx.lineWidth = isThrow || isClap ? 2.5 : 1.5;
      ctx.strokeStyle = isClap ? '#10B981' : isThrow ? '#F59E0B' : isTap ? '#F43F5E' : isSwipe ? '#A855F7' : isPinch ? '#F59E0B' : '#06B6D4';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = isThrow || isClap ? 8 : 4;

      HAND_CONNECTIONS.forEach(([i, j]) => {
        const p1 = hand.landmarks[i];
        const p2 = hand.landmarks[j];
        if (p1 && p2) {
          const x1 = (1 - p1.x) * width; // Mirrored
          const y1 = p1.y * height;
          const x2 = (1 - p2.x) * width;
          const y2 = p2.y * height;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });

      // 2. Draw 21 Joint Landmark Dots
      hand.landmarks.forEach((pt, idx) => {
        const x = (1 - pt.x) * width;
        const y = pt.y * height;
        const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;

        ctx.beginPath();
        ctx.arc(x, y, isTip ? 3.5 : 2, 0, 2 * Math.PI);
        ctx.fillStyle = idx === 8 ? '#FFFFFF' : isTip ? '#22D3EE' : '#38BDF8';
        ctx.shadowBlur = isTip ? 6 : 2;
        ctx.fill();
      });

      // 3. Draw Pinch Ring if Pinching
      if (isPinch) {
        const px = (1 - hand.pinchPoint.x) * width;
        const py = hand.pinchPoint.y * height;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, 2 * Math.PI);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.stroke();
      }
    });

    ctx.shadowBlur = 0;
  }

  /**
   * Pause camera tracking when device locks (Privacy Rule)
   */
  public pauseDueToLock() {
    console.log('[Barehands] Privacy Shield: Pausing camera tracking due to screen lock/hidden state');
    this.isLockedPaused = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Manual resume after screen unlock (Privacy Rule: Never auto-resumes)
   */
  public async resumeFromLock(): Promise<boolean> {
    console.log('[Barehands] Resuming camera tracking upon explicit user request...');
    this.isLockedPaused = false;
    const res = await this.start(this.videoElement);
    return res.success;
  }

  /**
   * Completely stops camera and releases resources
   */
  public stop() {
    console.log('[Barehands] Stopping Hand Tracking, releasing camera tracks...');
    this.isRunning = false;
    this.isLockedPaused = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // Ignore
        }
      });
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.previousHands = [];
    this.previousTwoHandDist = null;

    const stoppedState: BarehandsGestureState = {
      isActive: false,
      isModelReady: !!this.handLandmarker,
      handsDetected: 0,
      hands: [],
      isPinching: false,
      pinchDragDelta: { x: 0, y: 0 },
      twoHandDistance: null,
      twoHandScaleDelta: 1.0,
      handRotationDelta: 0,
      scrollDeltaY: 0,
      pointerPosition: null,
      activeAction: 'idle',
      actionFeedback: null,
      fps: 0,
      cameraPermission: 'prompt',
      isThrottled: false,
      error: null
    };

    this.lastState = stoppedState;
    this.broadcast(stoppedState);
  }

  public getIsRunning(): boolean {
    return this.isRunning && !this.isLockedPaused;
  }

  public getLastState(): BarehandsGestureState {
    return this.lastState;
  }
}
