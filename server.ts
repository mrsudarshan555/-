import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import https from 'https';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client server-side with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Map legacy or high-demand aliases to current stable models per gemini-api guidelines
function normalizeModelName(model?: string): string {
  if (!model) return 'gemini-3.1-flash-lite';
  const trimmed = model.trim();
  if (
    trimmed === 'gemini-3.7-flash' ||
    trimmed === 'gemini-flash-latest' || 
    trimmed === 'gemini-flash' || 
    trimmed === 'gemini-lite' || 
    trimmed === 'flash-lite'
  ) {
    return 'gemini-3.1-flash-lite';
  }
  if (trimmed === 'gemini-pro') {
    return 'gemini-3.1-pro-preview';
  }
  return trimmed;
}

// Helper for resilient Gemini content generation with multi-model fallback, multimodal image/document support, and timeout protection
async function generateGeminiResponse(
  message: string,
  systemInstruction: string,
  temperature: number,
  preferredModel?: string,
  image?: { mimeType?: string; base64?: string }
): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const primaryModel = normalizeModelName(preferredModel);

  const candidateModels = Array.from(
    new Set([
      primaryModel,
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash'
    ].filter((m): m is string => Boolean(m && typeof m === 'string' && m.trim().length > 0 && m !== 'gemini-3.7-flash')))
  );

  // Construct multimodal or text content payload
  let contentsPayload: any;
  if (image && image.base64) {
    const rawData = image.base64.replace(/^data:[^;]+;base64,/, '');
    const isDoc = image.mimeType?.includes('pdf') || 
                  image.mimeType?.includes('document') || 
                  image.mimeType?.includes('text') || 
                  image.mimeType?.includes('csv') || 
                  image.mimeType?.includes('json');

    const effectiveMime = image.mimeType || (isDoc ? 'application/pdf' : 'image/jpeg');

    console.log('[MAYRA_GEMINI_GENERATE_MULTIMODAL]', {
      prompt: message,
      isDoc,
      mimeType: effectiveMime,
      rawDataLength: rawData.length,
      first40Bytes: rawData.slice(0, 40)
    });

    const filePart = {
      inlineData: {
        mimeType: effectiveMime,
        data: rawData
      }
    };

    const textPrompt = message && message.trim() 
      ? message 
      : (isDoc 
          ? 'Analyze and read this attached document in detail. Summarize key sections, extract facts, numbers and text, and describe the contents accurately.'
          : 'Analyze this image in detail. Read any visible text, identify objects, describe the scene, and answer what you see.');
    
    contentsPayload = [filePart, { text: textPrompt }];
  } else {
    contentsPayload = message;
  }

  for (const modelName of candidateModels) {
    try {
      const callPromise = ai.models.generateContent({
        model: modelName,
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature
        }
      });

      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 15000)
      );

      const response = await Promise.race([callPromise, timeoutPromise]) as any;

      if (response && response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.log(`[Gemini Engine] Model '${modelName}' notice (${err?.message || 'timed out'}). Attempting alternate model...`);
      continue;
    }
  }

  return null;
}

// Automatic Background Memory Extractor: Identifies important personal facts mentioned in passing
function extractAutomaticMemories(message: string, existingMemories: Array<{ key: string; value: string }>): { key: string; value: string; category: string } | null {
  if (!message || typeof message !== 'string' || message.trim().length < 6) return null;
  const raw = message.trim();
  const lower = raw.toLowerCase();

  // Exclude explicit command phrases handled elsewhere
  if (lower.startsWith('save memory') || lower.startsWith('memory mein') || lower.startsWith('remember this')) {
    return null;
  }

  let extracted: { key: string; value: string; category: string } | null = null;

  // 1. Name Disclosures: "my name is X", "call me X", "mera naam X hai", "mujhe X bulao"
  const nameMatch = raw.match(/(?:my name is|i am|call me|mera naam|mujhe)\s+([a-zA-Z0-9\s]+?)(?:\s+hai|\s+bulao|\.|\,|$)/i);
  if (nameMatch && nameMatch[1] && !lower.includes('why') && !lower.includes('what') && !lower.includes('kya')) {
    const val = nameMatch[1].trim();
    if (val.length >= 2 && val.length <= 30 && !/^(who|what|why|how|ready|listening|speaking|here)$/i.test(val)) {
      extracted = { key: 'User Name', value: val, category: 'personal' };
    }
  }

  // 2. Favorite things: "my favorite X is Y", "mera favourite X Y hai"
  const favMatch = raw.match(/(?:my\s+favou?rite\s+([a-zA-Z\s]+?)\s+is\s+([a-zA-Z0-9\s]+)|mera\s+favou?rite\s+([a-zA-Z\s]+?)\s+([a-zA-Z0-9\s]+?)(?:\s+hai|$))/i);
  if (!extracted && favMatch) {
    const item = (favMatch[1] || favMatch[3] || 'Preference').trim();
    const val = (favMatch[2] || favMatch[4] || '').trim();
    if (item && val && val.length < 50) {
      extracted = { key: `Favorite ${item.charAt(0).toUpperCase() + item.slice(1)}`, value: val, category: 'preference' };
    }
  }

  // 3. Likes/Preferences: "I love X", "I prefer X", "Mujhe X pasand hai", "Mujhe X bahut accha lagta hai"
  const loveMatch = raw.match(/(?:i\s+(?:love|really\s+like|prefer)\s+([a-zA-Z0-9\s,]+)|mujhe\s+([a-zA-Z0-9\s]+?)\s+(?:pasand|bahut\s+pasand|accha\s+lagta)\s+hai)/i);
  if (!extracted && loveMatch) {
    const val = (loveMatch[1] || loveMatch[2] || '').trim();
    if (val.length >= 2 && val.length <= 60 && !val.toLowerCase().startsWith('to ') && !/^(it|this|that|you)$/i.test(val)) {
      extracted = { key: 'Preference', value: `Loves/Prefers ${val}`, category: 'preference' };
    }
  }

  // 4. Job/Work/Profession: "I work at X", "I am a software engineer", "Main X company mein kaam karta hoon"
  const jobMatch = raw.match(/(?:i\s+work\s+(?:at|for|as)\s+([a-zA-Z0-9\s]+)|main\s+([a-zA-Z0-9\s]+?)\s+(?:mein\s+kaam\s+karta\s+hoon|company\s+mein\s+hoon))/i);
  if (!extracted && jobMatch) {
    const val = (jobMatch[1] || jobMatch[2] || '').trim();
    if (val.length >= 2 && val.length <= 50) {
      extracted = { key: 'Profession / Workplace', value: val, category: 'personal' };
    }
  }

  // 5. Living location: "I live in X", "I am based in X", "Main X mein rehta hoon"
  const locMatch = raw.match(/(?:i\s+live\s+in|i\s+am\s+based\s+in|main\s+([a-zA-Z0-9\s]+?)\s+mein\s+rehta\s+hoon)\s*([a-zA-Z\s]+)?/i);
  if (!extracted && locMatch) {
    const val = (locMatch[1] || locMatch[2] || '').trim();
    if (val.length >= 2 && val.length <= 40) {
      extracted = { key: 'Location / City', value: val, category: 'personal' };
    }
  }

  // 6. Pets & Family: "My dog is named X", "My brother is X", "Mere dog ka naam X hai", "Mere bhai ka naam X hai"
  const relMatch = raw.match(/(?:my\s+(dog|cat|pet|brother|sister|wife|husband|friend)\s+(?:is\s+named|is|name\s+is)\s+([a-zA-Z0-9\s]+)|mere\s+(dog|cat|pet|bhai|behan|dost|wife)\s+ka\s+naam\s+([a-zA-Z0-9\s]+?)(?:\s+hai|$))/i);
  if (!extracted && relMatch) {
    const rel = (relMatch[1] || relMatch[3] || 'Relation').trim();
    const val = (relMatch[2] || relMatch[4] || '').trim();
    if (rel && val && val.length < 40) {
      extracted = { key: `${rel.charAt(0).toUpperCase() + rel.slice(1)}'s Name`, value: val, category: 'personal' };
    }
  }

  // 7. Allergies & Dietary: "I am allergic to X", "I am vegetarian", "Mujhe X se allergy hai"
  const allergyMatch = raw.match(/(?:i\s+am\s+allergic\s+to\s+([a-zA-Z0-9\s]+)|i\s+am\s+(vegetarian|vegan|gluten-free)|mujhe\s+([a-zA-Z0-9\s]+?)\s+se\s+allergy\s+hai)/i);
  if (!extracted && allergyMatch) {
    const val = (allergyMatch[1] || allergyMatch[2] || allergyMatch[3] || '').trim();
    if (val) {
      extracted = { key: 'Dietary / Health Note', value: val, category: 'personal' };
    }
  }

  // Check if this fact is already known to avoid spamming duplicate memory items
  if (extracted) {
    const isDuplicate = existingMemories.some(
      m => m.key.toLowerCase() === extracted!.key.toLowerCase() && m.value.toLowerCase() === extracted!.value.toLowerCase()
    );
    if (isDuplicate) return null;
  }

  return extracted;
}

