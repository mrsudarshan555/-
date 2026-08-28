import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, AssistantStatus } from '../../types';
import { 
  Send, Mic, Sparkles, Copy, 
  Paperclip, X, FileText, Image as ImageIcon,
  Check, Search, ChevronUp, ChevronDown, Trash2, Zap
} from 'lucide-react';
import { AttachmentBottomSheet, AttachmentItem } from '../common/AttachmentBottomSheet';
import { getDynamicSuggestions } from '../../utils/dynamicSuggestions';
import { EmptyStateIllustration } from '../common/EmptyStateIllustration';
import { ShimmerSkeleton } from '../common/ShimmerSkeleton';
import { PullToRefresh } from '../common/PullToRefresh';

interface ChatScreenProps {
  messages: ChatMessage[];
  status: AssistantStatus;
  inputText: string;
  setInputText: (val: string) => void;
  onSubmitPrompt: (customText?: string, image?: { base64: string; mimeType?: string; name?: string; size?: string }) => void;
  onTriggerVoice: () => void;
  onClearChat: () => void;
  onOpenVisionScanner?: () => void;
  onOpenRoutines?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  status,
  inputText,
  setInputText,
  onSubmitPrompt,
  onTriggerVoice,
  onClearChat,
  onOpenVisionScanner,
  onOpenRoutines
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<AttachmentItem | null>(null);
  const [isAttachmentSheetOpen, setIsAttachmentSheetOpen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState<number>(0);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Chat Search State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Filter and find matching message IDs
  const matchingMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .filter(m => m.text.toLowerCase().includes(q))
      .map(m => m.id);
  }, [messages, searchQuery]);

  // Adjust active match index
  useEffect(() => {
    if (matchingMessageIds.length > 0) {
      setCurrentMatchIndex(0);
      // Scroll to first match
      const el = document.getElementById(`msg-${matchingMessageIds[0]}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [matchingMessageIds]);

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchingMessageIds.length;
    setCurrentMatchIndex(nextIdx);
    const targetId = matchingMessageIds[nextIdx];
    const el = document.getElementById(`msg-${targetId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchingMessageIds.length) % matchingMessageIds.length;
    setCurrentMatchIndex(prevIdx);
    const targetId = matchingMessageIds[prevIdx];
    const el = document.getElementById(`msg-${targetId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Keyboard open/close layout coordinator via visualViewport
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleVisualResize = () => {
      if (!window.visualViewport) return;
      const visualHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const offset = Math.max(0, windowHeight - visualHeight - (window.visualViewport.offsetTop || 0));
      setKeyboardOffset(offset);
      if (offset > 40) {
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    };

    window.visualViewport.addEventListener('resize', handleVisualResize);
    window.visualViewport.addEventListener('scroll', handleVisualResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleVisualResize);
      window.visualViewport?.removeEventListener('scroll', handleVisualResize);
    };
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status, isSearchOpen]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 1800);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isDoc = attachedFile?.mimeType?.includes('pdf') || 
                  attachedFile?.mimeType?.includes('text') || 
                  attachedFile?.mimeType?.includes('csv') || 
                  attachedFile?.mimeType?.includes('json') ||
                  attachedFile?.name.match(/\.(pdf|txt|csv|json|md|doc|docx)$/i);

    const defaultPrompt = isDoc
      ? `Please read and analyze this attached document (${attachedFile?.name}). Summarize key points and explain its contents.`
      : 'Please analyze what is in this image in detail.';

    const promptToSend = attachedFile && !inputText.trim()
      ? defaultPrompt
      : inputText;
    
    const filePayload = attachedFile?.dataUrl 
      ? { 
          base64: attachedFile.dataUrl, 
          mimeType: attachedFile.mimeType || (isDoc ? 'application/pdf' : 'image/jpeg'),
          name: attachedFile.name,
          size: attachedFile.size
        }
      : undefined;

    onSubmitPrompt(promptToSend, filePayload);
    setAttachedFile(null);
  };

  const [rotationSeed, setRotationSeed] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationSeed(prev => (prev + 1) % 10);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const samplePrompts = useMemo(() => {
    return getDynamicSuggestions(messages, 'en', rotationSeed);
  }, [messages, rotationSeed]);

  // Helper to render text with search query highlighted
  const renderHighlightedText = (text: string, isMatch: boolean) => {
    if (!searchQuery.trim() || !isMatch) {
      return text;
    }
    const q = searchQuery.toLowerCase();
    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => {
      if (part.toLowerCase() === q) {
        return (
          <mark key={i} className="bg-amber-400 text-slate-950 font-bold px-0.5 rounded shadow-sm">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden bg-[#070913] text-slate-200 relative min-h-0 transition-[padding-bottom] duration-200 ease-out"
      style={keyboardOffset > 0 ? { paddingBottom: `${keyboardOffset}px` } : undefined}
    >
      
      {/* Top Floating Mini Header with Search & Clear */}
      <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between bg-[#070913]/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold font-sans text-white">MAYRA Chat & History</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenRoutines && (
            <button
              onClick={onOpenRoutines}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1 text-[10px] font-mono cursor-pointer"
              title="Quick Routines"
            >
              <Zap className="w-3 h-3 stroke-[2]" />
              <span className="hidden sm:inline">Routines</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsSearchOpen(prev => !prev);
              if (!isSearchOpen) {
                setTimeout(() => searchInputRef.current?.focus(), 150);
              } else {
                setSearchQuery('');
              }
            }}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isSearchOpen ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
            title="Search Chat History"
          >
            <Search className="w-3.5 h-3.5 stroke-[1.8]" />
          </button>

          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
              title="Clear Chat"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.8]" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-cyan-500/30 bg-[#0C1021] px-3 py-2 z-10 shrink-0"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-black/50 border border-white/10 rounded-xl px-2.5 py-1 gap-2 focus-within:border-cyan-400">
                <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in chat history..."
                  className="bg-transparent border-none outline-none flex-1 text-xs text-white placeholder-slate-400 font-sans min-w-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Match Navigation Counter */}
              {searchQuery.trim() && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300">
                  <span>
                    {matchingMessageIds.length > 0 ? `${currentMatchIndex + 1}/${matchingMessageIds.length}` : '0 found'}
                  </span>
                  <button
                    onClick={handlePrevMatch}
                    disabled={matchingMessageIds.length === 0}
                    className="p-1 hover:bg-white/10 disabled:opacity-30 rounded cursor-pointer"
                    title="Previous match"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNextMatch}
                    disabled={matchingMessageIds.length === 0}
                    className="p-1 hover:bg-white/10 disabled:opacity-30 rounded cursor-pointer"
                    title="Next match"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pull To Refresh Wrapped Messages Stream */}
      <PullToRefresh
        onRefresh={async () => {
          await new Promise(res => setTimeout(res, 600));
        }}
        className="flex-1 overflow-y-auto p-3.5 flex flex-col min-h-0 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center my-auto min-h-[300px]">
            <EmptyStateIllustration
              type="chat"
              suggestions={samplePrompts.slice(0, 3)}
              onSelectSuggestion={(sug) => {
                setInputText(sug);
              }}
            />
          </div>
        ) : (
          <div className="space-y-3 w-full flex flex-col">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const isMatch = matchingMessageIds.includes(msg.id);
                const isCurrentFocusedMatch = isMatch && matchingMessageIds[currentMatchIndex] === msg.id;

                return (
                  <motion.div
                    id={`msg-${msg.id}`}
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all ${
                      isCurrentFocusedMatch ? 'ring-2 ring-amber-400 rounded-2xl p-0.5' : ''
                    }`}
                  >
                    <div
                      className={`max-w-[86%] rounded-2xl p-3 text-xs leading-relaxed font-sans transition-all ${
                        isUser
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-700 backdrop-blur-xl border border-white/20 text-white rounded-br-sm shadow-[0_4px_20px_rgba(37,99,235,0.25)]'
                          : 'bg-white/[0.07] backdrop-blur-2xl border border-white/15 text-slate-100 rounded-bl-sm shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
                      }`}
                    >
                      {!isUser && (
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 text-[9px] font-mono text-cyan-300 font-bold">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                            <span>MAYRA</span>
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </motion.button>
                        </div>
                      )}

                      {/* Render attached image or document in user bubble if present */}
                      {msg.image && (msg.image.url || msg.image.base64) && (
                        <div className="mb-2">
                          {msg.image.mimeType?.startsWith('image/') || (!msg.image.mimeType && !msg.image.name?.match(/\.(pdf|txt|csv|json|md|doc|docx)$/i)) ? (
                            <div className="overflow-hidden rounded-lg border border-white/20 max-w-[220px]">
                              <img 
                                src={msg.image.url || msg.image.base64} 
                                alt="Attached vision snapshot" 
                                className="w-full h-auto object-cover max-h-48"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2.5 bg-black/40 rounded-xl border border-white/20 text-left max-w-[240px]">
                              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-300 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-white truncate">{msg.image.name || 'Document'}</p>
                                <p className="text-[9px] text-slate-300 uppercase">{msg.image.mimeType?.split('/')[1] || 'PDF'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="whitespace-pre-wrap leading-relaxed">
                        {renderHighlightedText(msg.text, isMatch)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Shimmering Reasoning Card for Thinking State */}
            {status === 'THINKING' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-[75%] rounded-2xl rounded-bl-sm p-3 bg-slate-900/90 border border-cyan-400/40 backdrop-blur-2xl shadow-[0_4px_24px_rgba(6,182,212,0.25)] space-y-2"
              >
                <div className="flex items-center gap-2 text-cyan-300 font-mono text-[10px] font-bold">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                  <span>MAYRA Neural Reasoning...</span>
                </div>
                <div className="space-y-1.5 pt-0.5">
                  <ShimmerSkeleton width="100%" height="8px" className="rounded-full bg-cyan-950/40" />
                  <ShimmerSkeleton width="75%" height="8px" className="rounded-full bg-cyan-950/40" />
                </div>
              </motion.div>
            )}

            <div ref={scrollRef} />
          </div>
        )}
      </PullToRefresh>

      {/* Suggested Quick Chips */}
      {messages.length > 0 && messages.length < 5 && (
        <div className="px-3.5 py-1 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
          {samplePrompts.slice(0, 4).map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                setInputText(p);
                inputRef.current?.focus();
              }}
              className="px-3 py-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-full text-[11px] text-slate-300 hover:text-white whitespace-nowrap backdrop-blur-md transition-colors cursor-pointer shadow-sm"
            >
              {p}
            </motion.button>
          ))}
        </div>
      )}

      {/* Attached File Preview Chip */}
      <AnimatePresence>
        {attachedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="px-3.5 py-1.5 shrink-0"
          >
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300">
              <div className="flex items-center gap-2 truncate">
                {attachedFile.mimeType?.includes('image') ? (
                  <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span className="truncate">{attachedFile.name}</span>
                <span className="text-[10px] text-cyan-400/60 shrink-0">({attachedFile.size})</span>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white ml-2 transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input Bar */}
      <div className="p-3 border-t border-white/10 bg-[#070913]/95 backdrop-blur-2xl shrink-0">
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/[0.12] focus-within:bg-white/[0.14] border border-white/15 focus-within:border-cyan-400/50 rounded-xl px-2.5 py-1.5 backdrop-blur-xl transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.12)] focus-within:shadow-[0_4px_24px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
        >
          {/* Left: Paperclip Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAttachmentSheetOpen(true)}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08] rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Attach photo, video, audio or document"
          >
            <Paperclip className="w-4 h-4 stroke-[1.8]" />
          </motion.button>

          {/* Voice Assistant Mic Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onTriggerVoice}
            className={`p-1.5 rounded-lg transition-all shrink-0 border cursor-pointer ${
              status === 'LISTENING'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.8)] animate-pulse'
                : 'bg-transparent text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08] border-transparent'
            }`}
            title={status === 'LISTENING' ? 'Listening... Tap to stop' : 'Voice Assistant'}
          >
            <Mic className="w-4 h-4 stroke-[1.8]" />
          </motion.button>

          {/* Center: Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onFocus={() => {
              setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="bg-transparent border-none outline-none flex-1 text-xs text-white placeholder-slate-400 font-sans min-w-0"
          />

          {/* Right: Send Button inside input */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            disabled={!inputText.trim() && !attachedFile}
            className="p-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-30 disabled:pointer-events-none text-white transition-all shadow-md shrink-0 cursor-pointer"
            title="Send prompt"
          >
            <Send className="w-3.5 h-3.5 stroke-[2]" />
          </motion.button>
        </form>
      </div>

      {/* Modern Glassmorphic Attachment Bottom Sheet */}
      <AttachmentBottomSheet
        isOpen={isAttachmentSheetOpen}
        onClose={() => setIsAttachmentSheetOpen(false)}
        onSelectAttachment={(item) => {
          setAttachedFile(item);
        }}
        onOpenVisionScanner={onOpenVisionScanner}
      />

    </div>
  );
};
