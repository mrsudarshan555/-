import * as THREE from 'three';

export * from './evelynAnimationEngine';

export type CharacterEmotion = 
  | 'idle'
  | 'happy'
  | 'excited'
  | 'curious'
  | 'thinking'
  | 'proud'
  | 'sad'
  | 'confused'
  | 'surprised'
  | 'embarrassed'
  | 'playful';

export const ALL_EMOTIONS: CharacterEmotion[] = [
  'idle',
  'happy',
  'excited',
  'curious',
  'thinking',
  'proud',
  'sad',
  'confused',
  'surprised',
  'embarrassed',
  'playful'
];

/**
 * Morph Name Mapping for PMX/MMD and standard VRM/English glTF models
 */
export const MORPH_NAME_ALIASES: Record<string, string[]> = {
  blink: ['まばたき', 'blink', 'eye_blink', 'blink_l', 'blink_r', 'eyeblink'],
  blinkL: ['ウィンク', 'blinkl', 'blink_l', 'wink_l', 'wink', 'blinkleft'],
  blinkR: ['ウィンク右', 'blinkr', 'blink_r', 'wink_r', 'blinkright'],
  smileEyes: ['笑い', 'smileeyes', 'smile_eyes', 'eye_smile', 'joy', 'happy_eye', 'smile_eye'],
  eyesWideL: ['びっくり左', 'eyeswidel', 'eyes_wide_l', 'wide_l', 'surprised_l', 'びっくり'],
  eyesWideR: ['びっくり右', 'eyeswider', 'eyes_wide_r', 'wide_r', 'surprised_r', 'びっくり'],
  eyesHalf: ['じと目', 'eyeshalf', 'eyes_half', 'half_closed', 'sleepy'],
  eyesAngry: ['怒り目', 'eyesangry', 'eyes_angry'],
  eyesSad: ['悲しむ', 'eyessad', 'eyes_sad', 'sorrow'],
  visemeA: ['あ', 'visemea', 'viseme_a', 'viseme_aa', 'v_aa', 'a', 'aa', 'mouth_a'],
  visemeI: ['い', 'visemei', 'viseme_i', 'viseme_ih', 'viseme_ee', 'v_ih', 'i', 'ih', 'ee', 'mouth_i'],
  visemeU: ['う', 'visemeu', 'viseme_u', 'viseme_ou', 'viseme_oo', 'v_ou', 'u', 'ou', 'oo', 'mouth_u'],
  visemeE: ['え', 'visemee', 'viseme_e', 'v_e', 'e', 'eh', 'mouth_e'],
  visemeO: ['お', 'visemeo', 'viseme_o', 'viseme_oh', 'v_oh', 'o', 'oh', 'mouth_o'],
  visemeTalk: ['ワ', 'visemetalk', 'viseme_talk', 'talk', 'mouth_open', 'mouthopen', 'mouth_talk', 'mouthopen', 'jawopen'],
  mouthSmile: ['にやり', 'mouthsmile', 'mouth_smile', 'smile', 'frown_inv'],
  mouthCornerUpL: ['口角上げ左', '口角上げ', 'mouthcornerupl', 'mouth_corner_up_l', 'lip_up_l'],
  mouthCornerUpR: ['口角上げ右', '口角上げ', 'mouthcornerupr', 'mouth_corner_up_r', 'lip_up_r'],
  mouthCornerDownL: ['口角下げ左', '口角下げ', 'mouthcornerdownl', 'mouth_corner_down_l', 'lip_down_l'],
  mouthCornerDownR: ['口角下げ右', '口角下げ', 'mouthcornerdownr', 'mouth_corner_down_r', 'lip_down_r'],
  mouthWiden: ['口横広げ', 'mouthwiden', 'mouth_widen', 'wide_mouth'],
  mouthNarrow: ['口横狭め', 'mouthnarrow', 'mouth_narrow', 'o_mouth'],
  browAngry: ['怒り', 'browangry', 'brow_angry'],
  browSerious: ['真面目', 'browserious', 'brow_serious'],
  browSad: ['悲しい', 'browsad', 'brow_sad'],
  browTroubled: ['困る', 'browtroubled', 'brow_troubled'],
  browUp: ['上', 'browup', 'brow_up', 'eyebrow_up'],
  browDown: ['下', 'browdown', 'brow_down', 'eyebrow_down']
};

