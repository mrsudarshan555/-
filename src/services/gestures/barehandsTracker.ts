import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { 
  BarehandsGestureState, 
  BarehandsTrackerOptions, 
  DetectedHand, 
  HandLandmark, 
  Handedness 
} from '../../types/gestures';
import { GestureDetector } from './gestureDetector';

const WASM_CDN_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_ASSET_PATH = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export class BarehandsTracker {
  private static instance: BarehandsTracker | null = null;

  private handLandmarker: HandLandmarker | null = null;
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private isInitializing: boolean = false;

  private previousHands: DetectedHand[] = [];
  private previousTwoHandDist: number | null = null;

  private lastFrameTimestamp: number = 0;
  private fpsCounter: number = 0;
  private lastFpsSampleTime: number = 0;
  private currentFps: number = 0;

  private options: Required<BarehandsTrackerOptions> = {
    maxHands: 2,
    targetFps: 18, // 15-20 FPS target for mobile thermal efficiency
    pinchThreshold: 0.38,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    cameraFacingMode: 'user'
  };

  private callback: ((state: BarehandsGestureState) => void) | null = null;

  public static getInstance(): BarehandsTracker {
    if (!this.instance) {
      this.instance = new BarehandsTracker();
    }
    return this.instance;
  }

  /**
   * Initializes MediaPipe HandLandmarker WebAssembly runtime
   */
  public async initializeModel(): Promise<boolean> {
    if (this.handLandmarker) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      console.log('[Barehands] Initializing MediaPipe HandLandmarker Wasm runtime...');
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

      console.log('[Barehands] HandLandmarker successfully loaded and ready.');
      this.isInitializing = false;
      return true;
    } catch (err) {
      console.warn('[Barehands] Failed loading HandLandmarker from primary CDN:', err);
      try {
        // Fallback with CPU delegate if GPU delegate failed
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN_PATH);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: this.options.maxHands
        });
        this.isInitializing = false;
        return true;
      } catch (fallbackErr) {
        console.error('[Barehands] HandLandmarker CPU fallback initialization failed:', fallbackErr);
        this.isInitializing = false;
        return false;
      }
    }
  }

  /**
   * Starts Hand Tracking with camera stream & frame throttling
   */
  public async start(
    videoEl: HTMLVideoElement | null | undefined,
    onUpdate: (state: BarehandsGestureState) => void,
    customOptions?: BarehandsTrackerOptions
  ): Promise<{ success: boolean; error?: string }> {
    if (this.isRunning) {
      this.callback = onUpdate;
      if (videoEl && this.mediaStream) {
        videoEl.srcObject = this.mediaStream;
        videoEl.playsInline = true;
        videoEl.muted = true;
        videoEl.play().catch(() => {});
      }
      return { success: true };
    }

    if (customOptions) {
      this.options = { ...this.options, ...customOptions };
    }

    this.callback = onUpdate;

    // Create or reuse internal video element if none provided
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

    // 1. Request Camera Permission ONLY when explicitly enabled
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[Barehands] getUserMedia is not supported in this environment/iframe context.');
        return { success: false, error: 'Camera API is not supported in this browser or iframe context.' };
      }

      console.log('[Barehands] Requesting camera stream with mobile-optimized constraints...');
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

      // 2. Initialize Model if not ready
      if (!this.handLandmarker) {
        const modelReady = await this.initializeModel();
        if (!modelReady) {
          this.stop();
          return { success: false, error: 'Failed to initialize Hand Tracking neural model.' };
        }
      }

      this.isRunning = true;
      this.lastFrameTimestamp = 0;
      this.lastFpsSampleTime = performance.now();
      this.fpsCounter = 0;

      // 3. Start Throttled Detection Loop
      this.scheduleNextFrame();

      console.log('[Barehands] Hand Tracking started successfully.');
      return { success: true };
    } catch (err: any) {
      console.warn('[Barehands] Camera stream acquisition skipped or denied:', err?.name || err?.message || err);
      let errMsg = 'Camera access was denied or is unavailable.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errMsg = 'Camera permission denied by user or iframe policy.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        errMsg = 'No front camera found on this device.';
      }
      return { success: false, error: errMsg };
    }
  }

  /**
   * Attaches active media stream to an overlay video element when mounted
   */
  public attachOverlayVideo(videoEl: HTMLVideoElement | null): void {
    if (videoEl && this.mediaStream) {
      videoEl.srcObject = this.mediaStream;
      videoEl.playsInline = true;
      videoEl.muted = true;
      videoEl.play().catch(() => {});
    }
  }

  /**
   * Main throttled processing frame
   */
  private processFrame = () => {
    if (!this.isRunning || !this.videoElement || !this.handLandmarker) return;

    const now = performance.now();
    const frameInterval = 1000 / this.options.targetFps; // ~55ms interval for 18 FPS

    // Throttling gate: Skip processing if frame came earlier than target interval
    if (now - this.lastFrameTimestamp >= frameInterval) {
      this.lastFrameTimestamp = now;
      this.fpsCounter++;

      // Update FPS calculation once per second
      if (now - this.lastFpsSampleTime >= 1000) {
        this.currentFps = Math.round((this.fpsCounter * 1000) / (now - this.lastFpsSampleTime));
        this.fpsCounter = 0;
        this.lastFpsSampleTime = now;
      }

      if (this.videoElement.readyState >= 2 && !this.videoElement.paused) {
        try {
          const results = this.handLandmarker.detectForVideo(this.videoElement, now);
          const detectedHands: DetectedHand[] = [];

          if (results.landmarks && results.landmarks.length > 0) {
            results.landmarks.forEach((landmarkArray, idx) => {
              const handednessStr = results.handednesses?.[idx]?.[0]?.categoryName || (idx === 0 ? 'Right' : 'Left');
              const handedness: Handedness = handednessStr.toLowerCase().includes('left') ? 'Left' : 'Right';
              const score = results.handednesses?.[idx]?.[0]?.score || 0.95;

              const analyzed = GestureDetector.analyzeHand(
                landmarkArray as HandLandmark[],
                handedness,
                score,
                this.options.pinchThreshold
              );
              detectedHands.push(analyzed);
            });
          }

          // Compute Gestures
          const primaryHand = detectedHands[0] || null;
          const prevPrimaryHand = this.previousHands[0] || null;

          // 1. Pinch Detection
          const isPinching = detectedHands.some((h) => h.isPinching);

          // 2. Pinch + Drag Delta
          const pinchDragDelta = primaryHand
            ? GestureDetector.computePinchDrag(primaryHand, prevPrimaryHand)
            : { x: 0, y: 0 };

          // 3. Two-Hand Scaling
          let twoHandDistance: number | null = null;
          let twoHandScaleDelta: number = 1.0;
          if (detectedHands.length >= 2) {
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
          const handRotationDelta = primaryHand
            ? GestureDetector.computeHandRotationDelta(primaryHand, prevPrimaryHand)
            : 0;

          // Save state for next delta computation
          this.previousHands = detectedHands;

          // Emit state update
          if (this.callback) {
            this.callback({
              isActive: true,
              isModelReady: true,
              handsDetected: detectedHands.length,
              hands: detectedHands,
              isPinching,
              pinchDragDelta,
              twoHandDistance,
              twoHandScaleDelta,
              handRotationDelta,
              fps: this.currentFps || this.options.targetFps,
              cameraPermission: 'granted',
              isThrottled: true,
              error: null
            });
          }
        } catch (detectionErr) {
          console.warn('[Barehands] Frame detection warning:', detectionErr);
        }
      }
    }

    if (this.isRunning) {
      this.scheduleNextFrame();
    }
  };

  private scheduleNextFrame() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.animFrameId = requestAnimationFrame(this.processFrame);
  }

  /**
   * Completely stops camera and terminates background processing to release CPU/GPU & battery
   */
  public stop() {
    console.log('[Barehands] Stopping Hand Tracking, releasing camera tracks & resetting GPU state...');
    this.isRunning = false;

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
      this.videoElement = null;
    }

    this.previousHands = [];
    this.previousTwoHandDist = null;

    if (this.callback) {
      this.callback({
        isActive: false,
        isModelReady: !!this.handLandmarker,
        handsDetected: 0,
        hands: [],
        isPinching: false,
        pinchDragDelta: { x: 0, y: 0 },
        twoHandDistance: null,
        twoHandScaleDelta: 1.0,
        handRotationDelta: 0,
        fps: 0,
        cameraPermission: 'prompt',
        isThrottled: false,
        error: null
      });
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}
