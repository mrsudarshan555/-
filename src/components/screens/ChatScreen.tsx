import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, AssistantStatus } from '../../types';
import { 
  Send, Mic, Sparkles, Copy, 
  Paperclip, X, FileText, Image as ImageIcon,
  Check
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
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  status,
  inputText,
  setInputText,
  onSubmitPrompt,
  onTriggerVoice,
  onClearChat,
  onOpenVisionScanner
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<AttachmentItem | null>(null);
  const [isAttachmentSheetOpen, setIsAttachmentSheetOpen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState<number>(0);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

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
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

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

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden bg-[#070913] text-slate-200 relative min-h-0 transition-[padding-bottom] duration-200 ease-out"
      style={keyboardOffset > 0 ? { paddingBottom: `${keyboardOffset}px` } : undefined}
    >
      
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
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
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

                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
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
              }}
              className="px-3 py-1.5 bg-white/[0.04] hover:bg-cyan-500/15 backdrop-blur-xl border border-white/10 hover:border-cyan-400/30 rounded-full text-[10px] text-slate-300 hover:text-cyan-200 whitespace-nowrap shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              {p}
            </motion.button>
          ))}
        </div>
      )}

      {/* Input Bar with Rounded Rectangle Proportion */}
      <div className="p-3 bg-transparent flex flex-col gap-1.5 shrink-0 sticky bottom-0 z-10">
        {/* Attached File Chip (if any) */}
        {attachedFile && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl text-[11px] font-mono text-cyan-300 shadow-md"
          >
            <div className="flex items-center gap-2 truncate">
              {attachedFile.dataUrl && (attachedFile.mimeType?.startsWith('image/') || attachedFile.type === 'gallery' || attachedFile.type === 'photo') ? (
                <img 
                  src={attachedFile.dataUrl} 
                  alt="Thumb" 
                  className="w-5 h-5 rounded object-cover border border-cyan-400/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="truncate">{attachedFile.name}</span>
              <span className="text-[9px] text-cyan-400/60">({attachedFile.size})</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => setAttachedFile(null)}
              className="p-0.5 text-slate-400 hover:text-red-400 rounded-md transition-colors ml-2 cursor-pointer"
              title="Remove attachment"
            >
              <X className="w-3 h-3" />
            </motion.button>
          </motion.div>
        )}

        <form
          onSubmit={handleFormSubmit}
          className="bg-white/[0.08] hover:bg-white/[0.12] focus-within:bg-white/[0.14] backdrop-blur-2xl border border-white/15 focus-within:border-cyan-400/50 rounded-xl flex items-center px-2.5 py-1.5 gap-1.5 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.12)] focus-within:shadow-[0_4px_24px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]"
        >
          {/* Attachment Paperclip Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAttachmentSheetOpen(true)}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08] rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Attach photo, video, audio or document"
          >
            <Paperclip className="w-4 h-4" />
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
            <Mic className={`w-4 h-4 ${status === 'LISTENING' ? 'fill-white/20' : 'fill-none'}`} />
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
            <Send className="w-3.5 h-3.5" />
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

