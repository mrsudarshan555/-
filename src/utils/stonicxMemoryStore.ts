import {
  StonicxUserProfile,
  StonicxTopicNote,
  StonicxJobPriming,
  StonicxDailyLog,
  StonicxNoteCategory
} from '../types/stonicxMemory';

export const STONICX_PROFILE_KEY = 'stonicx_user_profile_v2';
export const STONICX_TOPIC_NOTES_KEY = 'stonicx_topic_notes_v2';
export const STONICX_JOBS_KEY = 'stonicx_priming_jobs_v2';
export const STONICX_DAILY_LOGS_KEY = 'stonicx_daily_logs_v2';

export const DEFAULT_STONICX_PROFILE: StonicxUserProfile = {
  fullName: 'User Commander',
  preferredName: 'Commander',
  roleOrTitle: 'Lead Software Architect & Engineer',
  organizationOrProject: 'Quantum Core Systems',
  preferredLanguages: ['TypeScript', 'Python', 'Kotlin', 'Rust'],
  techStack: ['React', 'Node.js', 'TailwindCSS', 'FastAPI', 'Gemini API'],
  communicationStyle: 'Direct, analytical, zero-fluff, code-first with benchmarks',
  keyPreferences: [
    'Prefers clean TypeScript code with strong types',
    'Expects modular file structure instead of monoliths',
    'Values low latency and high execution precision',
    'Wants task-primed responses over generic advice'
  ],
  bioNotes: 'Focuses on high-performance web and AI engineering with strict architectural separation.',
  lastUpdated: Date.now()
};

export const DEFAULT_STONICX_TOPIC_NOTES: StonicxTopicNote[] = [
  {
    id: 'stx-note-personal-1',
    title: 'Personal Context & Working Style',
    category: 'personal',
    content: 'Values rapid execution, clean modular architecture, and autonomous self-updating memory. Speaks Hindi and English interchangeably. Avoids generic marketing fluff.',
    tags: ['workstyle', 'personal', 'habits'],
    lastModified: Date.now() - 86400000,
    isPinned: true
  },
  {
    id: 'stx-note-project-1',
    title: 'Quantum Terminal Architecture Specs',
    category: 'project',
    content: 'Full-stack application running with high-performance 60 FPS Canvas circuit visualizer, dual-core mode switcher (MAYRA / STONICX), and strict cryptographic memory isolation between assistants.',
    tags: ['stonicx', 'architecture', 'canvas', 'isolation'],
    lastModified: Date.now() - 43200000,
    isPinned: true
  },
  {
    id: 'stx-note-code-1',
    title: 'Code Generation & Review Standards',
    category: 'code',
    content: 'Always provide complete runnable snippets. Use TypeScript interfaces with strict types. Never use any unless necessary. Include concise performance considerations.',
    tags: ['typescript', 'standards', 'best-practices'],
    lastModified: Date.now() - 3600000,
    isPinned: false
  },
  {
    id: 'stx-note-pref-1',
    title: 'Tone & Synthesis Directives',
    category: 'preference',
    content: 'Responses should be structured with markdown headers, bold keywords, numbered procedures for steps, and direct summaries.',
    tags: ['tone', 'formatting', 'directives'],
    lastModified: Date.now() - 1800000,
    isPinned: false
  }
];