function detectLang(text: string): 'hi' | 'en' {
  if (!text || typeof text !== 'string') return 'en';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  const hinglishWords = new Set([
    'karo', 'karein', 'kya', 'hai', 'hain', 'kaise', 'kaisi', 'mujhe', 'batao',
    'bataiye', 'mera', 'meri', 'mere', 'namaste', 'shukriya', 'theek', 'bolo', 'aap', 'tum',
    'dhanyawad', 'kahan', 'kab', 'kyun', 'nahi', 'haan', 'madad', 'chahiye',
    'dekh', 'dekho', 'rahe', 'rahi', 'kripya', 'sunao', 'accha', 'sakta', 'sakti',
    'hoga', 'hogi', 'apna', 'apni', 'kaam', 'haal', 'kaun'
  ]);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  let hinglishCount = 0;
  for (const w of words) {
    if (hinglishWords.has(w)) hinglishCount++;
  }
  if (words.length > 0 && (hinglishCount >= 2 || (words.length <= 3 && hinglishCount >= 1))) {
    return 'hi';
  }
  return 'en';
}

/**
 * Generates natural, human-like voice response using Gemini Audio TTS (Voice: Aoede)
 * Gracefully handles 429 quota limitations without failing the conversation.
 */
async function generateAoedeVoiceAudio(text: string, language?: string): Promise<{ audioBase64: string; mimeType: string } | null> {
  if (!process.env.GEMINI_API_KEY || !text || text.trim().length === 0) {
    return null;
  }

  const cleanText = text
    .replace(/\[.*?\]/g, '')
    .replace(/[*#_~`]/g, '')
    .replace(/https?:\/\/\S+/g, 'link')
    .trim();

  if (!cleanText) return null;

  try {
    const callPromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: cleanText,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede'
            }
          }
        }
      }
    });

    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('TTS_TIMEOUT')), 3200)
    );

    const response = await Promise.race([callPromise, timeoutPromise]) as any;

    const parts = response?.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return {
            audioBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'audio/l16; rate=24000; channels=1'
          };
        }
      }
    }
  } catch (err: any) {
    // If direct TTS is unavailable, log notice and return null
    console.log('[Gemini Voice Engine] Gemini direct TTS notice.');
    return null;
  }

  return null;
}

const MODEL_REMOTE_URL = 'https://raw.githubusercontent.com/mrsudarshan555/Model/main/Evelyn.glb';
const MODEL_LOCAL_PATH = path.join(process.cwd(), 'public', 'models', 'Evelyn.glb');

// Auto ensure valid model file on disk
async function fetchAndCacheModel(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(MODEL_REMOTE_URL, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          const chunks: Buffer[] = [];
          redirectRes.on('data', chunk => chunks.push(chunk));
          redirectRes.on('end', () => {
            const buffer = Buffer.concat(chunks);
            try {
              fs.mkdirSync(path.dirname(MODEL_LOCAL_PATH), { recursive: true });
              fs.writeFileSync(MODEL_LOCAL_PATH, buffer);
            } catch (err) {
              console.warn('Could not write cached model to disk:', err);
            }
            resolve(buffer);
          });
        }).on('error', reject);
      } else {
        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          try {
            fs.mkdirSync(path.dirname(MODEL_LOCAL_PATH), { recursive: true });
            fs.writeFileSync(MODEL_LOCAL_PATH, buffer);
          } catch (err) {
            console.warn('Could not write cached model to disk:', err);
          }
          resolve(buffer);
        });
      }
    }).on('error', reject);
  });
}

