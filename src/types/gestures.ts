/**
 * Types for Barehands-style Hand Tracking & Gesture Recognition
 */

export interface HandLandmark {
  x: number; // Normalized [0, 1]
  y: number; // Normalized [0, 1]
  z: number; // Depth relative to wrist
}

export type Handedness = 'Left' | 'Right';

export interface DetectedHand {
  landmarks: HandLandmark[];
  handedness: Handedness;
  score: number;
  // Computed gesture metrics
  isPinching: boolean;
  pinchDistance: number;
  pinchPoint: { x: number; y: number };
  palmCenter: { x: number; y: number; z: number };
  wristPosition: { x: number; y: number; z: number };
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
  // Runtime Telemetry & Power States
  fps: number;
  cameraPermission: 'prompt' | 'granted' | 'denied' | 'unavailable';
  isThrottled: boolean;
  error: string | null;
}

export interface BarehandsTrackerOptions {
  maxHands?: number;
  targetFps?: number; // Default 15-20 FPS for mobile thermal conservation
  pinchThreshold?: number; // Normalized distance threshold
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  cameraFacingMode?: 'user' | 'environment';
}
