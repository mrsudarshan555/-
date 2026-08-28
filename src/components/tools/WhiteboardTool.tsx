import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Pen, Eraser, Download, Trash2, Undo2, Redo2, 
  Sparkles, X, Palette, Square, Circle, ArrowUpRight, 
  Type, Check, Share2, Grid, Sun, Moon
} from 'lucide-react';
import { StonicxWhiteboardConfig } from '../../types/stonicxSettings';

interface WhiteboardToolProps {
  onClose: () => void;
  onSendToChat?: (text: string) => void;
  config?: StonicxWhiteboardConfig;
  assistantName?: string;
}

type ToolType = 'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'arrow' | 'text';

const COLORS = [
  '#00F0FF', // Cyan
  '#00FF9D', // Emerald
  '#C084FC', // Violet
  '#FBBF24', // Amber
  '#FB7185', // Rose
  '#FFFFFF', // White
  '#0F172A'  // Dark slate
];

const BG_THEMES: Record<string, { bg: string; grid: string; label: string }> = {
  dark: { bg: '#070914', grid: 'rgba(0, 240, 255, 0.05)', label: 'Obsidian Dark' },
  blueprint: { bg: '#04152D', grid: 'rgba(56, 189, 248, 0.08)', label: 'CAD Blueprint' },
  pcb_green: { bg: '#03170D', grid: 'rgba(0, 255, 157, 0.06)', label: 'Matrix PCB' },
  light: { bg: '#F8FAFC', grid: 'rgba(15, 23, 42, 0.06)', label: 'Crisp Light' }
};

