import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AssistantStatus, CharacterTransform, CharacterLockState, CharacterModelMetadata } from '../../types';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { 
  CharacterEmotion, 
  buildCharacterBindings, 
  applyReferenceBasePose, 
  computeReferenceBasePoseRotations,
  tuneCharacterMaterials, 
  updateFacialAnimations,
  EMOTION_EXPRESSIONS, 
  ResolvedMorphTarget, 
  CharacterSkeletonBones,
  EvelynMasterAnimationOrchestrator,
  CharacterBonesMap
} from './myraCharacterEngine';
import { 
  PMX_MODEL_URL, 
  TEXTURES_JSON_URL, 
  RAW_TEXTURE_URLS, 
  loadEvelynPMXModel 
} from './pmxModelLoader';

// Priority Model URLs with automatic failover
export const MODEL_CANDIDATE_URLS = [
  PMX_MODEL_URL,
  '/models/Evelyn.glb',
  'https://cdn.jsdelivr.net/gh/mrsudarshan555/Model@main/Evelyn.glb',
  'https://raw.githubusercontent.com/mrsudarshan555/Model/main/Evelyn.glb'
];

export const PRIMARY_MODEL_URL = MODEL_CANDIDATE_URLS[0];
export const MODEL_URL = PRIMARY_MODEL_URL;
export const PMX_URL = PMX_MODEL_URL;
export const TEXTURES_URL = TEXTURES_JSON_URL;
export const TEXTURE_ASSETS = RAW_TEXTURE_URLS;

// Pristine raw source template (never directly mutated or animated)
let cachedRawSourceTemplate: THREE.Group | null = null;
let hasLoadedOnce = false;

interface ModelRendererProps {
  modelScene: THREE.Group;
  status: AssistantStatus;
  emotion?: CharacterEmotion;
  lockState?: CharacterLockState;
  transform?: CharacterTransform;
  characterSkinTone?: number;
}