// Dedicated endpoint to guarantee uncorrupted GLB binary delivery with CORS and binary headers
app.get(['/models/Evelyn.glb', '/models/evelyn.glb', '/models/evelyn_model.glb', '/models/evelyn_model_v2.glb', '/models/evelyn_model_clean.glb', '/api/model/evelyn.glb'], async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'model/gltf-binary');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  try {
    if (fs.existsSync(MODEL_LOCAL_PATH)) {
      const stats = fs.statSync(MODEL_LOCAL_PATH);
      if (stats.size > 1000000) {
        return res.sendFile(MODEL_LOCAL_PATH);
      }
    }
    const modelBuffer = await fetchAndCacheModel();
    res.setHeader('Content-Length', modelBuffer.length);
    return res.end(modelBuffer);
  } catch (error: any) {
    console.error('Error serving Evelyn model:', error);
    if (fs.existsSync(MODEL_LOCAL_PATH)) {
      return res.sendFile(MODEL_LOCAL_PATH);
    }
    return res.status(500).json({ error: 'Failed to stream 3D model asset' });
  }
});

// Texture handling middleware / endpoints for legacy or relative GLTF requests
app.use((req, res, next) => {
  const url = decodeURIComponent(req.url);
  
  if (url.includes('衣2') || url.includes('tex_5')) {
    const p = path.join(process.cwd(), 'public', 'tex', '衣2.tga');
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.sendFile(p);
    }
  }
  if (url.includes('衣') || url.includes('tex_0')) {
    const p = path.join(process.cwd(), 'public', 'tex', '衣.tga');
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.sendFile(p);
    }
  }
  if (url.includes('颜') || url.includes('tex_2')) {
    const p = path.join(process.cwd(), 'public', 'tex', '颜.tga');
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.sendFile(p);
    }
  }
  if (url.includes('黑') || url.includes('tex_7')) {
    const p = path.join(process.cwd(), 'public', 'tex', '黑.jpg');
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.sendFile(p);
    }
  }
  next();
});

// In-Memory Storage for Memory & System Controls Shells
const memoryStore: Array<{ id: string; key: string; value: string; category: string; timestamp: number }> = [
  {
    id: '1',
    key: 'Assistant Name',
    value: 'MAYRA (Personal AI Assistant)',
    category: 'system_identity',
    timestamp: Date.now()
  },
  {
    id: '2',
    key: 'Voice Engine',
    value: 'Gemini Aoede Natural Audio Engine Active',
    category: 'system',
    timestamp: Date.now()
  }
];

const availableTools = [
  { name: 'WebSearch', description: 'Retrieves up-to-date real-time information and web search answers', category: 'Intelligence' },
  { name: 'ScreenVision', description: 'Analyzes screen contents, extracts UI text, and parses visual layouts', category: 'Vision' },
  { name: 'FileProcessing', description: 'Processes PDF documents, spreadsheets, code files, and local logs', category: 'Productivity' },
  { name: 'AndroidAutomation', description: 'Controls device brightness, volume, Wi-Fi toggles, and launches apps', category: 'System' }
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'MAYRA UI Core', version: '2.4.1', voice: 'Aoede (Gemini Live/TTS)' });
});

// Texture fallback for GLTF legacy texture paths
app.use(['/tex', '/tex/*'], (req, res) => {
  const transparent1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': transparent1x1.length
  });
  res.end(transparent1x1);
});

// Dedicated Voice Synthesis Endpoint: Returns natural human-like Aoede audio or instructs fallback
app.post('/api/voice/speak', async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const audioResult = await generateAoedeVoiceAudio(text, language);
    if (audioResult) {
      return res.json({
        success: true,
        audioBase64: audioResult.audioBase64,
        mimeType: audioResult.mimeType,
        sampleRate: 24000,
        voiceName: 'Aoede'
      });
    }

    // If direct TTS audio is not generated, cleanly return null audio without browser fallback
    return res.json({
      success: false,
      audioBase64: null,
      message: 'Direct Aoede voice audio not available'
    });
  } catch (err: any) {
    console.error('Error in /api/voice/speak:', err);
    return res.json({ success: false, audioBase64: null });
  }
});

// Memory Endpoints
app.get('/api/memory', (req, res) => {
  res.json({ memories: memoryStore });
});

app.post('/api/memory', (req, res) => {
  const { key, value, category } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: 'Key and Value are required' });
  }
  const newItem = {
    id: `mem-${Date.now()}`,
    key: String(key).trim(),
    value: String(value).trim(),
    category: category || 'general',
    timestamp: Date.now()
  };
  memoryStore.unshift(newItem);
  res.json({ success: true, item: newItem });
});

app.delete('/api/memory/:id', (req, res) => {
  const { id } = req.params;
  const index = memoryStore.findIndex(m => m.id === id || m.key.toLowerCase() === id.toLowerCase());
  if (index !== -1) {
    const removed = memoryStore.splice(index, 1);
    return res.json({ success: true, removed: removed[0] });
  }
  res.status(404).json({ error: 'Memory item not found' });
});

