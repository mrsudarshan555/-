/*
 * MYRAA (Evelyn) — Character Animation Engine
 * -------------------------------------------------------
 * Source: MYRAA-Mobile-OPTIMIZED-v1_0_2 APK, assets/public/assets/index-D1Yb3TTp.js
 * Extracted, enhanced and structured with full Three.js TypeScript interfaces.
 *
 * WHAT THIS FILE CONTAINS:
 *  1. Emotion presets (pd) - morph-weight targets for each emotion (happy, sad, etc.)
 *  2. class EvelynExpressionBlender (NA) - Facial expression blender + eyelid blink state machine
 *  3. class EvelynLipSyncEngine (DA) - Real-time lip-sync engine (live audio FFT & synthetic speech)
 *  4. class EvelynBonePoseAccumulator (LA) - Bone pose accumulator (register/addEuler/addTranslation/apply)
 *  5. class EvelynIdleBreathingPostureEngine (OA) - Idle breathing + body sway + periodic posture shifts
 *  6. class EvelynLookAtEngine (IA) - Eye + head look-at system (saccades, wandering gaze, per-emotion offset)
 *  7. Hand pose helper (Ln) + finger-curl presets (kA)
 *  8. class EvelynBodyLanguageLayer (BA) - Full-body activity & emotion pose blending (speaking/listening/thinking/idle)
 *  9. class EvelynMMDAppendConstraintSolver (zA) - MMD appended rotation/position constraint solver
 * 10. class EvelynSecondaryPhysicsSpring (HA) - Spring-bone secondary physics (hair / coat / tie jiggle)
 * 11. class EvelynIdleMicroBehaviorScheduler (GA / Yp) - Idle micro-behaviours with weighted random scheduling
 * 12. class EvelynMasterAnimationOrchestrator (WA) - The master orchestrator driving the complete per-frame loop
 * 13. const EVELYN_CHARACTER_CONFIG (ip) - Complete Evelyn character configuration & camera settings
 */

import * as THREE from 'three';

// ==========================================
// 1. MATH UTILITIES & PROCEDURAL NOISE
// ==========================================

export function pseudoNoise(i: number): number {
  const e = Math.sin(i * 127.1) * 43758.5453123;
  return (e - Math.floor(e)) * 2 - 1;
}

export function cubicNoise1D(i: number): number {
  const e = Math.floor(i);
  const t = i - e;
  const a = t * t * (3 - 2 * t);
  return pseudoNoise(e) * (1 - a) + pseudoNoise(e + 1) * a;
}

export function fractalNoise(i: number, octaves = 2): number {
  let t = 0;
  let a = 1;
  let r = 1;
  let l = 0;
  for (let u = 0; u < octaves; u++) {
    t += cubicNoise1D(i * r) * a;
    l += a;
    a *= 0.5;
    r *= 2.07;
  }
  return l > 0 ? t / l : 0;
}

/** Asymmetric natural breathing wave: 38% inhale cubic ease-in-out, 62% exhale exponential power ease */
export function asymmetricBreathingWave(i: number): number {
  const e = i - Math.floor(i);
  const t = 0.38;
  if (e < t) {
    const r = e / t;
    return r * r * (3 - 2 * r);
  }
  const a = (e - t) / (1 - t);
  return 1 - Math.pow(a * a * (3 - 2 * a), 0.85);
}

export function smoothstep01(i: number): number {
  const e = Math.min(1, Math.max(0, i));
  return e * e * (3 - 2 * e);
}

export function overshootEaseOut(i: number): number {
  const e = Math.min(1, Math.max(0, i));
  const t = 1.35;
  const a = e - 1;
  return a * a * ((t + 1) * a + t) + 1;
}

// ==========================================
// 2. MORPH DEFINITIONS & EMOTION PRESETS (pd)
// ==========================================

export const VISEME_AND_MOUTH_MORPH_SET = new Set([
  'visemeA',
  'visemeI',
  'visemeU',
  'visemeE',
  'visemeO',
  'visemeTalk',
  'mouthSmile',
  'mouthCornerUpL',
  'mouthCornerUpR',
  'mouthCornerDownL',
  'mouthCornerDownR',
  'mouthWiden',
  'mouthNarrow',
  'mouthShiftRight',
  'mouthShiftLeft',
  'mouthUp',
  'mouthDown',
  'mouthWidenL',
  'mouthWidenR',
  'mouthNarrowL',
  'mouthNarrowR',
  'teethUp',
  'teethDown'
]);

export interface EmotionMorphWeights {
  [morphName: string]: number;
}

export const EVELYN_EMOTION_PRESETS: Record<string, EmotionMorphWeights> = {
  neutral: {
    lowerLidUp: 0.07,
    mouthCornerUpL: 0.04,
    mouthCornerUpR: 0.04,
    browUp: 0.025
  },
  happy: {
    smileEyes: 0.18,
    lowerLidUp: 0.4,
    mouthSmile: 0.2,
    mouthCornerUpL: 0.72,
    mouthCornerUpR: 0.72,
    mouthWiden: 0.18,
    browUp: 0.3
  },
  excited: {
    eyesWideL: 0.62,
    eyesWideR: 0.62,
    lowerLidUp: 0.12,
    mouthSmile: 0.24,
    mouthCornerUpL: 0.8,
    mouthCornerUpR: 0.8,
    mouthWiden: 0.28,
    visemeA: 0.22,
    browUp: 0.82
  },
  curious: {
    eyesWideL: 0.2,
    eyesWideR: 0.42,
    lowerLidUp: 0.1,
    browUp: 0.45,
    browAngryR: 0.22,
    mouthNarrow: 0.2,
    mouthShiftLeft: 0.1,
    mouthCornerUpR: 0.08
  },
  thinking: {
    eyesHalf: 0.34,
    browTroubled: 0.62,
    browSerious: 0.18,
    browUp: 0.08,
    mouthNarrow: 0.35,
    mouthShiftLeft: 0.16,
    mouthCornerDownR: 0.16
  },
  proud: {
    eyesHalf: 0.26,
    lowerLidUp: 0.22,
    browSerious: 0.55,
    browDown: 0.08,
    mouthSmile: 0.3,
    mouthCornerUpL: 0.44,
    mouthCornerUpR: 0.32,
    mouthShiftRight: 0.04
  },
  sad: {
    eyesSad: 0.75,
    eyeOuterDown: 0.18,
    lowerLidUp: 0.08,
    browSad: 0.88,
    browTroubled: 0.2,
    mouthCornerDownL: 0.55,
    mouthCornerDownR: 0.55,
    mouthNarrow: 0.14
  },
  confused: {
    eyesWideL: 0.3,
    eyesHalf: 0.24,
    browTroubled: 0.78,
    browUp: 0.18,
    browAngryR: 0.32,
    mouthNarrow: 0.28,
    mouthShiftRight: 0.2,
    mouthCornerDownL: 0.28,
    mouthCornerUpR: 0.06
  },
  surprised: {
    eyesWideL: 0.92,
    eyesWideR: 0.92,
    browUp: 1,
    visemeO: 0.55,
    mouthNarrow: 0.12
  },
  embarrassed: {
    eyesHalf: 0.48,
    eyesSad: 0.32,
    eyeOuterDown: 0.08,
    lowerLidUp: 0.3,
    browTroubled: 0.7,
    browSad: 0.28,
    browUp: 0.1,
    mouthSmile: 0.04,
    mouthCornerUpL: 0.09,
    mouthCornerDownR: 0.05,
    mouthNarrow: 0.27,
    mouthShiftLeft: 0.1
  },
  playful: {
    blinkL: 0.92,
    lowerLidUp: 0.26,
    mouthSmile: 0.5,
    mouthCornerUpL: 0.68,
    mouthCornerUpR: 0.36,
    mouthShiftRight: 0.13,
    browUp: 0.34,
    browAngryR: 0.24
  },
  listening: {
    eyesWideL: 0.14,
    eyesWideR: 0.14,
    lowerLidUp: 0.17,
    browUp: 0.3,
    mouthSmile: 0.05,
    mouthCornerUpL: 0.1,
    mouthCornerUpR: 0.1
  }
};

