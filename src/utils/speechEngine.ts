/**
 * MAYRA Voice & Live Audio Speech Engine
 * Powered by Pure Gemini Aoede Natural Voice Synthesis & Web Audio API (24kHz PCM).
 * Includes robust AudioContext lifecycle management, echo cancellation & feedback prevention,
 * and media stream cleanup.
 */

const LANGUAGE_STORAGE_KEY = 'mayra_preferred_language';

export type MayraLanguage = 'en' | 'hi';

let outputAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
const audioResponseCache = new Map<string, string>();

/**
 * Standard Hardware Echo Cancellation & Noise Suppression Constraints
 * Explicitly prevents acoustic feedback loops and squealing.
 */
export const MICROPHONE_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: false
};

// Global registry of active microphone streams for clean session tear-down
let activeMicStream: MediaStream | null = null;

// Audio Analyser node for live speech/mic waveform visualization
let globalAudioAnalyser: AnalyserNode | null = null;

export function getSpeechAudioAnalyser(): AnalyserNode | null {
  return globalAudioAnalyser;
}

// Microphone capture state
let micAudioContext: AudioContext | null = null;
let micSourceNode: MediaStreamAudioSourceNode | null = null;
let micScriptProcessor: ScriptProcessorNode | null = null;
let micSilentGain: GainNode | null = null;
let isMicCapturing = false;

// Streaming playback state
let nextSchedulePlayTime = 0;
const activeSourceNodes = new Set<AudioBufferSourceNode>();
let activePlaybackCount = 0;

function resampleAndConvertTo16BitPCM(input: Float32Array, inputSampleRate: number, targetSampleRate: number = 16000): ArrayBuffer {
  if (inputSampleRate === targetSampleRate) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
  }

  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(input.length / ratio);
  const output = new Int16Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(input.length - 1, Math.ceil(srcIndex));
    const interpolation = srcIndex - srcIndexFloor;
    const sample = input[srcIndexFloor] + (input[srcIndexCeil] - input[srcIndexFloor]) * interpolation;
    const s = Math.max(-1, Math.min(1, sample));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Starts continuous 16kHz raw PCM microphone capture (Old APK Mx.initializeMicrophone architecture)
 */
export async function startPcm16kCapture(onPcmChunk: (base64Pcm: string) => void): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }

  stopPcm16kCapture();

  try {
    const stream = await acquireMicrophoneStream();
    if (!stream) return false;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    micAudioContext = new AudioContextClass({ sampleRate: 16000 });
    if (micAudioContext.state === 'suspended') {
      await micAudioContext.resume();
    }

    micSourceNode = micAudioContext.createMediaStreamSource(stream);
    
    // Create AnalyserNode for audio visualization
    try {
      globalAudioAnalyser = micAudioContext.createAnalyser();
      globalAudioAnalyser.fftSize = 64;
      globalAudioAnalyser.smoothingTimeConstant = 0.8;
      micSourceNode.connect(globalAudioAnalyser);
    } catch (e) {}

    // Buffer size 2048 samples (~128ms @ 16kHz)
    micScriptProcessor = micAudioContext.createScriptProcessor(2048, 1, 1);

    micScriptProcessor.onaudioprocess = (e) => {
      if (!isMicCapturing) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBuffer = resampleAndConvertTo16BitPCM(inputData, micAudioContext?.sampleRate || 16000, 16000);
      const base64Pcm = arrayBufferToBase64(pcmBuffer);
      onPcmChunk(base64Pcm);
    };

    micSilentGain = micAudioContext.createGain();
    micSilentGain.gain.value = 0; // Completely silent so microphone is not echoed to speaker

    micSourceNode.connect(micScriptProcessor);
    micScriptProcessor.connect(micSilentGain);
    micSilentGain.connect(micAudioContext.destination);

    isMicCapturing = true;
    console.log('[MAYRA Pipeline] PCM_16K_CAPTURE: STARTED (Continuous Old APK Voice Engine)');
    return true;
  } catch (err) {
    console.warn('[MAYRA Pipeline] PCM_16K_CAPTURE_ERROR:', err);
    stopPcm16kCapture();
    return false;
  }
}

/**
 * Stops continuous 16kHz PCM microphone capture cleanly
 */
