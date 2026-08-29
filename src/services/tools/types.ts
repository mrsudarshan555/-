/**
 * Tool Definitions & Payloads for Autonomous Tool Calling Engine (Phase G)
 */

export type ToolCategory = 'search' | 'codebase' | 'memory' | 'terminal' | 'system';

export type FloatingCardType = 
  | 'WEB SEARCH RESULTS' 
  | 'CODE INTEL' 
  | 'MEMORY VAULT INTEL' 
  | 'TERMINAL OUTPUT' 
  | 'SYSTEM';

export interface ToolParameterSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  defaultValue?: any;
}

export interface ToolDefinition {
  name: string;
  displayName: string;
  category: ToolCategory;
  description: string;
  parameters: Record<string, ToolParameterSchema>;
  execute: (parameters: Record<string, any>, context?: any) => Promise<ToolExecutionResult>;
}

export interface ToolCallPayload {
  tool: string;
  parameters: Record<string, any>;
  callId?: string;
  requester?: 'STONICX' | 'MAYRA' | 'SYSTEM';
}

export interface FloatingCardPayload {
  id: string;
  toolType: FloatingCardType;
  title: string;
  queryOrTarget: string;
  summary: string;
  keyPoints: string[];
  codeSnippet?: {
    language: string;
    code: string;
    filename?: string;
  };
  metrics?: {
    latencyMs: number;
    itemsFound?: number;
    source?: string;
    confidenceScore?: number;
  };
  timestamp: number;
  isPinned?: boolean;
  rawJson?: any;
  position?: { x: number; y: number };
}

export interface ToolExecutionResult {
  tool: string;
  success: boolean;
  title: string;
  summary: string;
  data: any;
  executionTimeMs: number;
  error?: string;
  cardPayload?: FloatingCardPayload;
}
