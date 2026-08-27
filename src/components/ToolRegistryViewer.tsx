import React, { useState, useEffect } from 'react';
import { ToolItem } from '../types';
import { Wrench, Globe, FileText, Monitor, Cpu, ShieldCheck } from 'lucide-react';

export const ToolRegistryViewer: React.FC = () => {
  const [tools, setTools] = useState<ToolItem[]>([]);

  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => {
        if (data.tools) setTools(data.tools);
      })
      .catch(err => console.error(err));
  }, []);

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'WebSearch': return <Globe className="w-5 h-5 text-blue-400" />;
      case 'FileProcessing': return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'ScreenVision': return <Monitor className="w-5 h-5 text-indigo-400" />;
      case 'ComputerAutomation': return <Cpu className="w-5 h-5 text-purple-400" />;
      default: return <Wrench className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08080c] border border-white/10 rounded-2xl overflow-hidden p-5 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            MAYRA Tool Registry Architecture
          </h2>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-full">
          {tools.length} Future Tool Pipeline Abstractions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 overflow-y-auto pr-1">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="p-4 bg-[#0a0a0e] border border-white/10 rounded-xl hover:border-purple-500/40 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  {getToolIcon(tool.name)}
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                  {tool.category}
                </span>
              </div>
              <h3 className="text-xs font-mono font-bold text-white mb-1.5">{tool.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{tool.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1 text-purple-400">
                <ShieldCheck className="w-3 h-3" /> Defined
              </span>
              <span>Phase 2+ Action Pipeline</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
