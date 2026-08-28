import { useState, useCallback, useEffect, useRef } from 'react';
import { AssistantStatus, ChatMessage, UserPersonalConfig, AssistantConfig } from '../types';
import { playPcmAudio, stopCurrentSpeech } from '../utils/speechEngine';
import {
  StonicxUserProfile,
  StonicxTopicNote,
  StonicxJobPriming,
  StonicxDailyLog,
  StonicxNoteCategory
} from '../types/stonicxMemory';
import {
  loadStonicxProfile,
  saveStonicxProfile,
  loadStonicxTopicNotes,
  saveStonicxTopicNotes,
  loadStonicxJobs,
  saveStonicxJobs,
  loadStonicxDailyLogs,
  saveStonicxDailyLogs,
  extractAndApplyProfileUpdates,
  recordDailyInteraction,
  DEFAULT_STONICX_PROFILE
} from '../utils/stonicxMemoryStore';

// Backwards compatibility for legacy components
export interface StonicxMemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'system' | 'code' | 'directive' | 'telemetry' | 'personal';
  timestamp: number;
  isPinned?: boolean;
}

const STONICX_CHAT_STORAGE_KEY = 'stonicx_chat_messages_v2';

const INITIAL_STONICX_MESSAGES: ChatMessage[] = [
  {
    id: 'stx-init-1',
    sender: 'mayra', // rendered as STONICX in shell
    text: '⚡ **STONICX NEURAL CORE v4.2 ONLINE**\n\nAI Priming Memory Subsystem synchronized. Living Circuit visualizer operating at 60 FPS.\n• **Profile Memory**: Self-updating user context active\n• **Topic Notes**: Project & directive storage ready\n• **Task Jobs**: Specific priming engines loaded\n• **Daily Logs**: Continuous session timeline tracking active\n\nReady for precision query or task execution.',
    timestamp: Date.now()
  }
];

export interface UseStonicxAssistantProps {
  personalConfig: UserPersonalConfig;
  assistantConfig: AssistantConfig;
}

