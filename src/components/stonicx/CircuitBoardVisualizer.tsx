import React, { useEffect, useRef, useState } from 'react';
import { AssistantStatus } from '../../types';
import { StonicxThemeColor, StonicxFontStyle } from '../../types/stonicxSettings';

export type VisualizerState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface CircuitBoardVisualizerProps {
  status: AssistantStatus | VisualizerState;
  interactive?: boolean;
  className?: string;
  onCoreClick?: () => void;
  overrideState?: VisualizerState;
  seed?: number;
  themeColor?: StonicxThemeColor;
  fontStyle?: StonicxFontStyle;
  haloIntensity?: number;
  edgeVignette?: boolean;
}

interface Point {
  x: number;
  y: number;
  gx?: number;
  gy?: number;
}

interface SMDComponent {
  id: number;
  gx: number;
  gy: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: 0 | 90;
  type: 'resistor' | 'capacitor' | 'micro_ic' | 'qfp_mini' | 'via';
  label: string;
  flashIntensity: number;
}

interface PulseParticle {
  pos: number; // 0 to 1
  speed: number;
  size: number;
  alpha: number;
}

interface SeededTrace {
  id: number;
  points: Point[];
  totalLength: number;
  segmentLengths: number[];
  particles: PulseParticle[];
  width: number;
  isPrimary: boolean;
}

export const STONICX_PALETTES: Record<StonicxThemeColor, {
  name: string;
  primary: string;
  bgDark: string;
  bgRadialCenter: string;
  bgGridSubtle: string;
  fiberglassGrid: string;
  traceShadow: string;
  traceBase: string;
  traceBaseDim: string;
  traceHighlight: string;
  traceGlow: string;
  compBody: string;
  compBorder: string;
  compPad: string;
  compPadHighlight: string;
  compSilkscreen: string;
  boxBody: string;
  boxBorderOuter: string;
  boxBorderInner: string;
  pulseGlow: string;
  pulseBrightCore: string;
}> = {
  cyan: {
    name: 'Electric Cyan',
    primary: '#00F0FF',
    bgDark: '#020611',
    bgRadialCenter: '#051433',
    bgGridSubtle: 'rgba(0, 163, 255, 0.04)',
    fiberglassGrid: 'rgba(0, 229, 255, 0.025)',
    traceShadow: 'rgba(0, 4, 15, 0.95)',
    traceBase: 'rgba(0, 150, 255, 0.45)',
    traceBaseDim: 'rgba(0, 110, 220, 0.28)',
    traceHighlight: 'rgba(120, 235, 255, 0.9)',
    traceGlow: '#00F0FF',
    compBody: '#030C1E',
    compBorder: 'rgba(0, 200, 255, 0.5)',
    compPad: '#0088DD',
    compPadHighlight: '#00F0FF',
    compSilkscreen: 'rgba(0, 229, 255, 0.45)',
    boxBody: 'rgba(2, 10, 26, 0.92)',
    boxBorderOuter: '#00F0FF',
    boxBorderInner: 'rgba(0, 229, 255, 0.35)',
    pulseGlow: '#00F0FF',
    pulseBrightCore: '#FFFFFF'
  },
  emerald: {
    name: 'Matrix Emerald',
    primary: '#00FF9D',
    bgDark: '#010E08',
    bgRadialCenter: '#032616',
    bgGridSubtle: 'rgba(0, 255, 157, 0.04)',
    fiberglassGrid: 'rgba(0, 255, 157, 0.025)',
    traceShadow: 'rgba(0, 10, 5, 0.95)',
    traceBase: 'rgba(0, 200, 120, 0.45)',
    traceBaseDim: 'rgba(0, 150, 85, 0.28)',
    traceHighlight: 'rgba(140, 255, 195, 0.9)',
    traceGlow: '#00FF9D',
    compBody: '#02140B',
    compBorder: 'rgba(0, 255, 157, 0.5)',
    compPad: '#00A85D',
    compPadHighlight: '#00FF9D',
    compSilkscreen: 'rgba(0, 255, 157, 0.45)',
    boxBody: 'rgba(1, 18, 10, 0.92)',
    boxBorderOuter: '#00FF9D',
    boxBorderInner: 'rgba(0, 255, 157, 0.35)',
    pulseGlow: '#00FF9D',
    pulseBrightCore: '#FFFFFF'
  },
  violet: {
    name: 'Royal Cyber Violet',
    primary: '#C084FC',
    bgDark: '#0B0214',
    bgRadialCenter: '#22083A',
    bgGridSubtle: 'rgba(192, 132, 252, 0.04)',
    fiberglassGrid: 'rgba(192, 132, 252, 0.025)',
    traceShadow: 'rgba(10, 0, 20, 0.95)',
    traceBase: 'rgba(168, 85, 247, 0.45)',
    traceBaseDim: 'rgba(140, 45, 220, 0.28)',
    traceHighlight: 'rgba(235, 215, 255, 0.9)',
    traceGlow: '#C084FC',
    compBody: '#130421',
    compBorder: 'rgba(192, 132, 252, 0.5)',
    compPad: '#9D3CE8',
    compPadHighlight: '#F3E8FF',
    compSilkscreen: 'rgba(192, 132, 252, 0.45)',
    boxBody: 'rgba(15, 3, 28, 0.92)',
    boxBorderOuter: '#C084FC',
    boxBorderInner: 'rgba(192, 132, 252, 0.35)',
    pulseGlow: '#C084FC',
    pulseBrightCore: '#FFFFFF'
  },
  amber: {
    name: 'Solar Gold',
    primary: '#FBBF24',
    bgDark: '#120801',
    bgRadialCenter: '#301604',
    bgGridSubtle: 'rgba(251, 191, 36, 0.04)',
    fiberglassGrid: 'rgba(251, 191, 36, 0.025)',
    traceShadow: 'rgba(15, 8, 0, 0.95)',
    traceBase: 'rgba(245, 158, 11, 0.45)',
    traceBaseDim: 'rgba(200, 110, 5, 0.28)',
    traceHighlight: 'rgba(254, 243, 150, 0.9)',
    traceGlow: '#FBBF24',
    compBody: '#1A0E04',
    compBorder: 'rgba(251, 191, 36, 0.5)',
    compPad: '#E08008',
    compPadHighlight: '#FEF08A',
    compSilkscreen: 'rgba(251, 191, 36, 0.45)',
    boxBody: 'rgba(22, 12, 4, 0.92)',
    boxBorderOuter: '#FBBF24',
    boxBorderInner: 'rgba(251, 191, 36, 0.35)',
    pulseGlow: '#FBBF24',
    pulseBrightCore: '#FFFFFF'
  },
  crimson: {
    name: 'Crimson Cyber Pulse',
    primary: '#FB7185',
    bgDark: '#140206',
    bgRadialCenter: '#360613',
    bgGridSubtle: 'rgba(251, 113, 133, 0.04)',
    fiberglassGrid: 'rgba(251, 113, 133, 0.025)',
    traceShadow: 'rgba(20, 0, 5, 0.95)',
    traceBase: 'rgba(244, 63, 94, 0.45)',
    traceBaseDim: 'rgba(210, 25, 65, 0.28)',
    traceHighlight: 'rgba(254, 215, 222, 0.9)',
    traceGlow: '#FB7185',
    compBody: '#1E030B',
    compBorder: 'rgba(251, 113, 133, 0.5)',
    compPad: '#E81C4A',
    compPadHighlight: '#FFE4E8',
    compSilkscreen: 'rgba(251, 113, 133, 0.45)',
    boxBody: 'rgba(26, 4, 11, 0.92)',
    boxBorderOuter: '#FB7185',
    boxBorderInner: 'rgba(251, 113, 133, 0.35)',
    pulseGlow: '#FB7185',
    pulseBrightCore: '#FFFFFF'
  },
  silver: {
    name: 'Cyber Silver / Ice White',
    primary: '#E2E8F0',
    bgDark: '#07090E',
    bgRadialCenter: '#161D30',
    bgGridSubtle: 'rgba(226, 232, 240, 0.04)',
    fiberglassGrid: 'rgba(226, 232, 240, 0.025)',
    traceShadow: 'rgba(0, 0, 0, 0.95)',
    traceBase: 'rgba(148, 163, 184, 0.45)',
    traceBaseDim: 'rgba(95, 110, 130, 0.28)',
    traceHighlight: 'rgba(250, 252, 255, 0.9)',
    traceGlow: '#E2E8F0',
    compBody: '#0D111A',
    compBorder: 'rgba(226, 232, 240, 0.5)',
    compPad: '#6B7E98',
    compPadHighlight: '#FFFFFF',
    compSilkscreen: 'rgba(226, 232, 240, 0.45)',
    boxBody: 'rgba(12, 17, 26, 0.92)',
    boxBorderOuter: '#E2E8F0',
    boxBorderInner: 'rgba(226, 232, 240, 0.35)',
    pulseGlow: '#FFFFFF',
    pulseBrightCore: '#FFFFFF'
  }
};