function ModelRenderer({ 
  modelScene, 
  status, 
  emotion,
  lockState,
  transform,
  characterSkinTone = 50
}: ModelRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const initialMaterialsRef = useRef<Map<THREE.Material, { color: THREE.Color; roughness: number }>>(new Map());

  const { morphTargets, bones, restRotations, facialFeatures, meshRestTransforms } = useMemo(() => {
    return buildCharacterBindings(modelScene);
  }, [modelScene]);

  const targetBaseRotations = useMemo(() => {
    return computeReferenceBasePoseRotations(bones);
  }, [bones]);

  useEffect(() => {
    applyReferenceBasePose(bones);
  }, [bones]);

  useEffect(() => {
    tuneCharacterMaterials(modelScene, characterSkinTone, initialMaterialsRef.current);
  }, [characterSkinTone, modelScene]);

  const morphsByChannel = useMemo(() => {
    const map = new Map<string, ResolvedMorphTarget[]>();
    morphTargets.forEach((target) => {
      if (!map.has(target.channel)) {
        map.set(target.channel, []);
      }
      map.get(target.channel)!.push(target);
    });
    return map;
  }, [morphTargets]);

  // Model bone container for accumulator
  const modelBoneContainer = useMemo(() => {
    const bonesList: THREE.Object3D[] = [];
    const boneIndexByName = new Map<string, number>();

    modelScene.traverse((child) => {
      if (child.name) {
        bonesList.push(child);
        boneIndexByName.set(child.name, bonesList.length - 1);
      }
    });

    return {
      bones: bonesList,
      boneIndexByName,
      mesh: modelScene
    };
  }, [modelScene]);

  // Morph target consumer
  const { morphConsumer, morphMap } = useMemo(() => {
    const morphMap: Record<string, string> = {
      blink: 'blink',
      blinkL: 'blinkL',
      blinkR: 'blinkR',
      visemeA: 'visemeA',
      visemeI: 'visemeI',
      visemeU: 'visemeU',
      visemeE: 'visemeE',
      visemeO: 'visemeO',
      visemeTalk: 'visemeTalk',
      smileEyes: 'smileEyes',
      eyesWideL: 'eyesWideL',
      eyesWideR: 'eyesWideR',
      eyesHalf: 'eyesHalf',
      eyesSad: 'eyesSad',
      lowerLidUp: 'lowerLidUp',
      eyeOuterDown: 'eyeOuterDown',
      browUp: 'browUp',
      browSad: 'browSad',
      browSerious: 'browSerious',
      browTroubled: 'browTroubled',
      browAngryR: 'browAngryR',
      browDown: 'browDown',
      mouthSmile: 'mouthSmile',
      mouthCornerUpL: 'mouthCornerUpL',
      mouthCornerUpR: 'mouthCornerUpR',
      mouthCornerDownL: 'mouthCornerDownL',
      mouthCornerDownR: 'mouthCornerDownR',
      mouthWiden: 'mouthWiden',
      mouthNarrow: 'mouthNarrow',
      mouthShiftLeft: 'mouthShiftLeft',
      mouthShiftRight: 'mouthShiftRight',
      teethUp: 'teethUp',
      teethDown: 'teethDown'
    };

    const currentMorphInfluences = new Map<string, number>();

    const morphConsumer = {
      add(channelOrKey: number | string | undefined, weight: number) {
        if (!channelOrKey) return;
        const key = String(channelOrKey);
        const curr = currentMorphInfluences.get(key) || 0;
        currentMorphInfluences.set(key, Math.max(curr, weight));
      },
      flush(morphsByChannelMap: Map<string, ResolvedMorphTarget[]>, delta: number) {
        const morphDampingFactor = 1.0 - Math.exp(-8.0 * delta);
        morphsByChannelMap.forEach((targets, channel) => {
          const targetVal = currentMorphInfluences.get(channel) || 0;
          targets.forEach((target) => {
            if (target.mesh.morphTargetInfluences) {
              const curr = target.mesh.morphTargetInfluences[target.targetIndex] || 0;
              target.mesh.morphTargetInfluences[target.targetIndex] = THREE.MathUtils.lerp(
                curr,
                targetVal,
                morphDampingFactor
              );
            }
          });
        });
        currentMorphInfluences.clear();
      }
    };

    return { morphConsumer, morphMap };
  }, []);

  const bonesMap = useMemo<CharacterBonesMap>(() => {
    return {
      center: bones.upperBody?.parent?.name || 'センター',
      waist: '下半身',
      upperBody: bones.upperBody?.name || '上半身',
      upperBody2: bones.upperBody2?.name || '上半身2',
      neck: bones.neck?.name || '首',
      head: bones.head?.name || '頭',
      shoulderL: bones.shoulderL?.name || '左肩',
      shoulderR: bones.shoulderR?.name || '右肩',
      armL: bones.armL?.name || '左腕',
      armR: bones.armR?.name || '右腕',
      elbowL: bones.elbowL?.name || '左ひじ',
      elbowR: bones.elbowR?.name || '右ひじ',
      wristL: bones.wristL?.name || '左手首',
      wristR: bones.wristR?.name || '右手首'
    };
  }, [bones]);

  const hairBonesL = useMemo(() => bones.hairBonesL.map((b) => b.name).filter(Boolean), [bones]);
  const hairBonesR = useMemo(() => bones.hairBonesR.map((b) => b.name).filter(Boolean), [bones]);

  // Master Orchestrator Instance
  const orchestrator = useMemo(() => {
    const orch = new EvelynMasterAnimationOrchestrator(
      modelBoneContainer,
      morphConsumer,
      morphMap,
      bonesMap,
      hairBonesL,
      hairBonesR
    );

    // Bake reference base pose (natural arm slope, elbows, wrists) into rest pose
    targetBaseRotations.forEach((targetEuler, bone) => {
      orch.pose.bakeIntoRest(bone.name, targetEuler.x, targetEuler.y, targetEuler.z);
    });

    return orch;
  }, [modelBoneContainer, morphConsumer, morphMap, bonesMap, hairBonesL, hairBonesR, targetBaseRotations]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(delta, 0.1); // Protect against tab switch spikes

    // 1. Root group transform handling (drag, rotation, locked scale)
    groupRef.current.position.set(0, 0, 0);
    groupRef.current.scale.set(1.0, 1.0, 1.0);
    groupRef.current.rotation.x = 0;
    groupRef.current.rotation.z = 0;

    if (transform && !lockState?.isLocked) {
      const targetRadY = (transform.rotationY * Math.PI) / 180;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRadY, 0.1);
    } else if (lockState?.isLocked) {
      groupRef.current.rotation.y = 0;
    }

    // Resolve current emotion & status
    let currentEmotion: CharacterEmotion = emotion || 'idle';
    if (!emotion) {
      if (status === 'SPEAKING') currentEmotion = 'happy';
      else if (status === 'THINKING') currentEmotion = 'thinking';
      else if (status === 'LISTENING') currentEmotion = 'curious';
      else currentEmotion = 'idle';
    }

    // 2. THE ONE CENTRAL MASTER PER-FRAME UPDATE FUNCTION (WA.update)
    // Executes in exact mandated sequence on every single animation frame:
    // pose.begin() -> breathing/idle -> body-language -> micro-behaviors -> gaze -> constraints -> hair -> expression -> lip-sync -> pose.apply() -> updateMatrixWorld(true)
    orchestrator.update({
      delta: clampedDelta,
      status: status as 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING',
      emotion: currentEmotion,
      userLookTarget: state.camera.position,
      audioAnalyser: null
    });

    // 3. Flush morph targets to mesh morphTargetInfluences
    morphConsumer.flush(morphsByChannel, clampedDelta);

    // 4. Update facial mesh details
    const isSpeaking = status === 'SPEAKING';
    const speechWeight = isSpeaking ? 1.0 : 0.0;
    updateFacialAnimations(
      facialFeatures,
      meshRestTransforms,
      currentEmotion,
      isSpeaking,
      speechWeight,
      0,
      time
    );

    // 5. Update scene matrices
    modelScene.updateMatrixWorld(true);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <primitive object={modelScene} />
    </group>
  );
}

