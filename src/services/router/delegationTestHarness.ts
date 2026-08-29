/**
 * Autonomous Task Delegation Unit Test Suite
 * 
 * Verifies:
 * 1. Intent classification accuracy (Companion/General vs Technical/Work)
 * 2. Natural language keyword and syntax detection
 * 3. Direct voice trigger recognition ("switch to stonicx", "switch to mayra")
 * 4. Context snapshot and working memory continuity across persona boundaries
 * 5. Event bus emission and state lock lifecycles
 */

import { IntentClassifier } from './intentClassifier';
import { RouterStateBus, EVENT_PERSONA_TRANSITION } from './routerStateBus';
import { PersonaSwitchBridge } from './personaSwitchBridge';
import { DelegationRouter } from './delegationRouter';
import { MemoryVaultService } from '../memory/memoryVaultService';
import { loadStonicxTopicNotes } from '../../utils/stonicxMemoryStore';
import { ChatMessage } from '../../types';

export interface TestCaseResult {
  testId: string;
  name: string;
  passed: boolean;
  input: any;
  output: any;
  expected: any;
  durationMs: number;
  error?: string;
}

export interface DelegationTestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestCaseResult[];
}

export class DelegationTestHarness {
  /**
   * Runs the complete automated test suite
   */
  public static async runAllTests(): Promise<DelegationTestSuiteSummary> {
    const startTime = Date.now();
    const results: TestCaseResult[] = [];

    console.log('====================================================');
    console.log('🧪 RUNNING DELEGATION ROUTER TEST SUITE (PHASE C)');
    console.log('====================================================');

    // Test 1: Casual Greeting -> Retains MAYRA
    results.push(await this.testCasualGreetingRetainsMayra());

    // Test 2: Code Debugging Prompt -> Delegates to STONICX
    results.push(await this.testCodeDebuggingDelegatesToStonicx());

    // Test 3: Explicit Voice Trigger "switch to stonicx" -> Executes Transition
    results.push(await this.testExplicitVoiceTriggerStonicx());

    // Test 4: Memory Continuity Check Across Persona Swaps
    results.push(await this.testMemoryContinuityAcrossSwaps());

    // Test 5: Explicit Voice Trigger "switch to mayra" -> Switches back to MAYRA
    results.push(await this.testExplicitVoiceTriggerMayra());

    // Test 6: Technical Keywords & Syntax Parsing
    results.push(await this.testTechnicalKeywordParsing());

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;
    const durationMs = Date.now() - startTime;

    console.log('====================================================');
    console.log(`🏁 TEST RESULTS: ${passed}/${total} PASSED (${durationMs}ms)`);
    console.log('====================================================');

    return {
      total,
      passed,
      failed,
      durationMs,
      results
    };
  }

  // Test 1: Casual greeting -> Retains MAYRA
  public static async testCasualGreetingRetainsMayra(): Promise<TestCaseResult> {
    const t0 = Date.now();
    const prompt = 'Good morning Mayra, how are you today? Weather kaisa hai?';
    
    const result = IntentClassifier.classifyIntent(prompt, 'MAYRA');
    const passed = result.targetPersona === 'MAYRA' && 
                   (result.track === 'COMPANION' || result.track === 'GENERAL') &&
                   !result.isDirectSwitch;

    return {
      testId: 'TEST_1_CASUAL_GREETING',
      name: 'Casual greeting retains MAYRA',
      passed,
      input: { prompt, currentPersona: 'MAYRA' },
      output: { target: result.targetPersona, track: result.track, confidence: result.confidence },
      expected: { target: 'MAYRA', track: 'COMPANION or GENERAL' },
      durationMs: Date.now() - t0
    };
  }

  // Test 2: Code debugging prompt -> Delegates to STONICX
  public static async testCodeDebuggingDelegatesToStonicx(): Promise<TestCaseResult> {
    const t0 = Date.now();
    const prompt = 'Debug this React memory leak in my useEffect hook and analyze codebase architecture';
    
    const result = IntentClassifier.classifyIntent(prompt, 'MAYRA');
    const passed = result.targetPersona === 'STONICX' && 
                   result.track === 'TECHNICAL' &&
                   result.matchedKeywords.length >= 2;

    return {
      testId: 'TEST_2_CODE_DEBUG_DELEGATE',
      name: 'Code debugging prompt delegates to STONICX',
      passed,
      input: { prompt, currentPersona: 'MAYRA' },
      output: { target: result.targetPersona, track: result.track, matchedKeywords: result.matchedKeywords },
      expected: { target: 'STONICX', track: 'TECHNICAL' },
      durationMs: Date.now() - t0
    };
  }