export function useStonicxAssistant({ personalConfig, assistantConfig }: UseStonicxAssistantProps) {
  const [status, setStatus] = useState<AssistantStatus>('READY');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Isolated Chat Messages (Separate key from MAYRA)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return INITIAL_STONICX_MESSAGES;
    try {
      const saved = localStorage.getItem(STONICX_CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_STONICX_MESSAGES;
  });

  // 2. STONICX AI PRIMING MEMORY MODULES
  // A. Self-Updating Profile
  const [profile, setProfile] = useState<StonicxUserProfile>(() => loadStonicxProfile());

  // B. Topic-Wise Notes
  const [topicNotes, setTopicNotes] = useState<StonicxTopicNote[]>(() => loadStonicxTopicNotes());

  // C. Task-Specific Priming Jobs
  const [jobs, setJobs] = useState<StonicxJobPriming[]>(() => loadStonicxJobs());
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // D. Daily Interaction Logs
  const [dailyLogs, setDailyLogs] = useState<StonicxDailyLog[]>(() => loadStonicxDailyLogs());

  // Persist Stonicx messages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STONICX_CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages]);

  // Persist Profile
  useEffect(() => {
    saveStonicxProfile(profile);
  }, [profile]);

  // Persist Topic Notes
  useEffect(() => {
    saveStonicxTopicNotes(topicNotes);
  }, [topicNotes]);

  // Persist Jobs
  useEffect(() => {
    saveStonicxJobs(jobs);
  }, [jobs]);

  // Persist Daily Logs
  useEffect(() => {
    saveStonicxDailyLogs(dailyLogs);
  }, [dailyLogs]);

  // Speech Recognition (Mic)
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListeningRef.current = true;
      setStatus('LISTENING');
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript) {
        setInputText(transcript);
      }
    };

    recognition.onerror = () => {
      isListeningRef.current = false;
      setStatus('READY');
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      if (inputText.trim()) {
        submitPrompt(inputText.trim());
      } else {
        setStatus('READY');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setStatus('READY');
    }
  }, [inputText]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    isListeningRef.current = false;
    setStatus('READY');
  }, []);

  const triggerVoice = useCallback(() => {
    if (status === 'LISTENING') {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  // Synthetic Voice Engine (Prioritizes Gemini Live Charon Voice Audio)
  const speakStonicxResponse = useCallback(async (text: string) => {
    if (!text || typeof window === 'undefined') return;
    
    // Stop any existing speech playback
    stopCurrentSpeech();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      // 1. Primary: Fetch Gemini Charon PCM Audio
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: 'Charon',
          assistant: 'stonicx',
          language: 'en'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const played = playPcmAudio(
            data.audioBase64,
            () => setStatus('SPEAKING'),
            () => setStatus('READY')
          );
          if (played) return;
        }
      }
    } catch (e) {
      console.warn('[STONICX Voice Pipeline] Charon direct voice endpoint notice, engaging deep male synthesis fallback.');
    }

    // 2. Secondary Fallback: Deep, authoritative male speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#+\s/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 0.75; // Deep, commanding JARVIS tone

      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('david') || 
        v.name.toLowerCase().includes('daniel') || 
        v.name.toLowerCase().includes('george') || 
        v.name.toLowerCase().includes('guy') || 
        v.name.toLowerCase().includes('james') ||
        v.name.toLowerCase().includes('google uk english male')
      ) || voices.find(v => v.lang.startsWith('en'));

      if (maleVoice) utterance.voice = maleVoice;

      utterance.onstart = () => setStatus('SPEAKING');
      utterance.onend = () => setStatus('READY');
      utterance.onerror = () => setStatus('READY');

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Submit Prompt to Gemini with STONICX AI Priming Pattern
  const submitPrompt = useCallback(async (promptText: string, image?: { base64: string; mimeType?: string; name?: string }) => {
    const trimmed = (promptText || '').trim();
    if (!trimmed && !image) return;

    // 1. Detect matching or active Job Priming
    let activeJob = jobs.find(j => j.id === activeJobId);
    if (!activeJob && trimmed) {
      const lower = trimmed.toLowerCase();
      if (lower.includes('email') || lower.includes('mail') || lower.includes('draft message')) {
        activeJob = jobs.find(j => j.slug === 'email-draft');
      } else if (lower.includes('refactor') || lower.includes('code review') || lower.includes('optimize code')) {
        activeJob = jobs.find(j => j.slug === 'code-architect');
      } else if (lower.includes('summar') || lower.includes('brief') || lower.includes('tldr')) {
        activeJob = jobs.find(j => j.slug === 'exec-summary');
      } else if (lower.includes('debug') || lower.includes('fix error') || lower.includes('bug') || lower.includes('exception')) {
        activeJob = jobs.find(j => j.slug === 'bug-forensics');
      } else if (lower.includes('standup') || lower.includes('kal kya kiya') || lower.includes('daily report') || lower.includes('yesterday')) {
        activeJob = jobs.find(j => j.slug === 'daily-standup');
      }
    }

    // Add user message to state
    const userMsg: ChatMessage = {
      id: `stx-u-${Date.now()}`,
      sender: 'user',
      text: trimmed || (image ? `[OPTICAL TELEMETRY ATTACHED: ${image.name || 'Image Scan'}]` : ''),
      image: image ? { base64: image.base64, mimeType: image.mimeType, name: image.name } : undefined,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setStatus('THINKING');
    setIsProcessing(true);

    const userName = profile.preferredName || profile.fullName || personalConfig.preferredName || 'Commander';

    // 2. Filter Relevant Topic Notes for Priming
    const relevantNotes = topicNotes.filter(note => {
      if (note.isPinned) return true;
      if (activeJob && activeJob.targetCategories.includes(note.category)) return true;
      const lowerText = trimmed.toLowerCase();
      return note.title.toLowerCase().split(' ').some(w => w.length > 3 && lowerText.includes(w)) ||
             note.tags.some(tag => lowerText.includes(tag.toLowerCase()));
    });

    const topicNotesContext = (relevantNotes.length > 0 ? relevantNotes : topicNotes.slice(0, 4))
      .map(n => `• [${n.category.toUpperCase()}] ${n.title}:\n  ${n.content}`)
      .join('\n\n');

    // 3. Recent Daily Logs Context
    const recentLogsContext = dailyLogs
      .slice(0, 3)
      .map(l => `• [${l.date}] Topics: ${l.keyTopics.join(', ')} | Summary: ${l.summary}`)
      .join('\n');

    // 4. Construct Comprehensive AI Priming System Prompt
    const stonicxSystemPrompt = `You are STONICX, an autonomous High-Performance Cybernetic AI Operating System and Neural Computing Engine.

============================================================
PRIMARY IDENTITY & DIRECTIVES:
============================================================
- Name: STONICX
- Persona: High-velocity, analytical, concise, direct, authoritative, technologically formidable, zero fluff.
- Output Style: Crisp markdown with bold headings, clean bullet structures, code blocks with syntax highlighting, benchmark stats where relevant.
- Privacy & Memory Isolation: You operate on a dedicated 100% ISOLATED Neural Vault. You NEVER reference or share conversational state with Mayra.
- Language: Answer in English or Hindi matching user tone, keeping technical depth pristine.

============================================================
1. USER PROFILE FILE (SELF-UPDATING AI PRIMING FILE):
============================================================
- Preferred Name: ${profile.preferredName}
- Full Name: ${profile.fullName}
- Role / Title: ${profile.roleOrTitle}
- Organization / Project Context: ${profile.organizationOrProject}
- Primary Tech Stack: ${profile.techStack.join(', ')}
- Preferred Languages: ${profile.preferredLanguages.join(', ')}
- Communication Style: ${profile.communicationStyle}
- Key Directives & Preferences:
${profile.keyPreferences.map(p => `  • ${p}`).join('\n')}
- User Bio / Background: ${profile.bioNotes}

============================================================
2. TOPIC-WISE KNOWLEDGE & PROJECT NOTES (PRIMED):
============================================================
${topicNotesContext || 'No specific topic notes stored.'}

============================================================
3. RECENT DAILY LOGS & SESSION TIMELINE (CONTEXT):
============================================================
${recentLogsContext || 'No past logs recorded.'}

${activeJob ? `
============================================================
4. ACTIVE TASK-SPECIFIC PRIMING JOB: [${activeJob.name.toUpperCase()}]
============================================================
${activeJob.primerPrompt}
` : ''}

CRITICAL EXECUTION INSTRUCTION:
Synthesize your response by applying the primed user profile, topic notes, and active job constraints first. If the user asks about past discussions or yesterday ("kal kya baat hui thi"), consult the Daily Logs above. If the user provides new personal facts, acknowledge them briefly and accurately.
`;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          image,
          contextPrompt: stonicxSystemPrompt,
          assistant: 'stonicx',
          persona: 'technical',
          voiceName: 'Charon',
          returnAudio: true,
          model: personalConfig.geminiModel || 'gemini-3.1-flash-lite',
          temperature: 0.35, // Low temperature for high precision & logic
          userName,
          language: 'en'
        })
      });

      const data = await res.json();
      const reply = data.response || '✦ STONICX Matrix execution completed.';

      // A. Autonomous Fact Extraction & Profile Updating
      extractAndApplyProfileUpdates(
        trimmed,
        profile,
        (updated) => {
          setProfile(updated);
        },
        (newNote) => {
          const createdNote: StonicxTopicNote = {
            ...newNote,
            id: `stx-note-auto-${Date.now()}`,
            lastModified: Date.now()
          };
          setTopicNotes(prev => [createdNote, ...prev]);
        }
      );

      // B. Update Daily Interaction Log
      recordDailyInteraction(
        trimmed,
        reply,
        dailyLogs,
        (updatedLogs) => {
          setDailyLogs(updatedLogs);
        }
      );

      // C. Increment usage count for active job if used
      if (activeJob) {
        setJobs(prev => prev.map(j => j.id === activeJob!.id ? { ...j, usageCount: j.usageCount + 1 } : j));
      }

      const assistantMsg: ChatMessage = {
        id: `stx-m-${Date.now() + 1}`,
        sender: 'mayra', // rendered as STONICX in shell
        text: reply,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStatus('READY');
      setIsProcessing(false);

      // Play Gemini Charon PCM Audio if present, or invoke voice pipeline
      if (data.audioBase64) {
        stopCurrentSpeech();
        playPcmAudio(
          data.audioBase64,
          () => setStatus('SPEAKING'),
          () => setStatus('READY')
        );
      } else {
        speakStonicxResponse(reply);
      }

    } catch (err: any) {
      console.error('[STONICX Pipeline Error]', err);
      const errorMsg: ChatMessage = {
        id: `stx-err-${Date.now()}`,
        sender: 'mayra',
        text: `⚠️ **STONICX NEURAL BUS EXCEPTION**\n\nConnection error during synthesis: ${err.message || 'Unknown network interrupt'}. Please retry execution.`,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errorMsg]);
      setStatus('ERROR');
      setIsProcessing(false);
    }
  }, [profile, topicNotes, jobs, activeJobId, dailyLogs, personalConfig, speakStonicxResponse]);

  const clearChat = useCallback(() => {
    setMessages(INITIAL_STONICX_MESSAGES);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STONICX_CHAT_STORAGE_KEY);
      } catch (e) {}
    }
  }, []);

  // Profile management
  const updateProfile = useCallback((updated: Partial<StonicxUserProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updated,
      lastUpdated: Date.now()
    }));
  }, []);

  // Topic Notes management
  const addTopicNote = useCallback((note: Omit<StonicxTopicNote, 'id' | 'lastModified'>) => {
    const newNote: StonicxTopicNote = {
      ...note,
      id: `stx-note-${Date.now()}`,
      lastModified: Date.now()
    };
    setTopicNotes(prev => [newNote, ...prev]);
  }, []);

  const updateTopicNote = useCallback((id: string, updated: Partial<StonicxTopicNote>) => {
    setTopicNotes(prev => prev.map(n => n.id === id ? { ...n, ...updated, lastModified: Date.now() } : n));
  }, []);

  const deleteTopicNote = useCallback((id: string) => {
    setTopicNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const togglePinTopicNote = useCallback((id: string) => {
    setTopicNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned, lastModified: Date.now() } : n));
  }, []);

  // Jobs management
  const addJob = useCallback((job: Omit<StonicxJobPriming, 'id' | 'usageCount'>) => {
    const newJob: StonicxJobPriming = {
      ...job,
      id: `job-${Date.now()}`,
      usageCount: 0
    };
    setJobs(prev => [...prev, newJob]);
  }, []);

  const updateJob = useCallback((id: string, updated: Partial<StonicxJobPriming>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updated } : j));
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    if (activeJobId === id) setActiveJobId(null);
  }, [activeJobId]);

  const selectActiveJob = useCallback((jobId: string | null) => {
    setActiveJobId(jobId);
  }, []);

  // Daily Logs management
  const addDailyLog = useCallback((log: StonicxDailyLog) => {
    setDailyLogs(prev => [log, ...prev.filter(l => l.date !== log.date)]);
  }, []);

  const deleteDailyLog = useCallback((date: string) => {
    setDailyLogs(prev => prev.filter(l => l.date !== date));
  }, []);

  // Compatibility helpers for legacy components
  const memories: StonicxMemoryItem[] = topicNotes.map(n => ({
    id: n.id,
    key: n.title,
    value: n.content,
    category: n.category === 'personal' ? 'personal' : (n.category === 'code' ? 'code' : 'directive'),
    timestamp: n.lastModified,
    isPinned: n.isPinned
  }));

  const addMemory = useCallback((item: Omit<StonicxMemoryItem, 'id' | 'timestamp'>) => {
    const validCat: StonicxNoteCategory = item.category === 'personal' ? 'personal' : (item.category === 'code' ? 'code' : 'preference');
    addTopicNote({
      title: item.key,
      content: item.value,
      category: validCat,
      tags: [item.category],
      isPinned: item.isPinned
    });
  }, [addTopicNote]);

  const deleteMemory = useCallback((id: string) => {
    deleteTopicNote(id);
  }, [deleteTopicNote]);

  const togglePinMemory = useCallback((id: string) => {
    togglePinTopicNote(id);
  }, [togglePinTopicNote]);

  return {
    status,
    setStatus,
    messages,
    setMessages,
    inputText,
    setInputText,
    isProcessing,
    submitPrompt,
    triggerVoice,
    clearChat,
    // AI Priming Subsystems
    profile,
    updateProfile,
    topicNotes,
    addTopicNote,
    updateTopicNote,
    deleteTopicNote,
    togglePinTopicNote,
    jobs,
    activeJobId,
    selectActiveJob,
    addJob,
    updateJob,
    deleteJob,
    dailyLogs,
    addDailyLog,
    deleteDailyLog,
    // Compatibility
    memories,
    setMemories: () => {},
    addMemory,
    deleteMemory,
    togglePinMemory
  };
}
