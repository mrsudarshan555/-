import * as THREE from 'three';
import { MMDLoader } from 'three-stdlib';
import * as MMDParserModule from 'mmd-parser';

// Polyfill window / globalThis for mmd-parser if needed
const ParserClass: any = (MMDParserModule as any).Parser || (MMDParserModule as any).MMDParser || MMDParserModule;
if (typeof window !== 'undefined') {
  (window as any).MMDParser = ParserClass;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).MMDParser = ParserClass;
}

export const PMX_MODEL_URL = 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/model.pmx';
export const LOCAL_PMX_FALLBACK = '/models/model.pmx';
export const TEXTURES_JSON_URL = 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/textures.json';

export const RAW_TEXTURE_URLS: Record<string, string> = {
  'tex_0.png': 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/tex_0.png',
  'tex_1.bmp': 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/tex_1.bmp',
  'tex_2.png': 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/tex_2.png',
  'tex_3.bmp': 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/tex_3.bmp',
  'tex_4.bmp': 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/tex_4.bmp',
  'tex_5.png': 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/tex_5.png',
  'tex_6.png': 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/tex_6.png',
  'tex_7.jpg': 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/tex_7.jpg',
  'tex_8.bmp': 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/tex_8.bmp'
};

export const LOCAL_TEXTURE_URLS: Record<string, string> = {
  'tex_0.png': '/models/tex_0.png',
  'tex_1.bmp': '/models/tex_1.bmp',
  'tex_2.png': '/models/tex_2.png',
  'tex_3.bmp': '/models/tex_3.bmp',
  'tex_4.bmp': '/models/tex_4.bmp',
  'tex_5.png': '/models/tex_5.png',
  'tex_6.png': '/models/tex_6.png',
  'tex_7.jpg': '/models/tex_7.jpg',
  'tex_8.bmp': '/models/tex_8.bmp'
};

export const DEFAULT_TEXTURE_MAPPING: Record<string, string> = {
  'tex\\衣.tga': RAW_TEXTURE_URLS['tex_0.png'],
  'tex/衣.tga': RAW_TEXTURE_URLS['tex_0.png'],
  '衣.tga': RAW_TEXTURE_URLS['tex_0.png'],
  'textures/tex_0.png': RAW_TEXTURE_URLS['tex_0.png'],
  'tex_0.png': RAW_TEXTURE_URLS['tex_0.png'],

  'skin.bmp': RAW_TEXTURE_URLS['tex_1.bmp'],
  'textures/tex_1.bmp': RAW_TEXTURE_URLS['tex_1.bmp'],
  'tex_1.bmp': RAW_TEXTURE_URLS['tex_1.bmp'],

  'tex\\颜.tga': RAW_TEXTURE_URLS['tex_2.png'],
  'tex/颜.tga': RAW_TEXTURE_URLS['tex_2.png'],
  '颜.tga': RAW_TEXTURE_URLS['tex_2.png'],
  'textures/tex_2.png': RAW_TEXTURE_URLS['tex_2.png'],
  'tex_2.png': RAW_TEXTURE_URLS['tex_2.png'],

  'toon_defo.bmp': RAW_TEXTURE_URLS['tex_3.bmp'],
  'textures/tex_3.bmp': RAW_TEXTURE_URLS['tex_3.bmp'],
  'tex_3.bmp': RAW_TEXTURE_URLS['tex_3.bmp'],

  'spa\\2.bmp': RAW_TEXTURE_URLS['tex_4.bmp'],
  'spa/2.bmp': RAW_TEXTURE_URLS['tex_4.bmp'],
  '2.bmp': RAW_TEXTURE_URLS['tex_4.bmp'],
  'textures/tex_4.bmp': RAW_TEXTURE_URLS['tex_4.bmp'],
  'tex_4.bmp': RAW_TEXTURE_URLS['tex_4.bmp'],

  'tex\\衣2.tga': RAW_TEXTURE_URLS['tex_5.png'],
  'tex/衣2.tga': RAW_TEXTURE_URLS['tex_5.png'],
  '衣2.tga': RAW_TEXTURE_URLS['tex_5.png'],
  'textures/tex_5.png': RAW_TEXTURE_URLS['tex_5.png'],
  'tex_5.png': RAW_TEXTURE_URLS['tex_5.png'],

  'spa\\heisi.png': RAW_TEXTURE_URLS['tex_6.png'],
  'spa/heisi.png': RAW_TEXTURE_URLS['tex_6.png'],
  'heisi.png': RAW_TEXTURE_URLS['tex_6.png'],
  'textures/tex_6.png': RAW_TEXTURE_URLS['tex_6.png'],
  'tex_6.png': RAW_TEXTURE_URLS['tex_6.png'],

  'tex\\黑.jpg': RAW_TEXTURE_URLS['tex_7.jpg'],
  'tex/黑.jpg': RAW_TEXTURE_URLS['tex_7.jpg'],
  '黑.jpg': RAW_TEXTURE_URLS['tex_7.jpg'],
  'textures/tex_7.jpg': RAW_TEXTURE_URLS['tex_7.jpg'],
  'tex_7.jpg': RAW_TEXTURE_URLS['tex_7.jpg'],

  'hair.bmp': RAW_TEXTURE_URLS['tex_8.bmp'],
  'textures/tex_8.bmp': RAW_TEXTURE_URLS['tex_8.bmp'],
  'tex_8.bmp': RAW_TEXTURE_URLS['tex_8.bmp']
};

