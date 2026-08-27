import React, { useState } from 'react';
import { SkillItem } from '../../types';
import { 
  Wrench, Globe, FileText, Monitor, Cpu, 
  CheckCircle2, Plus, Search, Shield, ChevronRight, Sparkles, Store, ArrowLeft
} from 'lucide-react';

interface SkillsViewProps {
  skills: SkillItem[];
  onToggleSkill: (skillId: string) => void;
  onBack: () => void;
}

export const SkillsView: React.FC<SkillsViewProps> = ({
  skills,
  onToggleSkill,
  onBack
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStoreSheet, setShowStoreSheet] = useState(false);

  const categories = ['all', 'Intelligence', 'Vision', 'Productivity', 'System', 'Development'];

  const filteredSkills = skills.filter((s) => {
    const matchesCategory = filterCategory === 'all' || s.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getSkillIcon = (id: string) => {
    switch (id) {
      case 'skill-web-search': return <Globe className="w-4 h-4 text-blue-400" />;
      case 'skill-screen-vision': return <Monitor className="w-4 h-4 text-cyan-400" />;
      case 'skill-file-doc': return <FileText className="w-4 h-4 text-amber-400" />;
      case 'skill-device-automation': return <Cpu className="w-4 h-4 text-purple-400" />;
      default: return <Wrench className="w-4 h-4 text-emerald-400" />;
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
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">MAYRA Skills & Tools</h2>
              <p className="text-[10px] text-slate-400 font-sans">Installed Plugins & Capabilities</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowStoreSheet(true)}
          className="text-[10px] font-mono text-blue-400 bg-blue-950/40 border border-blue-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-blue-900/40 transition-colors"
        >
          <Store className="w-3 h-3" /> Skill Store
        </button>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search installed skills or tools..."
            className="w-full bg-[#0C1021] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors ${
                filterCategory === cat
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-[#0C1021] text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Skills Cards */}
        <div className="space-y-3">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className={`p-3.5 bg-[#0C1021] border rounded-2xl transition-colors space-y-2.5 ${
                skill.enabled ? 'border-blue-500/30' : 'border-white/5 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#070913] rounded-xl border border-white/10">
                    {getSkillIcon(skill.id)}
                  </div>
                  <div>
                    <div className="text-white font-bold text-xs flex items-center gap-1.5">
                      {skill.name}
                      <span className="text-[8px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.2 rounded border border-white/10">
                        v{skill.version}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-blue-400">{skill.category} • by {skill.author}</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={skill.enabled}
                  onChange={() => onToggleSkill(skill.id)}
                  className="w-4 h-4 accent-blue-500 rounded mt-1"
                />
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {skill.description}
              </p>

              <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                <span className="text-[8px] font-mono text-slate-500 uppercase mr-1">Permissions:</span>
                {skill.permissionsRequired.map((perm) => (
                  <span
                    key={perm}
                    className="text-[8px] font-mono text-slate-400 bg-[#070913] border border-white/5 px-1.5 py-0.2 rounded"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Skill Store Sheet Simulation */}
        {showStoreSheet && (
          <div className="p-4 bg-[#0F172A] border border-blue-500/40 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
                <Store className="w-4 h-4" /> MAYRA Skill Hub (Future Store)
              </span>
              <button onClick={() => setShowStoreSheet(false)} className="text-slate-400 hover:text-white text-xs">
                Close
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              Future integration pipeline to install community-verified skills, MCP servers, and custom tool bridges.
            </p>
            <div className="p-2.5 bg-[#070913] border border-white/10 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="text-white font-medium">Home Assistant BLE Bridge</div>
                <div className="text-[9px] text-slate-400">Control 50+ smart home brands</div>
              </div>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                Coming Phase 3+
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