export function stopPcm16kCapture(): void {
  isMicCapturing = false;
  if (micScriptProcessor) {
    try {
      micScriptProcessor.disconnect();
      micScriptProcessor.onaudioprocess = null;
    } catch (e) {}
    micScriptProcessor = null;
  }
  if (micSourceNode) {
    try { micSourceNode.disconnect(); } catch (e) {}
    micSourceNode = null;
  }
  if (micSilentGain) {
    try { micSilentGain.disconnect(); } catch (e) {}
    micSilentGain = null;
  }
  if (micAudioContext) {
    try {
      if (micAudioContext.state !== 'closed') {
        micAudioContext.close();
      }
    } catch (e) {}
    micAudioContext = null;
  }
  cleanupAudioStreams();
  console.log('[MAYRA Pipeline] PCM_16K_CAPTURE: STOPPED');
}

/**
 * Schedules 24kHz raw PCM Aoede audio chunk for seamless queued playback
 */
export function schedulePcm24kChunk(
  base64Data: string,
  onStart?: () => void,
  onEnded?: () => void
): boolean {
  if (typeof window === 'undefined' || !base64Data) return false;

  try {
    const audioCtx = getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    if (int16Array.length === 0) return false;

    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    console.log('[AUDIO_CONTEXT_STATE] AudioContext state:', audioCtx.state);
    console.log('[AUDIO_CHUNK_DECODED] Samples:', float32Array.length, 'Duration:', (float32Array.length / 24000).toFixed(3), 's');

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;

    // Connect to global analyser for speech waveform animation
    try {
      if (!globalAudioAnalyser || globalAudioAnalyser.context !== audioCtx) {
        globalAudioAnalyser = audioCtx.createAnalyser();
        globalAudioAnalyser.fftSize = 64;
        globalAudioAnalyser.smoothingTimeConstant = 0.8;
      }
      source.connect(globalAudioAnalyser);
    } catch (e) {}

    source.connect(audioCtx.destination);

    const currentTime = audioCtx.currentTime;
    const startTime = Math.max(currentTime + 0.02, nextSchedulePlayTime);
    nextSchedulePlayTime = startTime + audioBuffer.duration;

    console.log('[AUDIO_CHUNK_SCHEDULED] Scheduled at:', startTime.toFixed(3), 'Duration:', audioBuffer.duration.toFixed(3), 's');

    activeSourceNodes.add(source);
    activePlaybackCount++;

    if (onStart && activePlaybackCount === 1) {
      console.log('[AUDIO_PLAYBACK_START] Continuous 24kHz Aoede Voice Playing');
      onStart();
    }

    source.onended = () => {
      activeSourceNodes.delete(source);
      activePlaybackCount = Math.max(0, activePlaybackCount - 1);
      if (activePlaybackCount === 0) {
        nextSchedulePlayTime = 0;
        console.log('[AUDIO_PLAYBACK_END] All queued 24kHz Aoede Voice Playback Completed');
        if (onEnded) onEnded();
      }
    };

    source.start(startTime);
    return true;
  } catch (err) {
    console.warn('[Voice Engine] schedulePcm24kChunk error:', err);
    return false;
  }
}

/**
 * Cleanly flushes all queued 24kHz audio chunks and resets the schedule timeline
 */
export function flushQueuedAudio(): void {
  activeSourceNodes.forEach((source) => {
    try {
      source.stop();
      source.disconnect();
    } catch (e) {}
  });
  activeSourceNodes.clear();
  activePlaybackCount = 0;
  nextSchedulePlayTime = 0;
  stopCurrentSpeech();
}

/**
 * Play a standalone 24kHz raw PCM float buffer audio block directly (e.g. from /api/voice/speak or /api/chat)
 */
export function playPcmAudio(
  base64Data: string,
  onStart?: () => void,
  onEnded?: () => void
): boolean {
  flushQueuedAudio();
  return schedulePcm24kChunk(base64Data, onStart, onEnded);
}

/**
 * Checks if voice audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return activePlaybackCount > 0 || currentSourceNode !== null;
}

/**
 * Clean up existing audio streams and tracks before starting a new recording session
 */