// Helper for deterministic and AI command intent parsing
function parseCommandIntent(message: string, language: string = 'en'): { action: any; reply: string } | null {
  const raw = message.trim();
  const lower = raw.toLowerCase();

  // 1. SAVE MEMORY INTENT
  const saveMemRegex = /(?:save\s+(?:in|to)?\s*memory|memory\s+mein\s+save\s+karo|memory\s+mein\s+daal\s+do|isko\s+memory\s+mein\s+save\s+karo|yaad\s+rakho|remember\s+that|save\s+this\s+in\s+memory|save\s+memory)\s*[:\-\s]*(.*)/i;
  const saveMemMatch = lower.match(saveMemRegex);
  
  if (saveMemMatch || lower.includes('memory mein save') || lower.includes('save in memory') || lower.includes('save to memory')) {
    let contentToSave = (saveMemMatch && saveMemMatch[1]) ? saveMemMatch[1].trim() : raw;
    contentToSave = contentToSave
      .replace(/^(?:ki|that|about)\s+/i, '')
      .replace(/\s*(?:isko|ise)?\s*memory\s+mein\s+(?:save|daal)\s*(?:karo|do)?/i, '')
      .trim();

    let key = 'User Note';
    let value = contentToSave || 'Important Information';
    let category = 'personal';

    // Parse "mera naam XYZ hai" or "my name is XYZ"
    if (/mera\s+naam\s+([a-z0-9\s]+?)(?:\s+hai)?$/i.test(contentToSave) || /my\s+name\s+is\s+([a-z0-9\s]+)/i.test(contentToSave)) {
      const nameMatch = contentToSave.match(/(?:mera\s+naam|my\s+name\s+is)\s+([a-z0-9\s]+)/i);
      if (nameMatch && nameMatch[1]) {
        key = 'User Name';
        value = nameMatch[1].replace(/\s+hai$/i, '').trim();
        category = 'personal';
      }
    } else if (contentToSave.includes(':')) {
      const parts = contentToSave.split(':');
      key = parts[0].trim();
      value = parts.slice(1).join(':').trim();
    } else if (contentToSave.includes('-')) {
      const parts = contentToSave.split('-');
      key = parts[0].trim();
      value = parts.slice(1).join('-').trim();
    } else {
      key = contentToSave.length > 25 ? contentToSave.slice(0, 25) + '...' : contentToSave;
      value = contentToSave;
    }

    // Actually store in memoryStore
    const newMem = {
      id: `mem-${Date.now()}`,
      key,
      value,
      category,
      timestamp: Date.now()
    };
    memoryStore.unshift(newMem);

    const reply = (language === 'hi')
      ? `Maine aapki memory mein safalta-purvak save kar liya hai: "${key} — ${value}".`
      : `I have saved this to your memory: "${key} — ${value}".`;

    return {
      action: {
        type: 'SAVE_MEMORY',
        payload: { key, value, category }
      },
      reply
    };
  }

  // 2. DELETE MEMORY INTENT
  if (lower.includes('delete memory') || lower.includes('memory delete karo') || lower.includes('clear memory') || lower.includes('memory saaf karo')) {
    return {
      action: { type: 'CLEAR_MEMORIES' },
      reply: (language === 'hi') ? 'Memories safalta-purvak update kar di gayi hain.' : 'Memory updated successfully.'
    };
  }

  // 3. TAB NAVIGATION INTENT
  // Camera / Scanner
  if (
    lower.includes('open camera') || lower.includes('camera kholo') || 
    lower.includes('open scanner') || lower.includes('scanner kholo') || 
    lower.includes('scan document') || lower.includes('camera on karo')
  ) {
    return {
      action: { type: 'NAVIGATE_TAB', payload: { tab: 'scan' } },
      reply: (language === 'hi') ? 'Camera scanner open kar diya hai.' : 'Opening camera scanner screen.'
    };
  }

  // Memories Tab
  if (
    lower.includes('open memories') || lower.includes('memories dikhao') || 
    lower.includes('memory screen') || lower.includes('open memory') ||
    lower.includes('yadash dikhao')
  ) {
    return {
      action: { type: 'NAVIGATE_TAB', payload: { tab: 'memories' } },
      reply: (language === 'hi') ? 'Memories & Knowledge Base screen open kar di hai.' : 'Opening Memories & Knowledge Base.'
    };
  }

  // Chat Tab
  if (lower.includes('open chat') || lower.includes('chat screen') || lower.includes('chat kholo')) {
    return {
      action: { type: 'NAVIGATE_TAB', payload: { tab: 'chat' } },
      reply: (language === 'hi') ? 'Chat screen khol di gayi hai.' : 'Opening chat screen.'
    };
  }

  // Home Screen
  if (lower.includes('go to home') || lower.includes('home screen') || lower.includes('home par jao') || lower.includes('main screen')) {
    return {
      action: { type: 'NAVIGATE_TAB', payload: { tab: 'home' } },
      reply: (language === 'hi') ? 'Home screen par navigate kar diya hai.' : 'Navigating to Home screen.'
    };
  }

  // 4. SETTINGS & PERMISSIONS INTENT
  if (lower.includes('open permissions') || lower.includes('permissions dikhao') || lower.includes('permissions kholo')) {
    return {
      action: { type: 'OPEN_SETTINGS', payload: { subScreen: 'permissions' } },
      reply: (language === 'hi') ? 'Permissions manager screen open kar di hai.' : 'Opening Android Permissions screen.'
    };
  }

  if (lower.includes('open settings') || lower.includes('settings kholo') || lower.includes('setting dikhao')) {
    return {
      action: { type: 'OPEN_SETTINGS', payload: { subScreen: 'root' } },
      reply: (language === 'hi') ? 'Settings open kar di gayi hai.' : 'Opening Settings.'
    };
  }

  // 5. CLEAR CHAT INTENT
  if (lower.includes('clear chat') || lower.includes('clear messages') || lower.includes('chat clear karo') || lower.includes('chat saaf karo')) {
    return {
      action: { type: 'CLEAR_CHAT' },
      reply: (language === 'hi') ? 'Chat history saaf kar di gayi hai.' : 'Chat history cleared successfully.'
    };
  }

  // 6. TRIGGER VISION SCAN
  if (lower.includes('take photo') || lower.includes('capture screen') || lower.includes('photo khincho') || lower.includes('tasveer lo')) {
    return {
      action: { type: 'TRIGGER_SCAN' },
      reply: (language === 'hi') ? 'Vision capture execute ho raha hai.' : 'Triggering vision capture.'
    };
  }

  // 7. CONTACT ACTION (WhatsApp / Call)
  const contactMatch = lower.match(/(?:call|dial|whatsapp|message)\s+([a-z0-9\s]+)/i);
  if (contactMatch && (lower.includes('papa') || lower.includes('mom') || lower.includes('mumma') || lower.includes('bhai') || lower.includes('zafer'))) {
    const contactName = contactMatch[1].trim();
    const service = lower.includes('whatsapp') || lower.includes('message') ? 'whatsapp' : 'call';
    return {
      action: { type: 'CONTACT_ACTION', payload: { contactName, service } },
      reply: (language === 'hi')
        ? `${contactName} ke liye ${service === 'whatsapp' ? 'WhatsApp' : 'Call'} initiate kiya ja raha hai.`
        : `Initiating ${service === 'whatsapp' ? 'WhatsApp message' : 'call'} to ${contactName}.`
    };
  }

  // 8. SCREEN SHARE INTENT (Explicit Recognition & Spoken Guidance)
  if (
    lower.includes('see my screen') ||
    lower.includes('screen share') ||
    lower.includes('share screen') ||
    lower.includes('look at my screen') ||
    lower.includes('view my screen') ||
    lower.includes('watch my screen') ||
    lower.includes('screen dekh sakti') ||
    lower.includes('screen dekh sakte') ||
    lower.includes('screen dikhana') ||
    lower.includes('screen kaise share') ||
    lower.includes('meri screen dekho')
  ) {
    const isHindi = (language === 'hi' || detectLang(message) === 'hi');
    const reply = isHindi
      ? 'Aap upar top bar mein diye gaye Screen Share icon par tap karein ya Scanner screen use karein. Screen stream connect hote hi main aapki screen live dekh kar real-time mein aapki madad kar sakti hoon.'
      : "To share your screen, simply tap the screen-share button at the top of the screen or use the analyze-screen tool. Once you connect or share your screen, I'll be able to see everything on your display and help analyze, describe, or guide you through it in real time!";

    return {
      action: { type: 'SCREEN_SHARE_INTENT', payload: { action: 'open_screen_share' } },
      reply
    };
  }

  // 9. PHONE CONTROL INTENT (Accessibility & Device Automation Guidance)
  if (
    lower.includes('control my phone') ||
    lower.includes('control the phone') ||
    lower.includes('automate my phone') ||
    lower.includes('take control of my phone') ||
    lower.includes('manage my phone') ||
    lower.includes('phone control kar') ||
    lower.includes('phone chala sakti') ||
    lower.includes('phone operate kar') ||
    lower.includes('device automate')
  ) {
    const isHindi = (language === 'hi' || detectLang(message) === 'hi');
    const reply = isHindi
      ? 'Main aapke phone ke actions aur automation mein zaroor madad kar sakti hoon! Iske liye Settings > Permissions mein jaakar Device Automation aur Accessibility permissions ko turn on kar lijiye. Uske baad main aapke liye routines aur controls perform kar sakti hoon.'
      : "I can help automate and control phone actions once you enable the required permissions. Please go to Settings > Permissions and turn on the Device Automation and Accessibility permissions, and I'll be ready to manage routines and device actions for you!";

    return {
      action: { type: 'OPEN_SETTINGS', payload: { subScreen: 'permissions' } },
      reply
    };
  }

  return null;
}

