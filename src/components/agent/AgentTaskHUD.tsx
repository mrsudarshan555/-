import React from 'react';
import { AgentTaskContext } from '../../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Send, 
  Phone, 
  MessageSquare, 
  Layers, 
  Ban,
  ShieldCheck
} from 'lucide-react';

interface AgentTaskHUDProps {
  taskContext: AgentTaskContext | null;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export const AgentTaskHUD: React.FC<AgentTaskHUDProps> = ({
  taskContext,
  onApprove,
  onReject,
  onCancel
}) => {
  if (!taskContext || taskContext.status === 'IDLE') {
    return null;
  }

  const { status, stepDescription, currentStep, pendingConfirmation, toolCalls, toolResults } = taskContext;

  // Don't show HUD if completed with no pending status and no errors
  if (status === 'COMPLETED' && !pendingConfirmation) {
    return null;
  }

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'send_whatsapp_message':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'send_sms':
        return <Send className="w-5 h-5 text-cyan-400" />;
      case 'make_call':
        return <Phone className="w-5 h-5 text-emerald-400" />;
      default:
        return <Layers className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 px-4 pointer-events-auto flex flex-col items-center">
      {/* 1. ACTIVE CONFIRMATION MODAL */}
      {status === 'WAITING_CONFIRMATION' && pendingConfirmation && (
        <div className="w-full max-w-sm bg-slate-900/95 border border-amber-500/40 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Permission Required
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {pendingConfirmation.impactLevel.toUpperCase()} IMPACT
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-100 mt-0.5">
                {pendingConfirmation.actionDescription}
              </h4>
            </div>
          </div>

          {/* Action Content Preview Box */}
          {pendingConfirmation.contentPreview && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4 text-xs font-mono text-slate-300">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                {getToolIcon(pendingConfirmation.toolName)}
                <span>Message / Action Preview</span>
              </div>
              <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">
                "{pendingConfirmation.contentPreview}"
              </p>
            </div>
          )}

          {/* User Confirmation & Rejection Controls */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onReject}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-rose-300 border border-slate-700/60 active:scale-95 transition-all text-xs font-medium"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              Decline
            </button>
            <button
              onClick={onApprove}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              Approve & Run
            </button>
          </div>
        </div>
      )}

      {/* 2. LIGHTWEIGHT LIVE EXECUTION STEP STATUS BAR */}
      {(status === 'PLANNING' || status === 'EXECUTING') && (
        <div className="w-full max-w-sm bg-slate-900/90 border border-cyan-500/30 rounded-2xl px-4 py-3 shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              <div className="absolute inset-0 rounded-full blur-[4px] bg-cyan-400/20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  AGENT STEP {currentStep}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-200 truncate mt-0.5 font-medium">
                {stepDescription || 'Planning execution...'}
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            title="Cancel Agent Task"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors flex-shrink-0"
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. CANCELLED / FAILED BANNER */}
      {(status === 'CANCELLED' || status === 'FAILED') && (
        <div className="w-full max-w-sm bg-slate-900/90 border border-rose-500/40 rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-rose-300 text-xs">
            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="font-mono">{status === 'CANCELLED' ? 'Task cancelled' : 'Task interrupted'}</span>
          </div>
          <button
            onClick={onCancel}
            className="text-[10px] font-mono text-slate-400 hover:text-slate-200"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