export const EMOTION_EXPRESSIONS: Record<CharacterEmotion, Record<string, number>> = {
  idle: {},
  happy: {
    smileEyes: 0.5,
    mouthCornerUpL: 0.65,
    mouthCornerUpR: 0.65,
    browUp: 0.3,
    mouthSmile: 0.35
  },
  excited: {
    eyesWideL: 0.4,
    eyesWideR: 0.4,
    browUp: 0.5,
    mouthSmile: 0.6,
    smileEyes: 0.25
  },
  curious: {
    browUp: 0.45,
    eyesWideL: 0.2,
    eyesWideR: 0.2,
    mouthNarrow: 0.15
  },
  thinking: {
    eyesHalf: 0.35,
    browTroubled: 0.35,
    mouthNarrow: 0.25
  },
  proud: {
    browUp: 0.25,
    mouthCornerUpL: 0.45,
    mouthCornerUpR: 0.45,
    eyesHalf: 0.15,
    mouthSmile: 0.3
  },
  sad: {
    eyesSad: 0.5,
    browSad: 0.5,
    mouthCornerDownL: 0.45,
    mouthCornerDownR: 0.45
  },
  confused: {
    browTroubled: 0.4,
    eyesHalf: 0.2,
    mouthNarrow: 0.25
  },
  surprised: {
    eyesWideL: 0.6,
    eyesWideR: 0.6,
    browUp: 0.6,
    mouthNarrow: 0.35,
    visemeO: 0.25
  },
  embarrassed: {
    smileEyes: 0.25,
    eyesHalf: 0.3,
    browTroubled: 0.35,
    mouthSmile: 0.3
  },
  playful: {
    smileEyes: 0.4,
    mouthCornerUpL: 0.6,
    mouthCornerUpR: 0.4,
    browUp: 0.25,
    mouthSmile: 0.35
  }
};

export interface ResolvedMorphTarget {
  mesh: THREE.Mesh;
  targetIndex: number;
  channel: string;
}

export interface CharacterFacialFeatureMeshes {
  eyebrows: THREE.Mesh[];
  eyes: THREE.Mesh[];
  eyelashes: THREE.Mesh[];
  mouth: THREE.Mesh[];
  face: THREE.Mesh[];
}

export interface CharacterSkeletonBones {
  head?: THREE.Object3D;
  neck?: THREE.Object3D;
  upperBody?: THREE.Object3D;
  upperBody2?: THREE.Object3D;
  shoulderL?: THREE.Object3D;
  shoulderR?: THREE.Object3D;
  armL?: THREE.Object3D;
  armR?: THREE.Object3D;
  elbowL?: THREE.Object3D;
  elbowR?: THREE.Object3D;
  wristL?: THREE.Object3D;
  wristR?: THREE.Object3D;
  fingersL: THREE.Object3D[];
  fingersR: THREE.Object3D[];
  hairBonesL: THREE.Object3D[];
  hairBonesR: THREE.Object3D[];
}

export interface MeshRestTransform {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
}

/**
 * Builds complete character bindings (morph targets, bones, and facial feature meshes)
 */