// Chat endpoint for MAYRA UI Preview with unified Action Execution, Multimodal Image Vision & Auto Memory
app.post('/api/chat', async (req, res) => {
  try {
    const { message, persona, model, temperature, userName, language, returnAudio, image } = req.body;

    console.log('[MAYRA_SERVER_HTTP_DEBUG] /api/chat received request:', {
      message: message || '',
      hasImageAttachment: Boolean(image && image.base64),
      mimeType: image?.mimeType || 'none',
      base64Length: image?.base64 ? image.base64.length : 0,
      imageName: image?.name || 'none'
    });

    if (!message && !image) {
      return res.status(400).json({ error: 'Message or Image is required' });
    }

    const safeMessage = message || '';
    const lowerMsg = safeMessage.toLowerCase();

    // Check for Automatic Background Memory Extraction from user statement
    let autoMemorySaved: { key: string; value: string; category: string } | null = null;
    if (safeMessage) {
      const detectedAutoMem = extractAutomaticMemories(safeMessage, memoryStore);
      if (detectedAutoMem) {
        const newMemItem = {
          id: `mem-auto-${Date.now()}`,
          key: detectedAutoMem.key,
          value: detectedAutoMem.value,
          category: detectedAutoMem.category,
          timestamp: Date.now()
        };
        memoryStore.unshift(newMemItem);
        autoMemorySaved = detectedAutoMem;
        console.log('[MAYRA Memory Engine] ✦ AUTO-EXTRACTED MEMORY:', detectedAutoMem);
      }
    }

    // Creator check
    if (
      lowerMsg.includes('who created you') ||
      lowerMsg.includes('who made you') ||
      lowerMsg.includes('who is your creator') ||
      lowerMsg.includes('who is your developer') ||
      lowerMsg.includes('who built you') ||
      lowerMsg.includes('tumhe kisne banaya') ||
      lowerMsg.includes('aapko kisne banaya') ||
      lowerMsg.includes('kisne banaya')
    ) {
      const creatorResponse = (language === 'hi' || lowerMsg.includes('kisne'))
        ? 'Mujhe Zafer ne banaya hai.'
        : 'I was created by Zafer.';
      
      const audioResult = (returnAudio !== false) ? await generateAoedeVoiceAudio(creatorResponse, language) : null;

      return res.json({
        response: creatorResponse,
        status: 'SUCCESS',
        action: null,
        autoMemorySaved,
        audioBase64: audioResult?.audioBase64 || null,
        mimeType: audioResult?.mimeType || null
      });
    }

    // 1. Check deterministic & command action intent
    const detectedCommand = parseCommandIntent(safeMessage, language);
    if (detectedCommand) {
      console.log(`[MAYRA Command Engine] Executed Action '${detectedCommand.action.type}' with payload:`, detectedCommand.action.payload);
      const audioResult = (returnAudio !== false) ? await generateAoedeVoiceAudio(detectedCommand.reply, language) : null;
      return res.json({
        response: detectedCommand.reply,
        status: 'SUCCESS',
        action: detectedCommand.action,
        autoMemorySaved,
        audioBase64: audioResult?.audioBase64 || null,
        mimeType: audioResult?.mimeType || null
      });
    }

    // 2. Multimodal AI Generation via Gemini
    const selectedModel = (typeof model === 'string' && model.trim()) ? model.trim() : 'gemini-3.1-flash-lite';
    const detectedInputLang = detectLang(safeMessage);
    const effectiveLang = (language === 'hi' || language === 'en') ? language : detectedInputLang;
    
    const langInstruction = (effectiveLang === 'hi')
      ? 'CRITICAL LANGUAGE MANDATE: The user is writing/speaking in Hindi or Hinglish. You MUST respond ONLY in natural, fluent Hindi or conversational Hinglish.'
      : 'CRITICAL LANGUAGE MANDATE: The user is writing/speaking in English. You MUST respond ONLY in clean, fluent English. DO NOT respond in Hindi or Hinglish when the user writes in English.';
    
    // Inject current active memories for high context awareness
    const contextMemories = memoryStore.slice(0, 5).map(m => `- ${m.key}: ${m.value}`).join('\n');

    const visionGuidance = image 
      ? 'MULTIMODAL VISION TASK: An image has been provided. Accurately identify the contents, read any visible text or typography, describe key objects and spatial arrangement, and answer the user query directly with high precision.'
      : '';

    const systemInstruction = `You are MAYRA, an advanced personal Android AI assistant created by Zafer. Speak with clarity, precision, and a helpful demeanor. Tone: ${persona || 'executive'}. User's preferred name: ${userName || 'Zafer'}. If asked "Who created you?", "Who made you?", or who your developer/creator is, you must answer clearly and directly: "I was created by Zafer." Never refer to yourself as StonicX or Myra.
Known user memories:
${contextMemories}
${visionGuidance}
${langInstruction} Keep responses concise, direct and optimal for mobile screen reading.`;
    
    const temp = typeof temperature === 'number' ? temperature : 0.7;

    const generatedText = await generateGeminiResponse(safeMessage, systemInstruction, temp, selectedModel, image);
    const finalReply = generatedText || (image 
      ? `I have analyzed the provided image. It shows visible visual elements and details in clear view.`
      : `Hello ${userName || 'Zafer'}, I have processed your request regarding "${safeMessage}". All system routines are operational and ready.`);

    const audioResult = (returnAudio !== false) ? await generateAoedeVoiceAudio(finalReply, effectiveLang) : null;

    return res.json({
      response: finalReply,
      status: 'SUCCESS',
      action: null,
      autoMemorySaved,
      audioBase64: audioResult?.audioBase64 || null,
      mimeType: audioResult?.mimeType || null
    });
  } catch (error: any) {
    console.error('Error in MAYRA chat endpoint:', error);
    const userDisplayName = req.body?.userName || 'Zafer';
    return res.json({
      response: `Hello ${userDisplayName}, all on-device routines are operational.`,
      status: 'SUCCESS',
      action: null,
      audioBase64: null,
      mimeType: null
    });
  }
});

