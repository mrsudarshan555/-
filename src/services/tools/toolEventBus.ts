/**
 * Global Tool Event Bus (Phase G)
 * 
 * Bridges tool calls, spoken telemetries, execution results, and floating HUD cards.
 */

import { FloatingCardPayload, ToolCallPayload, ToolExecutionResult } from './types';

export const EVENT_TOOL_INVOKED = 'EVENT_TOOL_INVOKED';
export const EVENT_TOOL_EXECUTED = 'EVENT_TOOL_EXECUTED';
export const EVENT_TOOL_TELEMETRY = 'EVENT_TOOL_TELEMETRY';
export const EVENT_MOUNT_FLOATING_CARD = 'EVENT_MOUNT_FLOATING_CARD';
export const EVENT_DISMISS_FLOATING_CARD = 'EVENT_DISMISS_FLOATING_CARD';
export const EVENT_CLEAR_ALL_CARDS = 'EVENT_CLEAR_ALL_CARDS';

export type ToolEventMap = {
  [EVENT_TOOL_INVOKED]: ToolCallPayload;
  [EVENT_TOOL_EXECUTED]: ToolExecutionResult;
  [EVENT_TOOL_TELEMETRY]: { tool: string; telemetryText: string; persona: 'STONICX' | 'MAYRA' };
  [EVENT_MOUNT_FLOATING_CARD]: FloatingCardPayload;
  [EVENT_DISMISS_FLOATING_CARD]: { cardId: string };
  [EVENT_CLEAR_ALL_CARDS]: void;
};

type ToolListener<K extends keyof ToolEventMap> = (payload: ToolEventMap[K]) => void;

export class ToolEventBus {
  private static instance: ToolEventBus | null = null;
  private listeners: Map<string, Set<ToolListener<any>>> = new Map();
  private activeCards: Map<string, FloatingCardPayload> = new Map();

  private constructor() {}

  public static getInstance(): ToolEventBus {
    if (!this.instance) {
      this.instance = new ToolEventBus();
    }
    return this.instance;
  }

  public on<K extends keyof ToolEventMap>(event: K, listener: ToolListener<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.off(event, listener);
    };
  }

  public off<K extends keyof ToolEventMap>(event: K, listener: ToolListener<K>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  public emit<K extends keyof ToolEventMap>(event: K, payload: ToolEventMap[K]): void {
    if (event === EVENT_MOUNT_FLOATING_CARD) {
      const card = payload as FloatingCardPayload;
      this.activeCards.set(card.id, card);
    } else if (event === EVENT_DISMISS_FLOATING_CARD) {
      const { cardId } = payload as { cardId: string };
      this.activeCards.delete(cardId);
    } else if (event === EVENT_CLEAR_ALL_CARDS) {
      this.activeCards.clear();
    }

    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(payload);
        } catch (e) {
          console.error(`[ToolEventBus] Error in listener for ${event}:`, e);
        }
      });
    }
  }

  public getActiveCards(): FloatingCardPayload[] {
    return Array.from(this.activeCards.values());
  }

  public clearCards(): void {
    this.activeCards.clear();
    this.emit(EVENT_CLEAR_ALL_CARDS, undefined);
  }
}