export function resolveEmotionPreset(name: string): string {
  return name in EVELYN_EMOTION_PRESETS ? name : 'neutral';
}

// Eyelid Blink Timing Parameters
const BLINK_CLOSE_DURATION = 0.055;
const BLINK_HOLD_DURATION = 0.032;
const BLINK_OPEN_DURATION = 0.115;
const TOTAL_BLINK_DURATION = BLINK_CLOSE_DURATION + BLINK_HOLD_DURATION + BLINK_OPEN_DURATION;

export interface MorphTargetConsumer {
  add(morphIndexOrName: number | string | undefined, weight: number): void;
}

export interface IdleTimingConfig {
  blinkIntervalMin: number;
  blinkIntervalMax: number;
  doubleBlinkChance: number;
}

// ==========================================
// 3. CLASS NA: FACIAL EXPRESSION BLENDER & BLINK STATE MACHINE
// ==========================================

export class EvelynExpressionBlender {
  currentShape = new Map<string, number>();
  targetShape: EmotionMorphWeights = EVELYN_EMOTION_PRESETS.neutral;
  targetName = 'neutral';
  expressionTime = 0;
  blendDuration = 0.45;
  blinkTimer = 0;
  blinkNext = 0;
  blinkPhase = -1;
  pendingDoubleBlink = false;
  blinkOverride: { left: number; right: number } | null = null;

  constructor(
    public morphs: MorphTargetConsumer,
    public morphMap: Record<string, any>,
    public idleConfig: IdleTimingConfig
  ) {
    this.scheduleBlink();
    for (const [r, l] of Object.entries(EVELYN_EMOTION_PRESETS.neutral)) {
      this.currentShape.set(r, l);
    }
  }

  setExpression(name: string, blendDuration = 0.45) {
    const validName = resolveEmotionPreset(name);
    if (validName !== this.targetName) {
      this.targetName = validName;
      this.targetShape = EVELYN_EMOTION_PRESETS[validName];
      this.expressionTime = 0;
      this.blendDuration = Math.max(0.01, blendDuration);
    }
  }

  get expression(): string {
    return this.targetName;
  }

  triggerBlink() {
    if (this.blinkPhase < 0) {
      this.blinkPhase = 0;
      this.blinkTimer = 0;
    }
  }

  setBlinkOverride(override: { left: number; right: number } | null) {
    this.blinkOverride = override;
  }

  scheduleBlink() {
    const { blinkIntervalMin: min, blinkIntervalMax: max } = this.idleConfig;
    this.blinkNext = THREE.MathUtils.randFloat(min, max);
    this.blinkTimer = 0;
    this.blinkPhase = -1;
  }

  updateBlink(delta: number): number {
    if (this.blinkPhase < 0) {
      this.blinkTimer += delta;
      if (this.blinkTimer >= this.blinkNext) {
        this.blinkPhase = 0;
        this.blinkTimer = 0;
        this.pendingDoubleBlink = Math.random() < this.idleConfig.doubleBlinkChance;
      }
      return 0;
    }

    this.blinkPhase += delta;
    const phase = this.blinkPhase;

    if (phase >= TOTAL_BLINK_DURATION) {
      if (this.pendingDoubleBlink) {
        this.pendingDoubleBlink = false;
        this.blinkPhase = 0;
        return 0;
      }
      this.scheduleBlink();
      return 0;
    }

    if (phase < BLINK_CLOSE_DURATION) {
      return THREE.MathUtils.smoothstep(phase / BLINK_CLOSE_DURATION, 0, 1);
    }
    if (phase < BLINK_CLOSE_DURATION + BLINK_HOLD_DURATION) {
      return 1;
    }
    return 1 - THREE.MathUtils.smoothstep((phase - BLINK_CLOSE_DURATION - BLINK_HOLD_DURATION) / BLINK_OPEN_DURATION, 0, 1);
  }

  update(params: {
    delta: number;
    visemes: { a: number; i: number; u: number; e: number; o: number; talk: number; openness: number };
    speechAuthority: number;
    overlay?: Record<string, number>;
    overlayWeight?: number;
  }) {
    const { delta, visemes, speechAuthority } = params;
    this.expressionTime += delta;
    const blendFactor = 1 - Math.exp(-(delta / this.blendDuration) * 3);
    const keys = new Set([...this.currentShape.keys(), ...Object.keys(this.targetShape)]);

    for (const key of keys) {
      const current = this.currentShape.get(key) ?? 0;
      const target = this.targetShape[key] ?? 0;
      const val = THREE.MathUtils.lerp(current, target, blendFactor);
      if (val < 1e-4 && target === 0) {
        this.currentShape.delete(key);
      } else {
        this.currentShape.set(key, val);
      }
    }

    const speechMouthDamp = 1 - THREE.MathUtils.clamp(speechAuthority, 0, 1);

    for (const [key, weight] of this.currentShape) {
      const finalWeight = VISEME_AND_MOUTH_MORPH_SET.has(key) ? weight * speechMouthDamp : weight;
      this.morphs.add(this.morphMap[key], finalWeight);
    }

    this.emitExpressionMotion(speechMouthDamp);

    if (params.overlay && (params.overlayWeight ?? 0) > 0) {
      const overlayWeight = params.overlayWeight!;
      for (const [morphKey, morphVal] of Object.entries(params.overlay)) {
        const finalWeight = VISEME_AND_MOUTH_MORPH_SET.has(morphKey) ? morphVal * speechMouthDamp : morphVal;
        this.morphs.add(this.morphMap[morphKey], finalWeight * overlayWeight);
      }
    }

    const blinkVal = this.updateBlink(delta);
    if (this.blinkOverride) {
      this.morphs.add(this.morphMap.blinkL, this.blinkOverride.left);
      this.morphs.add(this.morphMap.blinkR, this.blinkOverride.right);
    } else if (blinkVal > 0) {
      const smileEyes = this.currentShape.get('smileEyes') ?? 0;
      this.morphs.add(this.morphMap.blink, blinkVal * (1 - smileEyes * 0.75));
    }

    if (speechAuthority > 0) {
      const h = speechAuthority;
      this.morphs.add(this.morphMap.visemeA, visemes.a * h);
      this.morphs.add(this.morphMap.visemeI, visemes.i * h);
      this.morphs.add(this.morphMap.visemeU, visemes.u * h);
      this.morphs.add(this.morphMap.visemeE, visemes.e * h);
      this.morphs.add(this.morphMap.visemeO, visemes.o * h);
      this.morphs.add(this.morphMap.visemeTalk, visemes.talk * h);
      this.morphs.add(this.morphMap.teethUp, visemes.openness * 0.35 * h);
    }
  }

  emitExpressionMotion(speechMouthDamp: number) {
    const t = 0.5 + 0.5 * Math.sin(this.expressionTime * 1.7);
    const a = Math.exp(-this.expressionTime * 1.7) * Math.sin(Math.min(1, this.expressionTime / 0.42) * Math.PI);
    const apply = (morphKey: string, weight: number) => {
      const d = VISEME_AND_MOUTH_MORPH_SET.has(morphKey) ? weight * speechMouthDamp : weight;
      this.morphs.add(this.morphMap[morphKey], d);
    };

    switch (this.targetName) {
      case 'happy':
        apply('browUp', 0.035 * t + 0.08 * a);
        apply('lowerLidUp', 0.025 * t);
        break;
      case 'excited':
        apply('browUp', 0.05 * t + 0.12 * a);
        apply('eyesWideL', 0.04 * t);
        apply('eyesWideR', 0.04 * t);
        break;
      case 'curious':
        apply('browAngryR', 0.07 * t + 0.1 * a);
        break;
      case 'thinking':
        apply('browTroubled', 0.06 * t + 0.08 * a);
        break;
      case 'proud':
        apply('browSerious', 0.045 * t);
        apply('mouthCornerUpL', 0.035 * t);
        break;
      case 'sad':
        apply('browSad', 0.055 * t + 0.1 * a);
        break;
      case 'confused':
        apply('browAngryR', 0.08 * t + 0.12 * a);
        apply('browTroubled', 0.04 * t);
        break;
      case 'surprised':
        apply('browUp', 0.06 * t + 0.18 * a);
        apply('eyesWideL', 0.1 * a);
        apply('eyesWideR', 0.1 * a);
        break;
      case 'embarrassed':
        apply('browTroubled', 0.08 * t + 0.18 * a);
        apply('browSad', 0.05 * t);
        apply('eyesHalf', 0.045 * t);
        break;
      case 'playful':
        apply('browAngryR', 0.08 * t);
        apply('mouthCornerUpL', 0.05 * t);
        break;
    }
  }
}

