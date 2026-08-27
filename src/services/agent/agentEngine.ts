/**
 * MAYRA Real AI Agent V1 Execution Coordinator
 * 
 * Manages:
 * - Multi-step task planning & chaining
 * - Gemini function calling communication loop
 * - Permission gates & user confirmations
 * - Real-time task context state & progress feedback
 * - Graceful cancellation & step timeout protection
 */

import { AgentTaskContext, AgentTaskStatus, AgentPendingConfirmation } from '../../types';
import { AgentToolRegistry } from './toolRegistry';

export interface AgentEngineCallbacks {
  onTaskStatusChange?: (status: AgentTaskStatus, context: AgentTaskContext) => void;
  onStepProgress?: (step: number, description: string, context: AgentTaskContext) => void;
  onConfirmationRequired?: (confirmation: AgentPendingConfirmation, context: AgentTaskContext) => void;
  onTaskComplete?: (finalResponse: string, context: AgentTaskContext) => void;
  onTaskError?: (error: string, context: AgentTaskContext) => void;
}

export class MayraAgentEngine {
  private activeContext: AgentTaskContext | null = null;
  private callbacks: AgentEngineCallbacks = {};
  private readonly MAX_STEPS = 6;
  private isProcessing: boolean = false;

  constructor(callbacks?: AgentEngineCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  public setCallbacks(callbacks: AgentEngineCallbacks): void {
    this.callbacks = callbacks;
  }

  public getActiveContext(): AgentTaskContext | null {
    return this.activeContext;
  }

  public isBusy(): boolean {
    return this.isProcessing && (this.activeContext?.status === 'PLANNING' || this.activeContext?.status === 'EXECUTING');
  }

  /**
   * Starts a new Agent Task for a user instruction
   */
  public async executeTask(
    userPrompt: string,
    options?: {
      userName?: string;
      language?: string;
      persona?: string;
    }
  ): Promise<AgentTaskContext> {
    const taskId = `task-${Date.now()}`;
    const initialContext: AgentTaskContext = {
      taskId,
      originalUserRequest: userPrompt,
      status: 'PLANNING',
      currentStep: 0,
      totalSteps: undefined,
      stepDescription: 'Analyzing task and selecting tools...',
      toolCalls: [],
      toolResults: [],
      pendingConfirmation: null,
      isCancelled: false,
      finalResult: null
    };

    this.activeContext = initialContext;
    this.isProcessing = true;
    this.notifyStatus('PLANNING');

    try {
      await this.runExecutionLoop(options);
    } catch (err: any) {
      console.warn('[MayraAgentEngine] Execution error:', err);
      if (this.activeContext) {
        this.activeContext.status = 'FAILED';
        this.activeContext.finalResult = err?.message || 'Task execution failed.';
        this.notifyStatus('FAILED');
        if (this.callbacks.onTaskError) {
          this.callbacks.onTaskError(this.activeContext.finalResult || 'Error', this.activeContext);
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return this.activeContext;
  }

  /**
   * Approves the pending confirmation and resumes execution
   */
  public async approveConfirmation(): Promise<void> {
    if (!this.activeContext || !this.activeContext.pendingConfirmation) {
      return;
    }

    const conf = this.activeContext.pendingConfirmation;
    console.log(`[MayraAgentEngine] User APPROVED action: ${conf.toolName}`);
    this.activeContext.pendingConfirmation = null;
    this.activeContext.status = 'EXECUTING';
    this.activeContext.stepDescription = `Executing confirmed action: ${conf.actionDescription}...`;
    this.notifyStatus('EXECUTING');

    // Execute the confirmed tool with userConfirmed = true
    const execRes = await AgentToolRegistry.executeTool(conf.toolName, conf.args, true);
    
    this.activeContext.toolResults.push({
      name: conf.toolName,
      args: conf.args,
      result: execRes.result,
      error: execRes.error,
      step: this.activeContext.currentStep,
      timestamp: Date.now()
    });

    // Resume execution loop with the tool result
    this.isProcessing = true;
    await this.runExecutionLoop();
  }

  /**
   * Rejects the pending confirmation
   */
  public async rejectConfirmation(): Promise<void> {
    if (!this.activeContext || !this.activeContext.pendingConfirmation) {
      return;
    }

    const conf = this.activeContext.pendingConfirmation;
    console.log(`[MayraAgentEngine] User REJECTED action: ${conf.toolName}`);
    
    this.activeContext.toolResults.push({
      name: conf.toolName,
      args: conf.args,
      error: 'User declined the action.',
      step: this.activeContext.currentStep,
      timestamp: Date.now()
    });

    this.activeContext.pendingConfirmation = null;
    this.activeContext.status = 'EXECUTING';
    this.activeContext.stepDescription = 'User declined action. Generating alternative response...';
    this.notifyStatus('EXECUTING');

    // Resume loop so AI knows user declined
    this.isProcessing = true;
    await this.runExecutionLoop();
  }

  /**
   * Cancels the active task immediately
   */
  public cancelActiveTask(): void {
    if (!this.activeContext) return;
    console.log(`[MayraAgentEngine] Task ${this.activeContext.taskId} cancelled by user.`);
    this.activeContext.isCancelled = true;
    this.activeContext.status = 'CANCELLED';
    this.activeContext.pendingConfirmation = null;
    this.activeContext.stepDescription = 'Task cancelled by user.';
    this.activeContext.finalResult = 'Task was cancelled.';
    this.isProcessing = false;
    this.notifyStatus('CANCELLED');
  }

  /**
   * Core multi-step execution loop
   */
  private async runExecutionLoop(options?: {
    userName?: string;
    language?: string;
    persona?: string;
  }): Promise<void> {
    if (!this.activeContext) return;

    while (this.activeContext.currentStep < this.MAX_STEPS && !this.activeContext.isCancelled) {
      this.activeContext.currentStep++;
      console.log(`[MayraAgentEngine] Step ${this.activeContext.currentStep}/${this.MAX_STEPS}`);

      // Call server-side Agent endpoint with task history and tool results
      const payload = {
        prompt: this.activeContext.originalUserRequest,
        step: this.activeContext.currentStep,
        toolCalls: this.activeContext.toolCalls,
        toolResults: this.activeContext.toolResults,
        userName: options?.userName || 'Zafer',
        language: options?.language || 'en',
        persona: options?.persona || 'executive'
      };

      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server agent endpoint responded with status ${response.status}`);
      }

      const agentData = await response.json();
      console.log('[MayraAgentEngine] Server agent step output:', agentData);

      // Check if Agent completed or has no further tools to run
      if (agentData.done || !agentData.toolCall) {
        this.activeContext.status = 'COMPLETED';
        this.activeContext.stepDescription = 'Completed.';
        this.activeContext.finalResult = agentData.finalResponse || agentData.response || 'Task completed successfully.';
        this.notifyStatus('COMPLETED');
        if (this.callbacks.onTaskComplete) {
          this.callbacks.onTaskComplete(this.activeContext.finalResult, this.activeContext);
        }
        return;
      }

      // Process requested tool call
      const requestedTool = agentData.toolCall;
      const toolName = requestedTool.name;
      const toolArgs = requestedTool.args || {};

      this.activeContext.toolCalls.push({
        name: toolName,
        args: toolArgs,
        step: this.activeContext.currentStep,
        timestamp: Date.now()
      });

      this.activeContext.status = 'EXECUTING';
      this.activeContext.stepDescription = `Executing: ${toolName}...`;
      this.notifyStatus('EXECUTING');

      // Dispatch to Tool Registry
      const execResult = await AgentToolRegistry.executeTool(toolName, toolArgs, false);

      if (execResult.requiresConfirmation && execResult.confirmationDetails) {
        // Pause execution and ask user
        console.log('[MayraAgentEngine] Pausing for user confirmation:', execResult.confirmationDetails);
        this.activeContext.status = 'WAITING_CONFIRMATION';
        this.activeContext.pendingConfirmation = execResult.confirmationDetails;
        this.activeContext.stepDescription = `Action confirmation required: ${execResult.confirmationDetails.actionDescription}`;
        this.notifyStatus('WAITING_CONFIRMATION');
        if (this.callbacks.onConfirmationRequired) {
          this.callbacks.onConfirmationRequired(execResult.confirmationDetails, this.activeContext);
        }
        return; // Yield until user approves/rejects
      }

      // Record result
      this.activeContext.toolResults.push({
        name: toolName,
        args: toolArgs,
        result: execResult.result,
        error: execResult.error,
        step: this.activeContext.currentStep,
        timestamp: Date.now()
      });
    }

    // Hit max steps safety guard
    if (this.activeContext.currentStep >= this.MAX_STEPS && this.activeContext.status !== 'COMPLETED') {
      this.activeContext.status = 'COMPLETED';
      this.activeContext.finalResult = 'Completed max allowed steps for this task.';
      this.notifyStatus('COMPLETED');
      if (this.callbacks.onTaskComplete) {
        this.callbacks.onTaskComplete(this.activeContext.finalResult, this.activeContext);
      }
    }
  }

  private notifyStatus(status: AgentTaskStatus): void {
    if (this.activeContext) {
      this.activeContext.status = status;
      if (this.callbacks.onTaskStatusChange) {
        this.callbacks.onTaskStatusChange(status, this.activeContext);
      }
      if (this.callbacks.onStepProgress) {
        this.callbacks.onStepProgress(
          this.activeContext.currentStep,
          this.activeContext.stepDescription || status,
          this.activeContext
        );
      }
    }
  }
}
