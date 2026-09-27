/**
 * Antigravity Connector - Central Test Runner
 * Executes all unit, integration, security and isolation tests
 */

const runMultiUserIsolationTests = require('./multiuser_isolation.test');
const runSecurityTests = require('./security_and_crypto.test');
const runAntigravityTests = require('./antigravity_adapter.test');
const runOrchestratorTests = require('./backups_and_orchestrator.test');
const runPremiumDormantTests = require('./premium_dormant.test');
const runModelsAndCloudIdentitiesTests = require('./models_and_cloud_identities.test');

async function main() {
  console.log('===============================================================');
  console.log('  ANTIGRAVITY CONNECTOR — VALIDATION & TEST SUITE');
  console.log('===============================================================');

  const startTime = Date.now();

  try {
    runMultiUserIsolationTests();
    runSecurityTests();
    runAntigravityTests();
    await runOrchestratorTests();
    runPremiumDormantTests();
    runModelsAndCloudIdentitiesTests();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n===============================================================');
    console.log(`  ✅ TODOS LOS TESTS PASARON EXITOSAMENTE (${duration}s)`);
    console.log('  Estado: FUNCIONAL Y VALIDADO');
    console.log('===============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR EN LA VALIDACIÓN:', err);
    process.exit(1);
  }
}

main();
