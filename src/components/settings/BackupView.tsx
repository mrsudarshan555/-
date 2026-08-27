import React, { useState } from 'react';
import { MemoryItem, ChatMessage } from '../../types';
import { 
  Download, Upload, Trash2, Database, 
  CheckCircle2, AlertTriangle, HardDrive, FileJson, Clock, RefreshCw, ArrowLeft
} from 'lucide-react';

interface BackupViewProps {
  memories: MemoryItem[];
  messages: ChatMessage[];
  onClearAllData: () => void;
  onRestoreData: (restoredMemories: MemoryItem[]) => void;
  onBack: () => void;
}

export const BackupView: React.FC<BackupViewProps> = ({
  memories,
  messages,
  onClearAllData,
  onRestoreData,
  onBack
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string>('Never');

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExportMemories = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mayra_memories_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setLastBackup(new Date().toLocaleTimeString());
    showStatus(`Exported ${memories.length} context memories.`);
  };

  const handleExportChats = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mayra_chats_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setLastBackup(new Date().toLocaleTimeString());
    showStatus(`Exported ${messages.length} conversation messages.`);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onRestoreData(parsed);
          showStatus(`Successfully restored ${parsed.length} items.`);
        } else {
          showStatus('Invalid backup JSON format.');
        }
      } catch (err) {
        showStatus('Error parsing backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070913] text-slate-200">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center active:scale-95"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Backup & Data Storage</h2>
              <p className="text-[10px] text-slate-400 font-sans">On-Device Local Data Governance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        {/* Status banner */}
        {statusMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Local Storage Metrics */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="text-[11px] font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Local Storage Breakdown
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#070913] rounded-xl border border-white/5">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Context Memories</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">{memories.length} facts</div>
              <div className="text-[9px] text-slate-500">~{Math.round(JSON.stringify(memories).length / 1024 * 10) / 10} KB</div>
            </div>

            <div className="p-2.5 bg-[#070913] rounded-xl border border-white/5">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Chat History</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">{messages.length} messages</div>
              <div className="text-[9px] text-slate-500">~{Math.round(JSON.stringify(messages).length / 1024 * 10) / 10} KB</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" /> Last Export: {lastBackup}
            </span>
            <span className="text-emerald-400">SQLite / Room Ready</span>
          </div>
        </div>

        {/* Export Controls */}
        <div className="p-3.5 bg-[#0C1021] border border-blue-500/20 rounded-2xl space-y-3">
          <div className="text-[11px] font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export Data
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportMemories}
              className="w-full p-2.5 bg-[#070913] hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <FileJson className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-white font-medium text-xs">Export Memories (.json)</div>
                  <div className="text-[9px] text-slate-400">Save all personal facts and system preferences</div>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={handleExportChats}
              className="w-full p-2.5 bg-[#070913] hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <FileJson className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-white font-medium text-xs">Export Chat Logs (.json)</div>
                  <div className="text-[9px] text-slate-400">Export conversational transcript history</div>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Restore Data */}
        <div className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="text-[11px] font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-purple-400" /> Restore Data from File
          </div>

          <p className="text-[10px] text-slate-400">
            Import a previously exported MAYRA JSON backup file to restore memories.
          </p>

          <label className="w-full p-2.5 bg-[#070913] hover:bg-white/5 border border-white/10 hover:border-purple-500/40 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-purple-300 font-mono text-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Select Backup File (.json)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>
        </div>

        {/* Danger Zone: Clear / Reset */}
        <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-2xl space-y-3">
          <div className="text-[11px] font-mono font-bold text-red-400 uppercase flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Clear All Local Data
          </div>

          <p className="text-[10px] text-red-200/70">
            Permanently erases all local stored context memories, chats, and customized settings.
          </p>

          {!showConfirmClear ? (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="w-full py-2 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              Clear & Reset MAYRA Data
            </button>
          ) : (
            <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl space-y-2 animate-in fade-in">
              <div className="text-xs text-white font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Confirm Irreversible Deletion?
              </div>
              <p className="text-[10px] text-slate-300">
                This action cannot be undone. Are you sure?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAllData();
                    setShowConfirmClear(false);
                    showStatus('All local memories and chats cleared.');
                  }}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono font-bold"
                >
                  Yes, Reset All
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
