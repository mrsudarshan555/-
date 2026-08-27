import React, { useRef, useEffect } from 'react';
import { AssistantStatus, AppearanceConfig } from '../../types';
import { getSpeechAudioAnalyser } from '../../utils/speechEngine';

interface VoiceControlOrbProps {
  status: AssistantStatus;
  isListeningMode?: boolean;
  size?: number;
  className?: string;
  appearanceConfig?: AppearanceConfig;
}

interface Particle {
  x0: number;
  y0: number;
  z0: number;
  colorIdx: number;
  speed: number;
  phase: number;
  radiusOffset: number;
  baseSize: number;
}

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): RGBColor {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

// Generate palette dynamically from configuration
function getOrbPalette(appearanceConfig?: AppearanceConfig): RGBColor[] {
  if (appearanceConfig?.customHue !== undefined) {
    const hue = appearanceConfig.customHue;
    return [
      hslToRgb(hue, 95, 55),
      hslToRgb(hue + 35, 95, 65),
      hslToRgb(hue + 70, 100, 75),
      hslToRgb(hue - 35, 90, 55),
      { r: 255, g: 255, b: 255 }, // White sparkle core
      hslToRgb(hue + 120, 90, 60),
      hslToRgb(hue - 60, 95, 50),
      hslToRgb(hue + 180, 85, 65)
    ];
  }

  const orbColor = appearanceConfig?.orbColor || 'spectrum';
  switch (orbColor) {
    case 'cyan':
      return [
        { r: 6, g: 182, b: 212 },
        { r: 34, g: 211, b: 238 },
        { r: 103, g: 232, b: 249 },
        { r: 14, g: 165, b: 233 },
        { r: 255, g: 255, b: 255 },
        { r: 56, g: 189, b: 248 },
        { r: 2, g: 132, b: 199 },
        { r: 186, g: 230, b: 253 }
      ];
    case 'blue':
      return [
        { r: 37, g: 99, b: 235 },
        { r: 59, g: 130, b: 246 },
        { r: 96, g: 165, b: 250 },
        { r: 147, g: 197, b: 253 },
        { r: 255, g: 255, b: 255 },
        { r: 29, g: 78, b: 216 },
        { r: 99, g: 102, b: 241 }
      ];
    case 'violet':
      return [
        { r: 139, g: 92, b: 246 },
        { r: 168, g: 85, b: 247 },
        { r: 192, g: 132, b: 252 },
        { r: 216, g: 180, b: 254 },
        { r: 255, g: 255, b: 255 },
        { r: 124, g: 58, b: 237 },
        { r: 232, g: 121, b: 249 }
      ];
    case 'orange':
      return [
        { r: 234, g: 88, b: 12 },
        { r: 249, g: 115, b: 22 },
        { r: 251, g: 146, b: 60 },
        { r: 253, g: 186, b: 116 },
        { r: 255, g: 255, b: 255 },
        { r: 194, g: 65, b: 12 },
        { r: 245, g: 158, b: 11 }
      ];
    case 'emerald':
      return [
        { r: 5, g: 150, b: 105 },
        { r: 16, g: 185, b: 129 },
        { r: 52, g: 211, b: 153 },
        { r: 110, g: 231, b: 183 },
        { r: 255, g: 255, b: 255 },
        { r: 4, g: 120, b: 87 },
        { r: 20, g: 184, b: 166 }
      ];
    case 'pink':
      return [
        { r: 219, g: 39, b: 119 },
        { r: 236, g: 72, b: 153 },
        { r: 244, g: 114, b: 182 },
        { r: 249, g: 168, b: 212 },
        { r: 255, g: 255, b: 255 },
        { r: 190, g: 24, b: 93 },
        { r: 251, g: 113, b: 133 }
      ];
    case 'gold':
      return [
        { r: 217, g: 119, b: 6 },
        { r: 245, g: 158, b: 11 },
        { r: 251, g: 191, b: 36 },
        { r: 252, g: 211, b: 77 },
        { r: 255, g: 255, b: 255 },
        { r: 180, g: 83, b: 9 }
      ];
    case 'spectrum':
    default:
      return [
        { r: 34, g: 211, b: 238 }, // Cyan
        { r: 96, g: 165, b: 250 }, // Electric Sky
        { r: 192, g: 132, b: 252 }, // Violet
        { r: 244, g: 114, b: 182 }, // Pink
        { r: 251, g: 191, b: 36 }, // Gold
        { r: 255, g: 255, b: 255 }, // White Core
        { r: 168, g: 85, b: 247 }, // Purple
        { r: 56, g: 189, b: 248 }  // Luminous Cyan
      ];
  }
}

export const VoiceControlOrb: React.FC<VoiceControlOrbProps> = ({
  status,
  isListeningMode = false,
  size = 52,
  className = '',
  appearanceConfig
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const palette = getOrbPalette(appearanceConfig);
    const orbType = appearanceConfig?.orbType || 'classic';
    const visualizerEnabled = appearanceConfig?.voiceVisualizerEnabled ?? true;

    // Generate 3D Fibonacci Particle Sphere
    const particleCount = orbType === 'energy' ? 220 : orbType === 'neon' ? 180 : 190;
    const particles: Particle[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < particleCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);

      const x0 = Math.sin(phi) * Math.cos(theta);
      const y0 = Math.cos(phi);
      const z0 = Math.sin(phi) * Math.sin(theta);

      const colorIdx = i % palette.length;

      particles.push({
        x0,
        y0,
        z0,
        colorIdx,
        speed: 0.7 + (i % 5) * 0.25,
        phase: (i * 1.37) % (Math.PI * 2),
        radiusOffset: ((i % 7) - 3) * 0.04,
        baseSize: orbType === 'neon' 
          ? (i % 6 === 0 ? 2.1 : i % 3 === 0 ? 1.6 : 1.2)
          : (i % 8 === 0 ? 1.8 : i % 3 === 0 ? 1.4 : 1.05)
      });
    }

    let animationFrameId: number;
    let angleY = 0;
    let angleX = 0.3;
    let time = 0;
    const frequencyData = new Uint8Array(32);

    const render = () => {
      time += 0.022;
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const baseRadius = size * 0.36;

      const isSpeaking = status === 'SPEAKING';
      const isListening = isListeningMode || status === 'LISTENING';
      const isThinking = status === 'THINKING';

      // 1. Audio Activity Sampling from Analyser
      let audioVolume = 0;
      const analyser = getSpeechAudioAnalyser();

      if (analyser && (isSpeaking || isListening) && visualizerEnabled) {
        try {
          analyser.getByteFrequencyData(frequencyData);
          let sum = 0;
          const count = Math.min(16, frequencyData.length);
          for (let i = 0; i < count; i++) {
            sum += frequencyData[i];
          }
          audioVolume = (sum / count) / 255;
        } catch {
          audioVolume = 0;
        }
      }

      // Continuous dynamic curve for idle & active states
      if (audioVolume <= 0.02) {
        if (isSpeaking) {
          audioVolume = 0.38 + 0.42 * Math.abs(Math.sin(time * 3.6));
        } else if (isListening) {
          audioVolume = 0.18 + 0.22 * Math.abs(Math.sin(time * 2.4));
        } else if (isThinking) {
          audioVolume = 0.26 + 0.32 * Math.abs(Math.sin(time * 4.2));
        } else {
          // Subtle continuous idle breathing and rotation even when idle
          audioVolume = 0.07 + 0.07 * Math.sin(time * 1.6);
        }
      }

      // 2. Continuous 3D Rotation Speeds (Active in idle state as well)
      const rotSpeedY = isThinking ? 0.048 : isSpeaking ? 0.034 : isListening ? 0.025 : 0.014;
      const rotSpeedX = isThinking ? 0.022 : isSpeaking ? 0.015 : 0.009;

      angleY += rotSpeedY;
      angleX += rotSpeedX;

      // 3. Radius Pulsation
      const sphereRadius = baseRadius * (1 + audioVolume * 0.35 + Math.sin(time * 2.2) * 0.04);

      // 4. Central Multi-Color Blended Radiant Glow
      const primaryColor = palette[0] || { r: 34, g: 211, b: 238 };
      const secondaryColor = palette[1] || { r: 168, g: 85, b: 247 };
      const tertiaryColor = palette[2] || { r: 244, g: 114, b: 182 };

      const auraGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, sphereRadius * 1.45
      );

      const auraIntensity = isSpeaking ? 1.0 : isListening ? 0.85 : isThinking ? 0.95 : 0.68;

      auraGradient.addColorStop(0.0, `rgba(255, 255, 255, ${0.45 * auraIntensity})`);
      auraGradient.addColorStop(0.28, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${0.36 * auraIntensity})`);
      auraGradient.addColorStop(0.55, `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, ${0.28 * auraIntensity})`);
      auraGradient.addColorStop(0.78, `rgba(${tertiaryColor.r}, ${tertiaryColor.g}, ${tertiaryColor.b}, ${0.16 * auraIntensity})`);
      auraGradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius * 1.45, 0, Math.PI * 2);
      ctx.fill();

      // 5. 3D Spherical Transform & Depth Calculation
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const transformedList = particles.map((p) => {
        const r = sphereRadius * (1 + p.radiusOffset + Math.sin(time * p.speed + p.phase) * (0.05 + audioVolume * 0.12));

        const px = p.x0 * r;
        const py = p.y0 * r;
        const pz = p.z0 * r;

        // Rotate Y
        const x1 = px * cosY - pz * sinY;
        const z1 = px * sinY + pz * cosY;

        // Rotate X
        const y2 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        // Perspective projection
        const focal = size * 1.85;
        const denom = focal + z2;
        const scale = denom > 0.1 ? focal / denom : 0.01;
        const screenX = centerX + x1 * scale;
        const screenY = centerY + y2 * scale;

        const normalizedZ = (z2 / (sphereRadius * 1.2) + 1) * 0.5;
        const alpha = Math.max(0.18, Math.min(1.0, normalizedZ));

        return {
          p,
          screenX,
          screenY,
          z: z2,
          scale: Math.max(0.01, scale),
          alpha
        };
      });

      // Sort back-to-front
      transformedList.sort((a, b) => a.z - b.z);

      // 6. Draw Multi-Color Luminous Particles
      for (let i = 0; i < transformedList.length; i++) {
        const item = transformedList[i];
        const p = item.p;
        const color = palette[p.colorIdx % palette.length];
        const particleSize = Math.max(0.75, p.baseSize * item.scale * (1 + audioVolume * 0.35));
        const alpha = item.alpha;

        // Draw soft glow aura around foreground particles
        if (item.z > -sphereRadius * 0.2) {
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(item.screenX, item.screenY, Math.max(0.5, particleSize * 2.2), 0, Math.PI * 2);
          ctx.fill();
        }

        // Core bright particle dot
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(1, alpha * 1.15)})`;
        ctx.beginPath();
        ctx.arc(item.screenX, item.screenY, Math.max(0.5, particleSize), 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, isListeningMode, size, appearanceConfig]);

  return (
    <div 
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />
    </div>
  );
};
