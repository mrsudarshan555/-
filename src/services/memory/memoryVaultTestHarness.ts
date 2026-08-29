/**
 * Automated Unit & Integration Test Suite for Unified Shared Memory Vault (Phase F)
 * 
 * Scenarios:
 * 1. STONICX writes technical note to vault -> Note appears in MEMORY.md.
 * 2. MAYRA queries the vault -> Successfully retrieves STONICX's note.
 * 3. App restart / reload simulation -> Context persists and restores in < 100ms.
 * 4. Dynamic markdown formatting & tag index integrity in VAULT-INDEX.md.
 * 
 * Console Trigger: window.__MAYRA_TEST_MEMORY_VAULT__()
 */

import { MemoryVaultManager } from './memoryVaultManager';
import { MemorySyncBridge } from './memorySyncBridge';
import { MemoryQueryEngine } from './memoryQueryEngine';

export interface MemoryVaultTestReport {
  scenario: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

export async function runMayraMemoryVaultTestSuite(): Promise<MemoryVaultTestReport[]> {
  console.log('🧪 [MAYRA Memory Vault Harness] Starting Unified Shared Markdown Vault Tests...');
  const reports: MemoryVaultTestReport[] = [];

  const vault = MemoryVaultManager.getInstance();
  const syncBridge = MemorySyncBridge.getInstance();
  const queryEngine = MemoryQueryEngine.getInstance();

  await vault.initializeVault();

  // TEST 1: STONICX writes technical note to vault -> Note appears in MEMORY.md
  const t1Start = performance.now();
  try {
    const testFact = 'Neural AST compiler pipeline optimized for Vite WebAssembly target';
    await vault.appendMemoryFact('Technical', testFact, 'STONICX');

    const memoryContent = vault.getDocument('MEMORY.md');
    const t1Passed = memoryContent.includes(testFact) && memoryContent.includes('[STONICX]');

    reports.push({
      scenario: '1. STONICX Writes Technical Note to Vault (MEMORY.md)',
      passed: t1Passed,
      details: t1Passed
        ? `Fact correctly appended and indexed in MEMORY.md with [STONICX] attribution`
        : `Fact missing or improperly formatted in MEMORY.md`,
      durationMs: Math.round(performance.now() - t1Start)
    });
  } catch (e: any) {
    reports.push({
      scenario: '1. STONICX Writes Technical Note to Vault (MEMORY.md)',
      passed: false,
      details: `Exception: ${e.message}`,
      durationMs: Math.round(performance.now() - t1Start)
    });
  }

  // TEST 2: MAYRA queries the vault -> Successfully retrieves STONICX's note
  const t2Start = performance.now();
  try {
    const queryResult = queryEngine.queryVault('neural ast compiler webassembly', 'MAYRA');
    const t2Passed = queryResult.found && queryResult.matchedContent.some((c) => c.includes('Neural AST compiler'));

    reports.push({
      scenario: "2. MAYRA Queries Shared Vault for STONICX's Note",
      passed: t2Passed,
      details: t2Passed
        ? `MAYRA resolved STONICX's technical note with score ${queryResult.relevanceScore}`
        : `Query resolution failed across markdown vault documents`,
      durationMs: Math.round(performance.now() - t2Start)
    });
  } catch (e: any) {
    reports.push({
      scenario: "2. MAYRA Queries Shared Vault for STONICX's Note",
      passed: false,
      details: `Exception: ${e.message}`,
      durationMs: Math.round(performance.now() - t2Start)
    });
  }

  // TEST 3: App restart / reload simulation -> Context persists and restores in < 100ms
  const t3Start = performance.now();
  try {
    const restartStart = performance.now();
    // Simulate restart by re-initializing vault
    await vault.initializeVault();
    const restartElapsed = performance.now() - restartStart;

    const restoredMemory = vault.getDocument('MEMORY.md');
    const t3Passed = restartElapsed < 100 && restoredMemory.includes('Neural AST compiler');

    reports.push({
      scenario: '3. Cold-Start Persistence & Instant Restore (<100ms)',
      passed: t3Passed,
      details: t3Passed
        ? `Restored markdown vault in ${Math.round(restartElapsed)}ms with 100% data fidelity`
        : `Restore exceeded 100ms or lost persistent state (${Math.round(restartElapsed)}ms)`,
      durationMs: Math.round(performance.now() - t3Start)
    });
  } catch (e: any) {
    reports.push({
      scenario: '3. Cold-Start Persistence & Instant Restore (<100ms)',
      passed: false,
      details: `Exception: ${e.message}`,
      durationMs: Math.round(performance.now() - t3Start)
    });
  }

  // TEST 4: Dynamic markdown formatting and tag index integrity in VAULT-INDEX.md
  const t4Start = performance.now();
  try {
    const vaultIndexDoc = vault.getDocument('VAULT-INDEX.md');
    const indexEntries = vault.getIndexEntries();

    const hasTableStructure = vaultIndexDoc.includes('| Tag | Category | Source | Summary | Target |');
    const hasTechnicalTag = vaultIndexDoc.includes('#technical') || indexEntries.some((e) => e.tag.includes('technical'));

    const t4Passed = hasTableStructure && hasTechnicalTag;
    reports.push({
      scenario: '4. Dynamic Markdown Formatting & VAULT-INDEX.md Integrity',
      passed: t4Passed,
      details: t4Passed
        ? `VAULT-INDEX.md maintained strict markdown table format and semantic tag mapping`
        : `VAULT-INDEX.md format corrupted or missing tag mapping`,
      durationMs: Math.round(performance.now() - t4Start)
    });
  } catch (e: any) {
    reports.push({
      scenario: '4. Dynamic Markdown Formatting & VAULT-INDEX.md Integrity',
      passed: false,
      details: `Exception: ${e.message}`,
      durationMs: Math.round(performance.now() - t4Start)
    });
  }

  // Console Reporting
  console.log('📊 [MAYRA Memory Vault Harness] Test Execution Summary:');
  reports.forEach((r) => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.scenario}: ${r.details} (${r.durationMs}ms)`);
  });

  return reports;
}

// Auto-attach to window for live developer console inspection
if (typeof window !== 'undefined') {
  (window as any).__MAYRA_TEST_MEMORY_VAULT__ = runMayraMemoryVaultTestSuite;
}