// Deterministic Mulberry32 PRNG
function createPrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CircuitBoardVisualizer: React.FC<CircuitBoardVisualizerProps> = ({
  status = 'idle',
  interactive = true,
  className = '',
  onCoreClick,
  overrideState,
  seed = 133742,
  themeColor = 'cyan',
  fontStyle = 'Orbitron',
  haloIntensity = 0.9,
  edgeVignette = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const [isHoveringChip, setIsHoveringChip] = useState(false);

  // Normalize status string to 4 core states: 'idle' | 'listening' | 'thinking' | 'speaking'
  const normalizedState: VisualizerState = ((): VisualizerState => {
    if (overrideState) return overrideState;
    const s = String(status).toLowerCase();
    if (s.includes('listen')) return 'listening';
    if (s.includes('think') || s.includes('process')) return 'thinking';
    if (s.includes('speak')) return 'speaking';
    return 'idle';
  })();

  const stateRef = useRef<VisualizerState>(normalizedState);
  useEffect(() => {
    stateRef.current = normalizedState;
  }, [normalizedState]);

  const activePalette = STONICX_PALETTES[themeColor] || STONICX_PALETTES.cyan;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    console.log('[STONICX Visualizer] Signal Bus Online -> 60 FPS locked');

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let traces: SeededTrace[] = [];
    let components: SMDComponent[] = [];
    let chipRect = { x: 0, y: 0, w: 220, h: 84, cx: 0, cy: 0 };
    const CELL_SIZE = 22; // Rich, dense grid for authentic PCB routing

    // Target energy for smooth easing transitions
    let currentEnergy = 0.25;
    let targetEnergy = 0.25;

    // PROCEDURAL HIGH-DENSITY PCB TRACE GENERATION CONCENTRATED IN BOARD CENTER (NATURAL MARGIN FROM EDGES)
    const generateBoard = (w: number, h: number) => {
      const prng = createPrng(seed);
      traces = [];
      components = [];

      const cx = w / 2;
      const cy = h / 2;
      const chipW = Math.max(180, Math.min(240, w * 0.42));
      const chipH = Math.max(76, Math.min(90, h * 0.17));

      chipRect = {
        x: cx - chipW / 2,
        y: cy - chipH / 2,
        w: chipW,
        h: chipH,
        cx,
        cy
      };

      const cols = Math.max(14, Math.floor(w / CELL_SIZE));
      const rows = Math.max(12, Math.floor(h / CELL_SIZE));

      // NATURAL SCREEN SAFETY MARGIN — 5% margin so traces extend across the entire width without clipping
      const marginCols = Math.max(1, Math.floor(cols * 0.05));
      const marginRows = Math.max(1, Math.floor(rows * 0.06));
      const minCol = marginCols;
      const maxCol = cols - marginCols - 1;
      const minRow = marginRows;
      const maxRow = rows - marginRows - 1;

      // Grid cell occupancy tracker
      const occupied: boolean[][] = Array.from({ length: cols }, () =>
        Array.from({ length: rows }, () => false)
      );

      const isCellOccupied = (gx: number, gy: number): boolean => {
        if (gx < minCol || gx > maxCol || gy < minRow || gy > maxRow) return true;
        if (!occupied[gx]) return true;
        return Boolean(occupied[gx][gy]);
      };

      const setCellOccupied = (gx: number, gy: number) => {
        if (gx >= 0 && gx < cols && gy >= 0 && gy < rows && occupied[gx]) {
          occupied[gx][gy] = true;
        }
      };

      // Mark center box area + 1 cell margin as occupied so traces terminate outside the clean center box
      const chipMinCol = Math.max(minCol, Math.floor((chipRect.x - 6) / CELL_SIZE));
      const chipMaxCol = Math.min(maxCol, Math.ceil((chipRect.x + chipRect.w + 6) / CELL_SIZE));
      const chipMinRow = Math.max(minRow, Math.floor((chipRect.y - 6) / CELL_SIZE));
      const chipMaxRow = Math.min(maxRow, Math.ceil((chipRect.y + chipRect.h + 6) / CELL_SIZE));

      for (let c = chipMinCol; c <= chipMaxCol; c++) {
        for (let r = chipMinRow; r <= chipMaxRow; r++) {
          setCellOccupied(c, r);
        }
      }

      // Helper for grid coords to world pixels
      const toWorld = (gx: number, gy: number): Point => ({
        x: gx * CELL_SIZE + CELL_SIZE / 2,
        y: gy * CELL_SIZE + CELL_SIZE / 2,
        gx,
        gy
      });

      // 8-direction vectors (0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW)
      const DIRS: [number, number][] = [
        [0, -1],  // N
        [1, -1],  // NE (45 deg)
        [1, 0],   // E
        [1, 1],   // SE (45 deg)
        [0, 1],   // S
        [-1, 1],  // SW (45 deg)
        [-1, 0],  // W
        [-1, -1]  // NW (45 deg)
      ];

      // 1. PLACE DENSE SMD COMPONENTS AROUND BOARD (Evenly distributed left and right)
      let compIdCounter = 1;
      const numComponents = Math.max(8, Math.floor(((maxCol - minCol) * (maxRow - minRow)) / 32));

      for (let i = 0; i < numComponents; i++) {
        const gx = minCol + Math.floor(prng() * (maxCol - minCol));
        const gy = minRow + Math.floor(prng() * (maxRow - minRow));

        if (!isCellOccupied(gx, gy) && !isCellOccupied(gx + 1, gy)) {
          const roll = prng();
          let compType: SMDComponent['type'] = 'resistor';
          let wComp = 12;
          let hComp = 6;
          let label = `R${compIdCounter}`;

          if (roll < 0.35) {
            compType = 'resistor';
            wComp = 12;
            hComp = 6;
            label = `R${compIdCounter}`;
          } else if (roll < 0.65) {
            compType = 'capacitor';
            wComp = 14;
            hComp = 8;
            label = `C${compIdCounter}`;
          } else if (roll < 0.85) {
            compType = 'micro_ic';
            wComp = 20;
            hComp = 14;
            label = `U${compIdCounter}`;
          } else {
            compType = 'via';
            wComp = 7;
            hComp = 7;
            label = `TP${compIdCounter}`;
          }

          const rot = prng() > 0.5 ? 90 : 0;
          const worldPt = toWorld(gx, gy);

          components.push({
            id: compIdCounter++,
            gx,
            gy,
            x: worldPt.x,
            y: worldPt.y,
            w: rot === 90 ? hComp : wComp,
            h: rot === 90 ? wComp : hComp,
            rotation: rot,
            type: compType,
            label,
            flashIntensity: 0
          });

          setCellOccupied(gx, gy);
          setCellOccupied(gx + 1, gy);
        }
      }

      // 2. DENSE PROCEDURAL BUS & FAN-OUT ROUTING (Authentic long continuous flowing PCB traces, balanced across full width)
      let traceIdCounter = 1;

      // Helper to generate long continuous flowing PCB trace with purposeful straight runs & 45° chamfers
      const generateLongFlowingTrace = (
        traceId: number,
        startGx: number,
        startGy: number,
        initialDir: number,
        preferredDirs: number[],
        maxSteps: number,
        minRunLength: number,
        maxRunLength: number,
        isPrimary: boolean
      ) => {
        const points: Point[] = [];
        let curGx = startGx;
        let curGy = startGy;
        let curDir = initialDir;

        let stepsInCurrentDir = 0;
        let segmentLengthTarget = minRunLength + Math.floor(prng() * (maxRunLength - minRunLength + 1));

        points.push(toWorld(curGx, curGy));
        setCellOccupied(curGx, curGy);

        for (let s = 0; s < maxSteps; s++) {
          if (stepsInCurrentDir >= segmentLengthTarget) {
            // Pick a graceful 45° turn that aligns with preferred fan-out directions
            const validTurns = [-1, 1, 0]; // 45° left, 45° right, or continue straight
            let bestDir = curDir;
            let bestScore = -999;

            validTurns.forEach((t) => {
              const testDir = (curDir + t + 8) % 8;
              const [tdx, tdy] = DIRS[testDir];
              const testNextGx = curGx + tdx;
              const testNextGy = curGy + tdy;

              if (
                testNextGx >= minCol &&
                testNextGx <= maxCol &&
                testNextGy >= minRow &&
                testNextGy <= maxRow &&
                !isCellOccupied(testNextGx, testNextGy)
              ) {
                let score = preferredDirs.includes(testDir) ? 2 : 0;
                if (t === 0) score += 1; // Preference for straight runs
                score += prng() * 1.5;
                if (score > bestScore) {
                  bestScore = score;
                  bestDir = testDir;
                }
              }
            });

            curDir = bestDir;
            stepsInCurrentDir = 0;
            segmentLengthTarget = minRunLength + Math.floor(prng() * (maxRunLength - minRunLength + 1));
          }

          const [dx, dy] = DIRS[curDir];
          const nextGx = curGx + dx;
          const nextGy = curGy + dy;

          // Stay within safe board margin
          if (
            nextGx < minCol ||
            nextGx > maxCol ||
            nextGy < minRow ||
            nextGy > maxRow ||
            isCellOccupied(nextGx, nextGy)
          ) {
            // Try an alternate 45° detour before ending
            const altTurns = [-1, 1];
            let foundAlt = false;
            for (const at of altTurns) {
              const altDir = (curDir + at + 8) % 8;
              const [adx, ady] = DIRS[altDir];
              const altGx = curGx + adx;
              const altGy = curGy + ady;
              if (
                altGx >= minCol &&
                altGx <= maxCol &&
                altGy >= minRow &&
                altGy <= maxRow &&
                !isCellOccupied(altGx, altGy)
              ) {
                curDir = altDir;
                curGx = altGx;
                curGy = altGy;
                setCellOccupied(curGx, curGy);
                points.push(toWorld(curGx, curGy));
                stepsInCurrentDir = 1;
                segmentLengthTarget = minRunLength + Math.floor(prng() * (maxRunLength - minRunLength + 1));
                foundAlt = true;
                break;
              }
            }
            if (!foundAlt) break;
          } else {
            curGx = nextGx;
            curGy = nextGy;
            setCellOccupied(curGx, curGy);
            points.push(toWorld(curGx, curGy));
            stepsInCurrentDir++;
          }
        }

        // Register traces that have good, purposeful length (at least 4 points)
        if (points.length >= 4) {
          let totalLength = 0;
          const segmentLengths: number[] = [];
          for (let i = 0; i < points.length - 1; i++) {
            const segLen = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
            segmentLengths.push(segLen);
            totalLength += segLen;
          }

          const particleCount = isPrimary ? 2 : 1;
          const particles: PulseParticle[] = [];

          for (let p = 0; p < particleCount; p++) {
            particles.push({
              pos: prng(),
              speed: 0.0022 + prng() * 0.0025,
              size: isPrimary ? 2.5 : 1.9,
              alpha: 0.85 + prng() * 0.15
            });
          }

          traces.push({
            id: traceId,
            points,
            totalLength,
            segmentLengths,
            particles,
            width: isPrimary ? 1.6 : 1.1,
            isPrimary
          });
        }
      };

      // A. FAN-OUT BUS TRACES RADIATING FROM CENTRAL CHIP PERIMETER (Cleanly spaced by 2 cells)
      // Top Edge: Radiate upward, North-West, North, North-East into upper board
      for (let c = chipMinCol + 1; c <= chipMaxCol - 1; c += 2) {
        if (chipMinRow > minRow && !isCellOccupied(c, chipMinRow - 1)) {
          const relPos = (c - chipMinCol) / Math.max(1, chipMaxCol - chipMinCol);
          let initDir = 0; // North
          let preferred = [0, 7, 1]; // N, NW, NE
          if (relPos < 0.4) {
            initDir = prng() < 0.6 ? 7 : 0; // NW or N
            preferred = [7, 0, 6];
          } else if (relPos > 0.6) {
            initDir = prng() < 0.6 ? 1 : 0; // NE or N
            preferred = [1, 0, 2];
          }

          generateLongFlowingTrace(
            traceIdCounter++,
            c,
            chipMinRow - 1,
            initDir,
            preferred,
            20 + Math.floor(prng() * 16),
            5,
            12,
            true
          );
        }
      }

      // Bottom Edge: Radiate downward, South-West, South, South-East into lower board
      for (let c = chipMinCol + 1; c <= chipMaxCol - 1; c += 2) {
        if (chipMaxRow < maxRow && !isCellOccupied(c, chipMaxRow + 1)) {
          const relPos = (c - chipMinCol) / Math.max(1, chipMaxCol - chipMinCol);
          let initDir = 4; // South
          let preferred = [4, 5, 3]; // S, SW, SE
          if (relPos < 0.4) {
            initDir = prng() < 0.6 ? 5 : 4; // SW or S
            preferred = [5, 4, 6];
          } else if (relPos > 0.6) {
            initDir = prng() < 0.6 ? 3 : 4; // SE or S
            preferred = [3, 4, 2];
          }

          generateLongFlowingTrace(
            traceIdCounter++,
            c,
            chipMaxRow + 1,
            initDir,
            preferred,
            20 + Math.floor(prng() * 16),
            5,
            12,
            true
          );
        }
      }

      // Left Edge: Radiate westward into left board
      for (let r = chipMinRow + 1; r <= chipMaxRow - 1; r += 2) {
        if (chipMinCol > minCol && !isCellOccupied(chipMinCol - 1, r)) {
          const relPos = (r - chipMinRow) / Math.max(1, chipMaxRow - chipMinRow);
          let initDir = 6; // West
          let preferred = [6, 7, 5]; // W, NW, SW
          if (relPos < 0.4) {
            initDir = prng() < 0.5 ? 7 : 6;
            preferred = [7, 6, 0];
          } else if (relPos > 0.6) {
            initDir = prng() < 0.5 ? 5 : 6;
            preferred = [5, 6, 4];
          }

          generateLongFlowingTrace(
            traceIdCounter++,
            chipMinCol - 1,
            r,
            initDir,
            preferred,
            18 + Math.floor(prng() * 14),
            5,
            10,
            true
          );
        }
      }

      // Right Edge: Radiate eastward into right board (FULLY UTILIZING RIGHT SIDE)
      for (let r = chipMinRow + 1; r <= chipMaxRow - 1; r += 2) {
        if (chipMaxCol < maxCol && !isCellOccupied(chipMaxCol + 1, r)) {
          const relPos = (r - chipMinRow) / Math.max(1, chipMaxRow - chipMinRow);
          let initDir = 2; // East
          let preferred = [2, 1, 3]; // E, NE, SE
          if (relPos < 0.4) {
            initDir = prng() < 0.5 ? 1 : 2;
            preferred = [1, 2, 0];
          } else if (relPos > 0.6) {
            initDir = prng() < 0.5 ? 3 : 2;
            preferred = [3, 2, 4];
          }

          generateLongFlowingTrace(
            traceIdCounter++,
            chipMaxCol + 1,
            r,
            initDir,
            preferred,
            18 + Math.floor(prng() * 14),
            5,
            10,
            true
          );
        }
      }

      // B. SYMMETRICAL PERIPHERAL BUSES (Guarantees Left & Right Sides are evenly populated)
      // Dedicated Right-Side Peripheral Buses
      if (maxCol > chipMaxCol + 3) {
        for (let i = 0; i < 4; i++) {
          const rightStartGx = (chipMaxCol + 2) + Math.floor(prng() * (maxCol - chipMaxCol - 3));
          const rightStartGy = minRow + 1 + Math.floor(prng() * (maxRow - minRow - 2));
          if (!isCellOccupied(rightStartGx, rightStartGy)) {
            const initDir = prng() < 0.5 ? 2 : (prng() < 0.5 ? 1 : 3); // E, NE, SE
            generateLongFlowingTrace(
              traceIdCounter++,
              rightStartGx,
              rightStartGy,
              initDir,
              [initDir, (initDir + 1) % 8, (initDir + 7) % 8],
              16 + Math.floor(prng() * 14),
              5,
              10,
              prng() < 0.5
            );
          }
        }
      }

      // Dedicated Left-Side Peripheral Buses
      if (chipMinCol > minCol + 3) {
        for (let i = 0; i < 4; i++) {
          const leftStartGx = minCol + 1 + Math.floor(prng() * (chipMinCol - minCol - 2));
          const leftStartGy = minRow + 1 + Math.floor(prng() * (maxRow - minRow - 2));
          if (!isCellOccupied(leftStartGx, leftStartGy)) {
            const initDir = prng() < 0.5 ? 6 : (prng() < 0.5 ? 7 : 5); // W, NW, SW
            generateLongFlowingTrace(
              traceIdCounter++,
              leftStartGx,
              leftStartGy,
              initDir,
              [initDir, (initDir + 1) % 8, (initDir + 7) % 8],
              16 + Math.floor(prng() * 14),
              5,
              10,
              prng() < 0.5
            );
          }
        }
      }
    };

    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const targetW = Math.max(Math.floor(rect.width), container.clientWidth, 320);
      const targetH = Math.max(Math.floor(rect.height), container.clientHeight, 240);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bufW = Math.round(targetW * dpr);
      const bufH = Math.round(targetH * dpr);

      if (canvas.width !== bufW || canvas.height !== bufH) {
        canvas.width = bufW;
        canvas.height = bufH;
      }

      if (width !== targetW || height !== targetH) {
        width = targetW;
        height = targetH;
        generateBoard(width, height);
      }
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // MOUSE INTERACTION (Hover on Center Box)
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const insideChip =
        mouseX >= chipRect.x &&
        mouseX <= chipRect.x + chipRect.w &&
        mouseY >= chipRect.y &&
        mouseY <= chipRect.y + chipRect.h;

      setIsHoveringChip(insideChip);
      canvas.style.cursor = insideChip ? 'pointer' : 'default';
    };

    const handleClick = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const insideChip =
        mouseX >= chipRect.x &&
        mouseX <= chipRect.x + chipRect.w &&
        mouseY >= chipRect.y &&
        mouseY <= chipRect.y + chipRect.h;

      if (insideChip && onCoreClick) {
        onCoreClick();
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    // ANIMATION LOOP (60FPS Canvas Render Pipeline)
    let lastTime = performance.now();
    let tick = 0;

    const renderLoop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      tick += delta;

      const currentState = stateRef.current;

      // Energy Target calculation
      if (currentState === 'speaking') {
        targetEnergy = 0.95 + 0.05 * Math.sin(tick * 12);
      } else if (currentState === 'thinking') {
        targetEnergy = 0.75 + 0.15 * Math.sin(tick * 8);
      } else if (currentState === 'listening') {
        targetEnergy = 0.65 + 0.12 * Math.sin(tick * 4);
      } else {
        targetEnergy = 0.25 + 0.05 * Math.sin(tick * 2);
      }

      currentEnergy += (targetEnergy - currentEnergy) * (delta * 6);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // A. Fiberglass / Resin Board Background Texture + Large Rich Radial Center Halo
      drawSubstrate(ctx, width, height, tick, currentEnergy, activePalette, haloIntensity);

      // B. "RAISED COPPER" 3-LAYER TRACE RENDERING
      renderRaisedCopperTraces(ctx, traces, currentEnergy, activePalette);

      // C. MULTI-SPEED ELECTRON PULSES
      renderElectronPulses(ctx, traces, delta, currentState, currentEnergy, activePalette);

      // D. Draw Surface Mount Components
      components.forEach((comp) => {
        drawSMDComponent(ctx, comp, currentEnergy, activePalette);
      });

      // E. Clean Soft Glowing Center Label Box with Crisp "STONICX" Text
      drawCleanStonicxBox(
        ctx,
        chipRect,
        currentState,
        tick,
        currentEnergy,
        isHoveringChip,
        activePalette,
        fontStyle
      );

      // E2. Dynamic Hacking / Cipher Decoding Effect during Thinking / Processing state
      if (currentState === 'thinking') {
        drawThinkingCipherDecodingEffect(
          ctx,
          width,
          height,
          chipRect,
          tick,
          currentEnergy,
          activePalette,
          fontStyle
        );
      }

      // F. Rich Edge Vignette Overlay (Frames the screen and gives cinematic depth)
      if (edgeVignette) {
        drawEdgeVignette(ctx, width, height);
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [seed, interactive, isHoveringChip, themeColor, fontStyle, haloIntensity, edgeVignette]);

  // A. Substrate Fiberglass Background & Ground Grid + LARGE WARM CENTER GLOW HALO
  const drawSubstrate = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    tick: number,
    energy: number,
    pal: typeof STONICX_PALETTES['cyan'],
    haloMultiplier: number
  ) => {
    ctx.save();

    const cx = w / 2;
    const cy = h / 2;

    // 1. Deep Obsidian Base
    ctx.fillStyle = pal.bgDark;
    ctx.fillRect(0, 0, w, h);

    // 2. LARGE, WARM, GLOWING CENTER RADIAL HALO (Rich atmospheric glow behind chip)
    const haloRadius = Math.max(w * 0.55, h * 0.65, 420);
    const centerHalo = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloRadius);
    const alphaBase = Math.min(1.0, haloMultiplier * (0.35 + 0.25 * energy));

    centerHalo.addColorStop(0, `${pal.primary}${Math.round(alphaBase * 255).toString(16).padStart(2, '0')}`);
    centerHalo.addColorStop(0.2, `${pal.primary}${Math.round(alphaBase * 0.55 * 255).toString(16).padStart(2, '0')}`);
    centerHalo.addColorStop(0.45, `${pal.primary}${Math.round(alphaBase * 0.22 * 255).toString(16).padStart(2, '0')}`);
    centerHalo.addColorStop(0.75, `${pal.primary}0a`);
    centerHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = centerHalo;
    ctx.fillRect(0, 0, w, h);

    // 3. Microscopic Fiberglass Weave Grid
    ctx.strokeStyle = pal.fiberglassGrid;
    ctx.lineWidth = 0.5;
    const microStep = 10;
    for (let x = 0; x < w; x += microStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += microStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 4. Primary PCB Grid Lines & Clean Ground Points
    ctx.strokeStyle = pal.bgGridSubtle;
    ctx.lineWidth = 0.75;
    const gridStep = 22;
    for (let x = 0; x < w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Edge Vignette Overlay (Rich cinematic dark frame at screen borders & corners)
  const drawEdgeVignette = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    const cx = w / 2;
    const cy = h / 2;
    const innerRadius = Math.min(w, h) * 0.35;
    const outerRadius = Math.hypot(cx, cy) * 0.95;

    const vignetteGrad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    vignetteGrad.addColorStop(0, 'rgba(2, 6, 17, 0)');
    vignetteGrad.addColorStop(0.5, 'rgba(2, 6, 17, 0.4)');
    vignetteGrad.addColorStop(0.82, 'rgba(2, 6, 17, 0.85)');
    vignetteGrad.addColorStop(1, 'rgba(2, 6, 17, 0.98)');

    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  // RAISED COPPER 3-LAYER RENDERING
  const renderRaisedCopperTraces = (
    ctx: CanvasRenderingContext2D,
    traces: SeededTrace[],
    energy: number,
    pal: typeof STONICX_PALETTES['cyan']
  ) => {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Layer 1: Dark Ground Shadow
    ctx.strokeStyle = pal.traceShadow;
    traces.forEach((trace) => {
      if (trace.points.length < 2) return;
      ctx.lineWidth = trace.width + 2.4;
      ctx.beginPath();
      ctx.moveTo(trace.points[0].x + 1.2, trace.points[0].y + 1.5);
      for (let i = 1; i < trace.points.length; i++) {
        ctx.lineTo(trace.points[i].x + 1.2, trace.points[i].y + 1.5);
      }
      ctx.stroke();
    });

    // Layer 2: Main Copper Trace Body
    traces.forEach((trace) => {
      if (trace.points.length < 2) return;
      ctx.lineWidth = trace.width;
      ctx.strokeStyle = trace.isPrimary ? pal.traceBase : pal.traceBaseDim;
      ctx.beginPath();
      ctx.moveTo(trace.points[0].x, trace.points[0].y);
      for (let i = 1; i < trace.points.length; i++) {
        ctx.lineTo(trace.points[i].x, trace.points[i].y);
      }
      ctx.stroke();
    });

    // Layer 3: Top Specular Center Ridge + Terminal Vias
    traces.forEach((trace) => {
      if (trace.points.length < 2) return;
      ctx.lineWidth = Math.max(0.6, trace.width * 0.4);
      ctx.strokeStyle = pal.traceHighlight;
      ctx.beginPath();
      ctx.moveTo(trace.points[0].x - 0.2, trace.points[0].y - 0.2);
      for (let i = 1; i < trace.points.length; i++) {
        ctx.lineTo(trace.points[i].x - 0.2, trace.points[i].y - 0.2);
      }
      ctx.stroke();

      // Terminal Vias on trace ends
      const startPt = trace.points[0];
      const endPt = trace.points[trace.points.length - 1];

      [startPt, endPt].forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.0, 0, Math.PI * 2);
        ctx.fillStyle = pal.compPad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = pal.bgDark;
        ctx.fill();
      });
    });

    ctx.restore();
  };

  // ELECTRON PULSES RENDERING
  const renderElectronPulses = (
    ctx: CanvasRenderingContext2D,
    traces: SeededTrace[],
    delta: number,
    state: VisualizerState,
    energy: number,
    pal: typeof STONICX_PALETTES['cyan']
  ) => {
    ctx.save();

    let speedMult = 1.0;
    if (state === 'speaking') speedMult = 2.4;
    else if (state === 'thinking') speedMult = 1.8;
    else if (state === 'listening') speedMult = 1.4;

    traces.forEach((trace) => {
      if (trace.points.length < 2 || trace.totalLength <= 0) return;

      trace.particles.forEach((p) => {
        p.pos = (p.pos + p.speed * speedMult * delta * 60) % 1;
        const pt = getInterpolatedPoint(trace.points, trace.segmentLengths, trace.totalLength, p.pos);
        if (!pt) return;

        const pRadius = p.size * (0.8 + 0.4 * energy);

        // 1. Broad soft outer glow
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pRadius * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = pal.pulseGlow;
        ctx.globalAlpha = 0.25 * p.alpha * energy;
        ctx.shadowColor = pal.pulseGlow;
        ctx.shadowBlur = 10 * energy;
        ctx.fill();

        // 2. Focused mid core
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = pal.pulseGlow;
        ctx.globalAlpha = 0.85 * p.alpha;
        ctx.shadowBlur = 5;
        ctx.fill();

        // 3. Ultra-bright pure white center point
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pRadius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = pal.pulseBrightCore;
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 2;
        ctx.fill();

        ctx.globalAlpha = 1.0;
      });
    });

    ctx.restore();
  };

  // SMD COMPONENT RENDERING
  const drawSMDComponent = (
    ctx: CanvasRenderingContext2D,
    comp: SMDComponent,
    energy: number,
    pal: typeof STONICX_PALETTES['cyan']
  ) => {
    ctx.save();
    ctx.translate(comp.x, comp.y);

    const halfW = comp.w / 2;
    const halfH = comp.h / 2;

    if (comp.type === 'via') {
      ctx.beginPath();
      ctx.arc(0, 0, halfW, 0, Math.PI * 2);
      ctx.fillStyle = pal.compPad;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, halfW * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = pal.bgDark;
      ctx.fill();
      ctx.restore();
      return;
    }

    // Component Body
    ctx.fillStyle = pal.compBody;
    ctx.strokeStyle = pal.compBorder;
    ctx.lineWidth = 0.8;
    ctx.fillRect(-halfW, -halfH, comp.w, comp.h);
    ctx.strokeRect(-halfW, -halfH, comp.w, comp.h);

    // Solder Terminal End Caps
    ctx.fillStyle = pal.compPad;
    const padW = Math.max(2.2, comp.w * 0.22);
    ctx.fillRect(-halfW, -halfH, padW, comp.h);
    ctx.fillRect(halfW - padW, -halfH, padW, comp.h);

    // Silkscreen Label
    ctx.fillStyle = pal.compSilkscreen;
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(comp.label, 0, halfH + 2);

    ctx.restore();
  };

  // DYNAMIC HACKING / CIPHER DECODING STREAM EFFECT DURING "THINKING" STATE
  const drawThinkingCipherDecodingEffect = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    chipRect: { x: number; y: number; w: number; h: number; cx: number; cy: number },
    tick: number,
    energy: number,
    pal: typeof STONICX_PALETTES['cyan'],
    font: StonicxFontStyle
  ) => {
    ctx.save();

    const CIPHER_CHARS = '0123456789ABCDEFλΨΩ§∆µθ#@%&*+-=/<>[]{}';
    const KEYWORDS = [
      'DECODE: 0x9F7A',
      'CIPHER_SYNC: 98.4%',
      'NEURAL_BUS: OK',
      'TENSOR: 4096-DIM',
      'KERNEL_EXEC: ACTIVE',
      'HASH_RESOLVE: PASS',
      'MATRIX_SOLVE: 0x4B2',
      'QUANTUM_BIT: 10110'
    ];

    const prng = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // 1. CHIP FLANKING CIPHER STREAMS (Left & Right of Center Box)
    const flankLeftX = chipRect.x - 24;
    const flankRightX = chipRect.x + chipRect.w + 14;
    const startY = chipRect.y - 24;

    const numRows = 7;
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';

    // Left Column
    ctx.textAlign = 'right';
    for (let i = 0; i < numRows; i++) {
      const y = startY + i * 18;
      const seedVal = Math.floor(tick * 15 + i * 7.3);
      const isResolved = ((tick * 1.5 + i * 0.4) % 3) > 1.8;
      
      let text = '';
      if (isResolved) {
        text = KEYWORDS[i % KEYWORDS.length];
        ctx.fillStyle = pal.primary;
        ctx.shadowColor = pal.primary;
        ctx.shadowBlur = 8;
      } else {
        // Fast rolling cipher glyphs
        for (let c = 0; c < 10; c++) {
          const charIdx = Math.floor(prng(seedVal + c * 13.7) * CIPHER_CHARS.length);
          text += CIPHER_CHARS[charIdx];
        }
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.85)' : pal.primary;
        ctx.shadowColor = pal.primary;
        ctx.shadowBlur = 4;
      }

      ctx.globalAlpha = 0.85;
      ctx.fillText(text, flankLeftX, y);
    }

    // Right Column
    ctx.textAlign = 'left';
    for (let i = 0; i < numRows; i++) {
      const y = startY + i * 18;
      const seedVal = Math.floor(tick * 15 + i * 11.1);
      const isResolved = ((tick * 1.2 + i * 0.5) % 3) > 1.6;
      
      let text = '';
      if (isResolved) {
        text = KEYWORDS[(i + 3) % KEYWORDS.length];
        ctx.fillStyle = pal.primary;
        ctx.shadowColor = pal.primary;
        ctx.shadowBlur = 8;
      } else {
        for (let c = 0; c < 10; c++) {
          const charIdx = Math.floor(prng(seedVal + c * 17.3) * CIPHER_CHARS.length);
          text += CIPHER_CHARS[charIdx];
        }
        ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : pal.primary;
        ctx.shadowColor = pal.primary;
        ctx.shadowBlur = 4;
      }

      ctx.globalAlpha = 0.85;
      ctx.fillText(text, flankRightX, y);
    }

    // 2. HUD CORNER STREAM MATRICES (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
    const corners = [
      { x: 24, y: 28, label: 'CIPHER STREAM // SECTOR_01', align: 'left' as const },
      { x: w - 24, y: 28, label: 'NEURAL DECODE // MATRIX_02', align: 'right' as const },
      { x: 24, y: h - 36, label: 'KERNEL REGISTERS // CORE_03', align: 'left' as const },
      { x: w - 24, y: h - 36, label: 'QUANTUM BUS // TELEMETRY_04', align: 'right' as const }
    ];

    corners.forEach((corner, cIdx) => {
      ctx.textAlign = corner.align;
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = pal.primary;
      ctx.shadowColor = pal.primary;
      ctx.shadowBlur = 6;
      ctx.fillText(`[ ${corner.label} ]`, corner.x, corner.y);

      // 3 rolling stream lines below label
      for (let line = 1; line <= 3; line++) {
        let streamStr = '';
        const streamSeed = Math.floor(tick * 20 + cIdx * 41 + line * 19);
        for (let s = 0; s < 18; s++) {
          const charIdx = Math.floor(prng(streamSeed + s * 9.1) * CIPHER_CHARS.length);
          streamStr += CIPHER_CHARS[charIdx];
        }
        ctx.font = '7.5px "JetBrains Mono", monospace';
        ctx.fillStyle = (streamSeed % 3 === 0) ? '#FFFFFF' : 'rgba(180, 240, 255, 0.75)';
        ctx.shadowBlur = 2;
        const lineY = corner.y > h / 2 ? corner.y - line * 11 : corner.y + line * 11;
        ctx.fillText(streamStr, corner.x, lineY);
      }
    });

    // 3. SCANNING HORIZONTAL GLITCH BAR AROUND CHIP
    const scanY = chipRect.y + (Math.sin(tick * 4) * 0.5 + 0.5) * chipRect.h;
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.45;
    ctx.shadowColor = pal.primary;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(chipRect.x - 40, scanY);
    ctx.lineTo(chipRect.x + chipRect.w + 40, scanY);
    ctx.stroke();

    ctx.restore();
  };

  // CLEAN SOFT GLOWING CENTER LABEL BOX WITH CRISP "STONICX" TEXT
  const drawCleanStonicxBox = (
    ctx: CanvasRenderingContext2D,
    rect: { x: number; y: number; w: number; h: number; cx: number; cy: number },
    state: VisualizerState,
    tick: number,
    energy: number,
    isHovered: boolean,
    pal: typeof STONICX_PALETTES['cyan'],
    font: StonicxFontStyle
  ) => {
    ctx.save();

    let scale = 1.0;
    if (state === 'speaking') {
      scale = 1.0 + Math.abs(Math.sin(tick * 10)) * 0.03 * energy;
    } else if (state === 'listening') {
      scale = 1.0 + Math.sin(tick * 4) * 0.015;
    } else if (isHovered) {
      scale = 1.02;
    }

    ctx.translate(rect.cx, rect.cy);
    ctx.scale(scale, scale);

    const halfW = rect.w / 2;
    const halfH = rect.h / 2;

    // 1. Soft Radiance Bloom Layer behind box
    ctx.save();
    const glowR = Math.max(rect.w * 0.9, 160);
    const boxHaloGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, glowR);
    boxHaloGrad.addColorStop(0, `${pal.primary}${Math.round(0.42 * energy * 255).toString(16).padStart(2, '0')}`);
    boxHaloGrad.addColorStop(0.4, `${pal.primary}${Math.round(0.18 * energy * 255).toString(16).padStart(2, '0')}`);
    boxHaloGrad.addColorStop(0.75, `${pal.primary}0a`);
    boxHaloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = boxHaloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Listening Inward Scanning Pulse Rings
    if (state === 'listening') {
      const rings = 3;
      for (let r = 0; r < rings; r++) {
        const prog = (tick * 0.8 + r / rings) % 1;
        const ringDist = (1 - prog) * 28;
        ctx.beginPath();
        ctx.rect(-halfW - ringDist, -halfH - ringDist, rect.w + ringDist * 2, rect.h + ringDist * 2);
        ctx.strokeStyle = pal.primary;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = prog * 0.45;
        ctx.shadowColor = pal.primary;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }

    // 3. Dark Box Body Backplate
    ctx.fillStyle = pal.boxBody;
    ctx.fillRect(-halfW, -halfH, rect.w, rect.h);

    // 4. SOFT GLOWING BOX BORDER (Multi-layer bloom + crisp outline)
    // Outer Soft Glowing Border
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = state === 'speaking' || isHovered ? 2.0 : 1.5;
    ctx.shadowColor = pal.primary;
    ctx.shadowBlur = (state === 'speaking' ? 22 : state === 'thinking' ? 16 : 10) * energy;
    ctx.strokeRect(-halfW, -halfH, rect.w, rect.h);

    // Inner Subtle Border
    ctx.strokeStyle = pal.boxBorderInner;
    ctx.lineWidth = 0.8;
    ctx.shadowBlur = 0;
    ctx.strokeRect(-halfW + 4, -halfH + 4, rect.w - 8, rect.h - 8);

    // Corner HUD Bracket Accents
    const bracketLen = 8;
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = pal.primary;
    ctx.shadowBlur = 8 * energy;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(-halfW, -halfH + bracketLen);
    ctx.lineTo(-halfW, -halfH);
    ctx.lineTo(-halfW + bracketLen, -halfH);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(halfW - bracketLen, -halfH);
    ctx.lineTo(halfW, -halfH);
    ctx.lineTo(halfW, -halfH + bracketLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(-halfW, halfH - bracketLen);
    ctx.lineTo(-halfW, halfH);
    ctx.lineTo(-halfW + bracketLen, halfH);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(halfW - bracketLen, halfH);
    ctx.lineTo(halfW, halfH);
    ctx.lineTo(halfW, halfH - bracketLen);
    ctx.stroke();

    // 5. CLEAN, SHARP "STONICX" TEXT (Restored directly with selected font & high-tech glow)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textY = -halfH + 28;

    // Glow underlayer
    ctx.font = `900 24px "${font}", sans-serif`;
    ctx.fillStyle = pal.primary;
    ctx.shadowColor = pal.primary;
    ctx.shadowBlur = (state === 'speaking' ? 18 : 12) * energy;
    ctx.fillText('STONICX', 0, textY);

    // Crisp high-contrast top core
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 3;
    ctx.fillText('STONICX', 0, textY);
    ctx.restore();

    // 6. Sub-Readout State & Energy Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const subTextY = halfH - 18;
    const stateLabel = `[ ${state.toUpperCase()} • ENERGY ${(energy * 100).toFixed(0)}% ]`;

    ctx.fillStyle =
      state === 'speaking'
        ? pal.primary
        : state === 'listening'
        ? pal.primary
        : state === 'thinking'
        ? pal.primary
        : 'rgba(200, 230, 255, 0.6)';

    ctx.font = `10px "${font}", monospace`;
    ctx.shadowColor = pal.primary;
    ctx.shadowBlur = state === 'speaking' ? 6 : 0;
    ctx.fillText(stateLabel, 0, subTextY);

    ctx.restore();
  };

  // Helper: Find point along segmented path
  const getInterpolatedPoint = (
    points: Point[],
    segmentLengths: number[],
    totalLen: number,
    t: number
  ): Point | null => {
    if (!points || points.length < 2 || totalLen <= 0) return null;

    const targetDist = t * totalLen;
    let accumulated = 0;

    for (let i = 0; i < segmentLengths.length; i++) {
      const segLen = segmentLengths[i];
      if (accumulated + segLen >= targetDist) {
        const segT = (targetDist - accumulated) / segLen;
        const p1 = points[i];
        const p2 = points[i + 1];
        return {
          x: p1.x + (p2.x - p1.x) * segT,
          y: p1.y + (p2.y - p1.y) * segT
        };
      }
      accumulated += segLen;
    }

    return points[points.length - 1];
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
};