export function buildCharacterBindings(modelScene: THREE.Group): {
  morphTargets: ResolvedMorphTarget[];
  bones: CharacterSkeletonBones;
  restRotations: Map<THREE.Object3D, THREE.Euler>;
  facialFeatures: CharacterFacialFeatureMeshes;
  meshRestTransforms: Map<THREE.Mesh, MeshRestTransform>;
} {
  const morphTargets: ResolvedMorphTarget[] = [];
  const bones: CharacterSkeletonBones = {
    fingersL: [],
    fingersR: [],
    hairBonesL: [],
    hairBonesR: []
  };
  const restRotations = new Map<THREE.Object3D, THREE.Euler>();
  const facialFeatures: CharacterFacialFeatureMeshes = {
    eyebrows: [],
    eyes: [],
    eyelashes: [],
    mouth: [],
    face: []
  };
  const meshRestTransforms = new Map<THREE.Mesh, MeshRestTransform>();

  modelScene.traverse((child) => {
    // Cache rest rotation
    restRotations.set(child, child.rotation.clone());

    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      meshRestTransforms.set(mesh, {
        position: mesh.position.clone(),
        scale: mesh.scale.clone(),
        rotation: mesh.rotation.clone()
      });

      // 1. Scan for Morph Targets
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        const dict = mesh.morphTargetDictionary;
        for (const [channel, aliases] of Object.entries(MORPH_NAME_ALIASES)) {
          for (const alias of aliases) {
            if (dict[alias] !== undefined) {
              morphTargets.push({
                mesh,
                targetIndex: dict[alias],
                channel
              });
              break;
            }
          }
        }
      }

      // 2. Classify facial feature meshes by material name / mesh name
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        if (!mat) return;
        const matName = mat.name || '';
        const lowerName = (matName + ' ' + (mesh.name || '')).toLowerCase();

        if (matName.includes('眉') || lowerName.includes('brow')) {
          facialFeatures.eyebrows.push(mesh);
        } else if (matName.includes('目') || matName.includes('白目') || matName.includes('目光') || lowerName.includes('eye')) {
          facialFeatures.eyes.push(mesh);
        } else if (matName.includes('睫') || lowerName.includes('lash')) {
          facialFeatures.eyelashes.push(mesh);
        } else if (matName.includes('口') || matName.includes('舌') || matName.includes('齿') || lowerName.includes('mouth') || lowerName.includes('lip') || lowerName.includes('teeth')) {
          facialFeatures.mouth.push(mesh);
        } else if (matName.includes('颜') || matName.includes('顔') || matName.includes('痣') || lowerName.includes('face') || lowerName.includes('head')) {
          facialFeatures.face.push(mesh);
        }
      });
    }

    // 3. Scan Skeleton Bones
    const name = child.name || '';
    const lower = name.toLowerCase();

    if (name === '頭' || lower === 'head' || lower.includes('head_bone') || lower === 'head.b') {
      bones.head = child;
    } else if (name === '首' || lower === 'neck' || lower === 'neck.b') {
      bones.neck = child;
    } else if (name === '上半身2' || lower === 'upperbody2' || lower === 'chest' || lower === 'chest.b') {
      bones.upperBody2 = child;
    } else if (name === '上半身' || lower === 'upperbody' || lower === 'spine' || lower === 'spine.b') {
      bones.upperBody = child;
    } else if (name === '左肩' || lower === 'shoulder_l' || lower === 'leftshoulder' || lower === 'shoulder.l' || lower === 'l_shoulder') {
      bones.shoulderL = child;
    } else if (name === '右肩' || lower === 'shoulder_r' || lower === 'rightshoulder' || lower === 'shoulder.r' || lower === 'r_shoulder') {
      bones.shoulderR = child;
    } else if (name === '左腕' || lower === 'arm_l' || lower === 'upperarm_l' || lower === 'leftarm' || lower === 'leftupperarm' || lower === 'arm.l' || lower === 'l_arm') {
      bones.armL = child;
    } else if (name === '右腕' || lower === 'arm_r' || lower === 'upperarm_r' || lower === 'rightarm' || lower === 'rightupperarm' || lower === 'arm.r' || lower === 'r_arm') {
      bones.armR = child;
    } else if (name === '左ひじ' || name === '左肘' || lower === 'elbow_l' || lower === 'forearm_l' || lower === 'leftelbow' || lower === 'leftforearm' || lower === 'elbow.l' || lower === 'l_elbow') {
      bones.elbowL = child;
    } else if (name === '右ひじ' || name === '右肘' || lower === 'elbow_r' || lower === 'forearm_r' || lower === 'rightelbow' || lower === 'rightforearm' || lower === 'elbow.r' || lower === 'r_elbow') {
      bones.elbowR = child;
    } else if (name === '左手首' || name === '左手' || lower === 'wrist_l' || lower === 'hand_l' || lower === 'lefthand' || lower === 'leftwrist' || lower === 'wrist.l' || lower === 'l_wrist') {
      bones.wristL = child;
    } else if (name === '右手首' || name === '右手' || lower === 'wrist_r' || lower === 'hand_r' || lower === 'righthand' || lower === 'rightwrist' || lower === 'wrist.r' || lower === 'r_wrist') {
      bones.wristR = child;
    } else if (lower.includes('finger') || lower.includes('thumb') || lower.includes('index') || lower.includes('middle') || lower.includes('ring') || lower.includes('little') || name.includes('指')) {
      if (lower.includes('_l') || lower.includes('.l') || lower.includes('left') || name.includes('左')) {
        bones.fingersL.push(child);
      } else {
        bones.fingersR.push(child);
      }
    } else if (lower.includes('hair') || lower.includes('髪') || lower.includes('twin') || lower.includes('side') || lower.includes('bang') || lower.includes('front')) {
      if (lower.includes('_l') || lower.includes('.l') || lower.includes('left') || name.includes('左') || lower.includes('l_')) {
        bones.hairBonesL.push(child);
      } else {
        bones.hairBonesR.push(child);
      }
    }
  });

  return { morphTargets, bones, restRotations, facialFeatures, meshRestTransforms };
}