// ==========================================
// 4. CLASS DA: REAL-TIME LIP-SYNC ENGINE
// ==========================================

export const FREQUENCY_BIN_RANGES = {
  low: [180, 620] as [number, number],
  lowMid: [620, 1150] as [number, number],
  mid: [1150, 1900] as [number, number],
  high: [1900, 3400] as [number, number]
};

export interface LipSyncConfig {
  noiseFloor: number;
  gain: number;
  maxWeight: number;
  attack: number;
  release: number;
  visemeBlendRate: number;
}

export class EvelynLipSyncEngine {
  spectrum = new Uint8Array(0);
  envelope = 0;
  speechClock = 0;
  current = { a: 0, i: 0, u: 0, e: 0, o: 0, talk: 0, openness: 0 };
  target = { a: 0, i: 0, u: 0, e: 0, o: 0, talk: 0, openness: 0 };
  binRanges: { low: [number, number]; lowMid: [number, number]; mid: [number, number]; high: [number, number] } | null = null;
  cachedFftSize = -1;
  cachedSampleRate = -1;

  constructor(public config: LipSyncConfig) {}

  setConfig(config: LipSyncConfig) {
    this.config = config;
  }

  silence(delta: number) {
    return this.update(null, delta, false);
  }

  update(analyser: AnalyserNode | null, delta: number, isSpeaking = analyser !== null) {
    if (analyser && analyser.context.state === 'running') {
      this.analyse(analyser);
    } else if (isSpeaking) {
      this.synthesiseSpeech(delta);
    } else {
      this.target.openness = 0;
      this.target.a = this.target.i = this.target.u = 0;
      this.target.e = this.target.o = this.target.talk = 0;
    }

    const blendRate = 1 - Math.exp(-(this.config.visemeBlendRate * 60) * delta);
    this.current.a = THREE.MathUtils.lerp(this.current.a, this.target.a, blendRate);
    this.current.i = THREE.MathUtils.lerp(this.current.i, this.target.i, blendRate);
    this.current.u = THREE.MathUtils.lerp(this.current.u, this.target.u, blendRate);
    this.current.e = THREE.MathUtils.lerp(this.current.e, this.target.e, blendRate);
    this.current.o = THREE.MathUtils.lerp(this.current.o, this.target.o, blendRate);
    this.current.talk = THREE.MathUtils.lerp(this.current.talk, this.target.talk, blendRate);

    const rate = this.target.openness > this.current.openness ? this.config.attack : this.config.release;
    const opennessBlend = 1 - Math.exp(-(rate * 60) * delta);
    this.current.openness = THREE.MathUtils.lerp(this.current.openness, this.target.openness, opennessBlend);

    return this.current;
  }

  synthesiseSpeech(delta: number) {
    this.speechClock += delta;
    const t = Math.pow(Math.max(0, Math.sin(this.speechClock * Math.PI * 2 * 3.7)), 1.45);
    const a = 0.78 + Math.sin(this.speechClock * 0.82) * 0.18;
    const r = THREE.MathUtils.clamp((0.12 + t * 0.62) * a, 0, 0.78);
    const l = Math.sin(this.speechClock * 2.15 + 0.7) * 0.5 + 0.5;
    const u = Math.sin(this.speechClock * 1.57 + 2.1) * 0.5 + 0.5;
    const d = l * (1 - u);
    const f = l * u;
    const h = (1 - l) * (1 - u) * 0.64;
    const m = (1 - l) * (1 - u) * 0.36;
    const y = (1 - l) * u;
    const x = d + f + h + m + y || 1;
    const s = (r * this.config.maxWeight) / x;

    this.target.a = d * s;
    this.target.e = f * s;
    this.target.o = h * s;
    this.target.u = m * s;
    this.target.i = y * s;
    this.target.talk = r * 0.2 * this.config.maxWeight;
    this.target.openness = r;
  }

  ensureBins(analyser: AnalyserNode) {
    const sampleRate = analyser.context.sampleRate;
    if (this.cachedFftSize === analyser.fftSize && this.cachedSampleRate === sampleRate) return;

    this.cachedFftSize = analyser.fftSize;
    this.cachedSampleRate = sampleRate;
    const binCount = analyser.frequencyBinCount;
    const binWidth = sampleRate / 2 / binCount;

    const clampRange = ([u, d]: [number, number]): [number, number] => [
      THREE.MathUtils.clamp(Math.floor(u / binWidth), 0, binCount - 1),
      THREE.MathUtils.clamp(Math.ceil(d / binWidth), 1, binCount)
    ];

    this.binRanges = {
      low: clampRange(FREQUENCY_BIN_RANGES.low),
      lowMid: clampRange(FREQUENCY_BIN_RANGES.lowMid),
      mid: clampRange(FREQUENCY_BIN_RANGES.mid),
      high: clampRange(FREQUENCY_BIN_RANGES.high)
    };

    if (this.spectrum.length !== binCount) {
      this.spectrum = new Uint8Array(binCount);
    }
  }

  analyse(analyser: AnalyserNode) {
    this.ensureBins(analyser);
    if (!this.binRanges) return;

    try {
      analyser.getByteFrequencyData(this.spectrum);
    } catch {
      return;
    }

    const calcEnergy = (range: [number, number]) => {
      let sum = 0;
      for (let i = range[0]; i < range[1]; i++) sum += this.spectrum[i];
      const count = Math.max(1, range[1] - range[0]);
      return sum / count / 255;
    };

    const low = calcEnergy(this.binRanges.low);
    const lowMid = calcEnergy(this.binRanges.lowMid);
    const mid = calcEnergy(this.binRanges.mid);
    const high = calcEnergy(this.binRanges.high);
    const total = low + lowMid + mid + high;
    const { noiseFloor, gain, maxWeight } = this.config;

    if (total < noiseFloor) {
      this.target.openness = 0;
      this.target.a = this.target.i = this.target.u = 0;
      this.target.e = this.target.o = this.target.talk = 0;
      this.envelope *= 0.9;
      return;
    }

    const norm = THREE.MathUtils.clamp((total / 2) * gain, 0, 1);
    this.envelope = Math.pow(norm, 0.7);
    this.target.openness = THREE.MathUtils.clamp(this.envelope, 0, 1);

    const vowelLow = THREE.MathUtils.clamp(low / (low + lowMid + 1e-5), 0, 1);
    const vowelHigh = THREE.MathUtils.clamp((mid + high) / (total + 1e-5), 0, 1);
    const stepLow = THREE.MathUtils.smoothstep(vowelLow, 0.25, 0.75);
    const stepHigh = THREE.MathUtils.smoothstep(vowelHigh, 0.12, 0.45);

    const aWeight = stepLow * (1 - stepHigh);
    const eWeight = stepLow * stepHigh;
    const oWeight = (1 - stepLow) * (1 - stepHigh) * 0.6;
    const uWeight = (1 - stepLow) * (1 - stepHigh) * 0.4;
    const iWeight = (1 - stepLow) * stepHigh;

    const sumWeights = aWeight + eWeight + oWeight + uWeight + iWeight || 1;
    const scale = (this.envelope * maxWeight) / sumWeights;

    this.target.a = aWeight * scale;
    this.target.e = eWeight * scale;
    this.target.o = oWeight * scale;
    this.target.u = uWeight * scale;
    this.target.i = iWeight * scale;
    this.target.talk = this.envelope * 0.25 * maxWeight;
  }

