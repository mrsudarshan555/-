import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AssistantStatus, CharacterTransform, CharacterLockState } from '../../types';

export interface Character3DRendererProps {
  status: AssistantStatus;
  transform?: CharacterTransform;
  lockState?: CharacterLockState;
  isDragging?: boolean;
  onPointerDown?: (x: number, y: number) => void;
  onPointerMove?: (x: number, y: number) => void;
  onPointerUp?: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onWheel?: (e: React.WheelEvent) => void;
}

// Generate high-resolution procedural anime face texture matching the Evelyn PMX specification
function createAnimeFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Soft Skin Base with gentle warm tone
  ctx.fillStyle = '#FDF6F0';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle skin gradient
  const skinGrad = ctx.createRadialGradient(512, 512, 100, 512, 512, 500);
  skinGrad.addColorStop(0, '#FFFFFF');
  skinGrad.addColorStop(0.7, '#FDF4ED');
  skinGrad.addColorStop(1, '#F3E5DC');
  ctx.fillStyle = skinGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Soft Rosy Anime Cheeks / Blush
  const blushGradL = ctx.createRadialGradient(340, 580, 10, 340, 580, 80);
  blushGradL.addColorStop(0, 'rgba(255, 140, 160, 0.45)');
  blushGradL.addColorStop(1, 'rgba(255, 140, 160, 0.0)');
  ctx.fillStyle = blushGradL;
  ctx.beginPath();
  ctx.arc(340, 580, 80, 0, Math.PI * 2);
  ctx.fill();

  const blushGradR = ctx.createRadialGradient(684, 580, 10, 684, 580, 80);
  blushGradR.addColorStop(0, 'rgba(255, 140, 160, 0.45)');
  blushGradR.addColorStop(1, 'rgba(255, 140, 160, 0.0)');
  ctx.fillStyle = blushGradR;
  ctx.beginPath();
  ctx.arc(684, 580, 80, 0, Math.PI * 2);
  ctx.fill();

  // Subtle blush lines (classic anime style)
  ctx.strokeStyle = 'rgba(255, 120, 140, 0.35)';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(330 + i * 16, 565);
    ctx.lineTo(345 + i * 16, 595);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(674 + i * 16, 565);
    ctx.lineTo(689 + i * 16, 595);
    ctx.stroke();
  }

  // 3. Cyber Temple Markings (Cyan Nanotech Traces)
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(220, 480);
  ctx.lineTo(260, 480);
  ctx.lineTo(280, 510);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(804, 480);
  ctx.lineTo(764, 480);
  ctx.lineTo(744, 510);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Generate high-resolution cyber suit texture
function createCyberSuitTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark obsidian/navy base
  ctx.fillStyle = '#080D1D';
  ctx.fillRect(0, 0, 1024, 1024);

  // Carbon weave pattern
  ctx.fillStyle = '#0D142A';
  for (let y = 0; y < 1024; y += 32) {
    for (let x = 0; x < 1024; x += 32) {
      if ((x + y) % 64 === 0) {
        ctx.fillRect(x, y, 32, 32);
      }
    }
  }

  // Luminescent Cyan & Violet Accent Lines
  ctx.strokeStyle = '#06B6D4';
  ctx.lineWidth = 8;
  ctx.shadowColor = '#22D3EE';
  ctx.shadowBlur = 15;

  // Center chest V-seam
  ctx.beginPath();
  ctx.moveTo(350, 200);
  ctx.lineTo(512, 450);
  ctx.lineTo(674, 200);
  ctx.stroke();

  // Waist cyber bands
  ctx.strokeStyle = '#8B5CF6';
  ctx.shadowColor = '#A78BFA';
  ctx.beginPath();
  ctx.moveTo(250, 700);
  ctx.lineTo(774, 700);
  ctx.stroke();

  ctx.strokeStyle = '#06B6D4';
  ctx.shadowColor = '#22D3EE';
  ctx.beginPath();
  ctx.moveTo(300, 740);
  ctx.lineTo(724, 740);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

const DEFAULT_TRANSFORM: CharacterTransform = { rotationY: 0, pitchX: 0, zoom: 1.0, panY: 0 };
const DEFAULT_LOCK_STATE: CharacterLockState = { isLocked: false };

