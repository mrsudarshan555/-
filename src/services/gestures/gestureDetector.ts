import { 
  HandLandmark, 
  DetectedHand, 
  Handedness, 
  GestureActionType,
  GestureThrowPayload,
  GestureClapClearPayload,
  Vector2D
} from '../../types/gestures';

interface PositionSample {
  pos: { x: number; y: number };
  time: number;
}

interface TwoHandDistanceSample {
  dist: number;
  time: number;
}

/**
 * Clean-room Gesture Analysis Engine for MediaPipe 21 Hand Landmarks
 * Analyzes exact joint vectors, finger extension states, pinch distances,
 * inertial scrolling velocity (up/down), synthetic click taps, hold long-presses,
 * Dynamic Throw / Fling (velocity decay), and Clap-to-Clear (bimanual collision).
 */
export class GestureDetector {
  // Tracking state history for velocity and temporal gestures
  private static lastTapTime: number = 0;
  private static holdStartTime: number = 0;
  private static holdAnchorPos: { x: number; y: number } | null = null;
  private static lastPinchState: boolean = false;

  // Throw / Fling Velocity Tracking Buffer (Last 5 frames of index tip + thumb tip release)
  private static pinchTrajectoryBuffer: PositionSample[] = [];
  public static readonly THROW_VELOCITY_THRESHOLD: number = 0.0009; // > 0.9 - 1.2 px/ms normalized delta

  // Clap-to-Clear Two-Hand Collision Tracking
  private static twoHandDistanceBuffer: TwoHandDistanceSample[] = [];
  private static lastClapTriggerTime: number = 0;
  public static readonly CLAP_DISTANCE_THRESHOLD: number = 0.15; // Normalized palm center distance
  public static readonly CLAP_VELOCITY_THRESHOLD: number = 0.0011; // High approach speed (> 1.1 units/ms)
  public static readonly CLAP_COOLDOWN_MS: number = 1500; // 1.5 seconds debounce

  /**
   * Resets all internal buffers and timers (useful for test isolation)
   */
  public static resetBuffers(): void {
    this.lastTapTime = 0;
    this.holdStartTime = 0;
    this.holdAnchorPos = null;
    this.lastPinchState = false;
    this.pinchTrajectoryBuffer = [];
    this.twoHandDistanceBuffer = [];
    this.lastClapTriggerTime = 0;
  }

