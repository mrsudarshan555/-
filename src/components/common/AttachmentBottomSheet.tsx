import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, FileText, X } from 'lucide-react';

export interface AttachmentItem {
  type: 'photo' | 'gallery' | 'file';
  name: string;
  size: string;
  dataUrl?: string;
  mimeType?: string;
  file?: File;
}

interface AttachmentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAttachment: (attachment: AttachmentItem) => void;
  onOpenVisionScanner?: () => void;
}

export const AttachmentBottomSheet: React.FC<AttachmentBottomSheetProps> = ({
  isOpen,
  onClose,
  onSelectAttachment,
  onOpenVisionScanner
}) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File, type: 'photo' | 'gallery' | 'file') => {
    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    // Detect MIME type with fallback
    let detectedMime = file.type;
    if (!detectedMime) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') detectedMime = 'application/pdf';
      else if (ext === 'jpg' || ext === 'jpeg') detectedMime = 'image/jpeg';
      else if (ext === 'png') detectedMime = 'image/png';
      else if (ext === 'webp') detectedMime = 'image/webp';
      else if (ext === 'txt') detectedMime = 'text/plain';
      else if (ext === 'csv') detectedMime = 'text/csv';
      else if (ext === 'json') detectedMime = 'application/json';
      else if (ext === 'md') detectedMime = 'text/markdown';
      else detectedMime = 'application/octet-stream';
    }

    // Always encode as Data URL so Gemini API receives full multimodal base64 payload
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      onSelectAttachment({
        type,
        name: file.name || `File_${Date.now()}`,
        size: sizeStr,
        dataUrl: result,
        mimeType: detectedMime,
        file
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, 'gallery');
      onClose();
    }
  };

  const handleFileBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, 'file');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in select-none">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Hidden File Inputs (Gallery & Documents) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleGallerySelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={handleFileBrowse}
      />

      {/* Compact Gemini Vertical List Bottom Sheet */}
      <div 
        className="relative z-10 w-full max-w-md bg-[#111528]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl p-4 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle */}
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mb-1" />

        {/* Minimal Header */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-white tracking-wide">Attach</span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vertical List of Options */}
        <div className="space-y-1">
          {/* 1. Camera -> Launches in-app MAYRA Vision Scanner directly */}
          <button
            onClick={() => {
              onClose();
              if (onOpenVisionScanner) {
                onOpenVisionScanner();
              }
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors text-left group"
          >
            <div className="p-2 bg-white/[0.06] group-hover:bg-cyan-500/20 rounded-xl text-slate-300 group-hover:text-cyan-300 transition-colors border border-white/5">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-cyan-200 transition-colors">Vision Scanner</p>
              <p className="text-[11px] text-slate-400">Scan text, objects & scenes in-app</p>
            </div>
          </button>

          {/* 2. Gallery */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors text-left group"
          >
            <div className="p-2 bg-white/[0.06] group-hover:bg-purple-500/20 rounded-xl text-slate-300 group-hover:text-purple-300 transition-colors border border-white/5">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-purple-200 transition-colors">Gallery</p>
              <p className="text-[11px] text-slate-400">Choose photos and images</p>
            </div>
          </button>

          {/* 3. Files / Documents */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors text-left group"
          >
            <div className="p-2 bg-white/[0.06] group-hover:bg-emerald-500/20 rounded-xl text-slate-300 group-hover:text-emerald-300 transition-colors border border-white/5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-emerald-200 transition-colors">Files & Documents</p>
              <p className="text-[11px] text-slate-400">PDFs, text docs, CSVs, and more</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