export const DEFAULT_STONICX_JOBS: StonicxJobPriming[] = [
  {
    id: 'job-email-draft',
    name: 'Executive Email Drafting',
    slug: 'email-draft',
    icon: 'Mail',
    description: 'Generates high-impact, professional executive emails tailored to recipient context with zero fluff.',
    primerPrompt: `TASK PRIMING DIRECTIVE: [EXECUTIVE EMAIL COMPOSITION]
- Goal: Draft an impactful, concise, and structured email for professional execution.
- Rules: Include Subject line, clear Greeting, concise Context/Objective, bulleted Action Items/Decisions, and clear Next Steps/CTA.
- Tone: Crisp, respectful, authoritative, and direct.`,
    targetCategories: ['personal', 'preference', 'project'],
    suggestedMacros: [
      'Draft sprint update email for stakeholders',
      'Compose polite client escalation followup',
      'Write architecture review invitation'
    ],
    usageCount: 12
  },
  {
    id: 'job-code-architect',
    name: 'Code Review & Refactor',
    slug: 'code-architect',
    icon: 'Code2',
    description: 'Performs deep static analysis, refactors for performance, and enforces clean modular design patterns.',
    primerPrompt: `TASK PRIMING DIRECTIVE: [CODE REVIEW & ARCHITECTURAL REFACTOR]
- Goal: Analyze provided code, detect security/latency/anti-patterns, and provide an optimized production-grade rewrite.
- Rules: Use TypeScript, adhere to user's saved code standards, add modular interfaces, and highlight exact optimizations made.`,
    targetCategories: ['code', 'architecture', 'project'],
    suggestedMacros: [
      'Refactor React state hook for memoization',
      'Audit API route for latency and error handling',
      'Convert legacy callback into async/await pipeline'
    ],
    usageCount: 28
  },
  {
    id: 'job-exec-summary',
    name: 'Executive Synthesis & Summary',
    slug: 'exec-summary',
    icon: 'FileText',
    description: 'Compresses long documents, meeting transcripts, or technical papers into high-density strategic briefs.',
    primerPrompt: `TASK PRIMING DIRECTIVE: [EXECUTIVE SYNTHESIS]
- Goal: Distill inputs into a high-density 1-page executive brief.
- Structure: 1. Core Thesis / TL;DR, 2. Key Strategic Takeaways, 3. Numerical / Quantitative Highlights, 4. Critical Blockers & Action Items.`,
    targetCategories: ['project', 'task', 'personal'],
    suggestedMacros: [
      'Summarize today\'s tech developments into 3 bullets',
      'Create 1-minute briefing on project milestones',
      'Extract action items from team notes'
    ],
    usageCount: 9
  },
  {
    id: 'job-bug-forensics',
    name: 'Bug Forensics & Debugging',
    slug: 'bug-forensics',
    icon: 'Bug',
    description: 'Pinpoints root causes of runtime exceptions, memory leaks, and race conditions with step-by-step resolution.',
    primerPrompt: `TASK PRIMING DIRECTIVE: [BUG FORENSICS & RESOLUTION]
- Goal: Identify root cause of failure, provide reproduction hypothesis, and output verified fix.
- Output: Root Cause Analysis, Fix Implementation, Edge Case Checklist.`,
    targetCategories: ['code', 'architecture'],
    suggestedMacros: [
      'Debug React infinite re-render loop',
      'Analyze async race condition in WebSocket stream',
      'Fix TypeScript type mismatch in payload'
    ],
    usageCount: 15
  },
  {
    id: 'job-daily-standup',
    name: 'Daily Standup & Plan',
    slug: 'daily-standup',
    icon: 'CalendarCheck',
    description: 'Synthesizes recent daily logs into a structured 3-part standup: Done Yesterday, Planned Today, Blockers.',
    primerPrompt: `TASK PRIMING DIRECTIVE: [DAILY STANDUP SYNTHESIS]
- Goal: Review recent daily logs and user tasks to create a concise standup update.
- Format:
  • 🟢 YESTERDAY / RECENT: Key items completed
  • 🟡 TODAY: Priority execution targets
  • 🔴 BLOCKERS & DEPENDENCIES: Risks or needed inputs`,
    targetCategories: ['task', 'project', 'personal'],
    suggestedMacros: [
      'Generate standup report from yesterday\'s log',
      'Plan top 3 high-impact tasks for today',
      'Review pending blockers from previous sessions'
    ],
    usageCount: 7
  }
];

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const DEFAULT_STONICX_DAILY_LOGS: StonicxDailyLog[] = [
  {
    date: getTodayString(),
    timestamp: Date.now(),
    summary: 'Initialized STONICX AI Priming memory subsystem with dedicated User Profile, Topic Notes, Task-Specific Jobs, and Daily Log tracking.',
    keyTopics: ['AI Priming', 'Living Circuit OS', 'Memory Isolation', 'Neural Core'],
    actionItems: ['Verify autonomous fact extraction', 'Test task-specific priming jobs', 'Ensure MAYRA isolation'],
    interactionCount: 4
  },
  {
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    timestamp: Date.now() - 86400000,
    summary: 'Built STONICX full app-shell takeover, Living Circuit 60 FPS visualizer, and dual-core top navigation switcher.',
    keyTopics: ['App Shell Takeover', 'Canvas Visualizer', 'Mode Switcher'],
    actionItems: ['Integrate isolated memory vault'],
    interactionCount: 8
  }
];

