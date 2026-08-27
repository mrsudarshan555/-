import React from 'react';
import { CharacterModelMetadata } from '../../types';
import { X, Box, Layers, Image, Cpu, CheckCircle2, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

interface CharacterInfoModalProps {
  metadata: CharacterModelMetadata;
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterInfoModal: React.FC<CharacterInfoModalProps> = ({
  metadata,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0C1024] border border-cyan-500/30 rounded-3xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-4 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-300">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans">MAYRA 3D Character Model</h3>
              <p className="text-[10px] font-mono text-cyan-400">Source: {metadata.sourceFile}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Model Spec Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-[#070914] border border-white/5 rounded-xl space-y-0.5">
            <span className="text-[9px] font-mono text-slate-400 uppercase">Format & Version</span>
            <p className="text-xs font-bold text-white font-mono">{metadata.format} {metadata.version}</p>
          </div>
          <div className="p-2.5 bg-[#070914] border border-white/5 rounded-xl space-y-0.5">
            <span className="text-[9px] font-mono text-slate-400 uppercase">Mesh Vertices</span>
            <p className="text-xs font-bold text-cyan-300 font-mono">~{metadata.vertexCount?.toLocaleString()} pts</p>
          </div>
          <div className="p-2.5 bg-[#070914] border border-white/5 rounded-xl space-y-0.5">
            <span className="text-[9px] font-mono text-slate-400 uppercase">Bones & Rigging</span>
            <p className="text-xs font-bold text-purple-300 font-mono">{metadata.boneCount} Skeletal Bones</p>
          </div>
          <div className="p-2.5 bg-[#070914] border border-white/5 rounded-xl space-y-0.5">
            <span className="text-[9px] font-mono text-slate-400 uppercase">Facial Morphs</span>
            <p className="text-xs font-bold text-emerald-300 font-mono">{metadata.morphCount} Blend Shapes</p>
          </div>
        </div>

        {/* Textures Specification */}
        <div className="p-3 bg-[#070914] border border-white/5 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Image className="w-3.5 h-3.5 text-cyan-400" />
            <span>Required Texture Assets ({metadata.textures.length})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {metadata.textures.map((tex, idx) => (
              <span
                key={idx}
                className="text-[9px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-slate-300"
              >
                {tex}
              </span>
            ))}
          </div>
        </div>

        {/* Android Rendering Pipeline & Conversion Specs */}
        <div className="p-3 bg-[#070914] border border-cyan-500/20 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Cpu className="w-3.5 h-3.5" />
            <span>Android Rendering Pipeline</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            Native Android uses <strong>Google Filament / SceneView</strong> via glTF/GLB or custom PMX parser.
            The pipeline preserves 100% vertex hierarchy, materials, normal maps, and facial morph targets for real-time Jetpack Compose rendering.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" /> State Machine Synced
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              <RefreshCw className="w-3 h-3" /> 360° Drag Orbit Ready
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold font-sans rounded-xl transition-all shadow-md active:scale-98"
        >
          Close Inspector
        </button>

      </div>
    </div>
  );
};
