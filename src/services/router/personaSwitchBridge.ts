/**
 * Persona Switch Bridge for MAYRA <-> STONICX
 * 
 * Manages handshakes, audio cues, cipher glitches, and bidirectional working memory continuity.
 * 
 * CRITICAL CONSTRAINTS:
 * 1. ZERO-TOUCH MODEL GUARANTEE: Does not mutate MAYRA's 3D mesh, shaders, lighting, camera rig, or personality.
 * 2. DUAL-BRAIN ISOLATION: MAYRA and STONICX remain distinct agents communicating through this Bridge and the Router State Bus.
 * 3. CONTEXT INTEGRITY: Seamlessly captures context snapshots and syncs into MemoryVault and Topic Notes.
 */

import { PersonaTarget } from './intentClassifier';
import { 
  RouterStateBus, 
  EVENT_PERSONA_TRANSITION, 
  EVENT_GLITCH_CIPHER, 
  EVENT_CONTEXT_SYNCHRONIZED 
} from './routerStateBus';
import { MemoryVaultService } from '../memory/memoryVaultService';
import { playPcmAudio, stopCurrentSpeech, speakText, sanitizeTextForSpeech } from '../../utils/speechEngine';
import { loadStonicxTopicNotes, saveStonicxTopicNotes } from '../../utils/stonicxMemoryStore';
import { StonicxTopicNote } from '../../types/stonicxMemory';
import { ChatMessage, MemoryItem } from '../../types';

export interface PersonaHandoffOptions {
  from: PersonaTarget;
  to: PersonaTarget;
  reason: string;
  userPrompt?: string;
  chatHistory?: ChatMessage[];
  gestureState?: { isTrackingActive: boolean; lastGesture?: string };
  language?: 'en' | 'hi';
  onModeSwitch?: (newMode: 'mayra' | 'stonicx') => void;
  onSpokenStart?: () => void;
  onSpokenEnd?: () => void;
}

export class PersonaSwitchBridge {
  private static isHandshaking = false;

  /**
   * Orchestrates the complete handoff between MAYRA and STONICX
   */
  public static async executeHandoff(options: PersonaHandoffOptions): Promise<boolean> {
    if (this.isHandshaking) {
      console.warn('[PersonaBridge] Handoff already in progress. Ignoring duplicate request.');
      return false;
    }

    const { from, to, reason, userPrompt, chatHistory = [], language = 'hi', onModeSwitch } = options;

    if (from === to) {
      return true;
    }

    this.isHandshaking = true;
    RouterStateBus.setLock(true);

    try {
      // 1. Log Routing Intent
      if (to === 'STONICX') {
        console.log('[DelegationRouter] Intent classified: TECHNICAL -> Initiating handoff to STONICX');
      } else {
        console.log('[DelegationRouter] Intent classified: COMPANION/GENERAL -> Returning to MAYRA');
      }

      // 2. Synchronize Context & Memory Snapshot
      const snapshot = this.synchronizeContextSnapshot(from, to, chatHistory, userPrompt);
      console.log('[MemoryVault] Context snapshot synchronized across persona boundary');

      // 3. Audio Cues & Glitch Decode Cipher Transition
      if (to === 'STONICX') {
        // Mayra speaks handover line
        const mayraCue = (language === 'hi') 
          ? 'Yeh technical kaam main STONICX ko delegate kar rahi hoon.'
          : 'I am delegating this technical task to STONICX.';
        
        await this.speakMayraCue(mayraCue, language);

        // Trigger brief glitch decode cipher effect
        RouterStateBus.publish(EVENT_GLITCH_CIPHER, {
          active: true,
          durationMs: 800,
          cipherText: 'DECODING STONICX NEURAL MATRIX...'
        });

        await new Promise((resolve) => setTimeout(resolve, 350));

        // Switch active mode state
        if (onModeSwitch) {
          onModeSwitch('stonicx');
        }
        RouterStateBus.setActivePersona('STONICX');

        // Publish Transition Event
        RouterStateBus.publish(EVENT_PERSONA_TRANSITION, {
          from: 'MAYRA',
          to: 'STONICX',
          reason,
          contextSnapshot: snapshot,
          timestamp: Date.now()
        });

        // STONICX initializes with Charon Voice
        const stonicxCue = 'STONICX active. Ready for execution.';
        await this.speakCharonVoice(stonicxCue);

        console.log('[PersonaBridge] Handshake completed -> Charon Voice active, MAYRA 3D untouched');
      } else {
        // Return to MAYRA: STONICX speaks with Charon Voice first
        const stonicxReturnCue = (language === 'hi')
          ? 'Task execution complete. Switching back to MAYRA.'
          : 'Task execution complete. Switching back to MAYRA.';

        await this.speakCharonVoice(stonicxReturnCue);

        // Trigger brief glitch decode cipher effect
        RouterStateBus.publish(EVENT_GLITCH_CIPHER, {
          active: true,
          durationMs: 600,
          cipherText: 'RE-ENGAGING MAYRA CORE...'
        });

        await new Promise((resolve) => setTimeout(resolve, 300));

        if (onModeSwitch) {
          onModeSwitch('mayra');
        }
        RouterStateBus.setActivePersona('MAYRA');

        // Publish Transition Event
        RouterStateBus.publish(EVENT_PERSONA_TRANSITION, {
          from: 'STONICX',
          to: 'MAYRA',
          reason,
          contextSnapshot: snapshot,
          timestamp: Date.now()
        });

        console.log('[PersonaBridge] Handshake completed -> MAYRA active, 3D character resumed');
      }

      return true;
    } catch (error) {
      console.error('[PersonaBridge] Error during persona handoff:', error);
      return false;
    } finally {
      this.isHandshaking = false;
      RouterStateBus.setLock(false);
    }
  }