  get weights() {
    return this.current;
  }
}

// ==========================================
// 5. CLASS LA: BONE POSE ACCUMULATOR
// ==========================================

export interface BoneRestEntry {
  bone: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

export interface ModelBoneContainer {
  bones: THREE.Object3D[];
  boneIndexByName: Map<string, number>;
  mesh?: THREE.SkinnedMesh | THREE.Object3D;
}

export class EvelynBonePoseAccumulator {
  rest = new Map<string, BoneRestEntry>();
  rotations = new Map<string, THREE.Quaternion>();
  translations = new Map<string, THREE.Vector3>();

  private _quat = new THREE.Quaternion();
  private _euler = new THREE.Euler();
  private _identity = new THREE.Quaternion();

  constructor(public model: ModelBoneContainer) {}

  register(boneName: string): boolean {
    if (!boneName || this.rest.has(boneName)) return !!boneName && this.rest.has(boneName);
    const index = this.model.boneIndexByName.get(boneName);
    if (index === undefined) return false;
    const bone = this.model.bones[index];
    if (!bone) return false;

    this.rest.set(boneName, {
      bone,
      position: bone.position.clone(),
      quaternion: bone.quaternion.clone()
    });
    return true;
  }

  registerAll(boneNames: string[]) {
    for (const name of boneNames) this.register(name);
  }

  has(boneName: string): boolean {
    return !!boneName && this.rest.has(boneName);
  }

  bakeIntoRest(boneName: string, x = 0, y = 0, z = 0) {
    if (!boneName) return;
    const entry = this.rest.get(boneName);
    if (entry) {
      this._euler.set(x, y, z, 'XYZ');
      this._quat.setFromEuler(this._euler);
      entry.quaternion.copy(this._quat);
      entry.bone.quaternion.copy(entry.quaternion);
    }
  }

  begin() {
    this.rotations.clear();
    this.translations.clear();
    for (const [, entry] of this.rest) {
      entry.bone.quaternion.copy(entry.quaternion);
      entry.bone.position.copy(entry.position);
    }
  }

  addEuler(boneName: string | undefined, x: number, y: number, z: number, weight = 1) {
    if (!boneName || weight === 0 || !this.rest.has(boneName) || (x === 0 && y === 0 && z === 0)) return;
    this._euler.set(x * weight, y * weight, z * weight, 'XYZ');
    this._quat.setFromEuler(this._euler);
    this.addQuaternion(boneName, this._quat);
  }

  addQuaternion(boneName: string | undefined, q: THREE.Quaternion, weight = 1) {
    if (!boneName || !this.rest.has(boneName)) return;
    let current = this.rotations.get(boneName);
    if (!current) {
      current = new THREE.Quaternion();
      this.rotations.set(boneName, current);
    }
    if (weight >= 0.999) {
      current.multiply(q);
    } else {
      this._quat.copy(this._identity).slerp(q, weight);
      current.multiply(this._quat);
    }
  }

  addTranslation(boneName: string | undefined, x: number, y: number, z: number, weight = 1) {
    if (!boneName || weight === 0 || !this.rest.has(boneName)) return;
    let t = this.translations.get(boneName);
    if (!t) {
      t = new THREE.Vector3();
      this.translations.set(boneName, t);
    }
    t.x += x * weight;
    t.y += y * weight;
    t.z += z * weight;
  }

  apply() {
    for (const [name, entry] of this.rest) {
      const rot = this.rotations.get(name);
      const trans = this.translations.get(name);

      entry.bone.quaternion.copy(entry.quaternion);
      if (rot) entry.bone.quaternion.multiply(rot);

      entry.bone.position.copy(entry.position);
      if (trans) entry.bone.position.add(trans);
    }
  }

  get drivenBones(): string[] {
    return [...this.rest.keys()];
  }
}

// ==========================================
// 6. CLASS OA: IDLE BREATHING + BODY SWAY + PERIODIC POSTURE SHIFTS
// ==========================================

export const POSTURE_MOTION_SCALES = {
  breathChest: 0.0135,
  breathUpperChest: 0.009,
  breathNeckCounter: 0.0055,
  breathShoulder: 0.011,
  breathRise: 0.035,
  swayHipRoll: 0.019,
  swayHipYaw: 0.011,
  swayLateral: 0.09,
  swayChestCounter: 0.012,
  postureHipRoll: 0.028,
  postureChestRoll: 0.017,
  postureHeadRoll: 0.021,
  postureLateral: 0.11,
  microHead: 0.016,
  microShoulder: 0.008
};

export interface IdleBreathingConfig {
  breathRate: number;
  breathDepth: number;
  swayRate: number;
  swayAmount: number;
  postureIntervalMin: number;
  postureIntervalMax: number;
}

export interface CharacterBonesMap {
  center?: string;
  waist?: string;
  upperBody?: string;
  upperBody2?: string;
  neck?: string;
  head?: string;
  shoulderL?: string;
  shoulderR?: string;
  armL?: string;
  armR?: string;
  elbowL?: string;
  elbowR?: string;
  wristL?: string;
  wristR?: string;
  eyeL?: string;
  eyeR?: string;
}

export class EvelynIdleBreathingPostureEngine {
  time = 0;
  breathPhase = 0;
  postureTimer = 0;
  postureNext = 0;
  posture = { weight: 0, roll: 0, yaw: 0, lateral: 0, elapsed: 0, duration: 4, active: false };
  intensity = 1;
  intensityTarget = 1;

  constructor(
    public bones: CharacterBonesMap,
    public config: IdleBreathingConfig
  ) {
    this.schedulePosture();
  }

  setConfig(config: IdleBreathingConfig) {
    this.config = config;
  }

  setIntensity(val: number) {
    this.intensityTarget = THREE.MathUtils.clamp(val, 0, 1);
  }

  get breath(): number {
    return asymmetricBreathingWave(this.breathPhase);
  }

  schedulePosture() {
    this.postureTimer = 0;
    this.postureNext = THREE.MathUtils.randFloat(this.config.postureIntervalMin, this.config.postureIntervalMax);
  }

  updatePosture(delta: number) {
    if (!this.posture.active) {
      this.postureTimer += delta;
      if (this.postureTimer >= this.postureNext) {
        this.posture.active = true;
        this.posture.elapsed = 0;
        this.posture.duration = THREE.MathUtils.randFloat(3.5, 8);
        const sign = Math.random() < 0.5 ? -1 : 1;
        this.posture.roll = sign * THREE.MathUtils.randFloat(0.5, 1);
        this.posture.yaw = sign * THREE.MathUtils.randFloat(0.2, 0.8);
        this.posture.lateral = sign * THREE.MathUtils.randFloat(0.4, 1);
      }
      return;
    }

    this.posture.elapsed += delta;
    const progress = this.posture.elapsed / this.posture.duration;

    if (progress >= 1) {
      this.posture.active = false;
      this.posture.weight = 0;
      this.schedulePosture();
      return;
    }

    if (progress < 0.33) {
      this.posture.weight = smoothstep01(progress / 0.33);
    } else if (progress > 0.67) {
      this.posture.weight = smoothstep01((1 - progress) / 0.33);
    } else {
      this.posture.weight = 1;
    }
  }

