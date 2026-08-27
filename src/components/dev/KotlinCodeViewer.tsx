import React, { useState } from 'react';
import { KOTLIN_CODEBASE, KotlinFileItem } from '../../data/kotlinCodebase';
import { Code2, Copy, Check, FileCode, Folder, Search, Sparkles } from 'lucide-react';

export const KotlinCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<KotlinFileItem>(KOTLIN_CODEBASE[0]);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'settings', 'screens', 'navigation', 'core', 'config'];

  const filteredFiles = KOTLIN_CODEBASE.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.path.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0C1021] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#070913]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Jetpack Compose Codebase
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">Native Kotlin & Material 3 Source Architecture</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy File'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-white/5 bg-[#070913]/60 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[160px]">
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files..."
            className="w-full bg-[#0C1021] border border-white/10 rounded-lg pl-7 pr-2 py-1 text-[11px] text-white outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left File Tree Sidebar */}
        <div className="w-56 border-r border-white/10 bg-[#070913] overflow-y-auto p-2 space-y-1 shrink-0">
          <div className="text-[9px] font-mono text-slate-500 uppercase px-2 py-1 flex items-center gap-1">
            <Folder className="w-3 h-3" /> Project Explorer
          </div>

          {filteredFiles.map((file) => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full p-2 rounded-xl text-left flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                <div className="overflow-hidden">
                  <div className="text-xs font-mono truncate">{file.name}</div>
                  <div className="text-[8px] font-mono text-slate-500 truncate">{file.category}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Code Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#050711]">
          <div className="px-4 py-2 border-b border-white/5 bg-[#0C1021]/80 text-[10px] font-mono text-cyan-400 flex items-center justify-between">
            <span>{selectedFile.path}</span>
            <span className="text-slate-500">{selectedFile.code.split('\n').length} lines</span>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-[#050711]">
            <pre className="text-slate-300 whitespace-pre">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
};