  /**
   * Synchronizes context, recent conversation messages, and memory vault items
   */
  public static synchronizeContextSnapshot(
    source: PersonaTarget,
    target: PersonaTarget,
    chatHistory: ChatMessage[],
    userPrompt?: string
  ): Record<string, any> {
    const recentMessages = chatHistory.slice(-6).map((m) => ({
      sender: m.sender || m.role || 'user',
      text: m.text || m.content || '',
      timestamp: m.timestamp
    }));

    const snapshot = {
      source,
      target,
      userPrompt: userPrompt || '',
      recentMessages,
      syncedAt: Date.now()
    };

    try {
      if (target === 'STONICX' && (userPrompt || recentMessages.length > 0)) {
        // Inject into STONICX Topic Notes for persistent technical context
        const notes = loadStonicxTopicNotes();
        const existingHandoffIndex = notes.findIndex((n) => n.id === 'stx-note-active-handoff');
        
        const summaryContent = userPrompt 
          ? `Handoff from MAYRA. Active task: "${userPrompt}"\nRecent dialog:\n` + 
            recentMessages.map((m) => `${m.sender}: ${m.text}`).join('\n')
          : 'Handoff from MAYRA session.';

        const handoffNote: StonicxTopicNote = {
          id: 'stx-note-active-handoff',
          title: 'Active Task Handoff from MAYRA',
          category: 'project',
          content: summaryContent,
          tags: ['handoff', 'active-task', 'delegation'],
          lastModified: Date.now(),
          isPinned: true
        };

        let updatedNotes: StonicxTopicNote[];
        if (existingHandoffIndex >= 0) {
          updatedNotes = [...notes];
          updatedNotes[existingHandoffIndex] = handoffNote;
        } else {
          updatedNotes = [handoffNote, ...notes];
        }
        saveStonicxTopicNotes(updatedNotes);
      }

      // Sync into MemoryVault
      if (userPrompt && userPrompt.length > 5) {
        const existingMemories = MemoryVaultService.loadPersistedMemories();
        const newMem: MemoryItem = {
          id: `mem-delegation-${Date.now()}`,
          key: `Delegated Task (${target})`,
          value: userPrompt,
          category: 'task',
          timestamp: Date.now(),
          importance: 4,
          tags: ['delegation', target.toLowerCase(), 'router_bus'],
          source: 'system'
        };
        MemoryVaultService.savePersistedMemories([newMem, ...existingMemories.slice(0, 49)]);
      }

      RouterStateBus.publish(EVENT_CONTEXT_SYNCHRONIZED, {
        source,
        target,
        syncedKeysCount: recentMessages.length + 1,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('[PersonaBridge] Error saving context snapshot into memory:', e);
    }

    return snapshot;
  }

  /**
   * Spoken audio for Mayra handoff line
   */
  private static speakMayraCue(text: string, language: 'en' | 'hi'): Promise<void> {
    return new Promise((resolve) => {
      stopCurrentSpeech();
      speakText(
        text,
        language,
        () => {},
        () => resolve()
      ).catch(() => resolve());

      // Timeout safety
      setTimeout(resolve, 2200);
    });
  }

  /**
   * Speaks using STONICX's authoritative Charon Voice
   */
  public static async speakCharonVoice(text: string): Promise<void> {
    if (!text || typeof window === 'undefined') return;

    stopCurrentSpeech();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
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
          await new Promise<void>((resolve) => {
            const played = playPcmAudio(
              data.audioBase64,
              () => {},
              () => resolve()
            );
            if (!played) resolve();
            setTimeout(resolve, 2500);
          });
          return;
        }
      }
    } catch (e) {
      console.warn('[PersonaBridge] Charon voice fetch note, using secondary voice fallback');
    }

    // Secondary fallback
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      await new Promise<void>((resolve) => {
        const clean = sanitizeTextForSpeech(text);
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1.0;
        utterance.pitch = 0.75;

        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(v => 
          v.name.toLowerCase().includes('male') || 
          v.name.toLowerCase().includes('david') || 
          v.name.toLowerCase().includes('daniel') || 
          v.name.toLowerCase().includes('george')
        ) || voices.find(v => v.lang.startsWith('en'));

        if (maleVoice) utterance.voice = maleVoice;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);

        setTimeout(resolve, 2500);
      });
    }
  }
}