export const Character3DRenderer: React.FC<Character3DRendererProps> = ({
  status,
  transform = DEFAULT_TRANSFORM,
  lockState = DEFAULT_LOCK_STATE,
  isDragging = false,
  onPointerDown = () => {},
  onPointerMove = () => {},
  onPointerUp = () => {},
  onTouchStart = () => {},
  onTouchMove = () => {},
  onWheel = () => {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Model Sub-nodes
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const hairLeftTailRef = useRef<THREE.Group | null>(null);
  const hairRightTailRef = useRef<THREE.Group | null>(null);
  const mouthMeshRef = useRef<THREE.Mesh | null>(null);
  const eyeLeftRef = useRef<THREE.Mesh | null>(null);
  const eyeRightRef = useRef<THREE.Mesh | null>(null);
  const coreOrbRef = useRef<THREE.Mesh | null>(null);
  const auraParticlesRef = useRef<THREE.Points | null>(null);
  const floorRingsRef = useRef<THREE.Group | null>(null);
  const reqIdRef = useRef<number>(0);

  // Status and transform refs for 60fps render loop
  const statusRef = useRef<AssistantStatus>(status);
  const transformRef = useRef<CharacterTransform>(transform);
  const isDraggingRef = useRef<boolean>(isDragging);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 360;
    const height = containerRef.current.clientHeight || 420;

    // 1. WebGL Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera (Full character framing)
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(0, 0.15, 3.4);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    rendererRef.current = renderer;

    // 4. Cyberpunk Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.0);
    scene.add(ambientLight);

    const cyanKeyLight = new THREE.DirectionalLight(0x06b6d4, 4.0);
    cyanKeyLight.position.set(3, 4, 3);
    scene.add(cyanKeyLight);

    const violetRimLight = new THREE.DirectionalLight(0x8b5cf6, 3.5);
    violetRimLight.position.set(-3, 2, -2);
    scene.add(violetRimLight);

    const softFillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    softFillLight.position.set(0, 1, 3);
    scene.add(softFillLight);

    const bottomGlowLight = new THREE.PointLight(0x06b6d4, 3.0, 8);
    bottomGlowLight.position.set(0, -1.2, 1);
    scene.add(bottomGlowLight);

    // 5. Main Character Root Group
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, -0.4, 0);
    characterGroup.scale.set(1.45, 1.45, 1.45);
    scene.add(characterGroup);
    characterGroupRef.current = characterGroup;

    // --- Floor Holographic Projector Rings ---
    const floorGroup = new THREE.Group();
    floorGroup.position.set(0, -0.7, 0);
    characterGroup.add(floorGroup);
    floorRingsRef.current = floorGroup;

    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const ringGeo1 = new THREE.RingGeometry(0.8, 1.3, 32);
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = -Math.PI / 2;
    floorGroup.add(ringMesh1);

    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const ringGeo2 = new THREE.RingGeometry(1.4, 1.8, 48);
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = -Math.PI / 2;
    floorGroup.add(ringMesh2);

    // Shared Materials & Textures
    const faceTexture = createAnimeFaceTexture();
    const suitTexture = createCyberSuitTexture();

    const skinMat = new THREE.MeshStandardMaterial({
      map: faceTexture,
      roughness: 0.5,
      metalness: 0.05
    });

    const cyberSuitMat = new THREE.MeshStandardMaterial({
      map: suitTexture,
      color: 0x13192f,
      metalness: 0.6,
      roughness: 0.25,
      emissive: 0x050b1a,
      emissiveIntensity: 0.5
    });

    const silverArmorMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.2
    });

    const neonCyanMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.9
    });

    const neonVioletMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.85
    });

    const animeHairMat = new THREE.MeshStandardMaterial({
      color: 0x241142, // Deep midnight purple-indigo
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x170b2c,
      emissiveIntensity: 0.4
    });

    // --- 6. Body Anatomy & Cyber Suit ---
    // Torso / Bodysuit
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.7, 24);
    const torsoMesh = new THREE.Mesh(torsoGeo, cyberSuitMat);
    torsoMesh.position.set(0, 0.65, 0);
    characterGroup.add(torsoMesh);

    // Silver Cyber Collar
    const collarGeo = new THREE.TorusGeometry(0.16, 0.03, 16, 32);
    const collarMesh = new THREE.Mesh(collarGeo, silverArmorMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.set(0, 0.98, 0);
    characterGroup.add(collarMesh);

    // Glowing Chest Core Reactor (Heart)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 3.5,
      roughness: 0.1
    });
    const coreGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const coreOrb = new THREE.Mesh(coreGeo, coreMat);
    coreOrb.position.set(0, 0.78, 0.18);
    characterGroup.add(coreOrb);
    coreOrbRef.current = coreOrb;

    // Glowing Chest Armor Trim
    const chestPlateGeo = new THREE.BoxGeometry(0.3, 0.14, 0.1);
    const chestPlate = new THREE.Mesh(chestPlateGeo, silverArmorMat);
    chestPlate.position.set(0, 0.82, 0.12);
    characterGroup.add(chestPlate);

    // Cyber Corset / Waist Detail
    const waistBeltGeo = new THREE.TorusGeometry(0.2, 0.02, 16, 32);
    const waistBelt = new THREE.Mesh(waistBeltGeo, neonCyanMat);
    waistBelt.rotation.x = Math.PI / 2;
    waistBelt.position.set(0, 0.45, 0);
    characterGroup.add(waistBelt);

    // Pleated Cyber Skirt / Thigh Armor Plates
    const skirtGeo = new THREE.ConeGeometry(0.34, 0.28, 16, 1, true);
    const skirtMesh = new THREE.Mesh(skirtGeo, cyberSuitMat);
    skirtMesh.position.set(0, 0.35, 0);
    characterGroup.add(skirtMesh);

    // Skirt Neon Hem
    const skirtHemGeo = new THREE.TorusGeometry(0.33, 0.015, 16, 32);
    const skirtHem = new THREE.Mesh(skirtHemGeo, neonCyanMat);
    skirtHem.rotation.x = Math.PI / 2;
    skirtHem.position.set(0, 0.22, 0);
    characterGroup.add(skirtHem);

    // --- Slender Anime Legs & Boots ---
    // Left Leg
    const legGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.85, 16);
    const leftLeg = new THREE.Mesh(legGeo, cyberSuitMat);
    leftLeg.position.set(-0.11, -0.15, 0);
    characterGroup.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Mesh(legGeo, cyberSuitMat);
    rightLeg.position.set(0.11, -0.15, 0);
    characterGroup.add(rightLeg);

    // Left Boot / Cyber Thruster
    const bootGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.45, 16);
    const leftBoot = new THREE.Mesh(bootGeo, silverArmorMat);
    leftBoot.position.set(-0.11, -0.4, 0.02);
    characterGroup.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, silverArmorMat);
    rightBoot.position.set(0.11, -0.4, 0.02);
    characterGroup.add(rightBoot);

    // Glowing Boot Soles
    const soleGeo = new THREE.BoxGeometry(0.1, 0.03, 0.2);
    const leftSole = new THREE.Mesh(soleGeo, neonCyanMat);
    leftSole.position.set(-0.11, -0.62, 0.05);
    characterGroup.add(leftSole);

    const rightSole = new THREE.Mesh(soleGeo, neonCyanMat);
    rightSole.position.set(0.11, -0.62, 0.05);
    characterGroup.add(rightSole);

    // --- Slender Shoulders, Arms, & Gauntlets ---
    const shoulderGeo = new THREE.SphereGeometry(0.085, 16, 16);
    const leftShoulder = new THREE.Mesh(shoulderGeo, silverArmorMat);
    leftShoulder.position.set(-0.32, 0.88, 0);
    characterGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, silverArmorMat);
    rightShoulder.position.set(0.32, 0.88, 0);
    characterGroup.add(rightShoulder);

    // Upper Arms (Skin tone)
    const upperArmGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.35, 16);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, skinMat);
    leftUpperArm.position.set(-0.35, 0.72, 0);
    leftUpperArm.rotation.z = 0.15;
    characterGroup.add(leftUpperArm);

    const rightUpperArm = new THREE.Mesh(upperArmGeo, skinMat);
    rightUpperArm.position.set(0.35, 0.72, 0);
    rightUpperArm.rotation.z = -0.15;
    characterGroup.add(rightUpperArm);

    // Cyber Gauntlets / Forearms
    const forearmGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.4, 16);
    const leftForearm = new THREE.Mesh(forearmGeo, cyberSuitMat);
    leftForearm.position.set(-0.4, 0.42, 0.05);
    leftForearm.rotation.z = 0.25;
    leftForearm.rotation.x = -0.2;
    characterGroup.add(leftForearm);

    const rightForearm = new THREE.Mesh(forearmGeo, cyberSuitMat);
    rightForearm.position.set(0.4, 0.42, 0.05);
    rightForearm.rotation.z = -0.25;
    rightForearm.rotation.x = -0.2;
    characterGroup.add(rightForearm);

    // Hands
    const handGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.47, 0.22, 0.1);
    characterGroup.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.47, 0.22, 0.1);
    characterGroup.add(rightHand);

    // --- Slender Anime Neck ---
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.2, 16);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 1.05, 0);
    characterGroup.add(neckMesh);

    // --- 7. Head Group (Articulated for pitch & gaze) ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.28, 0);
    characterGroup.add(headGroup);
    headGroupRef.current = headGroup;

    // Anime Head / Face Mesh (Tapered chin, smooth anime contour)
    const headGeo = new THREE.SphereGeometry(0.26, 32, 32);
    headGeo.scale(0.95, 1.15, 0.95);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(headMesh);

    // Chin Taper
    const chinGeo = new THREE.ConeGeometry(0.14, 0.18, 16);
    const chinMesh = new THREE.Mesh(chinGeo, skinMat);
    chinMesh.position.set(0, -0.22, 0.08);
    chinMesh.rotation.x = Math.PI;
    headGroup.add(chinMesh);

    // --- Anime Face Features: Big Glowing Eyes, Lashes, Mouth ---
    // Eye Whites / Sclera & Iris Texture
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 256;
    eyeCanvas.height = 256;
    const eyeCtx = eyeCanvas.getContext('2d');
    if (eyeCtx) {
      // Sclera
      eyeCtx.fillStyle = '#FFFFFF';
      eyeCtx.beginPath();
      eyeCtx.arc(128, 128, 120, 0, Math.PI * 2);
      eyeCtx.fill();

      // Big Vibrant Aqua/Cyan Anime Iris
      const irisGrad = eyeCtx.createRadialGradient(128, 130, 20, 128, 130, 100);
      irisGrad.addColorStop(0, '#A5F3FC'); // Bright luminescent core
      irisGrad.addColorStop(0.5, '#06B6D4'); // Cyan body
      irisGrad.addColorStop(0.85, '#0E7490'); // Deep aqua ring
      irisGrad.addColorStop(1.0, '#164E63'); // Dark limbal ring
      eyeCtx.fillStyle = irisGrad;
      eyeCtx.beginPath();
      eyeCtx.arc(128, 130, 90, 0, Math.PI * 2);
      eyeCtx.fill();

      // Pupil
      eyeCtx.fillStyle = '#082F49';
      eyeCtx.beginPath();
      eyeCtx.arc(128, 130, 36, 0, Math.PI * 2);
      eyeCtx.fill();

      // Big Anime Catchlights (Dual spark)
      eyeCtx.fillStyle = '#FFFFFF';
      eyeCtx.beginPath();
      eyeCtx.arc(100, 95, 24, 0, Math.PI * 2);
      eyeCtx.fill();

      eyeCtx.beginPath();
      eyeCtx.arc(155, 155, 12, 0, Math.PI * 2);
      eyeCtx.fill();
    }
    const eyeTex = new THREE.CanvasTexture(eyeCanvas);
    const animeEyeMat = new THREE.MeshBasicMaterial({
      map: eyeTex,
      transparent: true
    });

    const eyeGeo = new THREE.PlaneGeometry(0.11, 0.13);
    
    // Left Eye
    const eyeLeft = new THREE.Mesh(eyeGeo, animeEyeMat);
    eyeLeft.position.set(-0.09, 0.02, 0.245);
    eyeLeft.rotation.y = -0.15;
    headGroup.add(eyeLeft);
    eyeLeftRef.current = eyeLeft;

    // Right Eye
    const eyeRight = new THREE.Mesh(eyeGeo, animeEyeMat);
    eyeRight.position.set(0.09, 0.02, 0.245);
    eyeRight.rotation.y = 0.15;
    headGroup.add(eyeRight);
    eyeRightRef.current = eyeRight;

    // Upper Anime Eyelashes
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x1E1B4B });
    const lashGeo = new THREE.BoxGeometry(0.12, 0.02, 0.03);
    const leftLash = new THREE.Mesh(lashGeo, lashMat);
    leftLash.position.set(-0.09, 0.09, 0.25);
    leftLash.rotation.z = -0.1;
    headGroup.add(leftLash);

    const rightLash = new THREE.Mesh(lashGeo, lashMat);
    rightLash.position.set(0.09, 0.09, 0.25);
    rightLash.rotation.z = 0.1;
    headGroup.add(rightLash);

    // Anime Mouth (Dynamic Morph)
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xE11D48 });
    const mouthGeo = new THREE.TorusGeometry(0.035, 0.012, 8, 16, Math.PI);
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthMesh.rotation.x = Math.PI;
    mouthMesh.position.set(0, -0.12, 0.24);
    headGroup.add(mouthMesh);
    mouthMeshRef.current = mouthMesh;

    // --- 8. Evelyn Anime Hairstyle (Twin-Tails + Front Bangs + Headdress) ---
    // Hair Scalp Cap
    const hairCapGeo = new THREE.SphereGeometry(0.28, 24, 24);
    hairCapGeo.scale(1.02, 1.08, 1.05);
    const hairCap = new THREE.Mesh(hairCapGeo, animeHairMat);
    hairCap.position.set(0, 0.06, -0.04);
    headGroup.add(hairCap);

    // Front Bangs (Center & Sides)
    const bangCenterGeo = new THREE.ConeGeometry(0.08, 0.32, 12);
    const bangCenter = new THREE.Mesh(bangCenterGeo, animeHairMat);
    bangCenter.position.set(0, 0.06, 0.25);
    bangCenter.rotation.x = 0.3;
    bangCenter.rotation.z = 0.05;
    headGroup.add(bangCenter);

    const bangLeftGeo = new THREE.ConeGeometry(0.09, 0.45, 12);
    const bangLeft = new THREE.Mesh(bangLeftGeo, animeHairMat);
    bangLeft.position.set(-0.16, -0.02, 0.22);
    bangLeft.rotation.z = -0.35;
    bangLeft.rotation.x = 0.2;
    headGroup.add(bangLeft);

    const bangRightGeo = new THREE.ConeGeometry(0.09, 0.45, 12);
    const bangRight = new THREE.Mesh(bangRightGeo, animeHairMat);
    bangRight.position.set(0.16, -0.02, 0.22);
    bangRight.rotation.z = 0.35;
    bangRight.rotation.x = 0.2;
    headGroup.add(bangRight);

    // --- Left Twin-Tail (Articulated hair physics) ---
    const hairLeftTailGroup = new THREE.Group();
    hairLeftTailGroup.position.set(-0.24, 0.12, -0.05);
    headGroup.add(hairLeftTailGroup);
    hairLeftTailRef.current = hairLeftTailGroup;

    // Cyber Hair Ribbon Ring (Left)
    const ribbonGeo = new THREE.TorusGeometry(0.065, 0.02, 16, 24);
    const ribbonLeft = new THREE.Mesh(ribbonGeo, neonCyanMat);
    ribbonLeft.rotation.y = Math.PI / 2;
    hairLeftTailGroup.add(ribbonLeft);

    // Flowing Long Hair Locks (Segmented)
    const tailSeg1Geo = new THREE.ConeGeometry(0.09, 0.5, 16);
    const tailSeg1 = new THREE.Mesh(tailSeg1Geo, animeHairMat);
    tailSeg1.position.set(-0.06, -0.22, 0);
    tailSeg1.rotation.z = 0.2;
    tailSeg1.rotation.x = -0.15;
    hairLeftTailGroup.add(tailSeg1);

    const tailSeg2Geo = new THREE.ConeGeometry(0.065, 0.65, 16);
    const tailSeg2 = new THREE.Mesh(tailSeg2Geo, animeHairMat);
    tailSeg2.position.set(-0.12, -0.65, 0.05);
    tailSeg2.rotation.z = 0.15;
    tailSeg2.rotation.x = -0.2;
    hairLeftTailGroup.add(tailSeg2);

    // --- Right Twin-Tail (Articulated hair physics) ---
    const hairRightTailGroup = new THREE.Group();
    hairRightTailGroup.position.set(0.24, 0.12, -0.05);
    headGroup.add(hairRightTailGroup);
    hairRightTailRef.current = hairRightTailGroup;

    // Cyber Hair Ribbon Ring (Right)
    const ribbonRight = new THREE.Mesh(ribbonGeo, neonCyanMat);
    ribbonRight.rotation.y = Math.PI / 2;
    hairRightTailGroup.add(ribbonRight);

    const rTailSeg1 = new THREE.Mesh(tailSeg1Geo, animeHairMat);
    rTailSeg1.position.set(0.06, -0.22, 0);
    rTailSeg1.rotation.z = -0.2;
    rTailSeg1.rotation.x = -0.15;
    hairRightTailGroup.add(rTailSeg1);

    const rTailSeg2 = new THREE.Mesh(tailSeg2Geo, animeHairMat);
    rTailSeg2.position.set(0.12, -0.65, 0.05);
    rTailSeg2.rotation.z = -0.15;
    rTailSeg2.rotation.x = -0.2;
    hairRightTailGroup.add(rTailSeg2);

    // --- Cyber Crown Headset / Holographic Antennas ---
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x22d3ee,
      emissiveIntensity: 2.2,
      metalness: 0.9,
      roughness: 0.1
    });
    const crownRingGeo = new THREE.TorusGeometry(0.28, 0.018, 16, 32);
    const crownRing = new THREE.Mesh(crownRingGeo, crownMat);
    crownRing.rotation.x = Math.PI / 5;
    crownRing.position.set(0, 0.2, 0.02);
    headGroup.add(crownRing);

    // Cyber Ear Module Cups
    const earCupGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.06, 16);
    const earCupLeft = new THREE.Mesh(earCupGeo, silverArmorMat);
    earCupLeft.rotation.z = Math.PI / 2;
    earCupLeft.position.set(-0.27, 0.04, 0.02);
    headGroup.add(earCupLeft);

    const earCupRight = new THREE.Mesh(earCupGeo, silverArmorMat);
    earCupRight.rotation.z = Math.PI / 2;
    earCupRight.position.set(0.27, 0.04, 0.02);
    headGroup.add(earCupRight);

    // Ear Emitters
    const earGlowGeo = new THREE.SphereGeometry(0.025, 12, 12);
    const leftEarGlow = new THREE.Mesh(earGlowGeo, neonCyanMat);
    leftEarGlow.position.set(-0.3, 0.04, 0.02);
    headGroup.add(leftEarGlow);

    const rightEarGlow = new THREE.Mesh(earGlowGeo, neonCyanMat);
    rightEarGlow.position.set(0.3, 0.04, 0.02);
    headGroup.add(rightEarGlow);

    // --- 9. Cyber Orbital Dust Particles ---
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 3.5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 3.5 + 0.2;
      particlePositions[i + 2] = (Math.random() - 0.5) * 3.0;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.035,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const auraParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(auraParticles);
    auraParticlesRef.current = auraParticles;

    // --- 10. Animation & Render Loop (60 FPS) ---
    let clock = new THREE.Clock();
    let blinkTimer = 0;
    let isBlinking = false;

    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      const currentStatus = statusRef.current;
      const currentTransform = transformRef.current;
      const dragging = isDraggingRef.current;

      // Smooth Transform Interpolation
      if (characterGroupRef.current) {
        // Horizontal Drag Rotation
        const targetRotY = (currentTransform.rotationY * Math.PI) / 180;
        characterGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          characterGroupRef.current.rotation.y,
          targetRotY,
          dragging ? 0.35 : 0.15
        );

        // Vertical Drag Pitch
        const targetPitchX = (currentTransform.pitchX * Math.PI) / 180;
        if (headGroupRef.current) {
          headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
            headGroupRef.current.rotation.x,
            targetPitchX * 0.7,
            0.2
          );
        }

        // Pinch / Wheel Zoom
        const targetZoom = currentTransform.zoom;
        const currentScale = characterGroupRef.current.scale.x;
        const newScale = THREE.MathUtils.lerp(currentScale, targetZoom, 0.2);
        characterGroupRef.current.scale.set(newScale, newScale, newScale);
      }

      // Breathing Animation (Harmonic sine wave)
      const breath = Math.sin(elapsed * 2.2) * 0.025;
      if (characterGroupRef.current) {
        characterGroupRef.current.position.y = -0.4 + breath * 0.5;
      }

      // Dynamic Hair Twin-Tail Physics Sway
      if (hairLeftTailRef.current && hairRightTailRef.current) {
        const hairSway = Math.sin(elapsed * 2.5) * 0.05;
        hairLeftTailRef.current.rotation.z = Math.sin(elapsed * 2.0) * 0.08 + 0.1;
        hairLeftTailRef.current.rotation.x = -0.15 + hairSway;
        hairRightTailRef.current.rotation.z = -Math.sin(elapsed * 2.0) * 0.08 - 0.1;
        hairRightTailRef.current.rotation.x = -0.15 + hairSway;
      }

      // Natural Eye Blinking Logic
      blinkTimer += 0.016;
      if (blinkTimer > 3.2) {
        isBlinking = true;
        if (blinkTimer > 3.35) {
          isBlinking = false;
          blinkTimer = 0;
        }
      }
      if (eyeLeftRef.current && eyeRightRef.current) {
        const eyeScaleY = isBlinking ? 0.05 : 1.0;
        eyeLeftRef.current.scale.y = eyeScaleY;
        eyeRightRef.current.scale.y = eyeScaleY;
      }

      // State-Specific Animations
      if (currentStatus === 'SPEAKING') {
        // Active mouth movement sync
        if (mouthMeshRef.current) {
          const mouthOpen = Math.abs(Math.sin(elapsed * 12)) * 1.6 + 0.6;
          mouthMeshRef.current.scale.set(1.1, mouthOpen, 1.1);
        }
        if (coreOrbRef.current) {
          (coreOrbRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(0x10b981);
          (coreOrbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 4.0 + Math.sin(elapsed * 10) * 1.5;
        }
        if (floorRingsRef.current) {
          floorRingsRef.current.rotation.y += 0.02;
        }
      } else if (currentStatus === 'THINKING') {
        if (mouthMeshRef.current) {
          mouthMeshRef.current.scale.set(0.9, 0.5, 0.9);
        }
        if (coreOrbRef.current) {
          (coreOrbRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(0xf59e0b);
          (coreOrbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 3.5 + Math.sin(elapsed * 6) * 1.2;
        }
        if (headGroupRef.current) {
          headGroupRef.current.rotation.z = Math.sin(elapsed * 1.8) * 0.06;
        }
        if (floorRingsRef.current) {
          floorRingsRef.current.rotation.y += 0.035;
        }
      } else if (currentStatus === 'LISTENING') {
        if (mouthMeshRef.current) {
          mouthMeshRef.current.scale.set(1.0, 0.4, 1.0);
        }
        if (coreOrbRef.current) {
          (coreOrbRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(0x06b6d4);
          (coreOrbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 4.5 + Math.sin(elapsed * 8) * 2.0;
        }
        if (floorRingsRef.current) {
          floorRingsRef.current.rotation.y += 0.025;
        }
      } else {
        // READY / IDLE
        if (mouthMeshRef.current) {
          mouthMeshRef.current.scale.set(1.0, 0.4, 1.0);
        }
        if (coreOrbRef.current) {
          (coreOrbRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(0x06b6d4);
          (coreOrbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.8 + Math.sin(elapsed * 2) * 0.8;
        }
        if (floorRingsRef.current) {
          floorRingsRef.current.rotation.y += 0.005;
        }
      }

      // Orbital Particle Swarm Rotation
      if (auraParticlesRef.current) {
        auraParticlesRef.current.rotation.y += 0.002;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Responsive Resize Observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(reqIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[320px] flex items-center justify-center select-none ${
        lockState.isLocked ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onPointerDown={(e) => {
        if (!lockState.isLocked) {
          onPointerDown(e.clientX, e.clientY);
        }
      }}
      onPointerMove={(e) => {
        if (!lockState.isLocked) {
          onPointerMove(e.clientX, e.clientY);
        }
      }}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onTouchStart={(e) => {
        if (!lockState.isLocked) {
          onTouchStart(e);
        }
      }}
      onTouchMove={(e) => {
        if (!lockState.isLocked) {
          onTouchMove(e);
        }
      }}
      onTouchEnd={onPointerUp}
      onWheel={(e) => {
        if (!lockState.isLocked) {
          onWheel(e);
        }
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain pointer-events-none drop-shadow-[0_0_25px_rgba(6,182,212,0.35)]"
      />
    </div>
  );
};