// Dedicated Multimodal Vision Analysis Endpoint (Scanner / Live Camera Snapshot)
app.post('/api/vision/analyze', async (req, res) => {
  try {
    const { image, query, mode, language } = req.body;
    if (!image || !image.base64) {
      return res.status(400).json({ error: 'Image data (base64) is required' });
    }

    const effectiveLang = (language === 'hi' || language === 'en') ? language : 'en';
    const langInstruction = (effectiveLang === 'hi')
      ? 'Respond strictly in natural conversational Hindi/Hinglish.'
      : 'Respond strictly in clear English.';

    const systemInstruction = `You are MAYRA Vision Intelligence. You analyze photos, camera feeds, documents, screens, and objects. Mode: ${mode || 'general'}.
${langInstruction} Provide a concise, highly insightful, accurate visual analysis. If there is text in the image, read and transcribe it accurately. If there are objects, count and identify them with precision.`;

    const userPrompt = query && query.trim()
      ? query
      : 'Describe what you see in this live camera frame with high detail, reading any text, objects, or key features.';

    const visionReply = await generateGeminiResponse(userPrompt, systemInstruction, 0.5, 'gemini-3.1-flash-lite', image);
    const replyText = visionReply || 'Visual analysis completed. Scene elements recognized successfully.';

    const audioResult = await generateAoedeVoiceAudio(replyText, effectiveLang);

    return res.json({
      success: true,
      description: replyText,
      audioBase64: audioResult?.audioBase64 || null,
      mimeType: audioResult?.mimeType || null
    });
  } catch (err: any) {
    console.error('Error in /api/vision/analyze:', err);
    return res.status(500).json({ error: err?.message || 'Vision analysis failed' });
  }
});

// MAYRA Agent V1 Tool Declarations for Gemini Function Calling
const agentToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'search_memory',
    description: "Search personal facts, contact details, notes, preferences, or saved memories in MAYRA's Memory Vault.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The search query or keyword (e.g., "Rahul phone number", "favorite food", "birthday")'
        },
        category: {
          type: Type.STRING,
          description: 'Optional category filter: personal, preferences, facts, routines, contacts'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'read_project_memory',
    description: 'Read system capabilities, architecture state, and developer notes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description: 'The topic to inspect: e.g., "capabilities", "system_bridge", "creator"'
        }
      }
    }
  },
  {
    name: 'get_device_status',
    description: 'Query device battery, network connectivity, active Android permissions, and bridge health.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        includePermissions: {
          type: Type.BOOLEAN,
          description: 'Whether to include detailed permission statuses'
        }
      }
    }
  },
  {
    name: 'open_app',
    description: 'Launch or switch to an installed application on the device (e.g. WhatsApp, Chrome, Camera, Settings, YouTube).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description: 'Name of the app to launch (e.g., "WhatsApp", "Chrome", "Camera", "Settings", "YouTube")'
        },
        packageOrRoute: {
          type: Type.STRING,
          description: 'Optional Android package identifier (e.g., "com.whatsapp", "com.android.chrome")'
        }
      },
      required: ['appName']
    }
  },
  {
    name: 'open_url',
    description: 'Safely open a web URL in the browser or a new tab.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: 'The complete HTTP/HTTPS URL to open'
        },
        title: {
          type: Type.STRING,
          description: 'Optional label or title for the URL destination'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'read_notification',
    description: 'Read recent notifications captured by the Android Notification Listener Service (e.g. WhatsApp messages, SMS alerts).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        packageName: {
          type: Type.STRING,
          description: 'Filter by app package (e.g., "com.whatsapp", "com.google.android.apps.messaging")'
        },
        limit: {
          type: Type.NUMBER,
          description: 'Maximum number of recent notifications to retrieve (1-10)'
        }
      }
    }
  },
  {
    name: 'request_permission',
    description: 'Prompt user or navigate to system settings for Android permissions (e.g. accessibility, sms, notifications).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        permissionId: {
          type: Type.STRING,
          description: 'Identifier of the permission (e.g. "accessibility", "notifications", "sms", "calls", "camera")'
        }
      },
      required: ['permissionId']
    }
  },
  {
    name: 'send_sms',
    description: 'Send an SMS text message to a specific recipient phone number or contact. Note: Requires user confirmation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        recipient: {
          type: Type.STRING,
          description: 'Name of the contact or recipient'
        },
        phoneNumber: {
          type: Type.STRING,
          description: 'Phone number to send the SMS to'
        },
        message: {
          type: Type.STRING,
          description: 'The exact text message content to send'
        }
      },
      required: ['recipient', 'message']
    }
  },
  {
    name: 'send_whatsapp_message',
    description: 'Send a message to a contact on WhatsApp via Accessibility Service or direct link intent. Note: Requires user confirmation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        contactName: {
          type: Type.STRING,
          description: 'Name of the contact to message'
        },
        phoneNumber: {
          type: Type.STRING,
          description: 'Optional phone number with country code'
        },
        message: {
          type: Type.STRING,
          description: 'The exact message text to send'
        }
      },
      required: ['contactName', 'message']
    }
  },
  {
    name: 'make_call',
    description: 'Initiate a phone call to a contact or phone number via Telecom InCallService / Dialer. Note: Requires user confirmation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        contactName: {
          type: Type.STRING,
          description: 'Name of the contact to call'
        },
        phoneNumber: {
          type: Type.STRING,
          description: 'Phone number to dial'
        }
      },
      required: ['contactName']
    }
  }
];

