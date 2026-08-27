import fs from 'fs';
import { PNG } from 'pngjs';

console.log('Writing HD pixel textures with pngjs...');

// Helper: create PNG buffer
function createAtlas(width: number, height: number, painter: (png: PNG) => void, outputPath: string) {
  const png = new PNG({ width, height });
  painter(png);
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Wrote ${outputPath} (${width}x${height})`);
}

function setPixel(png: PNG, x: number, y: number, r: number, g: number, b: number, a = 255) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function fillRect(png: PNG, rx: number, ry: number, rw: number, rh: number, r: number, g: number, b: number, a = 255) {
  const x0 = Math.max(0, Math.floor(rx));
  const y0 = Math.max(0, Math.floor(ry));
  const x1 = Math.min(png.width, Math.floor(rx + rw));
  const y1 = Math.min(png.height, Math.floor(ry + rh));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const idx = (png.width * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
}

function fillCircle(png: PNG, cx: number, cy: number, radius: number, r: number, g: number, b: number, a = 255) {
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(png.width, Math.floor(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(png.height, Math.floor(cy + radius));
  for (let y = y0; y < y1; y++) {
    const dy = y - cy;
    for (let x = x0; x < x1; x++) {
      const dx = x - cx;
      if (dx * dx + dy * dy <= r2) {
        setPixel(png, x, y, r, g, b, a);
      }
    }
  }
}

function fillEllipse(png: PNG, cx: number, cy: number, rx: number, ry: number, r: number, g: number, b: number, a = 255) {
  const x0 = Math.max(0, Math.floor(cx - rx));
  const x1 = Math.min(png.width, Math.floor(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry));
  const y1 = Math.min(png.height, Math.floor(cy + ry));
  for (let y = y0; y < y1; y++) {
    const dy = (y - cy) / ry;
    for (let x = x0; x < x1; x++) {
      const dx = (x - cx) / rx;
      if (dx * dx + dy * dy <= 1) {
        setPixel(png, x, y, r, g, b, a);
      }
    }
  }
}

// 1. tex_2.png (Face Texture Atlas - 2048x2048)
createAtlas(2048, 2048, (png) => {
  // Background porcelain skin tone (#FFF4EE)
  fillRect(png, 0, 0, 2048, 2048, 255, 244, 238);

  // Soft face gradient
  fillCircle(png, 1024, 920, 860, 255, 248, 242);
  fillCircle(png, 1024, 920, 600, 255, 252, 248);

  // Blush on cheeks
  fillCircle(png, 660, 1120, 150, 251, 140, 155);
  fillCircle(png, 660, 1120, 100, 251, 113, 133);
  fillCircle(png, 1388, 1120, 150, 251, 140, 155);
  fillCircle(png, 1388, 1120, 100, 251, 113, 133);

  // Nose dot
  fillCircle(png, 1024, 1135, 8, 225, 29, 72);

  // Lips
  for (let x = 960; x <= 1088; x++) {
    const norm = (x - 1024) / 64;
    const y = Math.floor(1300 + (1 - norm * norm) * 20);
    fillCircle(png, x, y, 5, 225, 29, 72);
  }
  fillCircle(png, 1024, 1308, 4, 255, 255, 255); // Lip gloss

  // Eyes in bottom-right UV islands (matching tex_2.png)
  const drawEye = (cx: number, cy: number) => {
    // Sclera
    fillEllipse(png, cx, cy, 125, 155, 255, 255, 255);
    fillEllipse(png, cx, cy - 50, 125, 75, 220, 226, 236);
    // Iris (Violet / Indigo gradient)
    fillEllipse(png, cx, cy + 10, 105, 135, 99, 102, 241);
    fillEllipse(png, cx, cy + 20, 90, 115, 168, 85, 247);
    fillEllipse(png, cx, cy + 30, 70, 90, 216, 180, 254);
    // Dark pupil
    fillEllipse(png, cx, cy - 5, 45, 60, 15, 23, 42);
    // Luminous catchlights
    fillCircle(png, cx - 36, cy - 42, 26, 255, 255, 255);
    fillCircle(png, cx + 36, cy + 42, 14, 255, 255, 255);
    // Eyelash line
    for (let ex = cx - 130; ex <= cx + 130; ex++) {
      const en = (ex - cx) / 130;
      const ey = Math.floor(cy - 60 - (1 - en * en) * 45);
      fillCircle(png, ex, ey, 8, 15, 23, 42);
    }
  };

  drawEye(1520, 1820);
  drawEye(1860, 1820);
}, 'public/textures/tex_2.png');

// 2. tex_0.png (Suit / Outfit Texture Atlas - 2048x2048)
createAtlas(2048, 2048, (png) => {
  // Dark charcoal fabric base (#141721)
  fillRect(png, 0, 0, 2048, 2048, 20, 23, 33);

  // Top Left: Skin and Thigh-High Stockings with Gold Garter Bands
  fillRect(png, 20, 20, 640, 240, 255, 245, 240); // Skin
  fillRect(png, 20, 180, 640, 460, 26, 30, 41); // Stockings
  fillRect(png, 20, 174, 640, 12, 230, 180, 72); // Gold band
  fillRect(png, 20, 196, 640, 6, 255, 215, 0); // Gold trim
  fillRect(png, 340, 196, 6, 444, 230, 180, 72); // Seam

  // Top Center: Belts & Buckles
  const beltYs = [60, 120, 190, 240, 300];
  for (const by of beltYs) {
    fillRect(png, 740, by, 1160, 40, 15, 19, 28);
    fillRect(png, 740, by, 1160, 4, 217, 163, 41);
    fillRect(png, 740, by + 36, 1160, 4, 217, 163, 41);
    for (let bx = 800; bx < 1850; bx += 100) {
      fillCircle(png, bx, by + 20, 5, 252, 211, 77);
    }
  }

  // Center: Black Corset / Bodice with Gold Crossings
  for (let y = 420; y < 1440; y++) {
    const p = (y - 420) / 1020;
    const xL = Math.floor(680 - Math.sin(p * Math.PI) * 80);
    const xR = Math.floor(1080 + Math.sin(p * Math.PI) * 80);
    fillRect(png, xL, y, xR - xL, 1, 16, 19, 27);
  }
  // Gold crossing lines
  for (let y = 420; y < 1440; y++) {
    const p = (y - 420) / 1020;
    const x1 = Math.floor(680 + p * 380);
    const x2 = Math.floor(1080 - p * 380);
    fillCircle(png, x1, y, 4, 230, 180, 72);
    fillCircle(png, x2, y, 4, 230, 180, 72);
  }
  // Gold choker
  fillRect(png, 800, 420, 160, 30, 217, 163, 41);
  fillCircle(png, 880, 435, 12, 253, 224, 71);

  // Center Right: Crisp White Shirt & Vest
  for (let y = 600; y < 1100; y++) {
    fillRect(png, 1160, y, 420, 1, 255, 255, 255);
  }
  fillRect(png, 1340, 600, 4, 500, 203, 213, 225);
  // Vest buttons
  for (let by = 660; by <= 1040; by += 75) {
    fillCircle(png, 1342, by, 8, 51, 65, 85);
    fillCircle(png, 1342, by, 4, 226, 232, 240);
  }

  // Right Edge: Gold Silk Tie
  for (let y = 260; y < 1200; y++) {
    fillRect(png, 1925, y, 80, 1, 245, 158, 11);
  }
  fillCircle(png, 1965, 360, 14, 30, 27, 75);
  fillCircle(png, 1965, 360, 8, 253, 224, 71);

  // Middle Right: Warm Brown Tailcoat Flaps
  fillRect(png, 1460, 420, 480, 1000, 56, 32, 23);
  fillRect(png, 1480, 420, 440, 980, 15, 18, 25);

  // Bottom: Skirt Panels & Gold Arabesque Filigree
  fillRect(png, 40, 1240, 1600, 540, 17, 20, 28);
  for (let fx = 120; fx < 1600; fx += 160) {
    for (let py = 0; py <= 100; py++) {
      const px = fx + Math.sin(py / 100 * Math.PI) * 40;
      const y = 1340 + py * 4;
      fillCircle(png, Math.floor(px), y, 3, 234, 179, 8);
    }
  }

  // Bottom Gold Waist Crest
  for (let y = 1600; y < 1960; y++) {
    const p = Math.sin(((y - 1600) / 360) * Math.PI);
    const hw = Math.floor(p * 220);
    fillRect(png, 1024 - hw, y, hw * 2, 1, 245, 158, 11);
  }

  // Left Middle: Dark Gloves & Crimson Fingertips
  fillRect(png, 80, 540, 540, 620, 19, 22, 31);
  fillCircle(png, 160, 620, 36, 220, 38, 38);
  fillCircle(png, 260, 580, 36, 220, 38, 38);
  fillCircle(png, 360, 600, 36, 220, 38, 38);
  fillRect(png, 100, 700, 480, 4, 251, 191, 36);
  fillRect(png, 100, 1120, 480, 4, 251, 191, 36);
}, 'public/textures/tex_0.png');

// 3. tex_5.png (Hair & Outer Cape Atlas - 2048x2048)
createAtlas(2048, 2048, (png) => {
  // Top: Golden-Blonde Hair Base (#EBD59B -> #D4B870)
  for (let y = 0; y < 860; y++) {
    const p = y / 860;
    const r = Math.floor(235 - p * 35);
    const g = Math.floor(213 - p * 40);
    const b = Math.floor(155 - p * 50);
    fillRect(png, 0, y, 2048, 1, r, g, b);
  }
  // Hair shine ring
  fillRect(png, 0, 240, 2048, 100, 255, 248, 220);
  // Braid Headband
  fillCircle(png, 1550, 440, 240, 212, 184, 112);
  fillCircle(png, 1550, 440, 200, 235, 213, 155);

  // Bottom: Obsidian Outer Cape with Gold Swirling Lines
  fillRect(png, 0, 860, 2048, 1188, 16, 19, 27);
  for (let cx = 600; cx <= 1400; cx += 160) {
    for (let y = 880; y < 2048; y++) {
      const p = (y - 880) / 1168;
      const x = Math.floor(cx - Math.sin(p * Math.PI) * 80);
      fillCircle(png, x, y, 4, 230, 180, 72);
    }
  }

  // Red Inner Lining
  fillRect(png, 180, 860, 380, 360, 185, 28, 28);
  fillRect(png, 1500, 1440, 220, 600, 185, 28, 28);

  // Silver Dagger & Sheath
  fillRect(png, 100, 1340, 340, 30, 226, 232, 240);
  fillRect(png, 80, 1380, 420, 60, 15, 23, 42);
  fillRect(png, 480, 1380, 40, 100, 220, 38, 38);
}, 'public/textures/tex_5.png');

// 4. tex_6.png (Spa Heisi - 1024x1024)
createAtlas(1024, 1024, (png) => {
  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const dx = (x - 512) / 512;
      const dy = (y - 512) / 512;
      const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      const val = Math.floor(255 - dist * 130);
      setPixel(png, x, y, val, val, val);
    }
  }
}, 'public/textures/tex_6.png');

// 5. tex_7.jpg / png (Dark Visor - 512x512)
createAtlas(512, 512, (png) => {
  fillRect(png, 0, 0, 512, 512, 20, 23, 32);
}, 'public/textures/tex_7.jpg');

// Mirror also into public/tex for direct GLTF path matching
fs.copyFileSync('public/textures/tex_0.png', 'public/tex/衣.tga');
fs.copyFileSync('public/textures/tex_2.png', 'public/tex/颜.tga');
fs.copyFileSync('public/textures/tex_5.png', 'public/tex/衣2.tga');
fs.copyFileSync('public/textures/tex_7.jpg', 'public/tex/黑.jpg');

console.log('All texture files written successfully!');
