import React, { useState } from 'react';
import { KOTLIN_CODEBASE, KotlinFileItem } from '../data/kotlinCodebase';
import { FileCode, Folder, Copy, Check, Terminal } from 'lucide-react';

export const CodebaseViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<KotlinFileItem>(KOTLIN_CODEBASE[2] || KOTLIN_CODEBASE[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#08080c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0d0d14]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            MAYRA Android Native Kotlin Codebase (Phase 1 UI)
          </span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-500/30">
          com.mayra.assistant • Jetpack Compose • SDK 36
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Tree Navigation */}
        <div className="w-64 border-r border-white/10 bg-[#06060a] p-3 overflow-y-auto space-y-1 shrink-0">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 px-2">
            MAYRA Kotlin Files
          </div>
          {KOTLIN_CODEBASE.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors ${
                selectedFile.path === file.path
                  ? 'bg-purple-600/20 text-cyan-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              <span className="truncate">{file.name}</span>
            </button>
          ))}
        </div>

        {/* Code Content View */}
        <div className="flex-1 flex flex-col bg-[#050508] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#0a0a0d]">
            <span className="text-xs font-mono text-slate-300 font-semibold">
              {selectedFile.path}
            </span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-300 selection:bg-purple-600 selection:text-white">
            <pre className="whitespace-pre">{selectedFile.code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