export interface MayraAvatarProps {
  status: AssistantStatus;
  emotion?: CharacterEmotion;
  scaleMultiplier?: number;
  characterZoom?: number;
  characterSkinTone?: number;
  transform?: CharacterTransform;
  lockState?: CharacterLockState;
  modelMetadata?: CharacterModelMetadata;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onWheel?: (e: React.WheelEvent) => void;
  onTriggerVoice?: () => void;
}

export const MayraAvatar: React.FC<MayraAvatarProps> = ({
  status,
  emotion,
  scaleMultiplier = 1.0,
  characterZoom = 100,
  characterSkinTone = 50,
  transform,
  lockState,
  modelMetadata,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onTouchStart,
  onTouchMove,
  onWheel,
  onTriggerVoice
}) => {
  const [modelScene, setModelScene] = useState<THREE.Group | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedRawSourceTemplate);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [cameraConfig, setCameraConfig] = useState<{
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  }>({
    position: [0, 0, 2.25],
    target: [0, 0, 0],
    fov: 30
  });

  const effectiveZoom = useMemo(() => {
    const rawZoom = (characterZoom ?? 100) / 100;
    return rawZoom * (scaleMultiplier ?? 1.0);
  }, [characterZoom, scaleMultiplier]);

  useEffect(() => {
    let isMounted = true;
    const gltfLoader = new GLTFLoader();

    const configureSceneHierarchy = (scene: THREE.Group) => {
      // Ensure scene transform is reset before computing true bounding box
      scene.position.set(0, 0, 0);
      scene.rotation.set(0, 0, 0);
      scene.scale.set(1, 1, 1);
      scene.updateMatrixWorld(true);

      // 1. Calculate Real Bounding Box
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const actualHeight = size.y;
      console.log('[MayraAvatar] Model Bounding Box Computed:', {
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z },
        size: { x: size.x, y: size.y, z: size.z },
        center: { x: center.x, y: center.y, z: center.z },
        actualHeight
      });

      // 2. MODEL SCALE & UPPER-TORSO ALIGNMENT
      const TARGET_HEIGHT = 1.95;
      const scaleFactor = (actualHeight > 0.001 ? (TARGET_HEIGHT / actualHeight) : 1.0) * effectiveZoom;
      scene.scale.setScalar(scaleFactor);

      // Align chest/collar level directly to origin so chest-up (bust) portrait is framed cleanly
      const chestY = box.max.y - (actualHeight * 0.24);
      scene.position.x = -center.x * scaleFactor;
      scene.position.y = -chestY * scaleFactor;
      scene.position.z = -center.z * scaleFactor;
      scene.rotation.set(0, 0, 0);

      // 3. CAMERA CALIBRATION
      const CAMERA_DISTANCE = 1.75;
      const fov = 40;

      setCameraConfig({
        position: [0, 0, CAMERA_DISTANCE],
        target: [0, 0, 0],
        fov
      });

      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat) => {
              mat.side = THREE.DoubleSide;
              mat.needsUpdate = true;
            });
          }
        }
      });
    };

    const instantiateFreshModel = (sourceTemplate: THREE.Group) => {
      // Clones a fresh, unmutated skeleton & hierarchy with zero previous rotations
      const freshInstance = SkeletonUtils.clone(sourceTemplate) as THREE.Group;
      configureSceneHierarchy(freshInstance);
      setModelScene(freshInstance);
      setIsLoading(false);
    };

    if (cachedRawSourceTemplate) {
      instantiateFreshModel(cachedRawSourceTemplate);
      return;
    }

    const tryLoadGltfFallback = (urlIdx: number) => {
      const glbUrls = MODEL_CANDIDATE_URLS.filter(u => !u.endsWith('.pmx'));
      if (urlIdx >= glbUrls.length) {
        if (isMounted) {
          setLoadError('Failed to load 3D character asset.');
          setIsLoading(false);
        }
        return;
      }

      const currentUrl = glbUrls[urlIdx];
      gltfLoader.load(
        currentUrl,
        (gltf) => {
          if (!isMounted) return;
          try {
            cachedRawSourceTemplate = gltf.scene;
            hasLoadedOnce = true;
            instantiateFreshModel(gltf.scene);
          } catch (err: any) {
            console.error('[Mayra3D] Error processing GLTF scene:', err);
            tryLoadGltfFallback(urlIdx + 1);
          }
        },
        undefined,
        (err) => {
          if (!isMounted) return;
          console.warn(`[Mayra3D] Failed loading GLTF from ${currentUrl}:`, err);
          tryLoadGltfFallback(urlIdx + 1);
        }
      );
    };

    const loadCharacter = async () => {
      if (isMounted && !hasLoadedOnce) {
        setIsLoading(true);
        setLoadError(null);
      }

      try {
        console.log('[Mayra3D] Loading Evelyn PMX model with textures from GitHub...');
        const pmxScene = await loadEvelynPMXModel();
        if (!isMounted) return;

        cachedRawSourceTemplate = pmxScene;
        hasLoadedOnce = true;
        instantiateFreshModel(pmxScene);
        console.log('[Mayra3D] Evelyn PMX model successfully loaded.');
        return;
      } catch (pmxErr) {
        console.warn('[Mayra3D] PMX loader failed, falling back to GLB candidates:', pmxErr);
      }

      tryLoadGltfFallback(0);
    };

    loadCharacter();

    return () => {
      isMounted = false;
    };
  }, [attemptCount, effectiveZoom]);

  const handleRetry = () => {
    cachedRawSourceTemplate = null;
    hasLoadedOnce = false;
    setModelScene(null);
    setAttemptCount(prev => prev + 1);
  };

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center select-none overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/40 via-[#050711] to-[#020308]">
      {/* Background Radial Halo Light */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[340px] h-[340px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="w-[240px] h-[240px] rounded-full bg-indigo-500/10 blur-2xl -mt-12" />
      </div>

      {/* 1. Loading Overlay */}
      {isLoading && !hasLoadedOnce && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#050711]/90 backdrop-blur-sm pointer-events-none transition-opacity">
          <div className="flex flex-col items-center gap-3 p-5 bg-[#080C1E]/95 border border-cyan-500/30 rounded-3xl shadow-[0_0_25px_rgba(6,182,212,0.25)] max-w-xs w-full mx-4 text-center">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
              <Sparkles className="w-4 h-4 text-cyan-300 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-sans font-semibold text-white tracking-wide">Starting...</p>
              <p className="text-[10px] text-cyan-400/70 font-sans mt-0.5">Initializing AI Engine</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Error Overlay */}
      {loadError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#050711]/95 p-4 text-center">
          <div className="p-5 bg-[#0D1127] border border-rose-500/40 rounded-3xl text-slate-200 text-xs font-mono max-w-sm w-full space-y-3 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Character Unavailable</p>
              <p className="text-rose-400/80 text-[11px] mt-1">{loadError}</p>
            </div>
            <button
              onClick={handleRetry}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* 3. Three.js Canvas Scene */}
      {modelScene && (
        <Canvas
          key={`avatar-canvas-${cameraConfig.fov}-${cameraConfig.position[2]}`}
          camera={{
            position: cameraConfig.position,
            fov: cameraConfig.fov,
            near: 0.1,
            far: 1000
          }}
          className="w-full h-full touch-none"
          onCreated={({ gl, camera }) => {
            camera.lookAt(...cameraConfig.target);
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.LinearToneMapping;
            gl.toneMappingExposure = 1.0;
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
        >
          {/* Reference Soft Lighting Rig: Natural Ambient & Hemisphere base + gentle front-top key */}
          {/* 1. Base Soft Ambient Light (warm natural illumination for character) */}
          <ambientLight intensity={0.68} color="#fff8f2" />

          {/* 2. Soft Sky/Ground Hemisphere Light (natural gentle warmth, zero harsh contrast) */}
          <hemisphereLight color="#fff3ea" groundColor="#403632" intensity={0.38} />

          {/* 3. Single Gentle Front-Top Key Light (natural under-nose shadow and subtle chin depth, zero hot spots) */}
          <directionalLight position={[0.2, 1.8, 2.2]} intensity={0.44} color="#fffcf7" />

          <ModelRenderer 
            modelScene={modelScene} 
            status={status} 
            emotion={emotion}
            lockState={lockState}
            transform={transform}
            characterSkinTone={characterSkinTone}
          />

          <OrbitControls
            target={cameraConfig.target}
            enabled={false}
            enablePan={false}
            enableZoom={false}
            enableRotate={false}
          />
        </Canvas>
      )}
    </div>
  );
};