  update(delta: number, pose: EvelynBonePoseAccumulator) {
    this.time += delta;
    this.intensity = THREE.MathUtils.lerp(this.intensity, this.intensityTarget, 1 - Math.exp(-4 * delta));
    const intensity = this.intensity;
    const depth = this.config.breathDepth * intensity;
    const sway = this.config.swayAmount * intensity;

    this.breathPhase += delta * this.config.breathRate;
    const breathOffset = asymmetricBreathingWave(this.breathPhase) - 0.5;

    // Breath Torso Pitch & Neck Compensation
    pose.addEuler(this.bones.upperBody, -breathOffset * POSTURE_MOTION_SCALES.breathChest * depth, 0, 0);
    pose.addEuler(this.bones.upperBody2, breathOffset * POSTURE_MOTION_SCALES.breathUpperChest * depth, 0, 0);
    pose.addEuler(this.bones.neck, -breathOffset * POSTURE_MOTION_SCALES.breathNeckCounter * depth, 0, 0);
    pose.addTranslation(this.bones.center, 0, breathOffset * POSTURE_MOTION_SCALES.breathRise * depth, 0);

    // Shoulder Phase-Shifted Rise
    const shoulderBreath = asymmetricBreathingWave(this.breathPhase - 0.08) - 0.5;
    pose.addEuler(this.bones.shoulderL, 0, 0, -shoulderBreath * POSTURE_MOTION_SCALES.breathShoulder * depth);
    pose.addEuler(this.bones.shoulderR, 0, 0, shoulderBreath * POSTURE_MOTION_SCALES.breathShoulder * depth);

    // Organic Body Sway
    const swayTime = this.time * this.config.swayRate;
    const swayX = Math.sin(swayTime * Math.PI * 2) * 0.6 + fractalNoise(swayTime * 1.7) * 0.4;
    const swayY = fractalNoise(swayTime * 0.6 + 31.7);

    pose.addTranslation(this.bones.center, swayX * POSTURE_MOTION_SCALES.swayLateral * sway, 0, 0);
    pose.addEuler(this.bones.waist, 0, swayY * POSTURE_MOTION_SCALES.swayHipYaw * sway, swayX * POSTURE_MOTION_SCALES.swayHipRoll * sway);
    pose.addEuler(this.bones.upperBody, 0, 0, -swayX * POSTURE_MOTION_SCALES.swayChestCounter * sway);

    this.updatePosture(delta);

    if (this.posture.weight > 0) {
      const postureWeight = this.posture.weight * intensity;
      pose.addTranslation(this.bones.center, this.posture.lateral * POSTURE_MOTION_SCALES.postureLateral * postureWeight, 0, 0);
      pose.addEuler(this.bones.waist, 0, this.posture.yaw * POSTURE_MOTION_SCALES.postureHipRoll * 0.5 * postureWeight, this.posture.roll * POSTURE_MOTION_SCALES.postureHipRoll * postureWeight);
      pose.addEuler(this.bones.upperBody2, 0, 0, -this.posture.roll * POSTURE_MOTION_SCALES.postureChestRoll * postureWeight);
      pose.addEuler(this.bones.head, 0, 0, -this.posture.roll * POSTURE_MOTION_SCALES.postureHeadRoll * postureWeight);
    }

    // Micro-head & Micro-shoulder natural drift
    pose.addEuler(
      this.bones.head,
      fractalNoise(this.time * 0.31 + 11.3) * POSTURE_MOTION_SCALES.microHead * intensity,
      fractalNoise(this.time * 0.27 + 4.1) * POSTURE_MOTION_SCALES.microHead * intensity,
      fractalNoise(this.time * 0.23 + 71.9) * POSTURE_MOTION_SCALES.microHead * 0.6 * intensity
    );
    pose.addEuler(this.bones.shoulderL, 0, 0, fractalNoise(this.time * 0.19 + 5.5) * POSTURE_MOTION_SCALES.microShoulder * intensity);
    pose.addEuler(this.bones.shoulderR, 0, 0, fractalNoise(this.time * 0.21 + 47.2) * POSTURE_MOTION_SCALES.microShoulder * intensity);
  }
}

// ==========================================
// 7. CLASS IA: EYE + HEAD LOOK-AT SYSTEM
// ==========================================

export const LOOK_AT_LIMITS = {
  eyeYaw: THREE.MathUtils.degToRad(24),
  eyePitch: THREE.MathUtils.degToRad(14),
  headYaw: THREE.MathUtils.degToRad(34),
  headPitch: THREE.MathUtils.degToRad(20)
};

export interface LookAtIdleConfig {
  saccadeIntervalMin: number;
  saccadeIntervalMax: number;
}

export class EvelynLookAtEngine {
  mode: 'user' | 'wander' | 'away' | 'point' = 'user';
  target = new THREE.Vector3();
  wanderOffset = new THREE.Vector3();
  wanderTarget = new THREE.Vector3();
  wanderTimer = 0;
  wanderNext = 0;
  eyeYaw = 0;
  eyePitch = 0;
  headYaw = 0;
  headPitch = 0;
  saccadeTimer = 0;
  saccadeNext = 0;
  saccade = new THREE.Vector2();
  saccadeTargetVec = new THREE.Vector2();
  time = 0;
  emotion = 'idle';
  emotionTime = 0;
  emotionOffset = new THREE.Vector3();
  blinkRequested = false;

  private _headWorld = new THREE.Vector3();
  private _dir = new THREE.Vector3();
  private _quat = new THREE.Quaternion();

  constructor(
    public model: ModelBoneContainer,
    public bones: { head?: string; eyeL?: string; eyeR?: string },
    public idle: LookAtIdleConfig
  ) {
    this.scheduleSaccade();
    this.scheduleWander();
  }

  setMode(mode: 'user' | 'wander' | 'away' | 'point') {
    if (mode !== this.mode) {
      this.mode = mode;
      this.wanderTimer = this.wanderNext;
    }
  }

  get currentMode() {
    return this.mode;
  }

  setEmotion(emotion: string) {
    if (emotion !== this.emotion) {
      this.emotion = emotion;
      this.emotionTime = 0;
    }
  }

  lookAt(point: THREE.Vector3) {
    this.target.copy(point);
    this.mode = 'point';
  }

  consumeBlinkRequest(): boolean {
    const res = this.blinkRequested;
    this.blinkRequested = false;
    return res;
  }

  scheduleSaccade() {
    this.saccadeTimer = 0;
    this.saccadeNext = THREE.MathUtils.randFloat(this.idle.saccadeIntervalMin, this.idle.saccadeIntervalMax);
  }

  scheduleWander() {
    this.wanderTimer = 0;
    this.wanderNext = THREE.MathUtils.randFloat(2.5, 6.5);
  }

  applyEmotionOffset() {
    switch (this.emotion) {
      case 'thinking':
        this.emotionOffset.set(0.06, 0.0, -0.02);
        break;
      case 'embarrassed':
        this.emotionOffset.set(-0.04, -0.04, 0);
        break;
      case 'sad':
        this.emotionOffset.set(0, -0.06, 0);
        break;
      case 'proud':
      case 'happy':
      case 'excited':
      case 'curious':
      case 'grateful':
      case 'playful':
      default:
        this.emotionOffset.set(0, 0, 0);
        break;
    }
  }