// Helper to load/save profile
export function loadStonicxProfile(): StonicxUserProfile {
  if (typeof window === 'undefined') return DEFAULT_STONICX_PROFILE;
  try {
    const saved = localStorage.getItem(STONICX_PROFILE_KEY);
    if (saved) {
      return { ...DEFAULT_STONICX_PROFILE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load STONICX profile:', e);
  }
  return DEFAULT_STONICX_PROFILE;
}

export function saveStonicxProfile(profile: StonicxUserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STONICX_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save STONICX profile:', e);
  }
}

// Helper to load/save topic notes
export function loadStonicxTopicNotes(): StonicxTopicNote[] {
  if (typeof window === 'undefined') return DEFAULT_STONICX_TOPIC_NOTES;
  try {
    const saved = localStorage.getItem(STONICX_TOPIC_NOTES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load STONICX topic notes:', e);
  }
  return DEFAULT_STONICX_TOPIC_NOTES;
}

export function saveStonicxTopicNotes(notes: StonicxTopicNote[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STONICX_TOPIC_NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save STONICX topic notes:', e);
  }
}

// Helper to load/save jobs
export function loadStonicxJobs(): StonicxJobPriming[] {
  if (typeof window === 'undefined') return DEFAULT_STONICX_JOBS;
  try {
    const saved = localStorage.getItem(STONICX_JOBS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load STONICX jobs:', e);
  }
  return DEFAULT_STONICX_JOBS;
}

export function saveStonicxJobs(jobs: StonicxJobPriming[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STONICX_JOBS_KEY, JSON.stringify(jobs));
  } catch (e) {
    console.error('Failed to save STONICX jobs:', e);
  }
}

// Helper to load/save daily logs
export function loadStonicxDailyLogs(): StonicxDailyLog[] {
  if (typeof window === 'undefined') return DEFAULT_STONICX_DAILY_LOGS;
  try {
    const saved = localStorage.getItem(STONICX_DAILY_LOGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load STONICX daily logs:', e);
  }
  return DEFAULT_STONICX_DAILY_LOGS;
}

export function saveStonicxDailyLogs(logs: StonicxDailyLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STONICX_DAILY_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save STONICX daily logs:', e);
  }
}

/**
 * Intelligent parser to detect facts from conversational turns and auto-update the user profile / topic notes.
 */
export function extractAndApplyProfileUpdates(
  userText: string,
  currentProfile: StonicxUserProfile,
  onProfileUpdate: (updated: StonicxUserProfile) => void,
  onNoteAdd: (note: Omit<StonicxTopicNote, 'id' | 'lastModified'>) => void
): { updatedProfile: boolean; addedNote: boolean } {
  let hasProfileUpdate = false;
  let hasNoteAdded = false;
  const newProfile = { ...currentProfile };

  const lower = userText.toLowerCase();

  // 1. Detect Name ("Mera naam X hai", "My name is X", "Call me X")
  const nameMatch = userText.match(/(?:my name is|mera naam|call me|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch && nameMatch[1] && !['the', 'a', 'busy', 'working', 'trying'].includes(nameMatch[1].toLowerCase())) {
    const extractedName = nameMatch[1].trim();
    if (newProfile.preferredName !== extractedName) {
      newProfile.preferredName = extractedName;
      newProfile.fullName = extractedName;
      hasProfileUpdate = true;
    }
  }

  // 2. Detect Role / Title ("I am a X engineer", "I work as X", "Mera role X hai")
  const roleMatch = userText.match(/(?:i work as|i am a|i am an|working as|mera role)\s+([^.,;\n]+)/i);
  if (roleMatch && roleMatch[1] && roleMatch[1].length < 50) {
    const role = roleMatch[1].trim();
    if (!newProfile.roleOrTitle.toLowerCase().includes(role.toLowerCase())) {
      newProfile.roleOrTitle = role;
      hasProfileUpdate = true;
    }
  }

  // 3. Detect Tech Stack / Languages
  const techKeywords = ['react', 'next.js', 'vue', 'angular', 'svelte', 'typescript', 'javascript', 'python', 'rust', 'golang', 'kotlin', 'swift', 'docker', 'kubernetes', 'tailwind', 'graphql', 'postgres', 'fastapi'];
  techKeywords.forEach(tech => {
    if (lower.includes(tech)) {
      const formatted = tech.charAt(0).toUpperCase() + tech.slice(1);
      if (!newProfile.techStack.map(t => t.toLowerCase()).includes(tech)) {
        newProfile.techStack = [...newProfile.techStack, formatted];
        hasProfileUpdate = true;
      }
    }
  });

  // 4. Detect Preferences ("I prefer X", "Mujhe X pasand hai", "I like X", "I hate X", "Never do X")
  const prefMatch = userText.match(/(?:i prefer|i like|i always want|mujhe|hamesha|never)\s+([^.\n]+)/i);
  if (prefMatch && prefMatch[1] && prefMatch[1].length > 5 && prefMatch[1].length < 100) {
    const pref = prefMatch[0].trim();
    if (!newProfile.keyPreferences.some(p => p.toLowerCase() === pref.toLowerCase())) {
      newProfile.keyPreferences = [pref, ...newProfile.keyPreferences.slice(0, 8)];
      hasProfileUpdate = true;
    }
  }

  // 5. Detect explicit topic note directive ("Note this:", "Save project spec:", "Remember this:")
  const explicitNoteMatch = userText.match(/(?:note this|remember that|save note|project note|spec:)\s*[:\-]?\s*(.+)/i);
  if (explicitNoteMatch && explicitNoteMatch[1]) {
    const content = explicitNoteMatch[1].trim();
    const titleMatch = content.split(/[:\n]/)[0];
    onNoteAdd({
      title: titleMatch.length < 40 ? titleMatch : 'Auto-Saved Directive Note',
      category: 'project',
      content,
      tags: ['auto-saved', 'directive'],
      isPinned: false
    });
    hasNoteAdded = true;
  }

  if (hasProfileUpdate) {
    newProfile.lastUpdated = Date.now();
    onProfileUpdate(newProfile);
  }

  return { updatedProfile: hasProfileUpdate, addedNote: hasNoteAdded };
}

/**
 * Update or append to today's daily log
 */
export function recordDailyInteraction(
  userText: string,
  assistantReply: string,
  currentLogs: StonicxDailyLog[],
  onLogsUpdate: (logs: StonicxDailyLog[]) => void
): void {
  const today = getTodayString();
  const existingIndex = currentLogs.findIndex(l => l.date === today);

  // Extract key topic from text if possible
  const candidateTopics = ['Architecture', 'TypeScript', 'Email Drafting', 'Debugging', 'Refactor', 'Performance', 'Memory Priming', 'Database', 'API Design', 'Security', 'Telemetry'];
  const foundTopics: string[] = [];
  const combined = (userText + ' ' + assistantReply).toLowerCase();
  candidateTopics.forEach(topic => {
    if (combined.includes(topic.toLowerCase()) && !foundTopics.includes(topic)) {
      foundTopics.push(topic);
    }
  });

  if (existingIndex >= 0) {
    const existing = currentLogs[existingIndex];
    const mergedTopics = Array.from(new Set([...existing.keyTopics, ...foundTopics])).slice(0, 6);
    const updatedLog: StonicxDailyLog = {
      ...existing,
      interactionCount: existing.interactionCount + 1,
      keyTopics: mergedTopics.length > 0 ? mergedTopics : existing.keyTopics,
      timestamp: Date.now(),
      summary: userText.length > 20 
        ? `${existing.summary} | Latest: ${userText.slice(0, 60)}...`
        : existing.summary
    };
    const updated = [...currentLogs];
    updated[existingIndex] = updatedLog;
    onLogsUpdate(updated);
  } else {
    const newLog: StonicxDailyLog = {
      date: today,
      timestamp: Date.now(),
      summary: `Daily session: ${userText.slice(0, 80)}`,
      keyTopics: foundTopics.length > 0 ? foundTopics : ['General Synthesis'],
      actionItems: ['Follow up on discussed directives'],
      interactionCount: 1
    };
    onLogsUpdate([newLog, ...currentLogs]);
  }
}
