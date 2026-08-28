import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryItem, FamilyContact, MemoryCategory } from '../../types';
import { INITIAL_FAMILY_CONTACTS } from '../../data/defaultData';
import { MemoryVaultService } from '../../services/memory/memoryVaultService';
import { 
  Brain, Plus, Search, Pin, Trash2, 
  Tag, Clock, Check, Download, Sparkles, Filter,
  Users, Phone, MessageSquare, Send, Heart, Edit3, X, Star, Shield, FolderGit2
} from 'lucide-react';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { SuccessConfettiToast } from '../common/SuccessConfettiToast';
import { EmptyStateIllustration } from '../common/EmptyStateIllustration';
import { PullToRefresh } from '../common/PullToRefresh';

interface MemoriesScreenProps {
  memories: MemoryItem[];
  onAddMemory: (newMem: Omit<MemoryItem, 'id' | 'timestamp'>) => void;
  onDeleteMemory: (id: string) => void;
  onTogglePin: (id: string) => void;
  onTriggerDirectMessage?: (contactName: string, service: 'whatsapp' | 'call') => void;
  triggerAddSignal?: number;
}

const FAMILY_CONTACTS_STORAGE_KEY = 'mayra_family_contacts';

function getInitialFamilyContacts(): FamilyContact[] {
  if (typeof window === 'undefined') return INITIAL_FAMILY_CONTACTS;
  try {
    const saved = localStorage.getItem(FAMILY_CONTACTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return INITIAL_FAMILY_CONTACTS;
}

export const MemoriesScreen: React.FC<MemoriesScreenProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
  onTogglePin,
  onTriggerDirectMessage,
  triggerAddSignal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [familyContacts, setFamilyContactsState] = useState<FamilyContact[]>(getInitialFamilyContacts);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [newFamilyRelation, setNewFamilyRelation] = useState<FamilyContact['relationship']>('Father');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyNumber, setNewFamilyNumber] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const setFamilyContacts = React.useCallback((update: React.SetStateAction<FamilyContact[]>) => {
    setFamilyContactsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      try {
        localStorage.setItem(FAMILY_CONTACTS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Open action menu on FAB signal
  React.useEffect(() => {
    if (triggerAddSignal && triggerAddSignal > 0) {
      setShowActionMenu(true);
    }
  }, [triggerAddSignal]);

  // New memory form state
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('personal');
  const [newImportance, setNewImportance] = useState<number>(3);
  const [newTagsInput, setNewTagsInput] = useState<string>('');

  const categories: ('all' | MemoryCategory)[] = ['all', 'personal', 'preference', 'project', 'task', 'system', 'episodic'];

  // Memory Vault Hybrid Search Integration
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return memories
        .filter((m) => selectedCategory === 'all' || m.category === selectedCategory)
        .map((item) => ({ item, score: item.isPinned ? 5 : item.importance || 3, matchReasons: [] }));
    }
    return MemoryVaultService.search(memories, {
      query: searchQuery,
      categories: selectedCategory === 'all' ? undefined : [selectedCategory as MemoryCategory],
      limit: 50,
      minImportance: 1
    });
  }, [memories, searchQuery, selectedCategory]);

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    const parsedTags = newTagsInput
      .split(/[,#\s]+/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    onAddMemory({
      key: newKey.trim(),
      value: newValue.trim(),
      category: newCategory,
      isPinned: false,
      importance: newImportance,
      tags: parsedTags.length > 0 ? parsedTags : [newCategory],
      source: 'user_explicit'
    });

    const savedKey = newKey.trim();
    setNewKey('');
    setNewValue('');
    setNewTagsInput('');
    setNewImportance(3);
    setShowAddModal(false);
    setToastMessage(`Saved memory: "${savedKey}"`);
  };

  const handleAddFamilyContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim() || !newFamilyNumber.trim()) return;

    const newContact: FamilyContact = {
      id: `fam-${Date.now()}`,
      relationship: newFamilyRelation,
      name: newFamilyName.trim(),
      whatsappNumber: newFamilyNumber.trim(),
      notes: `Family Contact • ${newFamilyRelation}`
    };

    setFamilyContacts(prev => [...prev, newContact]);
    const addedName = newFamilyName.trim();
    setNewFamilyName('');
    setNewFamilyNumber('');
    setShowAddFamilyModal(false);
    setToastMessage(`Added family contact: ${addedName}`);
  };

  const handleTriggerContact = (contact: FamilyContact, type: 'whatsapp' | 'call') => {
    const cleanNum = contact.whatsappNumber.replace(/[^0-9+]/g, '');
    if (type === 'whatsapp') {
      setToastMessage(`Opening WhatsApp with ${contact.name}...`);
      if (typeof window !== 'undefined') {
        const url = `https://wa.me/${cleanNum.replace('+', '')}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      setToastMessage(`Calling ${contact.name}...`);
    }

    if (onTriggerDirectMessage) {
      onTriggerDirectMessage(contact.name, type);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#070913] text-slate-200 relative">
      
      {/* Micro-Delight Success Confetti Toast */}
      <SuccessConfettiToast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-orbitron font-extrabold text-white uppercase tracking-wider">Context & Memories</h2>
            <p className="text-[10px] text-slate-400 font-normal">Persistent Knowledge Base & Family Contacts</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 bg-purple-500/15 border border-purple-500/30 rounded-full text-[10px] font-mono text-purple-300 flex items-center gap-1">
            <span className="font-bold"><AnimatedCounter value={memories.length} /></span> facts • <span className="font-bold"><AnimatedCounter value={familyContacts.length} /></span> contacts
          </span>
        </div>
      </div>

      {/* Pull To Refresh Wrapped Memory List Container */}
      <PullToRefresh
        onRefresh={async () => {
          await new Promise(res => setTimeout(res, 500));
        }}
        className="flex-1 overflow-y-auto p-4 space-y-4 pb-8 scrollbar-thin"
      >

        {/* 1. FAMILY CONTACTS CARD SECTION */}
        <div className="p-3.5 bg-[#0C1024] border border-white/10 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="text-xs font-orbitron font-bold text-white tracking-wide">
                Family & Priority Contacts
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Quick Call & Message</span>
          </div>

          {familyContacts.length === 0 ? (
            <div className="p-4 text-center border border-dashed border-white/10 rounded-xl bg-[#080B1E]/60 space-y-1.5">
              <p className="text-xs text-slate-400 font-sans">No family contacts added yet.</p>
              <button
                onClick={() => setShowAddFamilyModal(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                Tap + Family to add.
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {familyContacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  whileHover={{ scale: 1.015 }}
                  className="p-3 bg-[#0E1329] border border-white/10 hover:border-cyan-500/40 rounded-xl flex items-center justify-between transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-orbitron font-bold text-white">{contact.name}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9px] font-medium">
                        {contact.relationship}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-normal">{contact.whatsappNumber}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleTriggerContact(contact, 'whatsapp')}
                      className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl text-emerald-300 transition-colors cursor-pointer"
                      title={`Send WhatsApp message to ${contact.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 stroke-[1.8]" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleTriggerContact(contact, 'call')}
                      className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-xl text-cyan-300 transition-colors cursor-pointer"
                      title={`Voice call ${contact.name}`}
                    >
                      <Phone className="w-3.5 h-3.5 stroke-[1.8]" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 2. SEARCH & CONTEXT MEMORIES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-orbitron font-bold text-white tracking-wide flex items-center gap-1">
              <span>Memory Vault</span>
              <span>(<AnimatedCounter value={searchResults.length} />)</span>
            </h3>
            {searchQuery && (
              <span className="text-[10px] font-mono text-purple-300">
                Hybrid Ranked
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vault, tags, preferences..."
                className="w-full bg-[#0C1024] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-purple-400 transition-colors font-sans"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[10px] uppercase font-medium tracking-wider shrink-0 transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white font-semibold shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                      : 'bg-[#0C1024] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {searchResults.length === 0 ? (
              <EmptyStateIllustration
                type={searchQuery ? 'search' : 'memories'}
                title={searchQuery ? 'No Vault Matches Found' : 'Your Memory Vault is Empty'}
                subtitle={searchQuery ? `No records matched "${searchQuery}".` : 'Add your habits, favorite coffee, work context or family contacts to keep MAYRA informed.'}
              />
            ) : (
              <AnimatePresence>
                {searchResults.map(({ item: mem, matchReasons, score }) => (
                  <motion.div
                    key={mem.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`p-3.5 bg-[#0C1024] border rounded-2xl transition-all space-y-2 shadow-sm ${
                      mem.isPinned ? 'border-purple-500/50 bg-purple-950/20 shadow-[0_0_16px_rgba(168,85,247,0.2)]' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-white">{mem.key}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[8px] font-mono uppercase">
                            {mem.category}
                          </span>
                          {mem.isPinned && (
                            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/25 border border-purple-400/40 text-purple-300 text-[9px] font-medium flex items-center gap-0.5">
                              <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                          )}
                        </div>
                        
                        {/* Importance level */}
                        <div className="flex items-center gap-1 text-[10px] text-amber-400">
                          {Array.from({ length: Math.min(5, Math.max(1, mem.importance || 3)) }).map((_, idx) => (
                            <Star key={idx} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          ))}
                          {searchQuery && (
                            <span className="text-[9px] font-mono text-purple-300 ml-1.5">
                              Score: {score} {matchReasons.length > 0 ? `(${matchReasons.join(', ')})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.88 }}
                          onClick={() => {
                            onTogglePin(mem.id);
                            setToastMessage(mem.isPinned ? `Unpinned fact: "${mem.key}"` : `Pinned fact to priority context: "${mem.key}"`);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            mem.isPinned ? 'text-purple-400 hover:text-purple-300' : 'text-slate-400 hover:text-white'
                          }`}
                          title={mem.isPinned ? 'Unpin fact' : 'Pin fact to priority context'}
                        >
                          <Pin className="w-3.5 h-3.5 stroke-[1.8]" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.88 }}
                          onClick={() => {
                            onDeleteMemory(mem.id);
                            setToastMessage(`Deleted memory: "${mem.key}"`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete memory"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
                        </motion.button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {mem.value}
                    </p>

                    {/* Tags */}
                    {mem.tags && mem.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {mem.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </PullToRefresh>

      {/* Add Family Contact Modal */}
      {showAddFamilyModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <motion.form
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onSubmit={handleAddFamilyContact}
            className="w-full max-w-sm bg-[#0C1021] border border-cyan-500/40 rounded-3xl p-4 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" /> Add Family Contact
              </span>
              <button
                type="button"
                onClick={() => setShowAddFamilyModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Relationship</label>
              <select
                value={newFamilyRelation}
                onChange={(e) => setNewFamilyRelation(e.target.value as any)}
                className="w-full bg-[#070913] border border-white/10 rounded-xl p-2 text-xs text-white font-mono outline-none focus:border-cyan-500"
              >
                <option value="Father">Father (Dad)</option>
                <option value="Mother">Mother (Mom)</option>
                <option value="Sibling">Sibling (Brother / Sister)</option>
                <option value="Spouse">Spouse / Partner</option>
                <option value="Other">Other Family</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Contact Name</label>
              <input
                type="text"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="e.g. Dad or Mom"
                className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-sans"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">WhatsApp / Phone Number</label>
              <input
                type="text"
                value={newFamilyNumber}
                onChange={(e) => setNewFamilyNumber(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!newFamilyName.trim() || !newFamilyNumber.trim()}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              Save Family Contact
            </motion.button>
          </motion.form>
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <motion.form
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onSubmit={handleSaveMemory}
            className="w-full max-w-sm bg-[#0C1021] border border-purple-500/40 rounded-3xl p-4 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase flex items-center gap-1.5">
                <Brain className="w-4 h-4" /> Store New Memory Fact
              </span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Key / Topic</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. Favorite Coffee or Project Deadline"
                className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-sans"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#070913] border border-white/10 rounded-xl p-2 text-xs text-white font-mono outline-none focus:border-purple-500"
                >
                  <option value="personal">Personal</option>
                  <option value="preference">Preference</option>
                  <option value="project">Project</option>
                  <option value="task">Task</option>
                  <option value="system">System</option>
                  <option value="episodic">Episodic</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Importance (1-5)</label>
                <div className="flex items-center gap-1 bg-[#070913] border border-white/10 rounded-xl p-1.5 justify-around">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewImportance(lvl)}
                      className={`p-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        newImportance >= lvl ? 'text-amber-400 font-bold' : 'text-slate-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Tags (Comma or space separated)</label>
              <input
                type="text"
                value={newTagsInput}
                onChange={(e) => setNewTagsInput(e.target.value)}
                placeholder="e.g. backend, priority, home"
                className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-sans"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Detail / Memory Value</label>
              <textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Write exact preference detail..."
                rows={3}
                className="w-full bg-[#070913] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-500 font-sans resize-none"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!newKey.trim() || !newValue.trim()}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              Save to Context Memory
            </motion.button>
          </motion.form>
        </div>
      )}

      {/* Floating Action Menu Popup (Triggered by center + FAB) */}
      {showActionMenu && (
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex items-end sm:items-center justify-center p-3 animate-in fade-in"
          onClick={() => setShowActionMenu(false)}
        >
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm bg-[#0B0F22] border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Add New Context</h3>
                  <p className="text-[11px] text-slate-400">Select an item to record in MAYRA's memory</p>
                </div>
              </div>
              <button
                onClick={() => setShowActionMenu(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/[0.05] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setShowActionMenu(false);
                  setShowAddModal(true);
                }}
                className="w-full p-3.5 bg-white/[0.04] hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/50 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer"
              >
                <div className="p-2.5 bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white rounded-xl transition-colors">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white block">+ Add Fact / Memory</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Store preferences, routines, notes or personal details</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setShowActionMenu(false);
                  setShowAddFamilyModal(true);
                }}
                className="w-full p-3.5 bg-white/[0.04] hover:bg-cyan-600/20 border border-white/10 hover:border-cyan-500/50 rounded-2xl flex items-center gap-3.5 transition-all text-left group cursor-pointer"
              >
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white rounded-xl transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white block">+ Add Family Contact</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Register Dad, Mom, or family with phone / WhatsApp</span>
                </div>
              </motion.button>
            </div>

            <button
              onClick={() => setShowActionMenu(false)}
              className="w-full py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
};