export function cleanupAudioStreams(stream?: MediaStream | null): void {
  const target = stream || activeMicStream;
  if (target) {
    try {
      target.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // Ignore track stop errors
        }
      });
    } catch (e) {
      // Ignore
    }
  }
  if (!stream && activeMicStream) {
    activeMicStream = null;
  }
}

/**
 * Safely requests a microphone stream with echo cancellation and stores it for tracking
 */
export async function acquireMicrophoneStream(): Promise<MediaStream | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    console.warn('[MAYRA Pipeline] GET_USER_MEDIA: NOT_SUPPORTED');
    return null;
  }

  // Clean up any stale streams first
  cleanupAudioStreams();

  try {
    console.log('[MAYRA Pipeline] GET_USER_MEDIA: REQUESTING');
    const stream = await navigator.mediaDevices.getUserMedia(MICROPHONE_CONSTRAINTS);
    activeMicStream = stream;
    const audioTracks = stream.getAudioTracks();
    const isActive = audioTracks.length > 0 && audioTracks[0].readyState === 'live';
    console.log('[MAYRA Pipeline] STREAM_ACTIVE:', isActive ? 'ACTIVE' : 'INACTIVE', {
      trackCount: audioTracks.length,
      label: audioTracks[0]?.label || 'Default Mic'
    });
    return stream;
  } catch (err) {
    console.warn('[MAYRA Pipeline] GET_USER_MEDIA_ERROR:', err);
    return null;
  }
}

/**
 * Safe singleton AudioContext accessor.
 * Prevents rapid re-initialization loops and buffer overflows.
 */
export function getAudioContext(): AudioContext {
  if (!outputAudioContext || outputAudioContext.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
  }
  return outputAudioContext;
}

let lastActivationPlayTimestamp = 0;

/**
 * Plays the Custom Microphone Activation Sound
 * - Attached EXCLUSIVELY to explicit user UI mic button tap (triggerVoice)
 * - Never triggered by recognition.onend, automatic restart, silence timeout, or VAD
 * - Strict timestamp debouncing guarantees exactly ONE playback per real user action
 */
export function playCustomActivationSound(): boolean {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  if (now - lastActivationPlayTimestamp < 600) {
    return false; // Debounced
  }
  lastActivationPlayTimestamp = now;

  try {
    const audioCtx = getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const t0 = audioCtx.currentTime;
    
    // Tone 1: Subtle warm digital transient (587.33 Hz - D5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, t0);
    osc1.frequency.exponentialRampToValueAtTime(783.99, t0 + 0.06);

    gain1.gain.setValueAtTime(0.001, t0);
    gain1.gain.linearRampToValueAtTime(0.18, t0 + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(t0);
    osc1.stop(t0 + 0.085);

    // Tone 2: Crisp harmonic chime resolution (880 Hz - A5 to 1046.5 Hz - C6)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, t0 + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1046.5, t0 + 0.12);

    gain2.gain.setValueAtTime(0.001, t0 + 0.05);
    gain2.gain.linearRampToValueAtTime(0.22, t0 + 0.065);
    gain2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(t0 + 0.05);
    osc2.stop(t0 + 0.23);

    console.log('[MAYRA Pipeline] ACTIVATION_SOUND: PLAYED_CUSTOM_SOUND (User Physical Mic Click)');
    return true;
  } catch (e) {
    console.warn('[MAYRA Pipeline] ACTIVATION_SOUND_ERROR:', e);
    return false;
  }
}

/**
 * Prewarms AudioContext on user gesture without throwing or rapid loops
 */
export function prewarmAudioEngine(): void {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {
    // Ignore prewarm errors
  }
}

/**
 * Cleanly stops any active speech playback source
 */
export function stopCurrentSpeech(): void {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch (e) {
      // Ignore
    }
    currentSourceNode = null;
  }
}

/**
 * Plays 16-bit PCM little-endian 24kHz audio base64 through Web Audio API
 */
