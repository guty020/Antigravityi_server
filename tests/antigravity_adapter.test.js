/**
 * Antigravity Adapter & Capabilities Test Suite (Prompt 05)
 */

const assert = require('node:assert');
const antigravity = require('../server/antigravity');

function runAntigravityTests() {
  console.log('\n[TEST SUITE] Antigravity Adapter & Capability Matrix');

  const capabilities = antigravity.capabilities();
  assert.ok(Array.isArray(capabilities), 'Capabilities must be an array');
  assert.ok(capabilities.length >= 4, 'Must return at least 4 capability items');

  // Rule 00 & 05: Mock/fake cloud endpoints MUST be NOT_SUPPORTED
  const cloudControl = capabilities.find(c => c.capability === 'remote_cloud_control');
  assert.ok(cloudControl, 'remote_cloud_control capability must be explicitly registered');
  assert.strictEqual(cloudControl.supported, false, 'Non-existent cloud control must NOT be marked as supported');
  assert.ok(cloudControl.limitation.includes('NOT_SUPPORTED'), 'Limitation must state NOT_SUPPORTED');

  const localInstall = capabilities.find(c => c.capability === 'local_installation_discovery');
  assert.ok(localInstall, 'local_installation_discovery must be present');

  const status = antigravity.status();
  assert.ok(['CONNECTED', 'DEGRADED', 'DISCONNECTED'].includes(status.connectionState), 'Status must be a valid state');

  console.log('  ✔ Capability matrix verified without mock APIs');
  console.log('  ✔ Strictly enforced NOT_SUPPORTED for non-official cloud endpoints');
  console.log('  ✔ Local discovery inspection verified');
}

module.exports = runAntigravityTests;

if (require.main === module) {
  runAntigravityTests();
}
