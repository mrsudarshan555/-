import { useState, useRef, useCallback } from 'react';
import { AssistantStatus } from '../types';

interface UseMayraWakeWordProps {
  onWakeWordDetected?: (transcript?: string) => void;
  onSpeechCaptured?: (transcript: string) => void;
  status: AssistantStatus;
  isListeningMode?: boolean;
  enabled?: boolean;
}

/**
 * useMayraWakeWord:
 * Web Speech API (webkitSpeechRecognition) has been REMOVED from the main voice path.
 * Continuous microphone conversation is now handled via raw 16kHz PCM streaming to /api/live-ws.
 */
export function useMayraWakeWord({
  onWakeWordDetected,
  onSpeechCaptured,
  status,
  isListeningMode = false,
  enabled = true
}: UseMayraWakeWordProps) {
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const [lastDetectedPhrase, setLastDetectedPhrase] = useState<string | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(true);

  const stopListening = useCallback(() => {
    setIsListeningForWakeWord(false);
  }, []);

  const startListening = useCallback(async () => {
    setIsListeningForWakeWord(false);
  }, []);

  return {
    isListeningForWakeWord,
    lastDetectedPhrase,
    hasMicrophonePermission,
    startListening,
    stopListening
  };
}