/**
 * Resolves a texture name to its corresponding URL
 */
export function resolveTextureUrl(pathOrName: string, customMap?: Record<string, string>): string | null {
  const map = { ...DEFAULT_TEXTURE_MAPPING, ...(customMap || {}) };
  if (map[pathOrName]) return map[pathOrName];

  try {
    const decoded = decodeURIComponent(pathOrName);
    if (map[decoded]) return map[decoded];
  } catch {}

  const forwardSlash = pathOrName.replace(/\\/g, '/');
  if (map[forwardSlash]) return map[forwardSlash];

  const baseName = forwardSlash.split('/').pop() || '';
  if (map[baseName]) return map[baseName];

  for (const [key, rawUrl] of Object.entries(RAW_TEXTURE_URLS)) {
    if (baseName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(baseName.toLowerCase())) {
      return rawUrl;
    }
  }

  return null;
}

/**
 * Helper to fetch a URL as ArrayBuffer with failover
 */
async function fetchModelBuffer(): Promise<ArrayBuffer> {
  const candidateUrls = [
    PMX_MODEL_URL,
    LOCAL_PMX_FALLBACK
  ];

  let lastError: any = null;
  for (const url of candidateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        if (buffer && buffer.byteLength > 1000) {
          return buffer;
        }
      }
    } catch (err) {
      lastError = err;
      console.warn(`[PMXLoader] Could not fetch model from ${url}:`, err);
    }
  }

  throw lastError || new Error('Failed to fetch PMX model binary from any candidate URL');
}

/**
 * Loads a single texture with automatic failover between GitHub and local models folder
 */
function loadSingleTexture(
  textureLoader: THREE.TextureLoader,
  key: string
): Promise<THREE.Texture> {
  const primaryUrl = RAW_TEXTURE_URLS[key];
  const localUrl = LOCAL_TEXTURE_URLS[key];

  return new Promise((resolve) => {
    textureLoader.load(
      primaryUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.flipY = false;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      () => {
        // Fallback to local
        textureLoader.load(
          localUrl,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.flipY = false;
            tex.needsUpdate = true;
            resolve(tex);
          },
          undefined,
          (err) => {
            console.warn(`[PMXLoader] Texture fallback failed for ${key}, using procedural placeholder:`, err);
            // Create 1x1 procedural texture so it never fails
            const canvas = document.createElement('canvas');
            canvas.width = 4;
            canvas.height = 4;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = key.includes('2') || key.includes('skin') ? '#fbe7d5' : '#4a5568';
              ctx.fillRect(0, 0, 4, 4);
            }
            const fallbackTex = new THREE.CanvasTexture(canvas);
            fallbackTex.colorSpace = THREE.SRGBColorSpace;
            fallbackTex.flipY = false;
            resolve(fallbackTex);
          }
        );
      }
    );
  });
}

/**
 * Loads the Evelyn PMX model with MMDLoader, mapping all textures directly from GitHub.
 */
