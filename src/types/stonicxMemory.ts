export interface StonicxUserProfile {
  fullName: string;
  preferredName: string;
  roleOrTitle: string;
  organizationOrProject: string;
  preferredLanguages: string[];
  techStack: string[];
  communicationStyle: string;
  keyPreferences: string[];
  bioNotes: string;
  lastUpdated: number;
}

export type StonicxNoteCategory = 'personal' | 'project' | 'code' | 'architecture' | 'preference' | 'task';

export interface StonicxTopicNote {
  id: string;
  title: string;
  category: StonicxNoteCategory;
  content: string;
  tags: string[];
  lastModified: number;
  isPinned?: boolean;
}

export interface StonicxJobPriming {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  primerPrompt: string;
  targetCategories: StonicxNoteCategory[];
  suggestedMacros: string[];
  usageCount: number;
}

export interface StonicxDailyLog {
  date: string; // YYYY-MM-DD
  timestamp: number;
  summary: string;
  keyTopics: string[];
  actionItems: string[];
  interactionCount: number;
}

export interface StonicxPrimingMemoryBundle {
  profile: StonicxUserProfile;
  topicNotes: StonicxTopicNote[];
  jobs: StonicxJobPriming[];
  dailyLogs: StonicxDailyLog[];
  activeJobId: string | null;
}