/**
 * Computes exact mirror-aware local reference rotations for relaxed natural posture
 * Uses fixed absolute numbers to guarantee zero cumulative drift across mounts
 */
export function computeReferenceBasePoseRotations(
  bones: CharacterSkeletonBones,
  _restRotations?: Map<THREE.Object3D, THREE.Euler>
): Map<THREE.Object3D, THREE.Euler> {
  const targetMap = new Map<THREE.Object3D, THREE.Euler>();

  if (bones.shoulderL) {
    targetMap.set(bones.shoulderL, new THREE.Euler(0.02, 0.0, -0.04));
  }
  if (bones.shoulderR) {
    targetMap.set(bones.shoulderR, new THREE.Euler(0.02, 0.0, 0.04));
  }

  // Left & Right Upper Arms: Fixed absolute natural slope down against waist (relaxed side pose)
  if (bones.armL) {
    targetMap.set(bones.armL, new THREE.Euler(0.08, -0.05, -0.72));
  }
  if (bones.armR) {
    targetMap.set(bones.armR, new THREE.Euler(0.08, 0.05, 0.72));
  }

  // Left & Right Elbows: Fixed absolute gentle inward bend matching reference posture
  if (bones.elbowL) {
    targetMap.set(bones.elbowL, new THREE.Euler(0.12, 0.10, -0.08));
  }
  if (bones.elbowR) {
    targetMap.set(bones.elbowR, new THREE.Euler(0.12, -0.10, 0.08));
  }

  // Left & Right Wrists: Fixed absolute neutral relaxed alignment
  if (bones.wristL) {
    targetMap.set(bones.wristL, new THREE.Euler(-0.04, 0.06, -0.04));
  }
  if (bones.wristR) {
    targetMap.set(bones.wristR, new THREE.Euler(-0.04, -0.06, 0.04));
  }

  // Soft natural finger curves with fixed absolute values
  bones.fingersL.forEach((f) => {
    targetMap.set(f, new THREE.Euler(0.0, 0.0, -0.08));
  });
  bones.fingersR.forEach((f) => {
    targetMap.set(f, new THREE.Euler(0.0, 0.0, 0.08));
  });

  return targetMap;
}

/**
 * Natural relaxed arm & hand pose matching the reference image.
 * Uses bone.rotation.set(x, y, z) with exact absolute values — never relative += addition.
 */
export function applyReferenceBasePose(
  bones: CharacterSkeletonBones,
  _restRotations?: Map<THREE.Object3D, THREE.Euler>
): Map<THREE.Object3D, THREE.Euler> {
  const targetMap = computeReferenceBasePoseRotations(bones);
  targetMap.forEach((targetEuler, bone) => {
    bone.rotation.set(targetEuler.x, targetEuler.y, targetEuler.z);
  });
  return targetMap;
}

/**
 * Direct facial feature animation & expression synthesizer
 * Ensures permanent 1.0 x 1.0 natural base scale for all meshes without whole-body stretch or Y-distortion
 */