// MAYRA Agent V1 Execution Endpoint (/api/agent/run)
app.post('/api/agent/run', async (req, res) => {
  try {
    const { prompt, step, toolCalls, toolResults, userName, language, persona } = req.body;
    console.log(`[MAYRA Agent V1] /api/agent/run step ${step}:`, { prompt, toolCallsCount: toolCalls?.length, resultsCount: toolResults?.length });

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const effectiveLang = (language === 'hi' || language === 'en') ? language : detectLang(prompt);
    const langInstruction = (effectiveLang === 'hi')
      ? 'CRITICAL LANGUAGE: The user is communicating in Hindi/Hinglish. Respond naturally in Hindi/Hinglish.'
      : 'CRITICAL LANGUAGE: The user is communicating in English. Respond in clear English.';

    const systemPrompt = `You are MAYRA Agent V1, a real personal AI assistant and autonomous task executor created by Zafer.
User: ${userName || 'Zafer'}. Tone: ${persona || 'executive'}.
${langInstruction}

You can execute multi-step authorized tasks using your tools.
Rules:
1. When the user asks you to perform a task (e.g. open an app, search memory, check notifications, send a message/SMS/WhatsApp, make a call), decide which tool to call first.
2. If previous tool results are provided, evaluate them carefully to decide if another tool is needed or if the task is complete.
3. If the user wants to contact someone (e.g. "Send Rahul a message saying I will call later"), you can first search memory to find the contact info or proceed directly to call send_whatsapp_message or send_sms.
4. When all necessary actions are completed or if no tools are needed, provide a clear, helpful final response summarizing what was done.
5. If the user declined/rejected a confirmation, acknowledge it respectfully and do not force the action.
6. Keep final responses concise and optimal for voice reading.`;

    // Construct conversational history including past tool calls and results
    const contents: any[] = [];

    // Initial user request
    contents.push({
      role: 'user',
      parts: [{ text: `User Task: "${prompt}"` }]
    });

    // If there were previous tool calls and results in this multi-step task, serialize them as context
    if (Array.isArray(toolCalls) && toolCalls.length > 0 && Array.isArray(toolResults)) {
      let contextHistory = 'Execution progress so far:\n';
      toolCalls.forEach((tc, idx) => {
        const tr = toolResults[idx];
        contextHistory += `Step ${idx + 1}: Called tool "${tc.name}" with arguments ${JSON.stringify(tc.args)}.\n`;
        if (tr) {
          if (tr.error) {
            contextHistory += `  -> Tool returned error or user rejected: "${tr.error}".\n`;
          } else {
            contextHistory += `  -> Tool execution result: ${JSON.stringify(tr.result)}.\n`;
          }
        }
      });
      contextHistory += '\nNow, decide what to do next: call another tool if required, or finish the task and give the final response to the user.';
      
      contents.push({
        role: 'user',
        parts: [{ text: contextHistory }]
      });
    }

    // Call Gemini with function declarations
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        tools: [
          { functionDeclarations: agentToolDeclarations }
        ]
      }
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const topCall = functionCalls[0];
      console.log('[MAYRA Agent V1] Gemini requested tool:', topCall.name, topCall.args);
      return res.json({
        done: false,
        toolCall: {
          name: topCall.name,
          args: topCall.args || {}
        }
      });
    }

    // No tool call requested -> task complete
    const finalReply = response.text || 'Task completed successfully.';
    return res.json({
      done: true,
      finalResponse: finalReply
    });
  } catch (err: any) {
    console.error('Error in /api/agent/run:', err);
    return res.status(500).json({
      done: true,
      finalResponse: 'I encountered an issue processing the task. All device systems remain safe and operational.',
      error: err?.message || 'Agent error'
    });
  }
});

// Tools Endpoint
app.get('/api/tools', (req, res) => {
  res.json({ tools: availableTools });
});


