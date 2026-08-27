import * as THREE from 'three';

/**
 * Textures configuration and mappings based on textures.json
 */
export const TEXTURE_MAP_CONFIG = {
  face: '/textures/tex_2.png',        // 'tex\\颜.tga' -> tex_2.png (Face, blush, lips, eyes)
  clothing: '/textures/tex_0.png',    // 'tex\\衣.tga' -> tex_0.png (Suit, shirt, tie, belts, stockings)
  outfit2: '/textures/tex_5.png',     // 'tex\\衣2.tga' -> tex_5.png (Hair braids, outer cape, red lining, dagger)
  skin: '/textures/tex_1.bmp',        // 'skin.bmp' -> tex_1.bmp (Skin base)
  heisi: '/textures/tex_6.png',       // 'spa\\heisi.png' -> tex_6.png (Fabric sheen)
  visor: '/textures/tex_7.jpg'        // 'tex\\黑.jpg' -> tex_7.jpg (Visor / Orb)
};

// Material indices in the Evelyn GLTF model (Mesh 0 with 31 primitives):
export const FACE_MAT_INDICES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
export const OUTFIT2_MAT_INDICES = new Set([14, 15, 16, 23, 28, 29, 30]);
export const HIDDEN_ORB_INDICES = new Set([27]);
export const CLOTHING_MAT_INDICES = new Set([0, 13, 17, 18, 19, 20, 21, 22, 24, 25, 26]);

/**
 * Load and configure all textures with:
 * - texture.flipY = false;
 * - texture.colorSpace = THREE.SRGBColorSpace;
 * - texture.needsUpdate = true;
 */
export function loadCharacterTextures(): {
  faceTexture: THREE.Texture;
  clothingTexture: THREE.Texture;
  outfit2Texture: THREE.Texture;
  skinTexture: THREE.Texture;
} {
  const loader = new THREE.TextureLoader();

  const configureTexture = (url: string): THREE.Texture => {
    const tex = loader.load(url);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  };

  return {
    faceTexture: configureTexture(TEXTURE_MAP_CONFIG.face),
    clothingTexture: configureTexture(TEXTURE_MAP_CONFIG.clothing),
    outfit2Texture: configureTexture(TEXTURE_MAP_CONFIG.outfit2),
    skinTexture: configureTexture(TEXTURE_MAP_CONFIG.skin)
  };
}

let cachedTextures: ReturnType<typeof loadCharacterTextures> | null = null;

export function getCharacterTextures() {
  if (!cachedTextures) {
    cachedTextures = loadCharacterTextures();
  }
  return cachedTextures;
}
