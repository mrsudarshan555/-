/**
 * Autonomous Tool Executor Engine (Phase G)
 * 
 * Orchestrates autonomous tool invocation loop:
 * 1. Analyzes intent & parameters (or structured LLM call).
 * 2. Emits spoken telemetry commentary ("Searching documentation...").
 * 3. Asynchronously runs the registered tool.
 * 4. Mounts interactive Floating HUD Cards to the viewport.
 * 5. Returns structured JSON payloads for AI prompt context buffers.
 */

import { ToolCallPayload, ToolExecutionResult, FloatingCardPayload } from './types';
import { ToolRegistry } from './toolRegistry';
import { ToolTelemetryBridge } from './toolTelemetryBridge';
import { ToolEventBus, EVENT_TOOL_INVOKED, EVENT_TOOL_EXECUTED, EVENT_MOUNT_FLOATING_CARD } from './toolEventBus';

export class ToolExecutor {
  private static instance: ToolExecutor | null = null;
  private registry: ToolRegistry;
  private telemetryBridge: ToolTelemetryBridge;

  private constructor() {
    this.registry = ToolRegistry.getInstance();
    this.telemetryBridge = ToolTelemetryBridge.getInstance();
  }

  public static getInstance(): ToolExecutor {
    if (!this.instance) {
      this.instance = new ToolExecutor();
    }
    return this.instance;
  }

  /**
   * Executes a tool autonomously given a structured tool call payload
   */
  public async executeToolCall(
    call: ToolCallPayload,
    persona: 'STONICX' | 'MAYRA' = 'STONICX',
    mountFloatingCard: boolean = true
  ): Promise<ToolExecutionResult> {
    const toolDef = this.registry.getTool(call.tool);
    if (!toolDef) {
      console.warn(`[ToolExecutor] Requested tool "${call.tool}" not found in registry.`);
      return {
        tool: call.tool,
        success: false,
        title: 'Tool Not Found',
        summary: `No tool registered with identifier: ${call.tool}`,
        data: null,
        executionTimeMs: 0,
        error: `Tool ${call.tool} not registered`
      };
    }

    // 1. Dispatch Spoken Telemetry Comment (Layer 2 of Thinking Engine)
    await this.telemetryBridge.dispatchToolStartTelemetry(call.tool, persona);

    // 2. Publish Tool Invocation Event
    ToolEventBus.getInstance().emit(EVENT_TOOL_INVOKED, call);

    // 3. Asynchronously Execute Tool
    const result = await toolDef.execute(call.parameters, { persona });

    // 4. Publish Tool Executed Event
    ToolEventBus.getInstance().emit(EVENT_TOOL_EXECUTED, result);

    // 5. Mount Floating Data HUD Card if payload is present
    if (mountFloatingCard && result.cardPayload) {
      console.log(`[DataCard] Floating HUD Card mounted -> Target payload rendered (${result.cardPayload.toolType})`);
      ToolEventBus.getInstance().emit(EVENT_MOUNT_FLOATING_CARD, result.cardPayload);
    }

    return result;
  }

  /**
   * Detects and parses tool calls from an AI response or user command
   */
  public detectToolIntent(input: string): ToolCallPayload | null {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();

    // 1. Structured JSON Tool Call format: {"tool": "web_search", "parameters": {...}}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.tool && parsed.parameters) {
          return {
            tool: parsed.tool,
            parameters: parsed.parameters
          };
        }
      } catch {
        // Not a JSON payload
      }
    }

    // 2. Embedded JSON block in Markdown: ```json { "tool": ... } ```
    const jsonMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?"tool"[\s\S]*?\})\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.tool && parsed.parameters) {
          return {
            tool: parsed.tool,
            parameters: parsed.parameters
          };
        }
      } catch {
        // Fallback
      }
    }

    // 3. Web Search heuristics
    if (
      lower.startsWith('search ') ||
      lower.startsWith('web search ') ||
      lower.startsWith('google ') ||
      lower.includes('search the web for') ||
      lower.includes('documentation for') ||
      lower.includes('latest release of') ||
      lower.includes('find specs on')
    ) {
      const cleanQuery = trimmed
        .replace(/^(?:web\s+)?search(?:\s+the\s+web)?(?:\s+for)?/i, '')
        .replace(/^google\s+/i, '')
        .replace(/^find\s+(?:docs|documentation|specs)\s+(?:for|on)\s+/i, '')
        .trim();

      if (cleanQuery.length > 2) {
        return {
          tool: 'web_search',
          parameters: { query: cleanQuery }
        };
      }
    }

    // 4. Codebase Scanner heuristics
    if (
      lower.includes('scan codebase') ||
      lower.includes('scan files') ||
      lower.includes('inspect architecture') ||
      lower.includes('list components') ||
      lower.includes('show module tree') ||
      lower.startsWith('scan ')
    ) {
      const moduleMatch = lower.match(/scan\s+(?:the\s+)?(?:module|codebase|directory|folder)?\s*([a-zA-Z0-9_\-/]+)?/i);
      const targetModule = (moduleMatch && moduleMatch[1]) ? moduleMatch[1] : 'services';
      return {
        tool: 'codebase_scanner',
        parameters: { targetModule }
      };
    }

    // 5. Terminal Sandbox Evaluator heuristics
    if (
      lower.startsWith('eval ') ||
      lower.startsWith('calc ') ||
      lower.startsWith('calculate ') ||
      lower.startsWith('terminal run ') ||
      lower.startsWith('math ') ||
      (lower.includes('math.') && lower.includes('('))
    ) {
      const expression = trimmed
        .replace(/^(?:eval|calc|calculate|terminal run|math)\s+/i, '')
        .trim();

      if (expression.length > 0) {
        return {
          tool: 'terminal_evaluator',
          parameters: { code: expression }
        };
      }
    }

    return null;
  }
}