export function playRawPcm24kAudio(
  base64Data: string,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !base64Data) {
    return false;
  }

  try {
    stopCurrentSpeech();
    const audioCtx = getAudioContext();

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert Int16 PCM to Float32 [-1, 1]
    const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    if (int16Array.length === 0) return false;

    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);

    currentSourceNode = source;
    console.log('[MAYRA Pipeline] PLAY_PCM_AUDIO: STARTED (24kHz Raw PCM Aoede Buffer, Samples:', float32Array.length, ')');

    if (onStart) onStart();

    source.onended = () => {
      console.log('[MAYRA Pipeline] PLAY_PCM_AUDIO: COMPLETED');
      if (currentSourceNode === source) {
        currentSourceNode = null;
      }
      if (onEnd) onEnd();
    };

    source.start(0);
    return true;
  } catch (err) {
    console.warn('[Voice Engine] Web Audio PCM playback error:', err);
    return false;
  }
}

export function getSavedLanguage(): MayraLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'hi' || saved === 'en') return saved;
  } catch (e) {
    // Ignore storage errors
  }
  return 'en';
}

export function saveLanguagePreference(lang: MayraLanguage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Detects whether a string is primarily Hindi (Devanagari or Romanized Hinglish) or English
 */
export function detectLanguage(text: string): MayraLanguage {
  if (!text || typeof text !== 'string') return 'en';
  
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(text)) {
    return 'hi';
  }

  const hinglishWords = [
    'namaste', 'kaise', 'kaisi', 'haal', 'kya', 'hai', 'hain', 'ho', 'hoga',
    'batao', 'karo', 'shukriya', 'dhanyawad', 'dhanyavaad', 'aap', 'tum', 'mera',
    'meri', 'mere', 'accha', 'theek', 'bolo', 'sunao', 'kuch', 'kaam', 'madad',
    'chahiye', 'kaun', 'kahan', 'kab', 'kyun', 'nahi', 'haan', 'namaskar'
  ];

  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = lower.split(/\s+/).filter(Boolean);
  
  let hinglishCount = 0;
  for (const w of words) {
    if (hinglishWords.includes(w)) {
      hinglishCount++;
    }
  }

  if (hinglishCount >= 1 && words.length <= 4) {
    return 'hi';
  }
  if (words.length > 0 && hinglishCount / words.length >= 0.25) {
    return 'hi';
  }

  return 'en';
}

/**
 * Generates dynamic greeting according to user language preference
 */
export function getDynamicGreeting(name: string = 'Zafer', lang: MayraLanguage = 'en'): string {
  if (lang === 'hi') {
    return `Hii ${name}, kaise hain aap? Aaj hum kya karein?`;
  }
  return `Hi ${name}, how are you? What should we do today?`;
}

/**
 * Strips formatting, markdown, and meta headers from text before speaking aloud
 */
export function sanitizeTextForSpeech(text: string): string {
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/[*#_~`]/g, '')
    .replace(/https?:\/\/\S+/g, 'link')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Speaks text using Direct Gemini Aoede Voice API (24kHz PCM)
 * Pure direct audio pipeline without any browser speech synthesis fallback.
 */
export async function speakText(
  text: string, 
  lang: MayraLanguage = 'en',
  onStart?: () => void,
  onEnd?: () => void,
  audioBase64Payload?: string | null
): Promise<void> {
  const cleanText = sanitizeTextForSpeech(text);
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  // 1. If audio base64 is already provided in the response payload, play directly
  if (audioBase64Payload) {
    audioResponseCache.set(`${lang}:${cleanText}`, audioBase64Payload);
    const success = playRawPcm24kAudio(audioBase64Payload, onStart, onEnd);
    if (success) return;
  }

  // 2. Check local audio response cache for zero network latency
  const cacheKey = `${lang}:${cleanText}`;
  if (audioResponseCache.has(cacheKey)) {
    const cachedAudio = audioResponseCache.get(cacheKey)!;
    const played = playRawPcm24kAudio(cachedAudio, onStart, onEnd);
    if (played) return;
  }

  // 3. Attempt direct natural Gemini Aoede Voice from backend
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('/api/voice/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, language: lang }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        audioResponseCache.set(cacheKey, data.audioBase64);
        const played = playRawPcm24kAudio(data.audioBase64, onStart, onEnd);
        if (played) return;
      }
    }
  } catch (err) {
    // Network or timeout notice
  }

  // Pure direct pipeline: if server audio is not available, do NOT play robotic browser voice.
  if (onEnd) {
    onEnd();
  }
}
