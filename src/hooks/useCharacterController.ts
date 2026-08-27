import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AssistantStatus, CharacterTransform, CharacterLockState, CharacterModelMetadata } from '../types';

export const DEFAULT_TRANSFORM: CharacterTransform = {
  rotationY: 0,
  pitchX: 0,
  zoom: 1.0,
  panY: 0
};

export const INITIAL_MODEL_METADATA: CharacterModelMetadata = {
  modelName: 'MAYRA (Source: Evelyn)',
  sourceFile: 'model.pmx',
  format: 'PMX',
  version: '2.0 / 2.1 (MMD Extended)',
  vendor: 'MAYRA Core Cybernetics',
  vertexCount: 48250,
  boneCount: 168,
  materialCount: 32,
  morphCount: 46,
  hasPhysics: true,
  hasBones: true,
  hasFacialMorphs: true,
  textures: [
    'face.png',
    'hair.png',
    'body_diffuse.png',
    'body_normal.png',
    'eye_l.png',
    'eye_r.png',
    'cloth_suit.png',
    'cloth_metal.png',
    'acc_cyan.png',
    'toon_shade.bmp',
    'metal_spa.sph'
  ],
  status: 'source_ready'
};

export function useCharacterController(assistantStatus: AssistantStatus) {
  const [transform, setTransform] = useState<CharacterTransform>(DEFAULT_TRANSFORM);
  const [lockState, setLockState] = useState<CharacterLockState>({ isLocked: false });
  const [modelMetadata, setModelMetadata] = useState<CharacterModelMetadata>(INITIAL_MODEL_METADATA);
  const [isDragging, setIsDragging] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);

  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);
  const initialTouchDistance = useRef<number | null>(null);
  const initialZoom = useRef<number>(1.0);
  const lastTapTime = useRef<number>(0);

  // Toggle Character Lock
  const toggleLock = useCallback(() => {
    setLockState(prev => ({
      isLocked: !prev.isLocked,
      lockTimestamp: Date.now()
    }));
  }, []);

  // Reset to default front-facing view
  const resetTransform = useCallback(() => {
    if (lockState.isLocked) return;
    setTransform(DEFAULT_TRANSFORM);
  }, [lockState.isLocked]);

  // Pointer Down (Mouse or single touch)
  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    if (lockState.isLocked) return;

    // Detect double tap
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      resetTransform();
      lastTapTime.current = 0;
      return;
    }
    lastTapTime.current = now;

    setIsDragging(true);
    lastPointerPos.current = { x: clientX, y: clientY };
  }, [lockState.isLocked, resetTransform]);

  // Pointer Move (Mouse drag or touch drag)
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (lockState.isLocked || !isDragging || !lastPointerPos.current) return;

    const deltaX = clientX - lastPointerPos.current.x;
    const deltaY = clientY - lastPointerPos.current.y;

    setTransform(prev => {
      // Horizontal drag rotates model horizontally (360 degrees)
      let newRotY = prev.rotationY + deltaX * 0.8;
      if (newRotY > 180) newRotY -= 360;
      if (newRotY < -180) newRotY += 360;

      return {
        ...prev,
        rotationY: newRotY,
        pitchX: 0,
        zoom: 1.0
      };
    });

    lastPointerPos.current = { x: clientX, y: clientY };
  }, [lockState.isLocked, isDragging]);

  // Pointer Up
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    lastPointerPos.current = null;
    initialTouchDistance.current = null;
  }, []);

  // Touch handlers for single touch horizontal drag (pinch-to-zoom is strictly disabled)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (lockState.isLocked) return;

    if (e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [lockState.isLocked, handlePointerDown]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (lockState.isLocked) return;

    if (e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [lockState.isLocked, handlePointerMove]);

  // Mouse wheel zoom disabled to maintain fixed presentation scale
  const handleWheel = useCallback((_e: React.WheelEvent) => {
    // Disabled to prevent resizing
  }, []);

  // Hand-controlled rotation delta (from Barehands gesture)
  const rotateByDelta = useCallback((deltaDegrees: number) => {
    if (lockState.isLocked) return;
    setTransform(prev => {
      let newRotY = prev.rotationY + deltaDegrees;
      if (newRotY > 180) newRotY -= 360;
      if (newRotY < -180) newRotY += 360;
      return {
        ...prev,
        rotationY: newRotY
      };
    });
  }, [lockState.isLocked]);

  // Two-hand scale delta (from Barehands gesture)
  const scaleByDelta = useCallback((scaleRatio: number) => {
    if (lockState.isLocked) return;
    setTransform(prev => {
      const newZoom = Math.max(0.7, Math.min(1.6, (prev.zoom || 1.0) * scaleRatio));
      return {
        ...prev,
        zoom: newZoom
      };
    });
  }, [lockState.isLocked]);

  return {
    transform,
    setTransform,
    lockState,
    modelMetadata,
    isDragging,
    showModelInfo,
    setShowModelInfo,
    toggleLock,
    resetTransform,
    rotateByDelta,
    scaleByDelta,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleWheel
  };
}
