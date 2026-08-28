import React, { useRef, useEffect } from 'react';
import { Terminal, Send, Mic, Sparkles, Trash2, Copy, Check, Paperclip, Cpu, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, AssistantStatus } from '../../types';

interface StonicxTerminalProps {
  messages: ChatMessage[];
  status: AssistantStatus;
  inputText: string;
  setInputText: (text: string) => void;
  onSubmitPrompt: (text: string, image?: { base64: string; mimeType?: string; name?: string }) => void;
  onTriggerVoice: () => void;
  onClearChat: () => void;
  onOpenScanner?: () => void;
  activeJobName?: string;
  onClearActiveJob?: () => void;
}

function renderFormattedMessage(text: string) {
  if (!text) return null;

  // Split text by markdown code blocks ```code```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const content = part.slice(3, -3);
          const firstLineBreak = content.indexOf('\n');
          let lang = 'code';
          let codeText = content;
          if (firstLineBreak > 0 && firstLineBreak < 20) {
            lang = content.slice(0, firstLineBreak).trim() || 'code';
            codeText = content.slice(firstLineBreak + 1);
          }

          return (
            <div key={index} className="my-2 rounded-xl overflow-hidden border border-cyan-500/30 bg-[#020914] font-mono text-[11px]">
              <div className="px-3 py-1 bg-cyan-500/10 border-b border-cyan-500/20 text-cyan-300 flex items-center justify-between text-[9px] font-bold">
                <span className="uppercase flex items-center gap-1.5">
                  <Code2 className="w-3 h-3 text-cyan-400" /> {lang}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(codeText.trim())}
                  className="hover:text-cyan-100 transition-colors uppercase"
                >
                  COPY SNIPPET
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-cyan-100/90 leading-relaxed scrollbar-thin">
                <code>{codeText.trim()}</code>
              </pre>
            </div>
          );
        }

        // Standard text lines with bold & inline code highlighting
        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-1">
            {lines.map((line, lIdx) => {
              if (!line.trim()) return <div key={lIdx} className="h-1.5" />;

              // Process inline bold **text** and inline code `code`
              const lineParts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

              return (
                <div key={lIdx} className="leading-relaxed">
                  {lineParts.map((sub, sIdx) => {
                    if (sub.startsWith('**') && sub.endsWith('**')) {
                      return <strong key={sIdx} className="text-cyan-300 font-bold">{sub.slice(2, -2)}</strong>;
                    }
                    if (sub.startsWith('`') && sub.endsWith('`')) {
                      return (
                        <code key={sIdx} className="px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]">
                          {sub.slice(1, -1)}
                        </code>
                      );
                    }
                    if (sub.startsWith('# ')) {
                      return <span key={sIdx} className="text-xs font-bold text-cyan-400 block mt-1">{sub.slice(2)}</span>;
                    }
                    if (sub.startsWith('## ')) {
                      return <span key={sIdx} className="text-xs font-bold text-cyan-300 block mt-1">{sub.slice(3)}</span>;
                    }
                    if (sub.startsWith('• ') || sub.startsWith('- ')) {
                      return (
                        <span key={sIdx} className="flex items-start gap-1.5 text-slate-200">
                          <span className="text-cyan-400">•</span>
                          <span>{sub.slice(2)}</span>
                        </span>
                      );
                    }
                    return <span key={sIdx}>{sub}</span>;
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export const StonicxTerminal: React.FC<StonicxTerminalProps> = ({
  messages,
  status,
  inputText,
  setInputText,
  onSubmitPrompt,
  onTriggerVoice,
  onClearChat,
  onOpenScanner,
  activeJobName,
  onClearActiveJob
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSubmitPrompt(inputText.trim());
  };

  const quickCommands = [
    'System Health Diagnostics',
    'Kotlin Multiplatform Best Practices',
    'Neural Architecture Review',
    'Explain Quantum Superposition'
  ];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#020611] text-cyan-100 font-mono overflow-hidden select-none">
      {/* Top Terminal Bar */}
      <div className="p-3 border-b border-cyan-500/20 bg-[#030B1C]/90 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-cyan-300 tracking-wider flex items-center gap-2">
              <span>STONICX SYNAPSE STREAM</span>
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-sans font-bold uppercase ${
                status === 'THINKING' ? 'bg-cyan-500/30 text-cyan-300 animate-pulse' :
                status === 'SPEAKING' ? 'bg-cyan-500/30 text-cyan-300 animate-pulse' :
                status === 'LISTENING' ? 'bg-cyan-400/30 text-cyan-200 animate-pulse' :
                'bg-white/10 text-slate-400'
              }`}>
                {status}
              </span>
            </div>
            <div className="text-[9px] text-cyan-500/70">BUFFER: ACTIVE • AI PRIMING READY</div>
          </div>
        </div>

        <button
          onClick={onClearChat}
          className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg transition-colors border border-white/5"
          title="Clear Terminal"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Active Priming Job Banner */}
      {activeJobName && (
        <div className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-950/80 to-[#020B1A] border-b border-cyan-500/30 flex items-center justify-between text-[10px] text-cyan-300 z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold font-mono">TASK PRIMED:</span>
            <span className="font-sans text-white">{activeJobName}</span>
          </div>
          {onClearActiveJob && (
            <button
              onClick={onClearActiveJob}
              className="text-[9px] text-cyan-400/80 hover:text-cyan-200 uppercase font-mono tracking-wider underline cursor-pointer"
            >
              RESET JOB
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const msgText = msg.text || msg.content || '';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1 text-[9px] text-slate-500 font-mono">
                <span>{isUser ? 'USER COMMAND' : 'STONICX // SYNAPSE'}</span>
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>

              <div
                className={`relative max-w-[88%] p-3.5 rounded-2xl border text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#081938] border-cyan-500/40 text-cyan-100 shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                    : 'bg-[#030E24] border-cyan-500/20 text-slate-200 shadow-[0_0_15px_rgba(0,163,255,0.08)]'
                }`}
              >
                {/* Image attachment if present */}
                {msg.image && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-cyan-500/20 max-h-48">
                    <img
                      src={`data:${msg.image.mimeType || 'image/jpeg'};base64,${msg.image.base64}`}
                      alt="Attachment"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Formatted message content */}
                <div className="font-sans select-text">
                  {renderFormattedMessage(msgText)}
                </div>

                {/* Copy button for Assistant messages */}
                {!isUser && (
                  <div className="mt-2 pt-2 border-t border-cyan-500/10 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span className="text-cyan-400/80">LATENCY: 12ms • TOKENS: {Math.round(msgText.length / 4)}</span>
                    <button
                      onClick={() => handleCopy(msgText, msg.id)}
                      className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-cyan-400" /> COPIED
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> COPY
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Processing Indicator */}
        {status === 'THINKING' && (
          <div className="flex items-center gap-2 p-3 bg-[#030E24] border border-cyan-500/40 rounded-2xl text-xs text-cyan-300 max-w-xs animate-pulse">
            <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Computing neural tensors across matrix...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestion Chips */}
      {messages.length < 3 && (
        <div className="px-4 py-1.5 flex gap-2 overflow-x-auto no-scrollbar">
          {quickCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                setInputText(cmd);
                onSubmitPrompt(cmd);
              }}
              className="px-2.5 py-1 bg-[#051430] hover:bg-[#0A204C] border border-cyan-500/20 text-[10px] text-cyan-300/80 hover:text-cyan-200 rounded-lg whitespace-nowrap transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Command Input Bar */}
      <form onSubmit={handleFormSubmit} className="p-3 bg-[#030B1C] border-t border-cyan-500/20 flex items-center gap-2">
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="p-2.5 bg-[#071738] hover:bg-[#0C2456] border border-cyan-500/20 text-cyan-400 rounded-xl transition-all active:scale-95"
            title="Optical Scan Frame"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 flex items-center bg-[#071738] border border-cyan-500/30 focus-within:border-cyan-400 rounded-xl px-3 py-2 transition-all shadow-inner">
          <input
            type="text"
            placeholder="Input neural query or execute command..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-cyan-600/60 outline-none font-sans"
          />
        </div>

        <button
          type="button"
          onClick={onTriggerVoice}
          className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
            status === 'LISTENING'
              ? 'bg-cyan-400 text-black border-cyan-300 animate-pulse shadow-[0_0_15px_rgba(0,229,255,0.7)]'
              : 'bg-[#071738] hover:bg-[#0C2456] border-cyan-500/20 text-cyan-400'
          }`}
          title="Voice Stream"
        >
          <Mic className="w-4 h-4" />
        </button>

        <button
          type="submit"
          disabled={!inputText.trim() || status === 'THINKING'}
          className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-black font-bold rounded-xl transition-all active:scale-95 shadow-[0_0_12px_rgba(0,229,255,0.4)]"
          title="Send Command"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
