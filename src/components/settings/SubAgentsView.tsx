import React from 'react';
import { SubAgentItem } from '../../types';
import { 
  Bot, Terminal, Search, ShieldAlert, 
  Eye, Zap, ShieldCheck, Lock, Play, Cpu, ArrowLeft
} from 'lucide-react';

interface SubAgentsViewProps {
  subAgents: SubAgentItem[];
  onToggleAgent: (agentId: string) => void;
  onBack: () => void;
}

export const SubAgentsView: React.FC<SubAgentsViewProps> = ({
  subAgents,
  onToggleAgent,
  onBack
}) => {
  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'agent-coding': return <Terminal className="w-4 h-4 text-purple-400" />;
      case 'agent-research': return <Search className="w-4 h-4 text-blue-400" />;
      case 'agent-sentinel': return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'agent-vision': return <Eye className="w-4 h-4 text-cyan-400" />;
      default: return <Bot className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070913] text-slate-200">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center active:scale-95"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Sub-Agents</h2>
              <p className="text-[10px] text-slate-400 font-sans">Multi-Agent Task Orchestration</p>
            </div>
          </div>
        </div>

        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full">
          Architecture Ready
        </span>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        <p className="text-[11px] text-slate-400 leading-relaxed">
          MAYRA delegates specialized background tasks, code refactoring, and multi-query research to dedicated sub-agents.
        </p>

        {/* Sub-Agent Cards */}
        <div className="space-y-3">
          {subAgents.map((agent) => (
            <div
              key={agent.id}
              className={`p-3.5 bg-[#0C1021] border rounded-2xl transition-colors space-y-3 ${
                agent.enabled ? 'border-indigo-500/30' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#070913] rounded-xl border border-white/10">
                    {getAgentIcon(agent.id)}
                  </div>
                  <div>
                    <div className="text-white font-bold text-xs flex items-center gap-1.5">
                      {agent.name}
                    </div>
                    <div className="text-[9px] font-mono text-indigo-400">{agent.role}</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={agent.enabled}
                  onChange={() => onToggleAgent(agent.id)}
                  className="w-4 h-4 accent-indigo-500 rounded mt-1"
                />
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {agent.description}
              </p>

              {/* Capabilities & Sandbox Status */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] font-mono">
                <div className="flex items-center gap-1 text-slate-400">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Sandboxed Execution</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Priority:</span>
                  <span className={`uppercase font-bold ${
                    agent.priority === 'high' ? 'text-purple-400' : 'text-blue-400'
                  }`}>
                    {agent.priority}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-[8px] font-mono text-slate-300 bg-[#070913] border border-white/5 px-2 py-0.5 rounded-full"
                  >
                    • {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
