import { HandLandmark, DetectedHand, Handedness } from '../../types/gestures';

/**
 * Clean-room Gesture Analysis Engine
 * Calculates Pinch, Pinch-Drag, 2-Hand Scale, and 3D Model Rotation from raw landmark coordinates.
 */
export class GestureDetector {
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
        wristPosition: { x: 0.5, y: 0.5, z: 0 }
      };
    }

    const wrist = landmarks[0]; // Landmark 0: Wrist
    const thumbTip = landmarks[4]; // Landmark 4: Thumb tip
    const indexTip = landmarks[8]; // Landmark 8: Index tip
    const middleMcp = landmarks[9]; // Landmark 9: Middle MCP (knuckle)
    const pinkyMcp = landmarks[17]; // Landmark 17: Pinky MCP

    // Palm center estimation (midpoint of wrist and middle/pinky MCPs)
    const palmCenter = {
      x: (wrist.x + middleMcp.x + pinkyMcp.x) / 3,
      y: (wrist.y + middleMcp.y + pinkyMcp.y) / 3,
      z: ((wrist.z || 0) + (middleMcp.z || 0) + (pinkyMcp.z || 0)) / 3
    };

    // Baseline palm scale (wrist to middle MCP) for distance normalization
    const palmScale = Math.max(this.distance2D(wrist, middleMcp), 0.05);

    // Raw pinch distance between thumb tip and index tip
    const rawPinchDistance = this.distance2D(thumbTip, indexTip);
    const pinchRatio = rawPinchDistance / palmScale;

    // Pinch point (midpoint of thumb tip and index tip)
    const pinchPoint = {
      x: (thumbTip.x + indexTip.x) / 2,
      y: (thumbTip.y + indexTip.y) / 2
    };

    const isPinching = pinchRatio < pinchThresholdRatio || rawPinchDistance < 0.065;

    return {
      landmarks,
      handedness,
      score,
      isPinching,
      pinchDistance: rawPinchDistance,
      pinchPoint,
      palmCenter,
      wristPosition: { x: wrist.x, y: wrist.y, z: wrist.z || 0 }
    };
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

    // Normalized screen delta (inverted X for selfie camera mirroring)
    const deltaX = -(currentHand.pinchPoint.x - previousHand.pinchPoint.x);
    const deltaY = currentHand.pinchPoint.y - previousHand.pinchPoint.y;

    // Filter tiny jitter noise (< 0.002)
    const cleanDeltaX = Math.abs(deltaX) > 0.002 ? deltaX : 0;
    const cleanDeltaY = Math.abs(deltaY) > 0.002 ? deltaY : 0;

    return { x: cleanDeltaX, y: cleanDeltaY };
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

    // Convert normalized delta to degrees (e.g., 0.1 normalized delta -> 25-30 degrees)
    const rotationDegrees = deltaX * 280;
    return rotationDegrees;
  }
}
