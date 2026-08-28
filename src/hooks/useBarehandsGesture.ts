import { useState, useEffect, useRef, useCallback } from 'react';
import { BarehandsGestureState } from '../types/gestures';
import { BarehandsTracker } from '../services/gestures/barehandsTracker';

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
  scrollDeltaY: 0,
  pointerPosition: null,
  activeAction: 'idle',
  actionFeedback: null,
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

      // 1. Hand-controlled rotation of the 3D model
      if (state.handRotationDelta !== 0 && options?.onRotateModel) {
        options.onRotateModel(state.handRotationDelta);
      }

      // 2. Pinch + Drag
      if (state.isPinching && (state.pinchDragDelta.x !== 0 || state.pinchDragDelta.y !== 0)) {
        if (options?.onPinchDrag) {
          options.onPinchDrag(state.pinchDragDelta.x, state.pinchDragDelta.y);
        } else if (options?.onRotateModel) {
          options.onRotateModel(state.pinchDragDelta.x * 120);
        }
      }

      // 3. Two-hand Scaling
      if (state.handsDetected >= 2 && state.twoHandScaleDelta !== 1.0 && options?.onScaleModel) {
        options.onScaleModel(state.twoHandScaleDelta);
      }

      // 4. Render 21 MediaPipe Skeleton on HUD canvas
      if (canvasRef.current && state.hands.length > 0) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          BarehandsTracker.drawSkeletonOnCanvas(ctx, canvas.width, canvas.height, state.hands, state.activeAction);
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

  // Subscribe to tracker updates
  useEffect(() => {
    const unsubscribe = tracker.subscribe(handleGestureUpdate);
    return () => {
      unsubscribe();
    };
  }, [tracker, handleGestureUpdate]);

  // When overlay mounts, attach video element
  useEffect(() => {
    if (isEnabled && videoRef.current) {
      tracker.attachOverlayVideo(videoRef.current);
    }
  }, [isEnabled, tracker]);

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