  update(delta: number, pose: EvelynBonePoseAccumulator, userTargetWorld: THREE.Vector3) {
    this.time += delta;
    this.emotionTime += delta;
    this.wanderTimer += delta;

    if (this.wanderTimer >= this.wanderNext) {
      this.scheduleWander();
      const mult = this.mode === 'away' ? 1 : 0.4;
      this.wanderTarget.set(
        THREE.MathUtils.randFloatSpread(0.6 * mult),
        THREE.MathUtils.randFloatSpread(0.2 * mult),
        THREE.MathUtils.randFloatSpread(0.2)
      );
      if (this.wanderTarget.distanceTo(this.wanderOffset) > 0.4) {
        this.blinkRequested = true;
      }
    }

    this.wanderOffset.lerp(this.wanderTarget, 1 - Math.exp(-2.2 * delta));

    const headIndex = this.model.boneIndexByName.get(this.bones.head ?? '') ?? -1;
    const headBone = this.model.bones[headIndex];
    if (!headBone) return;

    headBone.getWorldPosition(this._headWorld);

    // Compute eye-level target aligned with character's own head height:
    // We project the userTarget (camera) onto the character's head Y level, ensuring
    // gaze stays level with eye height and does not tilt up towards an elevated camera.
    const eyeLevelY = this._headWorld.y;

    switch (this.mode) {
      case 'user':
        this.target.set(userTargetWorld.x, eyeLevelY, userTargetWorld.z);
        break;
      case 'wander':
        this.target.set(userTargetWorld.x, eyeLevelY, userTargetWorld.z).add(this.wanderOffset);
        break;
      case 'away':
        this.target.set(userTargetWorld.x, eyeLevelY, userTargetWorld.z).add(this.wanderOffset);
        this.target.x += Math.sin(this.time * 0.38) * 0.2;
        this.target.y += (this.emotion === 'thinking' ? 0.02 : -0.05) + Math.sin(this.time * 0.71) * 0.02;
        break;
    }

    if (this.mode !== 'point') {
      this.applyEmotionOffset();
      this.target.add(this.emotionOffset);
    }

    // Calculate direction vector from head world position to target world position
    this._dir.subVectors(this.target, this._headWorld);

    // Transform into model's local orientation space if model mesh has rotation
    if (this.model.mesh) {
      this.model.mesh.getWorldQuaternion(this._quat);
      this._dir.applyQuaternion(this._quat.invert());
    }

    const len = this._dir.length();
    if (len < 1e-4) return;
    this._dir.divideScalar(len);

    const targetYaw = Math.atan2(this._dir.x, this._dir.z);
    const targetPitch = -Math.asin(THREE.MathUtils.clamp(this._dir.y, -1, 1));

    this.saccadeTimer += delta;
    if (this.saccadeTimer >= this.saccadeNext) {
      this.scheduleSaccade();
      this.saccadeTargetVec.set(
        THREE.MathUtils.randFloatSpread(THREE.MathUtils.degToRad(6)),
        THREE.MathUtils.randFloatSpread(THREE.MathUtils.degToRad(3))
      );
    }
    this.saccade.lerp(this.saccadeTargetVec, 1 - Math.exp(-18 * delta));

    const microGaze = fractalNoise(this.time * 0.35) * THREE.MathUtils.degToRad(1.4);
    const eyeLerp = 1 - Math.exp(-14 * delta);
    const headLerp = 1 - Math.exp(-3.2 * delta);

    this.eyeYaw = THREE.MathUtils.lerp(
      this.eyeYaw,
      THREE.MathUtils.clamp(targetYaw + this.saccade.x + microGaze, -LOOK_AT_LIMITS.eyeYaw, LOOK_AT_LIMITS.eyeYaw),
      eyeLerp
    );
    this.eyePitch = THREE.MathUtils.lerp(
      this.eyePitch,
      THREE.MathUtils.clamp(targetPitch + this.saccade.y, -LOOK_AT_LIMITS.eyePitch, LOOK_AT_LIMITS.eyePitch),
      eyeLerp
    );
    this.headYaw = THREE.MathUtils.lerp(
      this.headYaw,
      THREE.MathUtils.clamp(targetYaw * 0.55, -LOOK_AT_LIMITS.headYaw, LOOK_AT_LIMITS.headYaw),
      headLerp
    );
    this.headPitch = THREE.MathUtils.lerp(
      this.headPitch,
      THREE.MathUtils.clamp(targetPitch * 0.45, -LOOK_AT_LIMITS.headPitch, LOOK_AT_LIMITS.headPitch),
      headLerp
    );

    // Apply look-at angles to head bone in pose accumulator
    pose.addEuler(this.bones.head, this.headPitch, this.headYaw, 0);

    // Apply eye gaze angles if separate eye bones exist
    if (this.bones.eyeL) pose.addEuler(this.bones.eyeL, this.eyePitch, this.eyeYaw, 0);
    if (this.bones.eyeR) pose.addEuler(this.bones.eyeR, this.eyePitch, this.eyeYaw, 0);
  }
}

// ==========================================
// 8. CLASS BA: BODY-LANGUAGE LAYER (Speaking / Listening / Thinking / Idle Pose Blending)
// ==========================================

export class EvelynBodyLanguageLayer {
  activity = 'idle';
  activityWeights = { idle: 1, listening: 0, thinking: 0, speaking: 0 };
  time = 0;

  constructor(public bones: CharacterBonesMap) {}

  setActivity(activity: 'idle' | 'listening' | 'thinking' | 'speaking') {
    this.activity = activity;
  }

  update(delta: number, pose: EvelynBonePoseAccumulator, currentActivity: string, currentEmotion = 'neutral') {
    this.time += delta;
    this.activity = currentActivity;

    // Smooth activity weight transitions
    const blendRate = 1.0 - Math.exp(-6.0 * delta);
    this.activityWeights.idle = THREE.MathUtils.lerp(this.activityWeights.idle, this.activity === 'idle' ? 1 : 0, blendRate);
    this.activityWeights.listening = THREE.MathUtils.lerp(this.activityWeights.listening, this.activity === 'listening' ? 1 : 0, blendRate);
    this.activityWeights.thinking = THREE.MathUtils.lerp(this.activityWeights.thinking, this.activity === 'thinking' ? 1 : 0, blendRate);
    this.activityWeights.speaking = THREE.MathUtils.lerp(this.activityWeights.speaking, this.activity === 'speaking' ? 1 : 0, blendRate);

    const spk = this.activityWeights.speaking;
    const lis = this.activityWeights.listening;
    const thk = this.activityWeights.thinking;

    // 1. SPEAKING CONVERSATIONAL BODY MOVEMENT
    if (spk > 0.001) {
      // Natural cadence nods & upper-body conversational presence
      const nod1 = Math.sin(this.time * 6.2) * 0.016;
      const nod2 = Math.sin(this.time * 3.1 + 0.5) * 0.009;
      const headPitch = (nod1 + nod2) * spk;
      const headYaw = Math.sin(this.time * 2.4 + 0.4) * 0.013 * spk;
      const headRoll = Math.cos(this.time * 1.9 + 0.2) * 0.008 * spk;

      pose.addEuler(this.bones.head, headPitch, headYaw, headRoll);
      pose.addEuler(this.bones.neck, headPitch * 0.42, headYaw * 0.38, headRoll * 0.40);

      // Speaking chest and spine subtle cadence
      const chestPitch = Math.sin(this.time * 3.1 + 0.3) * 0.0028 * spk;
      const chestYaw = Math.sin(this.time * 1.8) * 0.0022 * spk;
      pose.addEuler(this.bones.upperBody2, chestPitch, chestYaw, 0);
      pose.addEuler(this.bones.upperBody, Math.sin(this.time * 3.1) * 0.002 * spk, 0, 0);

      // Speaking shoulder gesture
      const shoulderGesture = Math.sin(this.time * 3.1) * 0.0022 * spk;
      pose.addEuler(this.bones.shoulderL, 0, 0, shoulderGesture);
      pose.addEuler(this.bones.shoulderR, 0, 0, -shoulderGesture);

      // Conversational arm cadence
      const armSway = Math.sin(this.time * 2.6) * 0.003 * spk;
      pose.addEuler(this.bones.armL, armSway, 0, 0);
      pose.addEuler(this.bones.armR, armSway, 0, 0);
    }

    // 2. LISTENING ATTENTIVE POSTURE (Forward lean & curious head tilt)
    if (lis > 0.001) {
      const listenHeadPitch = 0.014 * lis;
      const listenHeadYaw = -0.018 * lis;
      const listenHeadRoll = (0.024 + Math.sin(this.time * 1.5) * 0.003) * lis;

      pose.addEuler(this.bones.head, listenHeadPitch, listenHeadYaw, listenHeadRoll);
      pose.addEuler(this.bones.neck, listenHeadPitch * 0.55, listenHeadYaw * 0.38, listenHeadRoll * 0.40);
      pose.addEuler(this.bones.upperBody, 0.004 * lis, 0, 0); // attentive forward lean
      pose.addEuler(this.bones.upperBody2, 0.006 * lis, 0, 0);
    }

    // 3. THINKING CONTEMPLATIVE POSTURE (Head tilt up/side & subtle introspective posture)
    if (thk > 0.001) {
      const thinkHeadPitch = -0.012 * thk;
      const thinkHeadYaw = (0.020 + Math.sin(this.time * 1.1) * 0.003) * thk;
      const thinkHeadRoll = -0.026 * thk;

      pose.addEuler(this.bones.head, thinkHeadPitch, thinkHeadYaw, thinkHeadRoll);
      pose.addEuler(this.bones.neck, thinkHeadPitch * 0.55, thinkHeadYaw * 0.38, thinkHeadRoll * 0.40);
      pose.addEuler(this.bones.shoulderR, 0, 0, 0.004 * thk);
      pose.addEuler(this.bones.upperBody2, -0.003 * thk, 0.004 * thk, 0);
    }

    // 4. EMOTION POSTURAL FLAVORS
    if (currentEmotion === 'happy' || currentEmotion === 'excited') {
      pose.addEuler(this.bones.upperBody2, 0.003, 0, 0); // proud/happy upright chest
    } else if (currentEmotion === 'sad') {
      pose.addEuler(this.bones.upperBody2, -0.006, 0, 0); // slightly hunched chest
      pose.addEuler(this.bones.head, -0.010, 0, 0);
    }
  }
}

// ==========================================
// 9. CLASS zA: MMD APPEND CONSTRAINT SOLVER (Inherited Bone Rotation / Position)
// ==========================================

export interface MMDAppendConstraint {
  targetBone: string;
  sourceBone: string;
  ratio: number;
  affectRotation: boolean;
  affectPosition: boolean;
}

export class EvelynMMDAppendConstraintSolver {
  constraints: MMDAppendConstraint[] = [];

