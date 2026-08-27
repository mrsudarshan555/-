import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Paperclip, Send, Mic, Sparkles, X, ScreenShare, Search, Copy, Check } from 'lucide-react';
import { AssistantStatus, AppearanceConfig } from '../../types';
import { MiniMayraAvatar } from '../character/MiniMayraAvatar';
import { AttachmentBottomSheet } from '../common/AttachmentBottomSheet';

interface FloatingMayraOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  status: AssistantStatus;
  inputText: string;
  setInputText: (val: string) => void;
  onSubmitPrompt: () => void;
  onTriggerVoice: () => void;
  onSelectAction?: (action: string) => void;
  lastResponse?: string;
  appearanceConfig?: AppearanceConfig;
}

export const FloatingMayraOverlay: React.FC<FloatingMayraOverlayProps> = ({
  isOpen,
  onClose,
  status,
  inputText,
  setInputText,
  onSubmitPrompt,
  onTriggerVoice,
  onSelectAction,
  lastResponse,
  appearanceConfig
}) => {
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [isAttachmentSheetOpen, setIsAttachmentSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      setAttachedFile({ name: file.name, size: sizeStr });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;
    if (attachedFile && !inputText.trim()) {
      setInputText(`[Attached file: ${attachedFile.name} (${attachedFile.size})]`);
    }
    onSubmitPrompt();
    setAttachedFile(null);
  };

  const handleActionPill = (action: string, promptText: string) => {
    setInputText(promptText);
    if (onSelectAction) {
      onSelectAction(action);
    }
    setTimeout(() => {
      onSubmitPrompt();
    }, 100);
  };

  const handleCopyResponse = () => {
    if (lastResponse) {
      navigator.clipboard.writeText(lastResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-auto select-none">
          
          {/* Backdrop Dimmer & Dismiss Area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
          />

          {/* iOS Magnifying Glass / Glassmorphism Bottom Sheet Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg mx-auto bg-slate-950/85 backdrop-blur-3xl border-t border-white/20 rounded-t-3xl p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col gap-3.5"
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-white/25 rounded-full mx-auto -mt-1 shrink-0" />

            {/* Header: Mini Mayra Orb Avatar + Status & Dismiss Button */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MiniMayraAvatar 
                  status={status} 
                  size={48} 
                  appearanceConfig={appearanceConfig} 
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-bold text-sm text-white tracking-wide">
                      ★𝐌₳ᎽⱤ₳ ᥫ᭡
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[9px] font-mono">
                      {status === 'READY' ? 'ACTIVE' : status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    {status === 'LISTENING' ? 'Listening...' :
                     status === 'THINKING' ? 'Reasoning...' :
                     status === 'SPEAKING' ? 'Speaking...' :
                     'How can I help you right now?'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-full transition-all"
                title="Dismiss overlay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live / Last Response - Direct text without card box */}
            {lastResponse && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-2 py-1 text-xs text-slate-100 leading-relaxed font-sans max-h-32 overflow-y-auto scrollbar-none relative flex items-start justify-between gap-2"
              >
                <div className="whitespace-pre-wrap flex-1">{lastResponse}</div>
                <button
                  onClick={handleCopyResponse}
                  className="text-slate-400 hover:text-white p-1 shrink-0"
                  title="Copy text"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </motion.div>
            )}

            {/* Quick Action Pills: "Ask about screen" & "Share screen with Live" */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
              <button
                type="button"
                onClick={() => handleActionPill('screen_query', 'Analyze what is currently on my screen')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 rounded-full text-xs font-mono text-cyan-200 transition-all shrink-0 shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-cyan-300" />
                <span>Ask about screen</span>
              </button>

              <button
                type="button"
                onClick={() => handleActionPill('live_share', 'Start live screen share and guide me')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-400/40 rounded-full text-xs font-mono text-purple-200 transition-all shrink-0 shadow-sm"
              >
                <ScreenShare className="w-3.5 h-3.5 text-purple-300" />
                <span>Share screen with Live</span>
              </button>
            </div>

            {/* Attached File Preview Tag */}
            {attachedFile && (
              <div className="flex items-center justify-between px-3 py-1 bg-slate-900/60 border border-cyan-500/30 rounded-full text-xs text-cyan-300">
                <span className="truncate">{attachedFile.name} ({attachedFile.size})</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-slate-400 hover:text-white ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Frosted Glass Bottom Input Capsule */}
            <form
              onSubmit={handleFormSubmit}
              className="w-full bg-slate-900/80 backdrop-blur-2xl border border-white/20 focus-within:border-cyan-400/70 rounded-full flex items-center px-2 py-1.5 gap-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all"
            >
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => setIsAttachmentSheetOpen(true)}
                className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08] rounded-full transition-all shrink-0"
                title="Attach Photo, Video, Audio or Document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Mayra anything..."
                className="flex-1 bg-transparent text-white placeholder-slate-400 text-xs px-1 focus:outline-none min-w-0"
              />

              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={onTriggerVoice}
                className={`p-2 rounded-full transition-all shrink-0 ${
                  status === 'LISTENING'
                    ? 'bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-pulse'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08]'
                }`}
                title="Speak to MAYRA"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() && !attachedFile}
                className="p-2 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white transition-all shadow-md shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Attachment Bottom Sheet */}
            <AttachmentBottomSheet
              isOpen={isAttachmentSheetOpen}
              onClose={() => setIsAttachmentSheetOpen(false)}
              onSelectAttachment={(item) => {
                setAttachedFile({
                  name: item.name,
                  size: item.size
                });
              }}
            />

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
