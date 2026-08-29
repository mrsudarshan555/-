/**
 * Autonomous Task Delegation Router for MAYRA <-> STONICX
 * 
 * Coordinates dynamic intent classification, brain delegation, and context bridges.
 */

import { IntentClassifier, ClassificationResult, PersonaTarget } from './intentClassifier';
import { RouterStateBus, EVENT_INTENT_CLASSIFIED } from './routerStateBus';
import { PersonaSwitchBridge, PersonaHandoffOptions } from './personaSwitchBridge';
import { ChatMessage } from '../../types';

export interface RoutePromptOptions {
  prompt: string;
  currentPersona?: PersonaTarget;
  chatHistory?: ChatMessage[];
  language?: 'en' | 'hi';
  onModeSwitch?: (newMode: 'mayra' | 'stonicx') => void;
}

export interface RoutingDecision {
  shouldDelegate: boolean;
  classification: ClassificationResult;
  executedHandoff: boolean;
  targetPersona: PersonaTarget;
  actionTaken: 'retained' | 'delegated_to_stonicx' | 'returned_to_mayra' | 'direct_switch';
}

export class DelegationRouter {
  /**
   * Evaluates prompt and autonomously delegates task or routes to the proper persona
   */
  public static async routePrompt(options: RoutePromptOptions): Promise<RoutingDecision> {
    const { 
      prompt, 
      currentPersona = RouterStateBus.getActivePersona(), 
      chatHistory = [], 
      language = 'hi', 
      onModeSwitch 
    } = options;

    // 1. Classify Intent
    const classification = IntentClassifier.classifyIntent(prompt, currentPersona);
    RouterStateBus.publish(EVENT_INTENT_CLASSIFIED, { prompt, result: classification });

    // 2. Check if a Persona Switch is needed
    const targetPersona = classification.targetPersona;
    const shouldDelegate = targetPersona !== currentPersona;

    if (!shouldDelegate) {
      return {
        shouldDelegate: false,
        classification,
        executedHandoff: false,
        targetPersona: currentPersona,
        actionTaken: 'retained'
      };
    }

    // 3. Perform Autonomous Handoff
    const handoffOptions: PersonaHandoffOptions = {
      from: currentPersona,
      to: targetPersona,
      reason: classification.reason,
      userPrompt: prompt,
      chatHistory,
      language,
      onModeSwitch
    };

    const executed = await PersonaSwitchBridge.executeHandoff(handoffOptions);

    let actionTaken: RoutingDecision['actionTaken'] = 'retained';
    if (classification.isDirectSwitch) {
      actionTaken = 'direct_switch';
    } else if (targetPersona === 'STONICX') {
      actionTaken = 'delegated_to_stonicx';
    } else {
      actionTaken = 'returned_to_mayra';
    }

    return {
      shouldDelegate: true,
      classification,
      executedHandoff: executed,
      targetPersona,
      actionTaken
    };
  }

  /**
   * Direct manual switch trigger
   */
  public static async executeManualSwitch(
    targetPersona: PersonaTarget,
    reason: string = 'Manual trigger',
    onModeSwitch?: (newMode: 'mayra' | 'stonicx') => void,
    chatHistory?: ChatMessage[]
  ): Promise<boolean> {
    const current = RouterStateBus.getActivePersona();
    if (current === targetPersona) return true;

    return await PersonaSwitchBridge.executeHandoff({
      from: current,
      to: targetPersona,
      reason,
      onModeSwitch,
      chatHistory
    });
  }

  public static getActivePersona(): PersonaTarget {
    return RouterStateBus.getActivePersona();
  }
}
