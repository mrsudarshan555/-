/**
 * Tool Telemetry Bridge (Phase G)
 * 
 * Coordinates dynamic spoken audio cues, dual-layer thinking integration,
 * and audio ducking during autonomous tool invocations.
 * 
 * Verification Console Log:
 * `[ToolTelemetry] Spoken telemetry dispatched: "Searching external technical documentation..."`
 */

import { AudioDuckingManager } from '../audio/audioDuckingManager';
import { ThinkingProgressEngine } from '../audio/thinkingProgressEngine';
import { PersonaSwitchBridge } from '../router/personaSwitchBridge';
import { ToolEventBus, EVENT_TOOL_TELEMETRY } from './toolEventBus';

export const TOOL_TELEMETRY_MAP: Record<string, string> = {
  web_search: 'Searching external technical documentation...',
  codebase_scanner: 'Scanning local module dependencies...',
  memory_vault_query: 'Querying shared neural memory vault...',
  terminal_evaluator: 'Evaluating sandboxed script execution...'
};

export class ToolTelemetryBridge {
  private static instance: ToolTelemetryBridge | null = null;
  private isSpeakingTelemetry = false;

  private constructor() {}

  public static getInstance(): ToolTelemetryBridge {
    if (!this.instance) {
      this.instance = new ToolTelemetryBridge();
    }
    return this.instance;
  }

  /**
   * Dispatches spoken telemetry comment during tool start
   */
  public async dispatchToolStartTelemetry(
    toolName: string,
    persona: 'STONICX' | 'MAYRA' = 'STONICX'
  ): Promise<void> {
    const telemetryPhrase = TOOL_TELEMETRY_MAP[toolName] || `Executing autonomous tool ${toolName}...`;

    console.log(`[ToolTelemetry] Spoken telemetry dispatched: "${telemetryPhrase}"`);

    // Emit event to tool bus
    ToolEventBus.getInstance().emit(EVENT_TOOL_TELEMETRY, {
      tool: toolName,
      telemetryText: telemetryPhrase,
      persona
    });

    // Speak commentary with audio ducking
    await this.speakTelemetry(telemetryPhrase, persona);
  }

  /**
   * Speaks verbal cue non-blockingly with ambient ducking
   */
  private async speakTelemetry(phrase: string, persona: 'STONICX' | 'MAYRA'): Promise<void> {
    if (this.isSpeakingTelemetry) return;
    this.isSpeakingTelemetry = true;

    const ducking = AudioDuckingManager.getInstance();
    ducking.duck({ duckGain: 0.20, rampDownTimeSec: 0.15 });

    try {
      if (persona === 'STONICX') {
        await PersonaSwitchBridge.speakCharonVoice(phrase);
      }
    } catch (e) {
      // Non-blocking fallback
    } finally {
      this.isSpeakingTelemetry = false;
      ducking.restore({ rampUpTimeSec: 0.30 });
    }
  }

  /**
   * Restores audio and completes thinking layer cleanly
   */
  public finalizeToolRun(fadeDurationSec: number = 0.3): void {
    ThinkingProgressEngine.getInstance().stopDualLayerThinking(fadeDurationSec);
  }
}
