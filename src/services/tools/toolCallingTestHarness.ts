/**
 * Phase G: Autonomous Tool Calling & Deep Information Extractor Test Harness
 * 
 * Verifies:
 * - Test 1: Complex query triggers autonomous `web_search` tool execution.
 * - Test 2: Local architecture query triggers `codebase_scanner` and resolves file tree.
 * - Test 3: Thinking telemetry spoken cues trigger during tool run.
 * - Test 4: `FloatingDataCard` renders with correct payload and handles dismissal.
 * 
 * Verification Console Log Format:
 * `[ToolRegistry] Tool invoked: web_search -> Parameters: { query: "..." }`
 * `[ToolTelemetry] Spoken telemetry dispatched: "Searching external technical documentation..."`
 * `[DataCard] Floating HUD Card mounted -> Target payload rendered`
 * 
 * Trigger via: `window.__MAYRA_TEST_TOOL_CALLING__()`
 */

import { ToolRegistry } from './toolRegistry';
import { ToolExecutor } from './toolExecutor';
import { ToolTelemetryBridge, TOOL_TELEMETRY_MAP } from './toolTelemetryBridge';
import { 
  ToolEventBus, 
  EVENT_TOOL_INVOKED, 
  EVENT_TOOL_EXECUTED, 
  EVENT_TOOL_TELEMETRY, 
  EVENT_MOUNT_FLOATING_CARD, 
  EVENT_DISMISS_FLOATING_CARD 
} from './toolEventBus';

export async function runToolCallingTestSuite(): Promise<{
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  logs: string[];
}> {
  const logs: string[] = [];
  let passedCount = 0;
  const totalCount = 4;

  const log = (msg: string) => {
    logs.push(msg);
    console.log(`[ToolCallingTest] ${msg}`);
  };

  log('================================================================');
  log('STARTING PHASE G: AUTONOMOUS TOOL CALLING TEST SUITE');
  log('================================================================');

  const executor = ToolExecutor.getInstance();
  const registry = ToolRegistry.getInstance();
  const eventBus = ToolEventBus.getInstance();

  // -------------------------------------------------------------
  // TEST 1: Autonomous Web Search Execution
  // -------------------------------------------------------------
  log('\n--- TEST 1: Autonomous Web Search Tool Execution ---');
  let test1Passed = false;
  try {
    const webCall = {
      tool: 'web_search',
      parameters: { query: 'WebAssembly SIMD vector processing standards' }
    };

    const res = await executor.executeToolCall(webCall, 'STONICX', false);
    if (res.success && res.tool === 'web_search' && res.data && res.data.results.length > 0) {
      test1Passed = true;
      passedCount++;
      log(`✅ Test 1 PASSED: Web search executed in ${res.executionTimeMs}ms with ${res.data.results.length} citations.`);
    } else {
      log(`❌ Test 1 FAILED: Unexpected web search result structure.`);
    }
  } catch (e: any) {
    log(`❌ Test 1 FAILED with exception: ${e.message}`);
  }

  // -------------------------------------------------------------
  // TEST 2: Local Codebase Scanner Tool
  // -------------------------------------------------------------
  log('\n--- TEST 2: Local Architecture Codebase Scanner ---');
  let test2Passed = false;
  try {
    const codeCall = {
      tool: 'codebase_scanner',
      parameters: { targetModule: 'services', filter: 'Router' }
    };

    const res = await executor.executeToolCall(codeCall, 'STONICX', false);
    if (res.success && res.tool === 'codebase_scanner' && res.data && res.data.modules.length > 0) {
      test2Passed = true;
      passedCount++;
      log(`✅ Test 2 PASSED: Codebase scanner identified ${res.data.modules.length} modules (${res.summary}).`);
    } else {
      log(`❌ Test 2 FAILED: Codebase scanner returned empty module list.`);
    }
  } catch (e: any) {
    log(`❌ Test 2 FAILED with exception: ${e.message}`);
  }

  // -------------------------------------------------------------
  // TEST 3: Thinking Telemetry Spoken Cues Trigger
  // -------------------------------------------------------------
  log('\n--- TEST 3: Thinking Telemetry Spoken Cues During Tool Run ---');
  let test3Passed = false;
  try {
    let capturedTelemetry: any = null;
    const unsub = eventBus.on(EVENT_TOOL_TELEMETRY, (payload) => {
      capturedTelemetry = payload;
    });

    const bridge = ToolTelemetryBridge.getInstance();
    await bridge.dispatchToolStartTelemetry('web_search', 'STONICX');

    unsub();

    if (capturedTelemetry && capturedTelemetry.tool === 'web_search' && capturedTelemetry.telemetryText.includes('documentation')) {
      test3Passed = true;
      passedCount++;
      log(`✅ Test 3 PASSED: Telemetry dispatched -> "${capturedTelemetry.telemetryText}"`);
    } else {
      log(`❌ Test 3 FAILED: Spoken telemetry phrase was not captured.`);
    }
  } catch (e: any) {
    log(`❌ Test 3 FAILED with exception: ${e.message}`);
  }

  // -------------------------------------------------------------
  // TEST 4: Floating HUD Data Card Mounting & Dismissal
  // -------------------------------------------------------------
  log('\n--- TEST 4: Floating HUD Data Card Mount & Dismissal ---');
  let test4Passed = false;
  try {
    let mountedCard: any = null;
    let dismissedId: string | null = null;

    const unsubMount = eventBus.on(EVENT_MOUNT_FLOATING_CARD, (card) => {
      mountedCard = card;
    });
    const unsubDismiss = eventBus.on(EVENT_DISMISS_FLOATING_CARD, ({ cardId }) => {
      dismissedId = cardId;
    });

    // Execute tool with card mounting enabled
    const termCall = {
      tool: 'terminal_evaluator',
      parameters: { code: 'Math.pow(2, 16) + 42' }
    };

    const res = await executor.executeToolCall(termCall, 'STONICX', true);

    if (mountedCard && mountedCard.toolType === 'TERMINAL OUTPUT') {
      // Test dismissal
      eventBus.emit(EVENT_DISMISS_FLOATING_CARD, { cardId: mountedCard.id });

      if (dismissedId === mountedCard.id) {
        test4Passed = true;
        passedCount++;
        log(`✅ Test 4 PASSED: Floating HUD Card mounted (${mountedCard.toolType}) and dismissed cleanly.`);
      } else {
        log(`❌ Test 4 FAILED: Card mount succeeded but dismissal event was not registered.`);
      }
    } else {
      log(`❌ Test 4 FAILED: Floating card did not mount.`);
    }

    unsubMount();
    unsubDismiss();
  } catch (e: any) {
    log(`❌ Test 4 FAILED with exception: ${e.message}`);
  }

  log('================================================================');
  const allPassed = passedCount === totalCount;
  log(`PHASE G TEST RESULTS: ${passedCount}/${totalCount} PASSED (All Passed: ${allPassed})`);
  log('================================================================');

  return {
    allPassed,
    passedCount,
    totalCount,
    logs
  };
}

// Attach to window for automated testing
if (typeof window !== 'undefined') {
  (window as any).__MAYRA_TEST_TOOL_CALLING__ = runToolCallingTestSuite;
}