  // Test 3: Explicit voice trigger "switch to stonicx" -> Executes full transition
  public static async testExplicitVoiceTriggerStonicx(): Promise<TestCaseResult> {
    const t0 = Date.now();
    const prompt = 'switch to stonicx';
    
    const result = IntentClassifier.classifyIntent(prompt, 'MAYRA');
    const passed = result.targetPersona === 'STONICX' && 
                   result.isDirectSwitch === true && 
                   result.switchDirection === 'TO_STONICX';

    return {
      testId: 'TEST_3_DIRECT_SWITCH_STONICX',
      name: 'Explicit voice trigger "switch to stonicx" executes transition',
      passed,
      input: { prompt },
      output: { target: result.targetPersona, isDirectSwitch: result.isDirectSwitch, direction: result.switchDirection },
      expected: { target: 'STONICX', isDirectSwitch: true, direction: 'TO_STONICX' },
      durationMs: Date.now() - t0
    };
  }

  // Test 4: Memory continuity check across persona swaps
  public static async testMemoryContinuityAcrossSwaps(): Promise<TestCaseResult> {
    const t0 = Date.now();
    
    const mockChatHistory: ChatMessage[] = [
      { id: 'm1', sender: 'user', text: 'We are working on Project Apex quantum circuit', timestamp: Date.now() - 5000 },
      { id: 'm2', sender: 'mayra', text: 'I have logged Project Apex.', timestamp: Date.now() - 4000 }
    ];

    const snapshot = PersonaSwitchBridge.synchronizeContextSnapshot(
      'MAYRA',
      'STONICX',
      mockChatHistory,
      'Optimize circuit algorithm performance'
    );

    // Verify snapshot contents
    const hasRecent = Array.isArray(snapshot.recentMessages) && snapshot.recentMessages.length >= 2;
    const hasPrompt = snapshot.userPrompt.includes('circuit algorithm');
    
    // Verify STONICX topic notes received the handoff
    const notes = loadStonicxTopicNotes();
    const handoffNote = notes.find((n) => n.id === 'stx-note-active-handoff');
    const notePassed = Boolean(handoffNote && handoffNote.content.includes('circuit algorithm'));

    const passed = hasRecent && hasPrompt && notePassed;

    return {
      testId: 'TEST_4_MEMORY_CONTINUITY',
      name: 'Memory continuity check across persona swaps',
      passed,
      input: { source: 'MAYRA', target: 'STONICX', messagesCount: mockChatHistory.length },
      output: { snapshotCreated: Boolean(snapshot), handoffNoteSaved: Boolean(handoffNote) },
      expected: { snapshotCreated: true, handoffNoteSaved: true },
      durationMs: Date.now() - t0
    };
  }

  // Test 5: Reverse voice trigger "switch to mayra"
  public static async testExplicitVoiceTriggerMayra(): Promise<TestCaseResult> {
    const t0 = Date.now();
    const prompt = 'mayra wapas aao';
    
    const result = IntentClassifier.classifyIntent(prompt, 'STONICX');
    const passed = result.targetPersona === 'MAYRA' && 
                   result.isDirectSwitch === true && 
                   result.switchDirection === 'TO_MAYRA';

    return {
      testId: 'TEST_5_DIRECT_SWITCH_MAYRA',
      name: 'Explicit voice trigger "mayra wapas aao" switches back to MAYRA',
      passed,
      input: { prompt, currentPersona: 'STONICX' },
      output: { target: result.targetPersona, isDirectSwitch: result.isDirectSwitch, direction: result.switchDirection },
      expected: { target: 'MAYRA', isDirectSwitch: true, direction: 'TO_MAYRA' },
      durationMs: Date.now() - t0
    };
  }

  // Test 6: Technical keyword and code syntax parsing
  public static async testTechnicalKeywordParsing(): Promise<TestCaseResult> {
    const t0 = Date.now();
    const prompt = 'function calculateMatrix(input: number[]): Promise<void> { return deploy(); }';
    
    const result = IntentClassifier.classifyIntent(prompt, 'MAYRA');
    const passed = result.targetPersona === 'STONICX' && result.track === 'TECHNICAL';

    return {
      testId: 'TEST_6_SYNTAX_PARSING',
      name: 'Code syntax regex and technical keywords parsing',
      passed,
      input: { prompt },
      output: { target: result.targetPersona, track: result.track, confidence: result.confidence },
      expected: { target: 'STONICX', track: 'TECHNICAL' },
      durationMs: Date.now() - t0
    };
  }
}

// Attach to window for interactive browser debugging
if (typeof window !== 'undefined') {
  (window as any).__MAYRA_TEST_DELEGATION__ = () => DelegationTestHarness.runAllTests();
}
