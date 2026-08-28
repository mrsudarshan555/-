import React, { useState } from 'react';
import { 
  Database, User, FileText, Zap, Calendar, Plus, Trash2, Edit3, 
  Search, Pin, Play, CheckCircle2, ShieldCheck, Tag, Sparkles, X, ArrowRight
} from 'lucide-react';
import { 
  StonicxUserProfile as StonicxProfileFile, 
  StonicxTopicNote, 
  StonicxJobPriming as StonicxJobDirective, 
  StonicxDailyLog,
  StonicxNoteCategory
} from '../../types/stonicxMemory';

interface StonicxVaultProps {
  profile: StonicxProfileFile;
  onUpdateProfile: (updates: Partial<StonicxProfileFile>) => void;
  topicNotes: StonicxTopicNote[];
  onAddTopicNote: (note: Omit<StonicxTopicNote, 'id' | 'createdAt' | 'lastModified'>) => void;
  onUpdateTopicNote: (id: string, updates: Partial<StonicxTopicNote>) => void;
  onDeleteTopicNote: (id: string) => void;
  onTogglePinTopicNote: (id: string) => void;
  jobs: StonicxJobDirective[];
  activeJobId: string | null;
  onSelectActiveJob: (id: string | null) => void;
  onAddJob: (job: Omit<StonicxJobDirective, 'id'>) => void;
  onUpdateJob: (id: string, updates: Partial<StonicxJobDirective>) => void;
  onDeleteJob: (id: string) => void;
  dailyLogs: StonicxDailyLog[];
  onDeleteDailyLog?: (date: string) => void;
  onTriggerPrompt?: (prompt: string) => void;
}

type VaultTab = 'profile' | 'notes' | 'jobs' | 'daily';