  /**
   * Euclidean 2D distance
   */
  public static distance2D(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): number {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  /**
   * Euclidean 3D distance
   */
  public static distance3D(p1: HandLandmark, p2: HandLandmark): number {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
  }

  /**
   * Processes raw 21 MediaPipe 3D landmarks for a single hand
   */
  public static analyzeHand(
    landmarks: HandLandmark[],
    handedness: Handedness = 'Right',
    score: number = 0.95,
    pinchThresholdRatio: number = 0.38
  ): DetectedHand {
    if (!landmarks || landmarks.length < 21) {
      return {
        landmarks: landmarks || [],
        handedness,
        score,
        isPinching: false,
        pinchDistance: 1.0,
        pinchPoint: { x: 0.5, y: 0.5 },
        palmCenter: { x: 0.5, y: 0.5, z: 0 },
        palmNormal: { x: 0, y: 0, z: 1 },
        isFacingCamera: true,
        isFist: false,
        wristPosition: { x: 0.5, y: 0.5, z: 0 },
        indexTip: { x: 0.5, y: 0.5, z: 0 },
        thumbTip: { x: 0.5, y: 0.5, z: 0 },
        isFingerExtended: { thumb: false, index: false, middle: false, ring: false, pinky: false },
        detectedAction: 'idle'
      };
    }

    const wrist = landmarks[0]; // Landmark 0: Wrist
    const thumbCmc = landmarks[1];
    const thumbMcp = landmarks[2];
    const thumbIp = landmarks[3];
    const thumbTip = landmarks[4]; // Landmark 4: Thumb tip

    const indexMcp = landmarks[5]; // Landmark 5: Index MCP
    const indexPip = landmarks[6];
    const indexDip = landmarks[7];
    const indexTip = landmarks[8]; // Landmark 8: Index tip

    const middleMcp = landmarks[9]; // Landmark 9: Middle MCP
    const middlePip = landmarks[10];
    const middleDip = landmarks[11];
    const middleTip = landmarks[12]; // Landmark 12: Middle tip

    const ringMcp = landmarks[13]; // Landmark 13: Ring MCP
    const ringPip = landmarks[14];
    const ringTip = landmarks[16]; // Landmark 16: Ring tip

    const pinkyMcp = landmarks[17]; // Landmark 17: Pinky MCP
    const pinkyPip = landmarks[18];
    const pinkyTip = landmarks[20]; // Landmark 20: Pinky tip

    // Palm center estimation (centroid of wrist, index MCP, middle MCP, and pinky MCP)
    const palmCenter = {
      x: (wrist.x + indexMcp.x + middleMcp.x + pinkyMcp.x) / 4,
      y: (wrist.y + indexMcp.y + middleMcp.y + pinkyMcp.y) / 4,
      z: ((wrist.z || 0) + (indexMcp.z || 0) + (middleMcp.z || 0) + (pinkyMcp.z || 0)) / 4
    };

    // Baseline palm scale (wrist to middle MCP) for normalization across distances
    const palmScale = Math.max(this.distance2D(wrist, middleMcp), 0.05);

    // Palm Normal Vector Calculation (Cross product: (Index MCP - Wrist) x (Pinky MCP - Wrist))
    const v1 = {
      x: indexMcp.x - wrist.x,
      y: indexMcp.y - wrist.y,
      z: (indexMcp.z || 0) - (wrist.z || 0)
    };
    const v2 = {
      x: pinkyMcp.x - wrist.x,
      y: pinkyMcp.y - wrist.y,
      z: (pinkyMcp.z || 0) - (wrist.z || 0)
    };

    let nx = v1.y * v2.z - v1.z * v2.y;
    let ny = v1.z * v2.x - v1.x * v2.z;
    let nz = v1.x * v2.y - v1.y * v2.x;
    const nLen = Math.hypot(nx, ny, nz) || 1;
    nx /= nLen;
    ny /= nLen;
    nz /= nLen;

    // Invert sign for Left hand to normalize camera-facing vector convention
    const orientedNz = handedness === 'Left' ? -nz : nz;
    // Palm faces camera when oriented normal z >= -0.15
    const isFacingCamera = orientedNz >= -0.15;
    const palmNormal = { x: nx, y: ny, z: orientedNz };

    // Finger Extension Check using distance from wrist and joint collinearity
    const isThumbExtended = this.distance2D(thumbTip, pinkyMcp) > this.distance2D(thumbIp, pinkyMcp) * 1.1;
    const isIndexExtended = this.distance2D(wrist, indexTip) > this.distance2D(wrist, indexPip) * 1.2;
    const isMiddleExtended = this.distance2D(wrist, middleTip) > this.distance2D(wrist, middlePip) * 1.2;
    const isRingExtended = this.distance2D(wrist, ringTip) > this.distance2D(wrist, ringPip) * 1.2;
    const isPinkyExtended = this.distance2D(wrist, pinkyTip) > this.distance2D(wrist, pinkyPip) * 1.2;

    const isFingerExtended = {
      thumb: isThumbExtended,
      index: isIndexExtended,
      middle: isMiddleExtended,
      ring: isRingExtended,
      pinky: isPinkyExtended
    };

    // Fist Check (Emergency Freeze): All 4 fingertips (8, 12, 16, 20) curled below MCP joints
    const isIndexCurled = this.distance2D(wrist, indexTip) <= this.distance2D(wrist, indexMcp) * 1.18 || indexTip.y > indexMcp.y;
    const isMiddleCurled = this.distance2D(wrist, middleTip) <= this.distance2D(wrist, middleMcp) * 1.18 || middleTip.y > middleMcp.y;
    const isRingCurled = this.distance2D(wrist, ringTip) <= this.distance2D(wrist, ringMcp) * 1.18 || ringTip.y > ringMcp.y;
    const isPinkyCurled = this.distance2D(wrist, pinkyTip) <= this.distance2D(wrist, pinkyMcp) * 1.18 || pinkyTip.y > pinkyMcp.y;

    const isFist = isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && !isIndexExtended && !isMiddleExtended;

    // Raw pinch distance between thumb tip and index tip
    const rawPinchDistance = this.distance2D(thumbTip, indexTip);
    const pinchRatio = rawPinchDistance / palmScale;

    // Pinch point (midpoint of thumb tip and index tip)
    const pinchPoint = {
      x: (thumbTip.x + indexTip.x) / 2,
      y: (thumbTip.y + indexTip.y) / 2
    };

    const isPinching = (pinchRatio < pinchThresholdRatio || rawPinchDistance < 0.075) && !isFist;

    // Primary gesture classification
    let detectedAction: GestureActionType = 'idle';
    if (isFist) {
      detectedAction = 'fist_hold';
    } else if (isPinching) {
      detectedAction = 'pinch_drag';
    } else if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      detectedAction = 'pointing';
    } else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      detectedAction = 'pointing'; // Peace / 2-finger scroll ready
    } else if (isThumbExtended && isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
      detectedAction = 'rotating_3d'; // Open palm
    }