export function updateFacialAnimations(
  facialFeatures: CharacterFacialFeatureMeshes,
  meshRestTransforms: Map<THREE.Mesh, MeshRestTransform>,
  emotion: CharacterEmotion,
  isSpeaking: boolean,
  speechAuthority: number,
  blinkVal: number,
  time: number
) {
  // 1. Lock all meshes strictly to their permanent natural 1.0 base scale and rest position
  meshRestTransforms.forEach((rest, mesh) => {
    mesh.scale.copy(rest.scale);
    mesh.position.copy(rest.position);
    mesh.rotation.copy(rest.rotation);
  });
}

/**
 * Tunes character materials for natural human skin tone:
 * - Slider at 50 (Default): Healthy, warm natural human skin tone (warm wheatish / golden peachy undertone)
 * - Slider > 50 (High): Fair / glowing skin tone (Gora)
 * - Slider < 50 (Low): Dusky / deep melanin skin tone (Kala)
 * - Instant runtime updates on slider movement
 */
export function tuneCharacterMaterials(
  modelScene: THREE.Group,
  skinToneVal: number = 50,
  initialMaterialsMap: Map<THREE.Material, { color: THREE.Color; roughness: number }>
) {
  // Clamp between 0 and 100
  const val = Math.max(0, Math.min(100, skinToneVal));
  
  // Calculate target RGB multiplier based on slider position (smooth natural warm human anime skin tone)
  let targetR: number;
  let targetG: number;
  let targetB: number;

  if (val <= 50) {
    const factor = val / 50.0;
    // Dusky / Deep Melanin (0): RGB(0.72, 0.44, 0.31) -> Natural Warm Golden-Peachy Human Tone (50): RGB(1.0, 0.828, 0.730) (+50% saturation)
    targetR = 0.72 + (1.0 - 0.72) * factor;
    targetG = 0.44 + (0.828 - 0.44) * factor;
    targetB = 0.31 + (0.730 - 0.31) * factor;
  } else {
    const factor = (val - 50) / 50.0;
    // Natural Warm (50): RGB(1.0, 0.828, 0.730) -> Fair Warm Porcelain (100): RGB(1.0, 0.910, 0.835) (+50% saturation)
    targetR = 1.0;
    targetG = 0.828 + (0.910 - 0.828) * factor;
    targetB = 0.730 + (0.835 - 0.730) * factor;
  }

  modelScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((mat) => {
        if (!mat) return;
        const standardMat = mat as THREE.MeshStandardMaterial;
        const matName = standardMat.name || '';
        const lowerName = matName.toLowerCase();

        // Cache initial material color
        if (!initialMaterialsMap.has(standardMat)) {
          initialMaterialsMap.set(standardMat, {
            color: standardMat.color ? standardMat.color.clone() : new THREE.Color(1, 1, 1),
            roughness: standardMat.roughness ?? 0.55
          });
        }

        const isSkin = 
          matName === '肌' || 
          matName === '颜' || 
          matName === '痣' ||
          lowerName.includes('skin') || 
          lowerName.includes('face') || 
          lowerName.includes('head') || 
          lowerName.includes('body') ||
          lowerName.includes('arm') ||
          lowerName.includes('hand') ||
          lowerName.includes('leg');

        const isFace = matName === '颜' || matName === '痣' || lowerName.includes('face');

        const isHair = 
          matName === '发' || 
          matName === '侧发' || 
          matName === '前发' || 
          matName === '刘海' || 
          matName === '碎发' || 
          matName === '后发' || 
          lowerName.includes('hair');

        const isIris = matName === '目' || lowerName.includes('iris') || lowerName.includes('eye_main');
        const isCatchlight = matName === '目光' || matName === '目光2' || lowerName.includes('catch') || lowerName.includes('highlight');
        const isEyeWhite = matName === '白目' || lowerName.includes('eyewhite');
        const isLashOrBrow = matName === '睫' || matName === '眉' || matName === '眉睫影' || lowerName.includes('lash') || lowerName.includes('brow');

        const isWhiteShirt = matName === '衬衣' || lowerName.includes('shirt') || lowerName.includes('white');
        const isDarkLeatherOrPants = 
          matName === '皮裤' || 
          matName === '黑丝衣' || 
          matName === '胸衣' || 
          lowerName.includes('leather') || 
          lowerName.includes('pant') || 
          lowerName.includes('sock');

        const isCapeOrCloth = 
          matName === '衣' || 
          matName === '外套' || 
          matName === '外套+' || 
          matName === '领带' || 
          matName === '领带+' || 
          matName === '发带' || 
          matName === '穗' || 
          matName === '武器' || 
          lowerName.includes('cloth') || 
          lowerName.includes('cape') || 
          lowerName.includes('coat');

        const isMetalOrJewelry = 
          matName === '金属' || 
          matName === '珠宝' || 
          lowerName.includes('metal') || 
          lowerName.includes('gold') || 
          lowerName.includes('jewelry');

        const isMouthInside = 
          matName === '口' || 
          matName === '齿' || 
          matName === '舌' || 
          lowerName.includes('mouth') || 
          lowerName.includes('tooth') || 
          lowerName.includes('tongue');

        if (isSkin) {
          // Natural warm anime skin tone: eliminates bleached plastic appearance with warm peachy undertones
          const r = targetR;
          const g = isFace ? targetG * 0.99 : targetG;
          const b = isFace ? targetB * 0.97 : targetB;

          standardMat.color.setRGB(r, g, b);
          standardMat.roughness = 0.88;
          standardMat.metalness = 0.0;
          standardMat.emissive.setRGB(0.0, 0.0, 0.0);
        } else if (isHair) {
          // Hair: preserve original texture and material characteristics without artificial brightening
          standardMat.roughness = 0.92;
          standardMat.metalness = 0.0;
          standardMat.emissive.setRGB(0.0, 0.0, 0.0);
        } else if (isIris) {
          // Iris: crystal clarity with subtle depth
          standardMat.roughness = 0.40;
          standardMat.metalness = 0.0;
          standardMat.emissive.setRGB(0.0, 0.0, 0.0);
        } else if (isCatchlight) {
          // Catchlight: crisp pure white pin-point reflection
          standardMat.roughness = 0.0;
          standardMat.metalness = 0.0;
          standardMat.color.setRGB(1.0, 1.0, 1.0);
          standardMat.emissive.setRGB(0.9, 0.9, 0.9);
        } else if (isEyeWhite) {
          // Eye White: clean organic sclera
          standardMat.roughness = 0.80;
          standardMat.metalness = 0.0;
          standardMat.color.setRGB(0.98, 0.98, 0.98);
          standardMat.emissive.setRGB(0.0, 0.0, 0.0);
        } else if (isLashOrBrow) {
          // Eyelashes & Brows: crisp dark anime definition
          standardMat.roughness = 0.95;
          standardMat.metalness = 0.0;
          standardMat.emissive.setRGB(0.0, 0.0, 0.0);
        } else if (isWhiteShirt) {
          // White Shirt: crisp clean fabric separated from skin tone
          standardMat.roughness = 0.98;
          standardMat.metalness = 0.0;
          standardMat.color.setRGB(1.0, 1.0, 1.0);
          standardMat.emissive.setRGB(0.0, 0.0, 0.0);
        } else if (isDarkLeatherOrPants) {
          // Black/Dark Clothing: deep dark absorption with natural fold detail visibility
          standardMat.roughness = 0.90;
          standardMat.metalness = 0.0;
          standardMat.emissive.setRGB(0.0, 0.0, 0.0);
        } else if (isCapeOrCloth) {
          // Cape, Tie & Cloth: matte textured fabric
          standardMat.roughness = 0.94;
          standardMat.metalness = 0.0;
          standardMat.emissive.setRGB(0.0, 0.0, 0.0);
        } else if (isMetalOrJewelry) {
          // Metallic accents: subtle gold sheen
          standardMat.roughness = 0.35;
          standardMat.metalness = 0.60;
          standardMat.emissive.setRGB(0.0, 0.0, 0.0);
        } else if (isMouthInside) {
          // Mouth Interior: natural organic cavity
          standardMat.roughness = 0.80;
          standardMat.metalness = 0.0;
          standardMat.emissive.setRGB(0.0, 0.0, 0.0);
        }

        standardMat.needsUpdate = true;
        if (standardMat.map) {
          standardMat.map.needsUpdate = true;
        }
      });
    }
  });
}