export async function loadEvelynPMXModel(
  onProgress?: (event: ProgressEvent) => void
): Promise<THREE.Group> {
  // 1. Fetch PMX buffer
  const arrayBuffer = await fetchModelBuffer();

  // 2. Parse PMX Data
  const parser = new ParserClass();
  const data = parser.parsePmx(arrayBuffer, true);
  if (!data || !data.metadata) {
    throw new Error('PMX parser returned invalid metadata');
  }

  // 3. Preload all textures in parallel
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous');

  const textureKeys = [
    'tex_0.png',
    'tex_1.bmp',
    'tex_2.png',
    'tex_3.bmp',
    'tex_4.bmp',
    'tex_5.png',
    'tex_6.png',
    'tex_7.jpg',
    'tex_8.bmp'
  ];

  const loadedTextureMap = new Map<string, THREE.Texture>();
  await Promise.all(
    textureKeys.map(async (key) => {
      const tex = await loadSingleTexture(textureLoader, key);
      loadedTextureMap.set(key, tex);
    })
  );

  // PMX Textures array index to loaded Texture mapping:
  // 0 -> tex_0.png
  // 1 -> tex_1.bmp
  // 2 -> tex_2.png
  // 3 -> tex_3.bmp
  // 4 -> tex_4.bmp
  // 5 -> tex_5.png
  // 6 -> tex_6.png
  // 7 -> tex_7.jpg
  // 8 -> tex_8.bmp
  const indexToTexture = [
    loadedTextureMap.get('tex_0.png'),
    loadedTextureMap.get('tex_1.bmp'),
    loadedTextureMap.get('tex_2.png'),
    loadedTextureMap.get('tex_3.bmp'),
    loadedTextureMap.get('tex_4.bmp'),
    loadedTextureMap.get('tex_5.png'),
    loadedTextureMap.get('tex_6.png'),
    loadedTextureMap.get('tex_7.jpg'),
    loadedTextureMap.get('tex_8.bmp')
  ];

  // 4. Build Three.js Geometry
  const mmdLoader = new MMDLoader();
  const geometry = (mmdLoader as any).meshBuilder.geometryBuilder.build(data);

  // 5. Build Material array for each group with MeshStandardMaterial
  const materials: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < data.metadata.materialCount; i++) {
    const pmxMat = data.materials[i];
    const matName = pmxMat.name || `Material_${i}`;

    let assignedMap: THREE.Texture | undefined = undefined;
    if (pmxMat.textureIndex >= 0 && pmxMat.textureIndex < indexToTexture.length) {
      assignedMap = indexToTexture[pmxMat.textureIndex];
    } else {
      // Fallback matching by material name
      const lower = matName.toLowerCase();
      if (lower.includes('肌') || lower.includes('skin') || lower.includes('body')) {
        assignedMap = loadedTextureMap.get('tex_1.bmp');
      } else if (lower.includes('颜') || lower.includes('face') || lower.includes('目') || lower.includes('口') || lower.includes('眉')) {
        assignedMap = loadedTextureMap.get('tex_2.png');
      } else if (lower.includes('发') || lower.includes('hair')) {
        assignedMap = loadedTextureMap.get('tex_5.png') || loadedTextureMap.get('tex_8.bmp');
      } else if (lower.includes('外套') || lower.includes('coat') || lower.includes('发带')) {
        assignedMap = loadedTextureMap.get('tex_5.png');
      } else {
        assignedMap = loadedTextureMap.get('tex_0.png');
      }
    }

    const diffuseColor = pmxMat.diffuse ? new THREE.Color().fromArray(pmxMat.diffuse.slice(0, 3)) : new THREE.Color(1, 1, 1);
    const opacity = pmxMat.diffuse && pmxMat.diffuse.length >= 4 ? pmxMat.diffuse[3] : 1.0;
    const isHairOrLash = matName.includes('睫') || matName.includes('眉') || matName.includes('发') || matName.includes('hair');
    const isTransparent = opacity < 0.99 || matName.includes('影') || matName.includes('光') || isHairOrLash;

    const standardMat = new THREE.MeshStandardMaterial({
      name: matName,
      color: diffuseColor,
      map: assignedMap,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide,
      transparent: isTransparent,
      opacity: opacity,
      alphaTest: isHairOrLash ? 0.35 : (isTransparent ? 0.05 : 0.0),
      depthWrite: true,
      depthTest: true
    });

    materials.push(standardMat);
  }

  // 6. Assemble SkinnedMesh and Skeleton
  const mesh = new THREE.SkinnedMesh(geometry, materials);
  mesh.name = 'Evelyn_SkinnedMesh';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  // Initialize morph targets if present on geometry
  if (geometry.morphAttributes && Object.keys(geometry.morphAttributes).length > 0) {
    mesh.updateMorphTargets();
  }

  const bones: THREE.Bone[] = [];
  if (geometry.bones && geometry.bones.length > 0) {
    for (let i = 0; i < geometry.bones.length; i++) {
      const gbone = geometry.bones[i];
      const bone = new THREE.Bone();
      bone.name = gbone.name;
      bone.position.fromArray(gbone.pos);
      bone.quaternion.fromArray(gbone.rotq);
      if (gbone.scl) bone.scale.fromArray(gbone.scl);
      bones.push(bone);
    }
    for (let i = 0; i < geometry.bones.length; i++) {
      const gbone = geometry.bones[i];
      if (gbone.parent !== -1 && gbone.parent !== null && bones[gbone.parent]) {
        bones[gbone.parent].add(bones[i]);
      } else {
        mesh.add(bones[i]);
      }
    }
    mesh.updateMatrixWorld(true);
    const skeleton = new THREE.Skeleton(bones);
    mesh.bind(skeleton);
  }

  const rootGroup = new THREE.Group();
  rootGroup.name = 'Evelyn_PMX_Root';
  rootGroup.add(mesh);

  return rootGroup;
}
