/**
 * Types for Barehands-style MediaPipe Hand Tracking & Gesture Recognition
 */

export interface HandLandmark {
  x: number; // Normalized [0, 1]
  y: number; // Normalized [0, 1]
  z: number; // Depth relative to wrist
}

export type Handedness = 'Left' | 'Right';

export type GestureActionType = 
  | 'idle'
  | 'pointing'
  | 'double_tap'
  | 'pinch_drag'
  | 'swipe_up'
  | 'swipe_down'
  | 'hold_long_press'
  | 'two_hand_zoom'
  | 'rotating_3d'
  | 'throw'
  | 'clap_clear'
  | 'fist_hold';

export interface Vector2D {
  x: number;
  y: number;
}

export interface GestureThrowPayload {
  direction: Vector2D;
  velocity: number; // Normalized speed (units/ms or px/ms)
  targetId?: string;
  releasePosition: Vector2D;
  timestamp: number;
}

export interface GestureClapClearPayload {
  distance: number;
  approachSpeed: number;
  palmCenters: {
    hand1: Vector2D;
    hand2: Vector2D;
  };
  timestamp: number;
}

export interface GestureFistHoldPayload {
  hand: Handedness;
  isHolding: boolean;
  palmPosition: Vector2D;
  timestamp: number;
}

export type GestureEventType = 
  | 'GESTURE_THROW'
  | 'GESTURE_CLAP_CLEAR'
  | 'GESTURE_FIST_HOLD'
  | 'GESTURE_DOUBLE_TAP'
  | 'GESTURE_SWIPE_SCROLL'
  | 'GESTURE_HOLD'
  | 'GESTURE_ZOOM';

export interface GestureEventMap {
  GESTURE_THROW: GestureThrowPayload;
  GESTURE_CLAP_CLEAR: GestureClapClearPayload;
  GESTURE_FIST_HOLD: GestureFistHoldPayload;
  GESTURE_DOUBLE_TAP: { x: number; y: number; timestamp: number };
  GESTURE_SWIPE_SCROLL: { deltaY: number; isUp: boolean; timestamp: number };
  GESTURE_HOLD: { x: number; y: number; timestamp: number };
  GESTURE_ZOOM: { scaleMultiplier: number; timestamp: number };
}

export interface DetectedHand {
  landmarks: HandLandmark[];
  handedness: Handedness;
  score: number;
  // Computed gesture metrics
  isPinching: boolean;
  pinchDistance: number;
  pinchPoint: { x: number; y: number };
  palmCenter: { x: number; y: number; z: number };
  palmNormal: { x: number; y: number; z: number };
  isFacingCamera: boolean;
  isFist: boolean;
  wristPosition: { x: number; y: number; z: number };
  indexTip: { x: number; y: number; z: number };
  thumbTip: { x: number; y: number; z: number };
  isFingerExtended: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  detectedAction: GestureActionType;
}

export interface BarehandsGestureState {
  isActive: boolean;
  isModelReady: boolean;
  handsDetected: number;
  hands: DetectedHand[];
  // Active Gestures
  isPinching: boolean;
  pinchDragDelta: { x: number; y: number };
  twoHandDistance: number | null;
  twoHandScaleDelta: number;
  handRotationDelta: number;
  scrollDeltaY: number; // Positive = scroll down, Negative = scroll up
  pointerPosition: { x: number; y: number } | null;
  activeAction: GestureActionType;
  actionFeedback: string | null;
  // Runtime Telemetry & Power States
  fps: number;
  cameraPermission: 'prompt' | 'granted' | 'denied' | 'unavailable';
  isThrottled: boolean;
  error: string | null;
}

export interface BarehandsTrackerOptions {
  maxHands?: number;
  targetFps?: number; // Default 18-22 FPS for mobile thermal conservation
  pinchThreshold?: number; // Normalized distance threshold
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  cameraFacingMode?: 'user' | 'environment';
}

/**
 * Standard MediaPipe 21 Hand Landmark Bones & Connections
 */
export const HAND_CONNECTIONS: [number, number][] = [
  // Palm Base
  [0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17],
  // Thumb
  [1, 2], [2, 3], [3, 4],
  // Index Finger
  [5, 6], [6, 7], [7, 8],
  // Middle Finger
  [9, 10], [10, 11], [11, 12],
  // Ring Finger
  [13, 14], [14, 15], [15, 16],
  // Pinky Finger
  [17, 18], [18, 19], [19, 20]
];
