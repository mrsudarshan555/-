import React, { useState, useEffect } from 'react';
import { MemoryItem } from '../types';
import { Database, Plus, Search, Brain, Sparkles } from 'lucide-react';

export const MemoryInspector: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('user_preference');
  const [query, setQuery] = useState('');

  const fetchMemories = async () => {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;

    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, category })
      });
      const data = await res.json();
      if (data.success) {
        setKey('');
        setValue('');
        fetchMemories();
      }
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  };

  const filteredMemories = memories.filter(
    m => m.key.toLowerCase().includes(query.toLowerCase()) || m.value.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#08080c] border border-white/10 rounded-2xl overflow-hidden p-5 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            MAYRA Context Memory Shell
          </h2>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-full">
          Phase 1 UI Shell Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 flex-1 overflow-hidden">
        {/* Memory Creation Form */}
        <div className="bg-[#0b0b12] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-purple-400" /> Add Context Fact
          </h3>

          <form onSubmit={handleAddMemory} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase mb-1 block">Key / Topic</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. Assistant Name"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500 font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase mb-1 block">Value / Memory Content</label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. MAYRA is a native Android AI assistant UI reconstruction."
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500 font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-slate-300 outline-none font-mono"
              >
                <option value="user_preference">User Preference</option>
                <option value="system_config">System Configuration</option>
                <option value="context_fact">Context Fact</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-colors"
            >
              Store Memory Shell
            </button>
          </form>
        </div>

        {/* Memory List Inspector */}
        <div className="lg:col-span-2 flex flex-col gap-3 overflow-hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stored memory keys or content..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-sans"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredMemories.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500 border border-white/5 rounded-xl">
                No memories stored. MAYRA context DB will be connected in future phases.
              </div>
            ) : (
              filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3.5 bg-[#0a0a0e] border border-white/10 rounded-xl hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-cyan-400">{mem.key}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                      {mem.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{mem.value}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
