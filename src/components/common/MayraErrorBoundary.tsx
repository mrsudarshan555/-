import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home, Sparkles } from 'lucide-react';
import { MayraLogo } from './MayraLogo';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class MayraErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MayraErrorBoundary] Caught rendering exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#070914] via-[#0C1021] to-[#070914] text-slate-100 relative select-none">
          {/* Subtle Ambient Glow */}
          <div className="absolute w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-4">
            
            {/* Logo & Mayra Expression */}
            <div className="relative">
              <MayraLogo size={56} showGlow={true} variant="raw" />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2]" />
              </div>
            </div>

            {/* Mayra Friendly Hindi/English Dialogue Box */}
            <div className="w-full p-4 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/15 space-y-2 shadow-xl shadow-black/40">
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse stroke-[1.8]" />
                <span>★ MAYRA ASSISTANT</span>
              </div>
              <p className="text-sm font-sans font-medium text-white leading-snug">
                "Mujhe thodi dikkat hui, phir se koshish karti hoon!"
              </p>
              <p className="text-[11px] font-sans text-slate-300">
                Don't worry — aapka session aur data safe hai. Hum screen ko bina crash kiye turant restore kar sakte hain.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex items-center gap-2.5 pt-1">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-95 text-white text-xs font-semibold font-sans flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[2]" />
                <span>Phir Se Koshish Karein</span>
              </button>
            </div>

            {/* Expandable Technical Details */}
            {this.state.error && (
              <details className="w-full text-left text-[10px] font-mono text-slate-400 bg-black/40 rounded-xl p-2.5 border border-white/5 cursor-pointer">
                <summary className="text-slate-400 hover:text-slate-300 font-semibold select-none">
                  Technical Diagnostics
                </summary>
                <div className="mt-2 text-rose-300/90 break-words whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {this.state.error.toString()}
                </div>
              </details>
            )}

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