export const StonicxVault: React.FC<StonicxVaultProps> = ({
  profile,
  onUpdateProfile,
  topicNotes,
  onAddTopicNote,
  onUpdateTopicNote,
  onDeleteTopicNote,
  onTogglePinTopicNote,
  jobs,
  activeJobId,
  onSelectActiveJob,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  dailyLogs,
  onDeleteDailyLog,
  onTriggerPrompt
}) => {
  const [activeTab, setActiveTab] = useState<VaultTab>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Note creation state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<StonicxNoteCategory>('project');
  const [newNoteTags, setNewNoteTags] = useState('');

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.preferredName);
  const [editRole, setEditRole] = useState(profile.roleOrTitle);
  const [editOrg, setEditOrg] = useState(profile.organizationOrProject);
  const [editStack, setEditStack] = useState(profile.techStack.join(', '));
  const [editStyle, setEditStyle] = useState(profile.communicationStyle);
  const [newPrefInput, setNewPrefInput] = useState('');

  // Job creation state
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobPrompt, setNewJobPrompt] = useState('');
  const [newJobCategories, setNewJobCategories] = useState<StonicxNoteCategory[]>(['project', 'code']);

  // Success flash toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    const tagsArray = newNoteTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    onAddTopicNote({
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      category: newNoteCategory,
      tags: tagsArray.length > 0 ? tagsArray : [newNoteCategory],
      isPinned: false
    });
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteTags('');
    setIsAddingNote(false);
    showToast('Topic note primed into Neural Vault');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      preferredName: editName.trim() || profile.preferredName,
      fullName: editName.trim() || profile.fullName,
      roleOrTitle: editRole.trim() || profile.roleOrTitle,
      organizationOrProject: editOrg.trim() || profile.organizationOrProject,
      techStack: editStack.split(',').map(s => s.trim()).filter(Boolean),
      communicationStyle: editStyle.trim() || profile.communicationStyle
    });
    setIsEditingProfile(false);
    showToast('Profile file updated & synced');
  };

  const handleAddPreference = () => {
    if (!newPrefInput.trim()) return;
    onUpdateProfile({
      keyPreferences: [newPrefInput.trim(), ...profile.keyPreferences]
    });
    setNewPrefInput('');
    showToast('Preference directive primed');
  };

  const handleRemovePreference = (index: number) => {
    const updated = profile.keyPreferences.filter((_, i) => i !== index);
    onUpdateProfile({ keyPreferences: updated });
  };

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName.trim() || !newJobPrompt.trim()) return;
    onAddJob({
      name: newJobName.trim(),
      slug: newJobName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: 'Zap',
      description: newJobDesc.trim() || 'Custom user-defined task priming directive.',
      primerPrompt: newJobPrompt.trim(),
      targetCategories: newJobCategories,
      suggestedMacros: [`Execute ${newJobName}`],
      usageCount: 0
    });
    setNewJobName('');
    setNewJobDesc('');
    setNewJobPrompt('');
    setIsAddingJob(false);
    showToast('Task Priming Job registered');
  };

  const filteredNotes = topicNotes.filter(n => {
    const matchesCat = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const getCategoryBadgeColor = (cat: StonicxNoteCategory) => {
    switch (cat) {
      case 'personal': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'project': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'code': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'architecture': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'preference': return 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40';
      case 'task': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#020611] text-slate-100 font-mono overflow-y-auto select-none">
      {/* 1. TOP HEADER & PILL NAVIGATION */}
      <div className="p-3.5 border-b border-cyan-500/20 bg-[#030B1C]/95 backdrop-blur-md sticky top-0 z-20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <span>STONICX AI PRIMING VAULT</span>
                <span className="px-1.5 py-0.2 bg-cyan-400/20 text-cyan-200 text-[8px] rounded border border-cyan-400/30 font-sans">
                  ISOLATED
                </span>
              </h2>
              <p className="text-[10px] text-cyan-500/80 font-sans">Autonomous Profile • Topic Notes • Task Jobs • Daily Logs</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeTab === 'notes' && (
              <button
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-[0_0_12px_rgba(0,229,255,0.3)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> NEW NOTE
              </button>
            )}
            {activeTab === 'jobs' && (
              <button
                onClick={() => setIsAddingJob(!isAddingJob)}
                className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-[0_0_12px_rgba(0,229,255,0.3)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> NEW JOB
              </button>
            )}
          </div>
        </div>

        {/* Isolation Banner */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#071638] border border-cyan-500/30 rounded-xl text-[9px] text-cyan-300 font-sans">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Dedicated STONICX Memory Vault — 100% Cryptographically Isolated from MAYRA.</span>
          </div>
          <span className="font-mono text-[8px] bg-cyan-950 px-1 py-0.5 rounded text-cyan-200">KEY: stonicx_v2</span>
        </div>

        {/* 4 Pillars Navigation Bar */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#020914] border border-cyan-500/20 rounded-xl text-[10px] font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1. Profile</span>
            <span className="sm:hidden">Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2. Topic Notes</span>
            <span className="sm:hidden">Notes</span>
            <span className="text-[9px] opacity-75">({topicNotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'jobs'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3. Task Jobs</span>
            <span className="sm:hidden">Jobs</span>
            {activeJobId && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">4. Daily Logs</span>
            <span className="sm:hidden">Daily</span>
          </button>
        </div>
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-2xl flex items-center gap-2 border border-cyan-300 animate-bounce">
          <CheckCircle2 className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* 2. MAIN TAB CONTENTS */}
      <div className="p-3.5 space-y-4 pb-24">
        
        {/* TAB 1: SELF-UPDATING USER PROFILE FILE */}
        {activeTab === 'profile' && (
          <div className="space-y-3">
            {/* Profile Overview Card */}
            <div className="p-4 bg-[#030E24] border border-cyan-500/30 rounded-2xl space-y-3 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-black font-black text-lg shadow-md">
                    {profile.preferredName ? profile.preferredName[0] : 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{profile.fullName || profile.preferredName}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                        AUTONOMOUS PRIMING FILE
                      </span>
                    </h3>
                    <p className="text-[11px] text-cyan-300/80 font-sans">{profile.roleOrTitle} • {profile.organizationOrProject}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditName(profile.preferredName);
                    setEditRole(profile.roleOrTitle);
                    setEditOrg(profile.organizationOrProject);
                    setEditStack(profile.techStack.join(', '));
                    setEditStyle(profile.communicationStyle);
                    setIsEditingProfile(!isEditingProfile);
                  }}
                  className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white transition-all flex items-center gap-1 text-[10px] border border-cyan-500/20"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingProfile ? 'CANCEL' : 'EDIT'}</span>
                </button>
              </div>

              {/* Status pill: Auto updates from chat */}
              <div className="p-2.5 bg-[#020814] border border-cyan-500/20 rounded-xl text-[10px] text-cyan-300/90 font-sans flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold">Autonomous Sync Active: </span>
                  <span>STONICX continuously updates this profile whenever you share facts in chat (e.g. &ldquo;Mera naam Rahul hai&rdquo; or &ldquo;I prefer TypeScript&rdquo;).</span>
                </div>
              </div>

              {/* Edit Form */}
              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-cyan-500/20 font-sans">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-cyan-400 uppercase font-mono block mb-1">Preferred Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-cyan-400 uppercase font-mono block mb-1">Role / Title</label>
                      <input
                        type="text"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-cyan-400 uppercase font-mono block mb-1">Organization / Project</label>
                    <input
                      type="text"
                      value={editOrg}
                      onChange={(e) => setEditOrg(e.target.value)}
                      className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-cyan-400 uppercase font-mono block mb-1">Tech Stack (comma separated)</label>
                    <input
                      type="text"
                      value={editStack}
                      onChange={(e) => setEditStack(e.target.value)}
                      className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-cyan-400 uppercase font-mono block mb-1">Communication Style</label>
                    <input
                      type="text"
                      value={editStyle}
                      onChange={(e) => setEditStyle(e.target.value)}
                      className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> SAVE PROFILE FILE
                  </button>
                </form>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="text-[9px] text-cyan-400 uppercase tracking-wider mb-1.5">Tech Stack & Tooling:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.techStack.map((tech, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#020814] rounded-xl border border-cyan-500/10 text-[11px] font-sans">
                    <span className="text-cyan-400 font-mono text-[9px] uppercase block mb-0.5">Communication Style:</span>
                    <span className="text-slate-200">{profile.communicationStyle}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Directives & Key Preferences */}
            <div className="p-4 bg-[#030E24] border border-cyan-500/20 rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Key Directives & Preferences ({profile.keyPreferences.length})</span>
                </h4>
              </div>

              {/* Add directive */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom preference/rule (e.g. Always output TypeScript)..."
                  value={newPrefInput}
                  onChange={(e) => setNewPrefInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPreference()}
                  className="flex-1 bg-[#020611] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-sans"
                />
                <button
                  onClick={handleAddPreference}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs shrink-0 cursor-pointer"
                >
                  ADD
                </button>
              </div>

              {/* Preferences list */}
              <div className="space-y-1.5">
                {profile.keyPreferences.map((pref, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#020814] border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl flex items-center justify-between text-xs text-slate-200 font-sans transition-all group"
                  >
                    <span className="flex-1 mr-2 leading-relaxed">• {pref}</span>
                    <button
                      onClick={() => handleRemovePreference(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Testing Fact Injector */}
            <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 to-[#030E24] border border-cyan-500/30 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Memory Priming in Chat</span>
              </div>
              <p className="text-[10px] text-cyan-400/80 font-sans">
                Type any of these in STONICX chat to verify autonomous profile extraction and AI Priming:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Mera naam Alex hai and I build React apps',
                  'I prefer zero-fluff bulleted code solutions',
                  'Note this: Project Apollo launch is set for Friday'
                ].map((sample, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => {
                      if (onTriggerPrompt) onTriggerPrompt(sample);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-sans text-left transition-all active:scale-95 cursor-pointer"
                  >
                    &ldquo;{sample}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TOPIC-WISE ALAG NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            {/* Search & Category Filter */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-[#030E24] border border-cyan-500/20 rounded-xl px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-cyan-500 mr-2" />
                <input
                  type="text"
                  placeholder="Search topic notes by keyword or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-100 placeholder-cyan-600/60 outline-none font-sans"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#030E24] border border-cyan-500/20 text-[10px] text-cyan-300 rounded-xl px-2.5 py-2 outline-none font-bold"
              >
                <option value="all">ALL TOPICS</option>
                <option value="personal">PERSONAL</option>
                <option value="project">PROJECT</option>
                <option value="code">CODE</option>
                <option value="architecture">ARCHITECTURE</option>
                <option value="preference">PREFERENCE</option>
                <option value="task">TASK</option>
              </select>
            </div>

            {/* Add Note Form Modal */}
            {isAddingNote && (
              <form onSubmit={handleSaveNote} className="p-4 bg-[#030E24] border border-cyan-500/40 rounded-2xl space-y-3 shadow-2xl animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300 uppercase">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Create Topic-Specific Note
                  </div>
                  <button onClick={() => setIsAddingNote(false)} type="button" className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-[9px] text-cyan-400 uppercase block mb-1">Note Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Project Orion Architecture, Kotlin Standards"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-white outline-none focus:border-cyan-400 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-cyan-400 uppercase block mb-1">Category</label>
                    <select
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value as StonicxNoteCategory)}
                      className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-cyan-300 outline-none"
                    >
                      <option value="project">PROJECT</option>
                      <option value="code">CODE STANDARDS</option>
                      <option value="architecture">ARCHITECTURE</option>
                      <option value="personal">PERSONAL</option>
                      <option value="preference">PREFERENCE</option>
                      <option value="task">TASK</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-cyan-400 uppercase block mb-1">Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. backend, latency, db"
                      value={newNoteTags}
                      onChange={(e) => setNewNoteTags(e.target.value)}
                      className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-white outline-none focus:border-cyan-400 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-cyan-400 uppercase block mb-1">Note Content / Knowledge Body</label>
                  <textarea
                    rows={4}
                    placeholder="Write detailed context, rules, or requirements..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400 resize-none font-sans leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> PRIME NOTE INTO VAULT
                </button>
              </form>
            )}

            {/* Notes List */}
            <div className="space-y-2.5">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3.5 bg-[#030E24] border rounded-2xl transition-all space-y-2.5 relative group ${
                    note.isPinned 
                      ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.15)]' 
                      : 'border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase ${getCategoryBadgeColor(note.category)}`}>
                        {note.category}
                      </span>
                      <h4 className="text-xs font-bold text-white font-sans">{note.title}</h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onTogglePinTopicNote(note.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          note.isPinned ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-500 hover:text-white'
                        }`}
                        title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTopicNote(note.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-cyan-500/10 text-[9px] text-cyan-400/70 font-sans">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.2 bg-cyan-500/10 rounded text-cyan-300">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span>{new Date(note.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              {filteredNotes.length === 0 && (
                <div className="p-8 text-center bg-[#030E24] border border-dashed border-cyan-500/20 rounded-2xl text-xs text-slate-400">
                  No topic notes matched your query. Click &quot;NEW NOTE&quot; to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: "JOBS" CONCEPT — TASK-SPECIFIC PRIMING */}
        {activeTab === 'jobs' && (
          <div className="space-y-3">
            <div className="p-3 bg-[#030E24] border border-cyan-500/20 rounded-2xl text-[10px] text-cyan-300/90 font-sans flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold">Task-Specific Priming: </span>
                <span>Selecting or triggering a Job causes STONICX to load dedicated instructions and related topic notes before synthesizing the output.</span>
              </div>
            </div>

            {/* Add Custom Job Form */}
            {isAddingJob && (
              <form onSubmit={handleSaveJob} className="p-4 bg-[#030E24] border border-cyan-500/40 rounded-2xl space-y-3 shadow-2xl">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300 uppercase">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> Create Task Priming Job
                  </div>
                  <button onClick={() => setIsAddingJob(false)} type="button" className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-[9px] text-cyan-400 uppercase block mb-1">Job Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Architecture RFC Generator"
                    value={newJobName}
                    onChange={(e) => setNewJobName(e.target.value)}
                    className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-white outline-none focus:border-cyan-400 font-sans"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-cyan-400 uppercase block mb-1">Short Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Writes comprehensive technical RFC documents"
                    value={newJobDesc}
                    onChange={(e) => setNewJobDesc(e.target.value)}
                    className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-white outline-none focus:border-cyan-400 font-sans"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-cyan-400 uppercase block mb-1">Task Priming Directive / Prompt Rules</label>
                  <textarea
                    rows={4}
                    placeholder="Specify step-by-step output rules, formatting requirements, and constraints..."
                    value={newJobPrompt}
                    onChange={(e) => setNewJobPrompt(e.target.value)}
                    className="w-full bg-[#020611] border border-cyan-500/30 rounded-xl p-2 text-xs text-white outline-none focus:border-cyan-400 resize-none font-sans leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> REGISTER TASK PRIMING JOB
                </button>
              </form>
            )}

            {/* Jobs Grid */}
            <div className="space-y-3">
              {jobs.map((job) => {
                const isActive = activeJobId === job.id;
                return (
                  <div
                    key={job.id}
                    className={`p-4 bg-[#030E24] border rounded-2xl transition-all space-y-3 ${
                      isActive
                        ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.2)] bg-gradient-to-r from-cyan-950/60 to-[#030E24]'
                        : 'border-cyan-500/20 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${
                          isActive ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white font-sans flex items-center gap-2">
                            <span>{job.name}</span>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 text-[8px] font-mono">
                                ACTIVE PRIMER
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-cyan-400/70 font-sans">{job.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectActiveJob(isActive ? null : job.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-cyan-400 text-black shadow-md'
                            : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> PRIMED
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> ACTIVATE
                          </>
                        )}
                      </button>
                    </div>

                    {/* Priming rules preview */}
                    <div className="p-2.5 bg-[#020814] border border-cyan-500/10 rounded-xl text-[10px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {job.primerPrompt}
                    </div>

                    {/* Suggested Macros */}
                    {job.suggestedMacros && job.suggestedMacros.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[9px] text-cyan-400 uppercase tracking-wider block mb-1">Quick Macros:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.suggestedMacros.map((macro, mIdx) => (
                            <button
                              key={mIdx}
                              onClick={() => {
                                onSelectActiveJob(job.id);
                                if (onTriggerPrompt) onTriggerPrompt(macro);
                              }}
                              className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] text-cyan-200 border border-cyan-500/20 font-sans transition-all text-left flex items-center gap-1 cursor-pointer"
                            >
                              <span>{macro}</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: DAILY LOGS & SESSION TIMELINE */}
        {activeTab === 'daily' && (
          <div className="space-y-3">
            <div className="p-3 bg-[#030E24] border border-cyan-500/20 rounded-2xl text-[10px] text-cyan-300/90 font-sans flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold">Continuous Daily Log Subsystem: </span>
                <span>Maintains an automatic rolling timeline of past conversations, so STONICX can answer &ldquo;Kal humne kya baat ki thi&rdquo; with precision.</span>
              </div>
            </div>

            <div className="space-y-3">
              {dailyLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#030E24] border border-cyan-500/20 rounded-2xl space-y-2.5 shadow-md relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold font-mono">
                        {log.date}
                      </span>
                      <span className="text-[10px] text-cyan-500 font-sans">
                        {log.interactionCount} turns logged
                      </span>
                    </div>

                    {onDeleteDailyLog && (
                      <button
                        onClick={() => onDeleteDailyLog(log.date)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Delete day log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {log.summary}
                  </p>

                  <div className="pt-2 border-t border-cyan-500/10 flex flex-wrap gap-1.5">
                    {log.keyTopics.map((topic, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-[9px] text-cyan-300 border border-cyan-500/20 font-sans">
                        #{topic}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {dailyLogs.length === 0 && (
                <div className="p-8 text-center bg-[#030E24] border border-dashed border-cyan-500/20 rounded-2xl text-xs text-slate-400">
                  No daily logs recorded yet. Daily interactions will automatically populate this timeline.
                </div>
              )}
            </div>

            {/* Quick Test Button for Daily Log Recall */}
            <div className="p-3.5 bg-[#030E24] border border-cyan-500/30 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Multi-Day Context Recall</span>
              </div>
              <p className="text-[10px] text-cyan-400/80 font-sans">
                Click below to test how STONICX retrieves past daily logs:
              </p>
              <button
                onClick={() => {
                  if (onTriggerPrompt) onTriggerPrompt('Kal aur aaj humne kya baat ki thi? Short summary do.');
                }}
                className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                &ldquo;Kal aur aaj humne kya baat ki thi? Short summary do.&rdquo;
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