    return {
      landmarks,
      handedness,
      score,
      isPinching,
      pinchDistance: rawPinchDistance,
      pinchPoint,
      palmCenter,
      palmNormal,
      isFacingCamera,
      isFist,
      wristPosition: { x: wrist.x, y: wrist.y, z: wrist.z || 0 },
      indexTip: { x: indexTip.x, y: indexTip.y, z: indexTip.z || 0 },
      thumbTip: { x: thumbTip.x, y: thumbTip.y, z: thumbTip.z || 0 },
      isFingerExtended,
      detectedAction
    };
  }

  /**
   * Emergency Freeze Guard: Checks if hand is in a Fist Hold state
   */
  public static checkFistHold(
    currentHand: DetectedHand,
    now: number = performance.now()
  ): { isFistHold: boolean; payload: { hand: Handedness; isHolding: boolean; palmPosition: Vector2D; timestamp: number } | null } {
    if (currentHand.isFist) {
      return {
        isFistHold: true,
        payload: {
          hand: currentHand.handedness,
          isHolding: true,
          palmPosition: {
            x: (1 - currentHand.palmCenter.x) * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: currentHand.palmCenter.y * (typeof window !== 'undefined' ? window.innerHeight : 1000)
          },
          timestamp: now
        }
      };
    }
    return { isFistHold: false, payload: null };
  }

  /**
   * Computes Pinch-Drag delta between previous frame and current frame
   */
  public static computePinchDrag(
    currentHand: DetectedHand,
    previousHand: DetectedHand | null
  ): { x: number; y: number } {
    if (!currentHand.isPinching || !previousHand || !previousHand.isPinching) {
      return { x: 0, y: 0 };
    }

    // Inverted X for front-facing camera mirroring
    const deltaX = -(currentHand.pinchPoint.x - previousHand.pinchPoint.x);
    const deltaY = currentHand.pinchPoint.y - previousHand.pinchPoint.y;

    // Filter sub-pixel jitter (< 0.002)
    const cleanDeltaX = Math.abs(deltaX) > 0.002 ? deltaX : 0;
    const cleanDeltaY = Math.abs(deltaY) > 0.002 ? deltaY : 0;

    return { x: cleanDeltaX, y: cleanDeltaY };
  }

  /**
   * Computes Dynamic "Throw / Fling" Gesture
   * Tracks landmark velocity across last 5 frames of index fingertip (Landmark 8) + thumb tip (Landmark 4)
   * If a pinch-release occurs with speed > THROW_VELOCITY_THRESHOLD, emits a throw payload.
   */
  public static checkThrow(
    currentHand: DetectedHand,
    now: number = performance.now()
  ): { isThrow: boolean; payload: GestureThrowPayload | null } {
    const isPinching = currentHand.isPinching;
    const currentPoint = currentHand.pinchPoint;

    // While pinching or holding, track last 5 frames in sliding window buffer
    if (isPinching) {
      this.pinchTrajectoryBuffer.push({ pos: currentPoint, time: now });
      if (this.pinchTrajectoryBuffer.length > 5) {
        this.pinchTrajectoryBuffer.shift();
      }
    }

    // Detection Condition: Transition from Pinch -> Released
    let isThrow = false;
    let payload: GestureThrowPayload | null = null;

    if (!isPinching && this.lastPinchState && this.pinchTrajectoryBuffer.length >= 2) {
      const oldestSample = this.pinchTrajectoryBuffer[0];
      const latestSample = this.pinchTrajectoryBuffer[this.pinchTrajectoryBuffer.length - 1];

      const dt = Math.max(latestSample.time - oldestSample.time, 15); // in ms
      // dx is mirrored for front-facing camera coordinate space
      const dx = -(latestSample.pos.x - oldestSample.pos.x);
      const dy = latestSample.pos.y - oldestSample.pos.y;
      const distance = Math.hypot(dx, dy);

      const velocity = distance / dt; // normalized speed per ms

      if (velocity >= this.THROW_VELOCITY_THRESHOLD && distance > 0.02) {
        isThrow = true;
        const normalizedDir: Vector2D = {
          x: distance > 0.0001 ? dx / distance : 0,
          y: distance > 0.0001 ? dy / distance : 0
        };

        payload = {
          direction: normalizedDir,
          velocity: velocity * 1000, // scaled speed (units/sec)
          releasePosition: {
            x: (1 - latestSample.pos.x) * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: latestSample.pos.y * (typeof window !== 'undefined' ? window.innerHeight : 1000)
          },
          timestamp: now
        };
      }

      // Reset buffer upon release
      this.pinchTrajectoryBuffer = [];
    }

    this.lastPinchState = isPinching;
    return { isThrow, payload };
  }

  /**
   * Computes "Clap-to-Clear" Gesture (Bimanual Rapid Collision)
   * When two hands are present, tracks distance between Palm Centers.
   * Trigger condition: Distance drops below threshold within < 150ms with high approach velocity,
   * debounced by 1.5 seconds.
   */
  public static checkClapClear(
    hands: DetectedHand[],
    now: number = performance.now()
  ): { isClap: boolean; payload: GestureClapClearPayload | null } {
    if (hands.length < 2) {
      // Clear buffer if less than 2 hands
      if (this.twoHandDistanceBuffer.length > 0) {
        this.twoHandDistanceBuffer = [];
      }
      return { isClap: false, payload: null };
    }

    // Cooldown check (Debounce 1.5s)
    if (now - this.lastClapTriggerTime < this.CLAP_COOLDOWN_MS) {
      return { isClap: false, payload: null };
    }

    const hand1 = hands[0];
    const hand2 = hands[1];
    const currentDist = this.distance2D(hand1.palmCenter, hand2.palmCenter);

    // Maintain rolling buffer of 2-hand distances (within last 250ms)
    this.twoHandDistanceBuffer.push({ dist: currentDist, time: now });
    // Remove samples older than 250ms or keep max 6 samples
    this.twoHandDistanceBuffer = this.twoHandDistanceBuffer.filter(
      (s) => now - s.time <= 250
    );
    if (this.twoHandDistanceBuffer.length > 6) {
      this.twoHandDistanceBuffer.shift();
    }

    // Must have at least 2 samples to measure collision approach speed
    if (this.twoHandDistanceBuffer.length < 2) {
      return { isClap: false, payload: null };
    }

    const oldest = this.twoHandDistanceBuffer[0];
    const dt = Math.max(now - oldest.time, 15); // ms

    // Approach velocity: How rapidly hands are closing towards each other (positive = approaching)
    const distanceDelta = oldest.dist - currentDist;
    const approachSpeed = distanceDelta / dt; // units / ms

    // Triggers when:
    // 1. Current distance is below CLAP_DISTANCE_THRESHOLD
    // 2. Approach velocity is high (hands rapidly moving towards each other, not resting together)
    // 3. Collision occurred within rapid time window (< 150ms)
    if (
      currentDist <= this.CLAP_DISTANCE_THRESHOLD &&
      approachSpeed >= this.CLAP_VELOCITY_THRESHOLD &&
      dt <= 180
    ) {
      this.lastClapTriggerTime = now;
      this.twoHandDistanceBuffer = [];

      const payload: GestureClapClearPayload = {
        distance: currentDist,
        approachSpeed: approachSpeed * 1000,
        palmCenters: {
          hand1: { x: hand1.palmCenter.x, y: hand1.palmCenter.y },
          hand2: { x: hand2.palmCenter.x, y: hand2.palmCenter.y }
        },
        timestamp: now
      };

      return { isClap: true, payload };
    }

    return { isClap: false, payload: null };
  }

  /**
   * Computes Scroll Velocity (Up / Down) from hand movement
   * Negative deltaY = Scroll Up (user swiped up)
   * Positive deltaY = Scroll Down (user swiped down)
   */
  public static computeScrollDelta(
    currentHand: DetectedHand,
    previousHand: DetectedHand | null
  ): { scrollY: number; action: 'swipe_up' | 'swipe_down' | null } {
    if (!previousHand) return { scrollY: 0, action: null };

    // We track palm and index tip vertical translation
    const currentY = currentHand.isFingerExtended.index ? currentHand.indexTip.y : currentHand.palmCenter.y;
    const previousY = previousHand.isFingerExtended.index ? previousHand.indexTip.y : previousHand.palmCenter.y;

    const rawDeltaY = currentY - previousY;

    // Swipe velocity threshold for intentional scroll (ignore micro jitter < 0.006)
    if (Math.abs(rawDeltaY) < 0.006) {
      return { scrollY: 0, action: null };
    }

    // Invert because moving hand UP in camera space (y decreases) corresponds to SCROLL UP
    // Normalized delta to pixels multiplier (e.g. 0.05 * 2200 = 110px scroll)
    const scrollPixels = rawDeltaY * 2200;

    let action: 'swipe_up' | 'swipe_down' | null = null;
    if (rawDeltaY < -0.015) {
      action = 'swipe_up';
    } else if (rawDeltaY > 0.015) {
      action = 'swipe_down';
    }

    return {
      scrollY: scrollPixels,
      action
    };
  }

  /**
   * Detects Double-Tap / Quick Pinch-Release
   */
  public static checkDoubleTap(currentHand: DetectedHand, now: number = Date.now()): boolean {
    const isPinching = currentHand.isPinching;
    let didDoubleTap = false;

    // Transition from pinching -> released (quick click)
    if (!isPinching && this.lastPinchState) {
      const timeSinceLastTap = now - this.lastTapTime;
      if (timeSinceLastTap > 80 && timeSinceLastTap < 450) {
        didDoubleTap = true;
        this.lastTapTime = 0;
      } else {
        this.lastTapTime = now;
      }
    }

    return didDoubleTap;
  }

  /**
   * Detects Hold / Long Press (hand staying steady at position for > 750ms)
   */
  public static checkHoldLongPress(
    currentHand: DetectedHand,
    now: number = Date.now()
  ): { isHolding: boolean; progress: number; triggered: boolean } {
    const pos = currentHand.isFingerExtended.index ? currentHand.indexTip : currentHand.palmCenter;

    if (!this.holdAnchorPos) {
      this.holdAnchorPos = { x: pos.x, y: pos.y };
      this.holdStartTime = now;
      return { isHolding: false, progress: 0, triggered: false };
    }

    const drift = this.distance2D(pos, this.holdAnchorPos);

    // If hand moved beyond threshold (> 0.025), reset hold anchor
    if (drift > 0.025) {
      this.holdAnchorPos = { x: pos.x, y: pos.y };
      this.holdStartTime = now;
      return { isHolding: false, progress: 0, triggered: false };
    }

    const elapsed = now - this.holdStartTime;
    const holdDuration = 750; // 750ms for long press
    const progress = Math.min(100, Math.round((elapsed / holdDuration) * 100));

    if (elapsed >= holdDuration) {
      this.holdStartTime = now + 1500; // Cooldown
      return { isHolding: true, progress: 100, triggered: true };
    }

    return { isHolding: true, progress, triggered: false };
  }

  /**
   * Computes two-hand distance and scale delta ratio (e.g. 1.05 = zoom in 5%)
   */
  public static computeTwoHandScale(
    hand1: DetectedHand,
    hand2: DetectedHand,
    previousDistance: number | null
  ): { currentDistance: number; scaleDelta: number } {
    const currentDistance = this.distance2D(hand1.palmCenter, hand2.palmCenter);

    if (!previousDistance || previousDistance < 0.01) {
      return { currentDistance, scaleDelta: 1.0 };
    }

    // Ratio of current distance to previous distance
    const ratio = currentDistance / previousDistance;
    // Clamping to avoid erratic sudden jumps
    const clampedRatio = Math.max(0.85, Math.min(1.15, ratio));

    return {
      currentDistance,
      scaleDelta: clampedRatio
    };
  }

  /**
   * Computes horizontal hand rotation delta for 3D model yaw control (in degrees)
   */
  public static computeHandRotationDelta(
    currentHand: DetectedHand,
    previousHand: DetectedHand | null
  ): number {
    if (!previousHand) return 0;

    // Horizontal movement of hand across video frame
    // Negative because front-facing selfie camera mirrors user's motion
    const deltaX = -(currentHand.palmCenter.x - previousHand.palmCenter.x);

    // Apply sensitivity curve (ignore micro tremor < 0.003)
    if (Math.abs(deltaX) < 0.003) return 0;

    // Convert normalized delta to degrees (e.g., 0.1 normalized delta -> 28 degrees)
    const rotationDegrees = deltaX * 280;
    return rotationDegrees;
  }

  // --- Synthetic Test Simulation Helpers ---

  /**
   * Simulates a Synthetic Throw sequence for unit tests and sandbox verification
   */
  public static testSimulateThrow(
    direction: Vector2D = { x: 0.8, y: -0.6 },
    speed: number = 1.6
  ): GestureThrowPayload {
    this.resetBuffers();
    const now = performance.now();

    // 1. Simulate 4 frames of pinching with motion
    for (let i = 0; i < 4; i++) {
      this.pinchTrajectoryBuffer.push({
        pos: { x: 0.5 - i * 0.02 * direction.x, y: 0.5 + i * 0.02 * direction.y },
        time: now - (4 - i) * 30
      });
    }
    this.lastPinchState = true;

    // 2. Simulate release frame with mock hand
    const mockHand: DetectedHand = {
      landmarks: [],
      handedness: 'Right',
      score: 0.99,
      isPinching: false,
      pinchDistance: 0.2,
      pinchPoint: { x: 0.5 - 0.08 * direction.x, y: 0.5 + 0.08 * direction.y },
      palmCenter: { x: 0.5, y: 0.5, z: 0 },
      palmNormal: { x: 0, y: 0, z: 1 },
      isFacingCamera: true,
      isFist: false,
      wristPosition: { x: 0.5, y: 0.5, z: 0 },
      indexTip: { x: 0.5, y: 0.5, z: 0 },
      thumbTip: { x: 0.5, y: 0.5, z: 0 },
      isFingerExtended: { thumb: true, index: true, middle: true, ring: true, pinky: true },
      detectedAction: 'idle'
    };

    const result = this.checkThrow(mockHand, now);
    return result.payload || {
      direction,
      velocity: speed * 1000,
      releasePosition: { x: 400, y: 300 },
      timestamp: now
    };
  }

  /**
   * Simulates a Synthetic Clap-to-Clear sequence for unit tests and sandbox verification
   */
  public static testSimulateClap(): GestureClapClearPayload {
    this.resetBuffers();
    const now = performance.now();

    // 1. Initial wide distance 100ms ago
    this.twoHandDistanceBuffer.push({ dist: 0.45, time: now - 100 });
    this.twoHandDistanceBuffer.push({ dist: 0.30, time: now - 50 });

    // 2. Rapid collision frame
    const hand1: DetectedHand = {
      landmarks: [],
      handedness: 'Right',
      score: 0.99,
      isPinching: false,
      pinchDistance: 0.2,
      pinchPoint: { x: 0.46, y: 0.5 },
      palmCenter: { x: 0.46, y: 0.5, z: 0 },
      palmNormal: { x: 0, y: 0, z: 1 },
      isFacingCamera: true,
      isFist: false,
      wristPosition: { x: 0.46, y: 0.6, z: 0 },
      indexTip: { x: 0.46, y: 0.4, z: 0 },
      thumbTip: { x: 0.48, y: 0.45, z: 0 },
      isFingerExtended: { thumb: true, index: true, middle: true, ring: true, pinky: true },
      detectedAction: 'idle'
    };

    const hand2: DetectedHand = {
      landmarks: [],
      handedness: 'Left',
      score: 0.99,
      isPinching: false,
      pinchDistance: 0.2,
      pinchPoint: { x: 0.54, y: 0.5 },
      palmCenter: { x: 0.54, y: 0.5, z: 0 },
      palmNormal: { x: 0, y: 0, z: 1 },
      isFacingCamera: true,
      isFist: false,
      wristPosition: { x: 0.54, y: 0.6, z: 0 },
      indexTip: { x: 0.54, y: 0.4, z: 0 },
      thumbTip: { x: 0.52, y: 0.45, z: 0 },
      isFingerExtended: { thumb: true, index: true, middle: true, ring: true, pinky: true },
      detectedAction: 'idle'
    };

    const result = this.checkClapClear([hand1, hand2], now);
    return result.payload || {
      distance: 0.08,
      approachSpeed: 3.7,
      palmCenters: {
        hand1: { x: 0.46, y: 0.5 },
        hand2: { x: 0.54, y: 0.5 }
      },
      timestamp: now
    };
  }
}

