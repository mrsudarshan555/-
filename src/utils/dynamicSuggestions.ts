import { ChatMessage, MayraLanguage } from '../types';

export interface DynamicSuggestionCategory {
  topic: string;
  en: string[];
  hi: string[];
}

const TOPIC_SUGGESTIONS: DynamicSuggestionCategory[] = [
  {
    topic: 'vision',
    en: [
      'Analyze screen',
      'Describe UI layout',
      'Scan current screen',
      'Extract text from image',
      'How to share screen'
    ],
    hi: [
      'Screen analyze karo',
      'Screen par kya hai batao',
      'Screen share kaise karein',
      'Photo scan karo'
    ]
  },
  {
    topic: 'phone_control',
    en: [
      'Can you control my phone?',
      'Check phone permissions',
      'Open settings',
      'Automate daily routine',
      'Guide me through permissions'
    ],
    hi: [
      'Phone control kaise karein?',
      'Permissions check karo',
      'Settings open karo',
      'Device automation on karo'
    ]
  },
  {
    topic: 'productivity',
    en: [
      'Draft an email',
      'Summarize notes',
      'Plan my schedule',
      'Create to-do list',
      'Write a meeting follow-up'
    ],
    hi: [
      'Email draft karo',
      'Notes summarize karo',
      'Mera schedule plan karo',
      'Kaam ki list banao'
    ]
  },
  {
    topic: 'memory',
    en: [
      'Save note in memory',
      'What do you remember about me?',
      'Show saved memories',
      'Remember my favorite tech stack'
    ],
    hi: [
      'Memory mein save karo',
      'Mere baare mein kya yaad hai?',
      'Saved memories dikhao'
    ]
  },
  {
    topic: 'code',
    en: [
      'Review TypeScript code',
      'Explain React hooks',
      'Optimize API route',
      'Debug state lifecycle'
    ],
    hi: [
      'Code explain karo',
      'React component samjhao',
      'Bug kaise fix karein'
    ]
  },
  {
    topic: 'general',
    en: [
      'Explain quantum computing',
      'What can you do?',
      'Latest AI advancements',
      'Tell me a fun fact'
    ],
    hi: [
      'Aap kya kar sakti ho?',
      'Aaj ki taaza khabrein',
      'Ek interesting fact batao'
    ]
  }
];

const DEFAULT_CHIPS_EN = [
  'Analyze screen',
  'Can you control my phone?',
  'Summarize notes',
  'Plan my schedule',
  'Save in memory',
  'What can you do?'
];

const DEFAULT_CHIPS_HI = [
  'Screen analyze karo',
  'Phone control kaise karein?',
  'Memory mein save karo',
  'Mera schedule plan karo',
  'Aap kya kar sakti ho?'
];

/**
 * Derives contextual topics based on recent conversation history
 */
export function extractContextualTopics(messages: ChatMessage[]): string[] {
  if (!messages || messages.length === 0) return ['vision', 'phone_control', 'productivity', 'memory'];

  const recentText = messages
    .slice(-4)
    .map(m => m.text.toLowerCase())
    .join(' ');

  const topics: string[] = [];

  if (recentText.includes('screen') || recentText.includes('see') || recentText.includes('look') || recentText.includes('camera') || recentText.includes('photo') || recentText.includes('vision') || recentText.includes('image')) {
    topics.push('vision');
  }
  if (recentText.includes('control') || recentText.includes('phone') || recentText.includes('permission') || recentText.includes('automate') || recentText.includes('setting')) {
    topics.push('phone_control');
  }
  if (recentText.includes('code') || recentText.includes('function') || recentText.includes('typescript') || recentText.includes('react') || recentText.includes('api') || recentText.includes('bug')) {
    topics.push('code');
  }
  if (recentText.includes('remember') || recentText.includes('memory') || recentText.includes('save') || recentText.includes('naam') || recentText.includes('yaad')) {
    topics.push('memory');
  }
  if (recentText.includes('email') || recentText.includes('plan') || recentText.includes('schedule') || recentText.includes('note') || recentText.includes('task')) {
    topics.push('productivity');
  }

  // Always fill with general categories if needed
  if (topics.length === 0) {
    topics.push('vision', 'phone_control', 'productivity', 'general');
  } else {
    topics.push('general', 'productivity');
  }

  return Array.from(new Set(topics));
}

/**
 * Returns dynamic, rotated suggestion chips based on context, language, and refresh cycle
 */
export function getDynamicSuggestions(
  messages: ChatMessage[],
  language: MayraLanguage = 'en',
  rotationSeed: number = 0
): string[] {
  const isHindi = language === 'hi';
  const topics = extractContextualTopics(messages);

  const selectedChips: string[] = [];

  // Pick top recommendations matching user's recent active topics
  for (const topicKey of topics) {
    const category = TOPIC_SUGGESTIONS.find(c => c.topic === topicKey);
    if (category) {
      const pool = isHindi && category.hi.length > 0 ? category.hi : category.en;
      if (pool.length > 0) {
        const index = (rotationSeed + selectedChips.length) % pool.length;
        selectedChips.push(pool[index]);
      }
    }
  }

  // Add general fallbacks if under 5 chips
  const defaultPool = isHindi ? DEFAULT_CHIPS_HI : DEFAULT_CHIPS_EN;
  for (let i = 0; i < defaultPool.length && selectedChips.length < 6; i++) {
    const item = defaultPool[(i + rotationSeed) % defaultPool.length];
    if (!selectedChips.includes(item)) {
      selectedChips.push(item);
    }
  }

  return selectedChips.slice(0, 5);
}