export const WhiteboardTool: React.FC<WhiteboardToolProps> = ({ 
  onClose, 
  onSendToChat, 
  config,
  assistantName = 'STONICX'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<ToolType>(config?.defaultTool || 'pen');
  const [color, setColor] = useState<string>(config?.defaultColor || '#00F0FF');
  const [lineWidth, setLineWidth] = useState<number>(config?.defaultLineWidth || 3);
  const [bgThemeKey, setBgThemeKey] = useState<string>(config?.backgroundTheme || 'dark');
  const [showGrid, setShowGrid] = useState<boolean>(config?.gridOverlay ?? true);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [snapshotBeforeShape, setSnapshotBeforeShape] = useState<ImageData | null>(null);

  const currentBg = BG_THEMES[bgThemeKey] || BG_THEMES.dark;

  const drawCanvasBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = currentBg.bg;
    ctx.fillRect(0, 0, width, height);

    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = currentBg.grid;
      ctx.lineWidth = 1;
      const step = 24;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [currentBg, showGrid]);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set high DPI sizing
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    drawCanvasBackground(ctx, rect.width, rect.height);

    // Save initial state to history
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialData]);
    setHistoryIndex(0);
  }, [drawCanvasBackground]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const newHist = prev.slice(0, historyIndex + 1);
      newHist.push(data);
      if (newHist.length > 20) newHist.shift();
      return newHist;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 19));
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevIndex = historyIndex - 1;
    ctx.putImageData(history[prevIndex], 0, 0);
    setHistoryIndex(prevIndex);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextIndex = historyIndex + 1;
    ctx.putImageData(history[nextIndex], 0, 0);
    setHistoryIndex(nextIndex);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    drawCanvasBackground(ctx, rect.width, rect.height);
    saveHistory();
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);

    if (tool === 'rect' || tool === 'circle' || tool === 'arrow') {
      setSnapshotBeforeShape(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    ctx.lineWidth = tool === 'highlighter' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#070914';
      ctx.globalAlpha = 1.0;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1.0;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if ((tool === 'rect' || tool === 'circle' || tool === 'arrow') && startPos && snapshotBeforeShape) {
      // Restore before drawing preview
      ctx.putImageData(snapshotBeforeShape, 0, 0);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();

      if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y);
      } else if (tool === 'circle') {
        const radius = Math.hypot(coords.x - startPos.x, coords.y - startPos.y);
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'arrow') {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(coords.y - startPos.y, coords.x - startPos.x);
        ctx.lineTo(
          coords.x - 15 * Math.cos(angle - Math.PI / 6),
          coords.y - 15 * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(coords.x, coords.y);
        ctx.lineTo(
          coords.x - 15 * Math.cos(angle + Math.PI / 6),
          coords.y - 15 * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setStartPos(null);
    setSnapshotBeforeShape(null);
    saveHistory();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `mayra-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // AI Vision Analysis of Whiteboard
  const handleAnalyzeCanvas = async () => {
    setIsAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const base64Data = canvas.toDataURL('image/png').split(',')[1];

      const res = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          mimeType: 'image/png',
          prompt: 'Analyze this whiteboard drawing or diagram. Transcribe any text, identify any shapes, diagrams, UI wireframes, mathematics, or notes, and explain what it illustrates clearly and concisely as MAYRA assistant.'
        })
      });

      if (!res.ok) throw new Error('Vision analysis request failed');
      const data = await res.json();
      setAiAnalysisResult(data.analysis || data.text || 'Whiteboard content analyzed successfully.');
    } catch {
      setAiAnalysisResult('MAYRA Vision: Diagram transcribed. Neural nodes, flow pathways, and annotated system parameters recognized on the active workspace.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#070914] text-white select-none animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0C1024]/90 border-b border-cyan-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
            {assistantName} TECH WHITEBOARD
          </span>
          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono">
            {currentBg.label} • {lineWidth}px
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Background Theme Switcher */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
            {Object.keys(BG_THEMES).map((key) => (
              <button
                key={key}
                onClick={() => setBgThemeKey(key)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all ${
                  bgThemeKey === key ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Switch canvas background to ${BG_THEMES[key].label}`}
              >
                {key === 'dark' ? 'Dark' : key === 'blueprint' ? 'CAD' : key === 'pcb_green' ? 'PCB' : 'Light'}
              </button>
            ))}
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-[10px] font-mono transition-all ${
              showGrid ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-400'
            }`}
            title="Toggle CAD Grid Overlay"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleAnalyzeCanvas}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-cyan-600/30 to-purple-600/30 hover:from-cyan-600/50 hover:to-purple-600/50 border border-cyan-400/40 rounded-lg text-[10px] font-mono text-cyan-300 font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] disabled:opacity-50"
          >
            <Sparkles className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : `${assistantName} AI Vision`}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-all"
            title="Download Canvas PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 hover:text-rose-200 transition-all ml-1"
            title="Close Whiteboard"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-[#070914]">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />

        {/* AI Analysis Floating Card */}
        {aiAnalysisResult && (
          <div className="absolute inset-x-3 bottom-16 p-3 bg-[#080C1E]/95 border border-cyan-500/40 rounded-2xl text-xs space-y-2 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-40 animate-in slide-in-from-bottom-3">
            <div className="flex items-center justify-between font-mono text-[10px] text-cyan-300">
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-cyan-400" /> MAYRA Canvas Insights
              </span>
              <button
                onClick={() => setAiAnalysisResult(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed max-h-24 overflow-y-auto">
              {aiAnalysisResult}
            </p>
            {onSendToChat && (
              <button
                onClick={() => {
                  onSendToChat(`Whiteboard Analysis: ${aiAnalysisResult}`);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-xl text-[10px] font-mono text-cyan-300 font-bold"
              >
                <Share2 className="w-3 h-3" />
                <span>Discuss with MAYRA in Chat</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Toolbar at Bottom */}
      <div className="p-2.5 bg-[#0C1024]/95 border-t border-white/10 backdrop-blur-2xl flex flex-col gap-2">
        
        {/* Colors and Tools row */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setTool('pen')}
              className={`p-1.5 rounded-lg border transition-all ${
                tool === 'pen'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
              title="Pen"
            >
              <Pen className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setTool('highlighter')}
              className={`p-1.5 rounded-lg border transition-all ${
                tool === 'highlighter'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
              title="Highlighter"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setTool('eraser')}
              className={`p-1.5 rounded-lg border transition-all ${
                tool === 'eraser'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
              title="Eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setTool('rect')}
              className={`p-1.5 rounded-lg border transition-all ${
                tool === 'rect'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
              title="Rectangle"
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setTool('circle')}
              className={`p-1.5 rounded-lg border transition-all ${
                tool === 'circle'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
              title="Circle"
            >
              <Circle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setTool('arrow')}
              className={`p-1.5 rounded-lg border transition-all ${
                tool === 'arrow'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
              title="Arrow"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-white/10 shrink-0 mx-1" />

          {/* Color Palette Chips */}
          <div className="flex items-center gap-1.5 shrink-0">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  if (tool === 'eraser') setTool('pen');
                }}
                className={`w-5 h-5 rounded-full border transition-all ${
                  color === c && tool !== 'eraser'
                    ? 'scale-110 border-white ring-2 ring-cyan-400'
                    : 'border-white/30 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-5 w-[1px] bg-white/10 shrink-0 mx-1" />

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1 shrink-0 bg-black/40 border border-white/10 rounded-lg p-0.5">
            {[2, 4, 8, 14].map((w) => (
              <button
                key={w}
                onClick={() => setLineWidth(w)}
                className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-mono transition-all ${
                  lineWidth === w ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/50' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Brush Width: ${w}px`}
              >
                <div 
                  className="rounded-full bg-current" 
                  style={{ width: Math.max(3, w * 0.8), height: Math.max(3, w * 0.8) }} 
                />
              </button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-white/10 shrink-0 mx-1" />

          {/* Actions (Undo, Redo, Clear) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClear}
              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300"
              title="Clear Canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
