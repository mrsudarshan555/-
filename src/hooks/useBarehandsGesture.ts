import { useState, useEffect, useRef, useCallback } from 'react';
import { BarehandsGestureState } from '../types/gestures';
import { BarehandsTracker } from '../services/gestures/barehandsTracker';
import { CharacterTransform } from '../types';

export const INITIAL_GESTURE_STATE: BarehandsGestureState = {
  isActive: false,
  isModelReady: false,
  handsDetected: 0,
  hands: [],
  isPinching: false,
  pinchDragDelta: { x: 0, y: 0 },
  twoHandDistance: null,
  twoHandScaleDelta: 1.0,
  handRotationDelta: 0,
  fps: 0,
  cameraPermission: 'prompt',
  isThrottled: true,
  error: null
};

interface UseBarehandsGestureOptions {
  onRotateModel?: (rotationDeltaDeg: number) => void;
  onScaleModel?: (scaleMultiplierDelta: number) => void;
  onPinchDrag?: (deltaX: number, deltaY: number) => void;
  characterLocked?: boolean;
}

export function useBarehandsGesture(options?: UseBarehandsGestureOptions) {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gestureState, setGestureState] = useState<BarehandsGestureState>(INITIAL_GESTURE_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const tracker = BarehandsTracker.getInstance();

  const handleGestureUpdate = useCallback(
    (state: BarehandsGestureState) => {
      setGestureState(state);

      if (options?.characterLocked) return;

      // 1. Hand-controlled rotation of the EXISTING Mayra 3D model
      if (state.handRotationDelta !== 0 && options?.onRotateModel) {
        options.onRotateModel(state.handRotationDelta);
      }

      // 2. Pinch + Drag
      if (state.isPinching && (state.pinchDragDelta.x !== 0 || state.pinchDragDelta.y !== 0)) {
        if (options?.onPinchDrag) {
          options.onPinchDrag(state.pinchDragDelta.x, state.pinchDragDelta.y);
        } else if (options?.onRotateModel) {
          // If no separate pinch drag, pinch drag drives rotation
          options.onRotateModel(state.pinchDragDelta.x * 120);
        }
      }

      // 3. Two-hand Scaling
      if (state.handsDetected >= 2 && state.twoHandScaleDelta !== 1.0 && options?.onScaleModel) {
        options.onScaleModel(state.twoHandScaleDelta);
      }

      // 4. Render minimal skeleton overlay to debug canvas if mounted
      if (canvasRef.current && state.hands.length > 0) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          state.hands.forEach((hand) => {
            const isPinch = hand.isPinching;

            // Draw Landmark Points
            hand.landmarks.forEach((pt, i) => {
              const x = (1 - pt.x) * canvas.width; // Mirrored for front camera
              const y = pt.y * canvas.height;

              ctx.beginPath();
              ctx.arc(x, y, i === 4 || i === 8 ? 4 : 2, 0, 2 * Math.PI);
              ctx.fillStyle = isPinch ? '#f59e0b' : '#06b6d4';
              ctx.fill();
            });

            // Draw Pinch Ring if Pinching
            if (isPinch) {
              const px = (1 - hand.pinchPoint.x) * canvas.width;
              const py = hand.pinchPoint.y * canvas.height;
              ctx.beginPath();
              ctx.arc(px, py, 14, 0, 2 * Math.PI);
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });
        }
      } else if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    },
    [options]
  );

  const enableTracking = useCallback(async () => {
    setErrorMessage(null);
    setIsLoading(true);
    setIsEnabled(true);
    try {
      const result = await tracker.start(videoRef.current, handleGestureUpdate);
      setIsLoading(false);
      if (result.success) {
        if (videoRef.current) {
          tracker.attachOverlayVideo(videoRef.current);
        }
        return true;
      } else {
        setIsEnabled(false);
        setErrorMessage(result.error || 'Failed to start Hand Tracking.');
        return false;
      }
    } catch (e: any) {
      setIsLoading(false);
      setIsEnabled(false);
      setErrorMessage('Camera access failed. Please grant camera permission.');
      return false;
    }
  }, [tracker, handleGestureUpdate]);

  const disableTracking = useCallback(() => {
    tracker.stop();
    setIsEnabled(false);
    setIsLoading(false);
    setErrorMessage(null);
    setGestureState(INITIAL_GESTURE_STATE);
  }, [tracker]);

  const toggleTracking = useCallback(() => {
    if (isEnabled || isLoading) {
      disableTracking();
    } else {
      enableTracking();
    }
  }, [isEnabled, isLoading, enableTracking, disableTracking]);

  // When overlay mounts, attach the video element to the active stream
  useEffect(() => {
    if (isEnabled && videoRef.current) {
      tracker.attachOverlayVideo(videoRef.current);
    }
  }, [isEnabled, tracker]);

  // Pause camera when document is hidden (backgrounded) to conserve battery on mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isEnabled) {
        console.log('[Barehands] Tab backgrounded, temporarily pausing camera stream...');
        tracker.stop();
      } else if (!document.hidden && isEnabled) {
        console.log('[Barehands] Tab foregrounded, resuming camera stream...');
        tracker.start(videoRef.current, handleGestureUpdate).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, tracker, handleGestureUpdate]);

  // Clean up completely on unmount
  useEffect(() => {
    return () => {
      tracker.stop();
    };
  }, [tracker]);

  return {
    isEnabled,
    isLoading,
    gestureState,
    errorMessage,
    videoRef,
    canvasRef,
    enableTracking,
    disableTracking,
    toggleTracking
  };
}