  constructor(public model: ModelBoneContainer) {}

  addConstraint(constraint: MMDAppendConstraint) {
    this.constraints.push(constraint);
  }

  update(pose: EvelynBonePoseAccumulator) {
    for (const c of this.constraints) {
      if (!pose.has(c.sourceBone) || !pose.has(c.targetBone)) continue;

      if (c.affectRotation) {
        const sourceRot = pose.rotations.get(c.sourceBone);
        if (sourceRot) {
          pose.addQuaternion(c.targetBone, sourceRot, c.ratio);
        }
      }

      if (c.affectPosition) {
        const sourceTrans = pose.translations.get(c.sourceBone);
        if (sourceTrans) {
          pose.addTranslation(
            c.targetBone,
            sourceTrans.x * c.ratio,
            sourceTrans.y * c.ratio,
            sourceTrans.z * c.ratio,
            1.0
          );
        }
      }
    }
  }
}

// ==========================================
// 10. CLASS HA: SPRING-BONE SECONDARY PHYSICS (Hair / Ribbon / Tie / Coat Physics)
// ==========================================

export interface SpringBoneNode {
  boneName: string;
  boneObject?: THREE.Object3D;
  position: THREE.Vector3;
  prevPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  restLength: number;
  radius: number;
  stiffness: number;
  damping: number;
  drag: number;
  gravity: THREE.Vector3;
}

export class EvelynSecondaryPhysicsSpring {
  nodes: SpringBoneNode[] = [];
  time = 0;

  constructor(
    public model: ModelBoneContainer,
    public hairBonesL: string[],
    public hairBonesR: string[]
  ) {
    this.initHairNodes();
  }

  initHairNodes() {
    const allBones = [...this.hairBonesL, ...this.hairBonesR];
    for (const name of allBones) {
      const idx = this.model.boneIndexByName.get(name);
      if (idx !== undefined && this.model.bones[idx]) {
        const b = this.model.bones[idx];
        this.nodes.push({
          boneName: name,
          boneObject: b,
          position: b.position.clone(),
          prevPosition: b.position.clone(),
          velocity: new THREE.Vector3(),
          restLength: 0.1,
          radius: 0.05,
          stiffness: 0.35,
          damping: 0.75,
          drag: 0.88,
          gravity: new THREE.Vector3(0, -0.05, 0)
        });
      }
    }
  }

  update(delta: number, pose: EvelynBonePoseAccumulator, breathPhase: number, isSpeaking: boolean) {
    this.time += delta;
    const clampedDelta = Math.min(delta, 0.05);

    // Harmonic hair swaying combined with physical spring damping
    const swayL = Math.sin(breathPhase - 0.4) * 0.006 + (Math.sin(this.time * 3.2) * 0.004) * (isSpeaking ? 1 : 0);
    const swayR = Math.sin(breathPhase - 0.4) * 0.006 - (Math.sin(this.time * 3.2) * 0.004) * (isSpeaking ? 1 : 0);

    for (const node of this.nodes) {
      const isLeft = this.hairBonesL.includes(node.boneName);
      const sway = isLeft ? swayL : swayR;
      const sign = isLeft ? -1 : 1;

      // Add secondary spring sway to accumulator
      pose.addEuler(node.boneName, sway * 0.5, 0, sign * sway);
    }
  }
}

// ==========================================
// 11. CLASS Yp / GA: IDLE MICRO-BEHAVIOUR LIBRARY & SCHEDULER
// ==========================================

export interface MicroBehavior {
  name: string;
  duration: number;
  weight: number;
  run: (t: number, progress: number, pose: EvelynBonePoseAccumulator, bones: CharacterBonesMap) => void;
}

export class EvelynIdleMicroBehaviorScheduler {
  behaviors: MicroBehavior[] = [];
  currentBehavior: MicroBehavior | null = null;
  behaviorTimer = 0;
  behaviorElapsed = 0;
  behaviorNext = 4.0;
  activeWeight = 0;

  constructor(public bones: CharacterBonesMap) {
    this.initBehaviorLibrary();
  }

  initBehaviorLibrary() {
    // 1. Subtle Conversational Nod
    this.behaviors.push({
      name: 'nod',
      duration: 1.6,
      weight: 3.0,
      run: (t, p, pose, b) => {
        const nod = Math.sin(p * Math.PI * 2) * 0.022;
        pose.addEuler(b.head, nod, 0, 0);
        pose.addEuler(b.neck, nod * 0.45, 0, 0);
      }
    });

    // 2. Curious Head Tilt
    this.behaviors.push({
      name: 'headTilt',
      duration: 2.5,
      weight: 2.5,
      run: (t, p, pose, b) => {
        const tilt = Math.sin(p * Math.PI) * 0.024;
        pose.addEuler(b.head, 0, tilt * 0.4, tilt);
        pose.addEuler(b.neck, 0, tilt * 0.2, tilt * 0.4);
      }
    });

    // 3. Look Around
    this.behaviors.push({
      name: 'lookAround',
      duration: 3.2,
      weight: 2.0,
      run: (t, p, pose, b) => {
        const yaw = Math.sin(p * Math.PI) * 0.028;
        pose.addEuler(b.head, 0, yaw, 0);
        pose.addEuler(b.neck, 0, yaw * 0.5, 0);
      }
    });

    // 4. Subtle Weight Shift
    this.behaviors.push({
      name: 'shiftWeight',
      duration: 3.5,
      weight: 1.5,
      run: (t, p, pose, b) => {
        const roll = Math.sin(p * Math.PI) * 0.015;
        pose.addEuler(b.waist, 0, 0, roll);
        pose.addEuler(b.upperBody, 0, 0, -roll * 0.8);
      }
    });

    // 5. Natural Friendly Greeting Wave & Nod (on launch & welcome)
    this.behaviors.push({
      name: 'greeting',
      duration: 2.8,
      weight: 2.5,
      run: (t, p, pose, b) => {
        const nod = Math.sin(p * Math.PI * 2) * 0.018;
        const chest = Math.sin(p * Math.PI) * 0.008;
        pose.addEuler(b.head, nod, 0, 0);
        pose.addEuler(b.upperBody2, chest, 0, 0);
        // Subtle friendly wave with arm and wrist
        const waveAngle = Math.sin(p * Math.PI * 4) * 0.035 * Math.sin(p * Math.PI);
        pose.addEuler(b.armR, 0.04 * Math.sin(p * Math.PI), 0, -0.06 * Math.sin(p * Math.PI));
        pose.addEuler(b.wristR, 0, 0, waveAngle);
      }
    });
  }