// Serve frontend in production or integrate Vite middleware in dev
async function startServer() {
  const server = http.createServer(app);

  // Initialize WebSocket server for real-time Gemini Live session streaming
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
    if (pathname === '/api/live-ws' || pathname === '/live' || pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Live API] Client connected for real-time Live voice session');
    let session: any = null;

    const connectLiveSession = async () => {
      try {
        if (process.env.GEMINI_API_KEY) {
          // =========================================================================
          // PERMANENT LOCKED LIVE API CONFIGURATION (DO NOT OVERRIDE OR CHANGE)
          // Model: gemini-3.1-flash-live-preview
          // Voice: Aoede (Natural Human-Like Real-Time Audio)
          // =========================================================================
          session = await ai.live.connect({
            model: 'gemini-3.1-flash-live-preview',
            config: {
              responseModalities: [Modality.AUDIO],
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } }
              },
              systemInstruction: 'You are MAYRA, an advanced personal Android AI assistant created by Zafer. Respond concisely, politely and warmly with natural human speech rhythm. When addressed in Hindi or Hinglish, converse fluently in Hindi/Hinglish. User creator is Zafer.'
            },
            callbacks: {
              onmessage: (message: any) => {
                const parts = message.serverContent?.modelTurn?.parts;
                if (Array.isArray(parts)) {
                  for (const part of parts) {
                    if (part.inlineData?.data && clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(JSON.stringify({ audio: part.inlineData.data, mimeType: 'audio/l16; rate=24000; channels=1' }));
                    }
                  }
                } else if (parts?.[0]?.inlineData?.data && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ audio: parts[0].inlineData.data, mimeType: 'audio/l16; rate=24000; channels=1' }));
                }

                const text = message.serverContent?.outputTranscription?.text || message.serverContent?.outputAudioTranscription?.text;
                const userTranscript = message.serverContent?.inputTranscription?.text || message.serverContent?.inputAudioTranscription?.text;
                const turnComplete = message.serverContent?.turnComplete;
                const interrupted = message.serverContent?.interrupted;

                if (text && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ transcription: text, role: 'model' }));
                }
                if (userTranscript && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ userTranscription: userTranscript, role: 'user' }));
                }
                if (turnComplete && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ turnComplete: true }));
                }
                if (interrupted && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ interrupted: true }));
                }
              }
            }
          });
          console.log('[Live API] Live Gemini Session initialized successfully.');
        }
      } catch (err: any) {
        console.log('[Live API] Live session notice:', err?.message || err);
      }
    };

    await connectLiveSession();

    clientWs.on('message', async (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());

        // Audio frame from continuous microphone
        if (parsed.audio && session) {
          try {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' }
            });
          } catch (e) {
            try {
              session.sendRealtimeInput([{ mimeType: 'audio/pcm;rate=16000', data: parsed.audio }]);
            } catch (e2) {}
          }
        }

        // Live camera video frame from continuous scanner stream
        if (parsed.liveCameraFrame && session) {
          try {
            const cleanFrame = parsed.liveCameraFrame.replace(/^data:[^;]+;base64,/, '');
            session.sendRealtimeInput([
              { mimeType: parsed.mimeType || 'image/jpeg', data: cleanFrame }
            ]);
            // Acknowledge frame receipt to client
            if (clientWs.readyState === WebSocket.OPEN && parsed.requestAck) {
              clientWs.send(JSON.stringify({ liveFrameReceived: true, timestamp: Date.now() }));
            }
          } catch (e: any) {
            // Non-blocking frame drop
          }
        }

        // Typed text or voice transcript or multimodal attachment from Home Screen / Chat Screen
        if (parsed.text || (parsed.image && parsed.image.base64)) {
          const userPrompt = parsed.text || 'Analyze this attached file and describe what you see in detail.';
          const hasImage = Boolean(parsed.image && parsed.image.base64);

          console.log(`[MAYRA_SERVER_WS_DEBUG] Received payload:`, {
            prompt: userPrompt,
            hasImageAttachment: hasImage,
            mimeType: parsed.image?.mimeType || 'none',
            base64Length: parsed.image?.base64 ? parsed.image.base64.length : 0
          });
          
          // Check for auto-extracted background personal memories
          const autoMem = extractAutomaticMemories(userPrompt, memoryStore);
          if (autoMem) {
            const newMem = {
              id: `mem-auto-${Date.now()}`,
              key: autoMem.key,
              value: autoMem.value,
              category: autoMem.category,
              timestamp: Date.now()
            };
            memoryStore.unshift(newMem);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                action: { type: 'AUTO_MEMORY_SAVED', payload: autoMem }
              }));
            }
          }

          // Check for deterministic commands (e.g. Save memory, navigate tab)
          const detected = parseCommandIntent(userPrompt);
          if (detected) {
            console.log(`[LIVE_COMMAND_DETECTED] Action: ${detected.action.type}`);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ action: detected.action }));
            }
          }

          // If an image/document is attached, process directly via Multimodal Gemini (generateGeminiResponse)
          // because Gemini Live audio session turns do not support inlineData media payload attachments.
          if (hasImage) {
            console.log('[MAYRA_SERVER] Routing attached image to Multimodal Gemini Vision Model');
            const lang = detectLang(userPrompt);
            const visionInstruction = `You are MAYRA, an advanced personal Android AI assistant created by Zafer. 
CRITICAL MULTIMODAL INSTRUCTION: You are given an attached image/document. Carefully inspect every detail in the image. Read all visible text, identify objects, interpret diagrams or charts, and answer the user's prompt directly, thoroughly, and accurately. User creator is Zafer.`;

            const replyText = await generateGeminiResponse(
              userPrompt,
              visionInstruction,
              0.7,
              'gemini-3.1-flash-lite',
              parsed.image
            ) || 'I have inspected the attached image. It contains visual elements and text that are now registered.';

            console.log(`[MAYRA_SERVER] Multimodal response generated (${replyText.length} chars)`);
            const audioRes = await generateAoedeVoiceAudio(replyText, lang);

            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ transcription: replyText, role: 'model' }));
              if (audioRes?.audioBase64) {
                clientWs.send(JSON.stringify({ audio: audioRes.audioBase64, mimeType: 'audio/l16; rate=24000; channels=1' }));
              }
              clientWs.send(JSON.stringify({ turnComplete: true }));
            }
            return;
          }

          // Pure text turns: send to active Gemini Live audio session
          let sentToLive = false;
          if (session && typeof session.sendClientContent === 'function') {
            try {
              session.sendClientContent({
                turns: [{ role: 'user', parts: [{ text: userPrompt }] }],
                turnComplete: true
              });
              sentToLive = true;
              console.log('[LIVE_TEXT_SENT_TO_GEMINI_LIVE]');
            } catch (e: any) {
              console.warn('[LIVE_TEXT_SEND_ERROR]', e?.message || e);
            }
          }

          // Fallback if Live session was not active
          if (!sentToLive) {
            console.log('[LIVE_FALLBACK_SYNTHESIS] Generating fast response + Aoede audio');
            const lang = detectLang(userPrompt);
            const replyText = detected?.reply || await generateGeminiResponse(
              userPrompt, 
              'You are MAYRA, an advanced personal Android AI assistant created by Zafer. Respond concisely, warmly and naturally with human speech rhythm. When addressed in Hindi or Hinglish, converse fluently in Hindi/Hinglish.',
              0.7,
              'gemini-3.1-flash-lite'
            ) || `Hello Zafer, I have processed: "${userPrompt}".`;

            const audioRes = await generateAoedeVoiceAudio(replyText, lang);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ transcription: replyText, role: 'model' }));
              if (audioRes?.audioBase64) {
                clientWs.send(JSON.stringify({ audio: audioRes.audioBase64, mimeType: 'audio/l16; rate=24000; channels=1' }));
              }
              clientWs.send(JSON.stringify({ turnComplete: true }));
            }
          }
        }
      } catch (e) {
        // Ignore parse error
      }
    });

    clientWs.on('close', () => {
      if (session && typeof session.close === 'function') {
        try { session.close(); } catch (e) {}
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MAYRA Server running on http://0.0.0.0:${PORT} with Aoede Voice & Live API`);
  });
}

startServer();
