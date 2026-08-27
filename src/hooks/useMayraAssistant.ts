import { useState, useCallback, useEffect, useRef } from 'react';
import { AssistantStatus, ChatMessage, UserPersonalConfig, AssistantConfig, AppAction, MemoryItem, AgentTaskContext } from '../types';
import { 
  getSavedLanguage, 
  saveLanguagePreference, 
  detectLanguage, 
  getDynamicGreeting, 
  speakText, 
  prewarmAudioEngine,
  playCustomActivationSound,
  stopCurrentSpeech,
  startPcm16kCapture,
  stopPcm16kCapture,
  schedulePcm24kChunk,
  flushQueuedAudio,
  getAudioContext,
  MayraLanguage 
} from '../utils/speechEngine';
import { MayraSystemBridge } from '../services/native/MayraSystemIntegrationBridge';
import { MemoryVaultService } from '../services/memory/memoryVaultService';
import { ContinuousConversationEngine } from '../services/voice/continuousConversationEngine';
import { MayraAgentEngine } from '../services/agent/agentEngine';

export interface UseMayraAssistantProps {
  personalConfig: UserPersonalConfig;
  assistantConfig: AssistantConfig;
  memories?: MemoryItem[];
  onExecuteAction?: (action: AppAction) => void;
}

export function useMayraAssistant({ personalConfig, assistantConfig, memories = [], onExecuteAction }: UseMayraAssistantProps) {
  const [status, setStatus] = useState<AssistantStatus>('READY');
  const [isListeningMode, setIsListeningMode] = useState<boolean>(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<MayraLanguage>(() => getSavedLanguage());
  const [activeAgentTask, setActiveAgentTask] = useState<AgentTaskContext | null>(null);
  
  const isListeningModeRef = useRef<boolean>(false);
  isListeningModeRef.current = isListeningMode;

  const wsRef = useRef<WebSocket | null>(null);
  const activeModelMsgIdRef = useRef<string | null>(null);
  const activeUserMsgIdRef = useRef<string | null>(null);

  const continuousEngineRef = useRef<ContinuousConversationEngine | null>(null);
  const agentEngineRef = useRef<MayraAgentEngine | null>(null);

  const userName = personalConfig.preferredName || personalConfig.fullName || 'Zafer';
  const initialGreeting = useRef(getDynamicGreeting(userName, getSavedLanguage())).current;

  // Initialize MayraAgentEngine
  if (!agentEngineRef.current) {
    agentEngineRef.current = new MayraAgentEngine({
      onTaskStatusChange: (taskStatus, context) => {
        setActiveAgentTask({ ...context });
        if (taskStatus === 'PLANNING' || taskStatus === 'EXECUTING') {
          setStatus('THINKING');
        } else if (taskStatus === 'WAITING_CONFIRMATION') {
          setStatus('READY');
        }
      },
      onStepProgress: (_step, _desc, context) => {
        setActiveAgentTask({ ...context });
      },
      onConfirmationRequired: (_conf, context) => {
        setActiveAgentTask({ ...context });
        setStatus('READY');
      },
      onTaskComplete: (finalResponse, context) => {
        setActiveAgentTask({ ...context });
        const assistantMsg: ChatMessage = {
          id: `msg-m-agent-${Date.now()}`,
          sender: 'mayra',
          text: finalResponse,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        speakText(finalResponse, lastSpokenLanguageRef.current, handleSpeechStart, handleSpeechEnd);
        setTimeout(() => {
          setActiveAgentTask((curr) => (curr?.taskId === context.taskId ? null : curr));
        }, 3500);
      },
      onTaskError: (error, context) => {
        setActiveAgentTask({ ...context });
        const assistantMsg: ChatMessage = {
          id: `msg-m-err-${Date.now()}`,
          sender: 'mayra',
          text: `Task could not be completed: ${error}`,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        speakText(`Task could not be completed: ${error}`, lastSpokenLanguageRef.current, handleSpeechStart, handleSpeechEnd);
      }
    });
  }

  const approveAgentAction = useCallback(async () => {
    if (agentEngineRef.current) {
      await agentEngineRef.current.approveConfirmation();
    }
  }, []);

  const rejectAgentAction = useCallback(async () => {
    if (agentEngineRef.current) {
      await agentEngineRef.current.rejectConfirmation();
    }
  }, []);

  const cancelAgentTask = useCallback(() => {
    if (agentEngineRef.current) {
      agentEngineRef.current.cancelActiveTask();
    }
    setActiveAgentTask(null);
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'mayra',
      text: initialGreeting,
      timestamp: Date.now()
    }
  ]);

  const hasGreetedRef = useRef(false);
  const lastUserActivityRef = useRef<number>(Date.now());
  const hasTriggeredIdleCheckinRef = useRef<boolean>(false);
  const lastSpokenLanguageRef = useRef<MayraLanguage>(getSavedLanguage());

  // Unified voice state lifecycle transitions
  const handleSpeechStart = useCallback(() => {
    console.log('[MAYRA Assistant] Natural Voice Playback: STARTED');
    continuousEngineRef.current?.onAssistantSpeakingStart();
    setStatus('SPEAKING');
  }, []);

  const handleSpeechEnd = useCallback(() => {
    console.log('[MAYRA Assistant] Natural Voice Playback: ENDED. Continuous active:', isListeningModeRef.current);
    continuousEngineRef.current?.onAssistantSpeakingEnd();
    if (!isListeningModeRef.current) {
      setStatus('READY');
    }
  }, []);

  // Proactive Silence Check-in: Checks if user has been silent for 85-90 seconds during active session
  useEffect(() => {
    if (assistantConfig.proactiveIdleCheckin === false) return;

    const idleInterval = setInterval(() => {
      const isIdle = Date.now() - lastUserActivityRef.current >= 90000; // 90 seconds
      if (
        isIdle &&
        !hasTriggeredIdleCheckinRef.current &&
        status === 'READY' &&
        !isListeningModeRef.current
      ) {
        hasTriggeredIdleCheckinRef.current = true;
        const currentLang = lastSpokenLanguageRef.current || currentLanguage;
        const checkinPrompt = (currentLang === 'hi')
          ? "Hey, aap itni der se shant ho gaye—sab theek hai na, ya kisi cheez mein madad chahiye?"
          : "Hey, why did you go quiet? Anything I can help with?";

        const checkinMsg: ChatMessage = {
          id: `msg-m-idle-${Date.now()}`,
          sender: 'mayra',
          text: checkinPrompt,
          timestamp: Date.now()
        };

        setMessages((prev) => [...prev, checkinMsg]);
        speakText(
          checkinPrompt,
          currentLang,
          () => setStatus('SPEAKING'),
          () => setStatus(isListeningModeRef.current ? 'LISTENING' : 'READY')
        );
        console.log('[MAYRA Assistant] Proactive silence check-in triggered in language:', currentLang);
      }
    }, 10000);

    return () => clearInterval(idleInterval);
  }, [assistantConfig.proactiveIdleCheckin, status, currentLanguage]);

  // Dynamic natural voice greeting and pre-warming on app launch
  useEffect(() => {
    prewarmAudioEngine();

    const handleFirstTouch = () => {
      prewarmAudioEngine();
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
    window.addEventListener('click', handleFirstTouch, { passive: true });
    window.addEventListener('touchstart', handleFirstTouch, { passive: true });

    if (hasGreetedRef.current) return;
    hasGreetedRef.current = true;

    // Small delay to allow audio context readiness
    const timer = setTimeout(() => {
      setStatus('SPEAKING');
      speakText(
        initialGreeting, 
        currentLanguage,
        handleSpeechStart,
        handleSpeechEnd
      );
    }, 800);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, [initialGreeting, currentLanguage, handleSpeechStart, handleSpeechEnd]);

  // Connects or retrieves the persistent Live WebSocket connection
  const getOrConnectLiveWs = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return wsRef.current;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;
      console.log('[LIVE_WS_STATE] CONNECTING ->', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[LIVE_WS_STATE] OPEN - Connected to persistent Gemini Live session');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 1. Model Audio Chunks (24 kHz Aoede raw PCM)
          if (data.audio) {
            console.log('[LIVE_AUDIO_CHUNK_RECEIVED] Size:', data.audio.length, 'bytes base64');
            schedulePcm24kChunk(
              data.audio,
              handleSpeechStart,
              handleSpeechEnd
            );
          }

          // 2. Model Live Output Transcription
          if (data.transcription) {
            const cleanModelText = typeof data.transcription === 'string'
              ? data.transcription.replace(/^(mayra|assistant|model):\s*/i, '')
              : data.transcription;
            if (cleanModelText) {
              setMessages((prev) => {
                if (activeModelMsgIdRef.current) {
                  const id = activeModelMsgIdRef.current;
                  const existing = prev.find((m) => m.id === id);
                  if (existing) {
                    return prev.map((m) =>
                      m.id === id ? { ...m, text: `${m.text}${cleanModelText}` } : m
                    );
                  }
                }
                const newId = `msg-m-${Date.now()}`;
                activeModelMsgIdRef.current = newId;
                return [
                  ...prev,
                  {
                    id: newId,
                    sender: 'mayra',
                    text: cleanModelText,
                    timestamp: Date.now()
                  }
                ];
              });
            }
          }

          // 3. User Live Input Transcription
          if (data.userTranscription) {
            lastUserActivityRef.current = Date.now();
            hasTriggeredIdleCheckinRef.current = false;
            const cleanUserText = typeof data.userTranscription === 'string'
              ? data.userTranscription.replace(/^(user|you):\s*/i, '').trim()
              : data.userTranscription;
            if (cleanUserText) {
              const detected = detectLanguage(cleanUserText);
              lastSpokenLanguageRef.current = detected;
              setMessages((prev) => {
                if (activeUserMsgIdRef.current) {
                  const id = activeUserMsgIdRef.current;
                  return prev.map((m) => {
                    if (m.id !== id) return m;
                    const currentText = m.text.trim();
                    const updated = currentText
                      ? (cleanUserText.startsWith(currentText) ? cleanUserText : `${currentText} ${cleanUserText}`.trim())
                      : cleanUserText;
                    return { ...m, text: updated };
                  });
                } else {
                  const newId = `msg-u-${Date.now()}`;
                  activeUserMsgIdRef.current = newId;
                  return [
                    ...prev,
                    {
                      id: newId,
                      sender: 'user',
                      text: cleanUserText,
                      timestamp: Date.now()
                    }
                  ];
                }
              });
            }
          }

          // 4. Turn Complete -> Reset active message trackers
          if (data.turnComplete) {
            activeModelMsgIdRef.current = null;
            activeUserMsgIdRef.current = null;
          }

          // 5. Interrupted -> Flush active playback and return to LISTENING
          if (data.interrupted) {
            console.log('[MAYRA Pipeline] LIVE_EVENT: INTERRUPTED (User speaking)');
            flushQueuedAudio();
            setStatus(isListeningModeRef.current ? 'LISTENING' : 'READY');
            activeModelMsgIdRef.current = null;
            activeUserMsgIdRef.current = null;
          }

          // 6. Action Execution (e.g. SAVE_MEMORY, NAVIGATE_TAB, OPEN_SETTINGS)
          if (data.action && onExecuteAction) {
            console.log('[MAYRA Pipeline] LIVE_ACTION_EXECUTED:', data.action.type);
            onExecuteAction(data.action);
          }
        } catch (e) {
          // Ignore JSON parse error
        }
      };

      ws.onerror = (err) => {
        console.warn('[LIVE_WS_STATE] ERROR:', err);
      };

      ws.onclose = () => {
        console.log('[LIVE_WS_STATE] CLOSED');
        wsRef.current = null;
      };

      wsRef.current = ws;
      return ws;
    } catch (err) {
      console.warn('[LIVE_WS_STATE] INIT_ERROR:', err);
      return null;
    }
  }, [onExecuteAction, handleSpeechStart, handleSpeechEnd]);

  // Unified sendGeminiText: Old APK style persistent Gemini Live session text turn
  const sendGeminiText = useCallback(async (textToSend: string, image?: { base64: string; mimeType?: string; name?: string; size?: string }) => {
    const trimmed = textToSend.trim();
    if (!trimmed && !image) return;

    // Reset silence tracker on user active input
    lastUserActivityRef.current = Date.now();
    hasTriggeredIdleCheckinRef.current = false;

    console.log(`[HOME_TEXT_SUBMIT] Typed prompt submitted: "${trimmed}" (hasImage: ${Boolean(image)})`);
    console.log(`[TEXT_SEND_REQUEST] Sending text turn to Live Session`);

    // Ensure AudioContext is running on user gesture
    prewarmAudioEngine();
    const audioCtx = getAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    // VISIBLE DEBUG LOGGING FOR MULTIMODAL ATTACHMENTS
    console.log(`[MAYRA_MULTIMODAL_CLIENT_DEBUG] Pre-flight Check:`, {
      hasImageAttachment: Boolean(image && image.base64),
      attachmentName: image?.name || (image ? 'unnamed' : 'none'),
      mimeType: image?.mimeType || 'none',
      base64Length: image?.base64 ? image.base64.length : 0,
      base64Preview: image?.base64 ? `${image.base64.slice(0, 40)}...` : 'none',
      promptText: trimmed
    });

    // Language adaptation and memory
    const detected = detectLanguage(trimmed);
    lastSpokenLanguageRef.current = detected;
    if (detected !== currentLanguage) {
      setCurrentLanguage(detected);
      saveLanguagePreference(detected);
    }

    // Add user message to UI
    const isDoc = image?.mimeType?.includes('pdf') || 
                  image?.mimeType?.includes('document') || 
                  image?.mimeType?.includes('text') || 
                  image?.mimeType?.includes('csv') || 
                  image?.name?.match(/\.(pdf|txt|csv|json|md|doc|docx)$/i);

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: trimmed || (image ? (isDoc ? `Attached document: ${image.name || 'document'}` : 'Uploaded image') : ''),
      image: image ? { base64: image.base64, mimeType: image.mimeType, name: image.name } : undefined,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setStatus('THINKING');
    activeModelMsgIdRef.current = null;

    const lower = (trimmed || '').toLowerCase();

    // Check if user request is an actionable task or tool execution command
    const isAgentTask = !image && (
      lower.includes('whatsapp') ||
      lower.includes('sms') ||
      lower.startsWith('text ') ||
      lower.includes('send text') ||
      lower.includes('send message') ||
      lower.includes('make a call') ||
      lower.startsWith('call ') ||
      lower.includes('phone lagao') ||
      lower.startsWith('open ') ||
      lower.startsWith('launch ') ||
      lower.includes('battery') ||
      lower.includes('device status') ||
      lower.includes('notification') ||
      lower.includes('search memory') ||
      lower.includes('find in memory') ||
      lower.includes('kholo') ||
      lower.includes('bhejo') ||
      lower.includes('check karo')
    );

    if (isAgentTask && agentEngineRef.current) {
      console.log(`[MAYRA Agent V1] Dispatching user request to Agent Engine: "${trimmed}"`);
      agentEngineRef.current.executeTask(trimmed, {
        userName,
        language: detected,
        persona: assistantConfig.personaTone
      });
      return;
    }

    // Direct Call Answer / Reject Quick Command
    if (lower.includes('answer call') || lower.includes('accept call') || lower === 'answer' || lower === 'accept') {
      const result = await MayraSystemBridge.answerCall();
      const reply = result.success ? "Call answered." : "No active ringing call to answer.";
      const assistantMsg: ChatMessage = {
        id: `msg-m-${Date.now()}`,
        sender: 'mayra',
        text: reply,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      speakText(reply, detected, handleSpeechStart, handleSpeechEnd);
      return;
    }

    if (lower.includes('reject call') || lower.includes('decline call') || lower === 'reject' || lower === 'decline' || lower === 'end call') {
      const result = await MayraSystemBridge.rejectCall();
      const reply = result.success ? "Call declined." : "No active call to decline.";
      const assistantMsg: ChatMessage = {
        id: `msg-m-${Date.now()}`,
        sender: 'mayra',
        text: reply,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      speakText(reply, detected, handleSpeechStart, handleSpeechEnd);
      return;
    }

    // 4. App Launch Command
    const openMatch = trimmed.match(/^(?:open|launch)\s+([a-zA-Z0-9\s]+)$/i);
    if (openMatch && !trimmed.toLowerCase().includes('setting') && !trimmed.toLowerCase().includes('camera')) {
      const targetApp = openMatch[1].trim();
      const result = await MayraSystemBridge.launchApp(targetApp);
      const reply = result.success ? `Opening ${targetApp}.` : `Could not open ${targetApp}.`;
      const assistantMsg: ChatMessage = {
        id: `msg-m-${Date.now()}`,
        sender: 'mayra',
        text: reply,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, assistantMsg]);
      speakText(reply, detected, handleSpeechStart, handleSpeechEnd);
      return;
    }

    // 5. Memory Vault: Analyze for persistent facts with conservative threshold
    if (onExecuteAction && trimmed.length > 8) {
      const extraction = MemoryVaultService.analyzeForMemoryExtraction(trimmed);
      if (extraction.shouldMemorize && extraction.key && extraction.value && extraction.confidence >= 0.85) {
        console.log('[MemoryVault] ✦ Conservative memory extracted:', extraction.key, '->', extraction.value, `(${extraction.reason})`);
        onExecuteAction({
          type: 'AUTO_MEMORY_SAVED',
          payload: {
            key: extraction.key,
            value: extraction.value,
            category: extraction.category || 'personal',
            importance: extraction.importance || 4,
            tags: extraction.tags || ['auto_vault']
          }
        });
      }
    }

    // Connect or reuse existing persistent WebSocket
    const ws = getOrConnectLiveWs();
    console.log(`[LIVE_WS_STATE] ReadyState: ${ws?.readyState}`);

    // Inject relevant memory context for HTTP fallback and live prompts
    const memoryContext = MemoryVaultService.buildPromptContext(memories, trimmed, 4);

    const hasImagePayload = Boolean(image && image.base64);
    console.log(`[MAYRA_CLIENT_SEND_DISPATCH] Dispatching turn:`, {
      channel: (ws && ws.readyState === WebSocket.OPEN) ? 'WebSocket (/api/live-ws)' : 'HTTP (/api/chat)',
      text: trimmed,
      hasMemoryContext: Boolean(memoryContext),
      hasImageAttachment: hasImagePayload,
      mimeType: image?.mimeType || 'none',
      base64Length: image?.base64 ? image.base64.length : 0,
      imageName: image?.name || 'none'
    });

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ text: trimmed, image, contextPrompt: memoryContext }));
      console.log(`[LIVE_TEXT_SENT] Dispatched text & image to /api/live-ws`);
    } else if (ws && ws.readyState === WebSocket.CONNECTING) {
      ws.addEventListener('open', () => {
        try {
          ws.send(JSON.stringify({ text: trimmed, image, contextPrompt: memoryContext }));
          console.log(`[LIVE_TEXT_SENT] Dispatched queued text & image on WebSocket OPEN`);
        } catch (err) {
          console.warn('[LIVE_TEXT_SEND_ERROR]', err);
        }
      }, { once: true });
    } else {
      // Fallback via /api/chat if WebSocket is unavailable
      try {
        console.log('[LIVE_WS_STATE] Fallback to /api/chat');
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            image,
            contextPrompt: memoryContext,
            persona: assistantConfig.personaTone,
            model: personalConfig.geminiModel || 'gemini-3.1-flash-lite',
            temperature: personalConfig.temperature ?? 0.7,
            userName: personalConfig.preferredName || personalConfig.fullName,
            language: detected,
            returnAudio: true
          })
        });
        const data = await res.json();
        if (data.action && onExecuteAction) {
          onExecuteAction(data.action);
        }
        if (data.autoMemorySaved && onExecuteAction) {
          onExecuteAction({
            type: 'AUTO_MEMORY_SAVED',
            payload: data.autoMemorySaved
          });
        }
        const reply = data.response || 'Routine executed.';
        const assistantMsg: ChatMessage = {
          id: `msg-m-${Date.now() + 1}`,
          sender: 'mayra',
          text: reply,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (data.audioBase64) {
          schedulePcm24kChunk(
            data.audioBase64,
            handleSpeechStart,
            handleSpeechEnd
          );
        } else {
          speakText(
            reply,
            detected,
            handleSpeechStart,
            handleSpeechEnd
          );
        }
      } catch (e) {
        console.warn('Fallback error:', e);
        setStatus('READY');
      }
    }
  }, [currentLanguage, assistantConfig, personalConfig, onExecuteAction, getOrConnectLiveWs, handleSpeechStart, handleSpeechEnd, memories]);

  // Initialize Continuous Conversation Engine
  useEffect(() => {
    const engine = new ContinuousConversationEngine({
      onStateChange: (newState) => {
        setStatus(newState);
      },
      onUserTranscript: (transcript, isFinal) => {
        lastUserActivityRef.current = Date.now();
        hasTriggeredIdleCheckinRef.current = false;
        const cleanUserText = transcript.replace(/^(user|you):\s*/i, '').trim();
        if (!cleanUserText) return;

        const detected = detectLanguage(cleanUserText);
        lastSpokenLanguageRef.current = detected;

        setMessages((prev) => {
          if (activeUserMsgIdRef.current) {
            const id = activeUserMsgIdRef.current;
            return prev.map((m) => (m.id === id ? { ...m, text: cleanUserText } : m));
          } else {
            const newId = `msg-u-${Date.now()}`;
            activeUserMsgIdRef.current = newId;
            return [
              ...prev,
              {
                id: newId,
                sender: 'user',
                text: cleanUserText,
                timestamp: Date.now()
              }
            ];
          }
        });
        if (isFinal) {
          activeUserMsgIdRef.current = null;
        }
      },
      onTurnComplete: (completedTranscript) => {
        console.log('[Continuous Conversation] Turn completed:', completedTranscript);
        activeUserMsgIdRef.current = null;
        sendGeminiText(completedTranscript);
      },
      onInterruption: () => {
        console.log('[Continuous Conversation] Barge-in interruption triggered!');
        activeModelMsgIdRef.current = null;
        activeUserMsgIdRef.current = null;
      },
      onError: (err) => {
        console.warn('[Continuous Conversation] Engine notice:', err);
      }
    }, currentLanguage);

    continuousEngineRef.current = engine;

    return () => {
      engine.stopContinuousMode();
    };
  }, [sendGeminiText, currentLanguage]);

  // Main prompt submission for typed chat input (Home Screen / Chat Screen)
  const submitPrompt = useCallback((customText?: string, image?: { base64: string; mimeType?: string }) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend && !image) return;
    sendGeminiText(textToSend, image);
  }, [inputText, sendGeminiText]);

  // Backtalk-Style Continuous Voice Mode Toggle: 1st tap = Continuous ON, 2nd tap = Continuous OFF
  const triggerVoice = useCallback(async () => {
    console.log('[MAYRA Pipeline] MIC_CLICK triggered. Current ListeningMode:', isListeningModeRef.current, 'Status:', status);
    prewarmAudioEngine();

    // If currently speaking, tapping mic acts as instant manual interruption
    if (status === 'SPEAKING') {
      console.log('[MAYRA Pipeline] Assistant speaking -> Manual interruption triggered');
      continuousEngineRef.current?.interruptManually();
      flushQueuedAudio();
      stopCurrentSpeech();
      setStatus('LISTENING');
      return;
    }

    if (isListeningModeRef.current) {
      // Turn Continuous Listening OFF
      setIsListeningMode(false);
      isListeningModeRef.current = false;
      continuousEngineRef.current?.stopContinuousMode();
      stopPcm16kCapture();
      flushQueuedAudio();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
        wsRef.current = null;
      }
      setStatus('READY');
      console.log('[MAYRA Pipeline] CONTINUOUS_VOICE: OFF -> READY');
    } else {
      // Play custom activation sound strictly ONCE on explicit physical user mic click
      playCustomActivationSound();
      // Interrupt any current speech before listening
      flushQueuedAudio();
      // Turn Continuous Listening ON
      setIsListeningMode(true);
      isListeningModeRef.current = true;
      setStatus('LISTENING');
      console.log('[MAYRA Pipeline] CONTINUOUS_VOICE: ON -> LISTENING');

      // Start continuous turn detection & VAD barge-in loop
      await continuousEngineRef.current?.startContinuousMode();

      // Connect WebSocket and start continuous raw 16kHz PCM stream
      const ws = getOrConnectLiveWs();
      const started = await startPcm16kCapture((pcmBase64) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ audio: pcmBase64 }));
        }
      });

      if (!started) {
        console.warn('[MAYRA Pipeline] Could not start PCM capture.');
      }
    }
  }, [getOrConnectLiveWs, status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      continuousEngineRef.current?.stopContinuousMode();
      stopPcm16kCapture();
      flushQueuedAudio();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
        wsRef.current = null;
      }
    };
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    activeModelMsgIdRef.current = null;
    activeUserMsgIdRef.current = null;
  }, []);

  return {
    status,
    setStatus,
    isListeningMode,
    setIsListeningMode,
    inputText,
    setInputText,
    isProcessing,
    messages,
    setMessages,
    submitPrompt,
    triggerVoice,
    clearChat,
    currentLanguage,
    setCurrentLanguage,
    activeAgentTask,
    approveAgentAction,
    rejectAgentAction,
    cancelAgentTask
  };
}