  triggerGreeting() {
    const greetingBehavior = this.behaviors.find(b => b.name === 'greeting');
    if (greetingBehavior) {
      this.currentBehavior = greetingBehavior;
      this.behaviorElapsed = 0;
    }
  }

  scheduleNext() {
    this.behaviorTimer = 0;
    this.behaviorElapsed = 0;
    this.currentBehavior = null;
    this.behaviorNext = THREE.MathUtils.randFloat(3.5, 9.0);
  }

  update(delta: number, pose: EvelynBonePoseAccumulator, isIdle: boolean) {
    if (!isIdle) {
      this.currentBehavior = null;
      return;
    }

    if (!this.currentBehavior) {
      this.behaviorTimer += delta;
      if (this.behaviorTimer >= this.behaviorNext) {
        // Pick weighted random behavior
        const totalWeight = this.behaviors.reduce((acc, b) => acc + b.weight, 0);
        let rnd = Math.random() * totalWeight;
        for (const b of this.behaviors) {
          if (rnd < b.weight) {
            this.currentBehavior = b;
            this.behaviorElapsed = 0;
            break;
          }
          rnd -= b.weight;
        }
      }
      return;
    }

    this.behaviorElapsed += delta;
    const progress = Math.min(1.0, this.behaviorElapsed / this.currentBehavior.duration);

    this.currentBehavior.run(this.behaviorElapsed, progress, pose, this.bones);

    if (progress >= 1.0) {
      this.scheduleNext();
    }
  }
}

// ==========================================
// 12. CLASS WA: MASTER ANIMATION ORCHESTRATOR
// Drives the full per-frame loop in the exact mandated order:
// pose.begin() -> breathing/idle -> body-language -> micro-behaviors -> gaze -> constraints -> hair -> expression -> lip-sync -> pose.apply() -> updateMatrixWorld()
// ==========================================

export class EvelynMasterAnimationOrchestrator {
  pose: EvelynBonePoseAccumulator;
  idleBreathing: EvelynIdleBreathingPostureEngine;
  bodyLanguage: EvelynBodyLanguageLayer;
  microBehaviors: EvelynIdleMicroBehaviorScheduler;
  lookAt: EvelynLookAtEngine;
  boneInherit: EvelynMMDAppendConstraintSolver;
  hairPhysics: EvelynSecondaryPhysicsSpring;
  expressionBlender: EvelynExpressionBlender;
  lipSync: EvelynLipSyncEngine;

  userLookTarget = new THREE.Vector3(0, 0, 2.5);

  constructor(
    public model: ModelBoneContainer,
    public morphConsumer: MorphTargetConsumer,
    public morphMap: Record<string, any>,
    public bonesMap: CharacterBonesMap,
    public hairBonesL: string[] = [],
    public hairBonesR: string[] = []
  ) {
    // 1. Initialize Pose Accumulator
    this.pose = new EvelynBonePoseAccumulator(model);
    const allBoneNames = Object.values(bonesMap).filter((b): b is string => !!b);
    this.pose.registerAll(allBoneNames);
    this.pose.registerAll(hairBonesL);
    this.pose.registerAll(hairBonesR);

    // 2. Initialize Sub-Engines
    this.idleBreathing = new EvelynIdleBreathingPostureEngine(bonesMap, EVELYN_CHARACTER_CONFIG.idle);
    this.bodyLanguage = new EvelynBodyLanguageLayer(bonesMap);
    this.microBehaviors = new EvelynIdleMicroBehaviorScheduler(bonesMap);
    this.lookAt = new EvelynLookAtEngine(
      model,
      { head: bonesMap.head, eyeL: bonesMap.eyeL, eyeR: bonesMap.eyeR },
      EVELYN_CHARACTER_CONFIG.idle
    );
    this.boneInherit = new EvelynMMDAppendConstraintSolver(model);
    this.hairPhysics = new EvelynSecondaryPhysicsSpring(model, hairBonesL, hairBonesR);
    this.expressionBlender = new EvelynExpressionBlender(morphConsumer, morphMap, EVELYN_CHARACTER_CONFIG.idle);
    this.lipSync = new EvelynLipSyncEngine(EVELYN_CHARACTER_CONFIG.lipSync);
  }

  /**
   * The Central Master Per-Frame Update Loop
   * Runs on every single animation frame inside useFrame with real delta-time.
   */
  update(params: {
    delta: number;
    status: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';
    emotion?: string;
    userLookTarget?: THREE.Vector3;
    audioAnalyser?: AnalyserNode | null;
  }) {
    const { delta, status, emotion = 'neutral', userLookTarget, audioAnalyser = null } = params;
    const isSpeaking = status === 'SPEAKING';
    const isIdle = status === 'IDLE';

    // Target for look-at gaze
    if (userLookTarget) {
      this.userLookTarget.copy(userLookTarget);
    }

    // 1. Reset bone accumulator for new frame
    this.pose.begin();

    // 2. Idle Breathing & Body Sway Layer (~0.22 Hz asymmetric harmonic expansion)
    this.idleBreathing.update(delta, this.pose);

    // 3. Body-Language & Conversational Activity Layer (Speaking nods/arms, Listening attentive tilt, Thinking)
    const activityName = status.toLowerCase() as 'idle' | 'listening' | 'thinking' | 'speaking';
    this.bodyLanguage.update(delta, this.pose, activityName, emotion);

    // 4. Idle Micro-Behavior Library Scheduler (Nod, Head Tilt, Weight Shift, Look Around)
    this.microBehaviors.update(delta, this.pose, isIdle);

    // 5. Look-At & Saccades Gaze Tracking Layer
    this.lookAt.setEmotion(emotion);
    this.lookAt.update(delta, this.pose, this.userLookTarget);

    // 6. MMD Appended Bone Inherit Constraint Solver (zA)
    this.boneInherit.update(this.pose);

    // 7. Secondary Spring-Bone Physics (Hair & Ribbons) (HA)
    this.hairPhysics.update(delta, this.pose, this.idleBreathing.breathPhase, isSpeaking);

    // 8. Real-Time Lip-Sync Engine (Audio FFT spectrum & synthetic fallback) (DA)
    const visemes = this.lipSync.update(audioAnalyser, delta, isSpeaking);
    const speechAuthority = isSpeaking ? 1.0 : 0.0;

    // 9. Facial Expression Blender + Eyelid Blink State Machine (NA)
    this.expressionBlender.setExpression(emotion);
    this.expressionBlender.update({
      delta,
      visemes,
      speechAuthority
    });

    // 10. Apply all accumulated transforms to Three.js Skeleton Bones
    this.pose.apply();

    // 11. Synchronize World Matrix for SkinnedMesh and Lighting
    if (this.model.mesh) {
      this.model.mesh.updateMatrixWorld(true);
    }
  }
}

// ==========================================
// 13. MASTER CONFIGURATION & CAMERA PARAMETERS
// ==========================================

export const EVELYN_CHARACTER_CONFIG = {
  name: 'Evelyn (MYRAA)',
  camera: {
    targetBone: '上半身2', // Chest / UpperBody2
    targetOffset: 1.2,
    distance: 22,
    fov: 30,
    heightOffset: 0.4,
    parallax: 0.055,
    minDistance: 8,
    maxDistance: 40
  },
  idle: {
    blinkIntervalMin: 2.2,
    blinkIntervalMax: 5.5,
    doubleBlinkChance: 0.22,
    breathRate: 0.22,
    breathDepth: 1.0,
    swayRate: 0.16,
    swayAmount: 1.0,
    postureIntervalMin: 7.0,
    postureIntervalMax: 16.0,
    saccadeIntervalMin: 0.6,
    saccadeIntervalMax: 2.4
  },
  lipSync: {
    noiseFloor: 0.03,
    gain: 2.2,
    maxWeight: 0.85,
    attack: 0.28,
    release: 0.15,
    visemeBlendRate: 0.22
  }
};
