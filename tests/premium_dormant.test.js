/**
 * Premium Infrastructure (Dormant Mode) Test Suite (Prompt 18)
 */

const assert = require('node:assert');
const { DatabaseSync } = require('node:sqlite');
const { initSchema } = require('../server/db');
const premium = require('../server/premium');

function runPremiumDormantTests() {
  console.log('\n[TEST SUITE] Premium Infrastructure (Dormant Mode / Desactivada)');
  const db = new DatabaseSync(':memory:');
  initSchema(db);

  // 1. Initial State: Must be Dormant / Disabled
  const settings = premium.getSettings(db);
  assert.strictEqual(settings.premium_mode_enabled, false, 'Premium MUST be initially disabled (dormant)');
  assert.strictEqual(settings.premium_default_price, 1.50, 'Configured price should be 1.50 EUR');
  assert.strictEqual(settings.premium_currency, 'EUR', 'Currency EUR');
  assert.strictEqual(settings.status, 'DORMANT_UNLIMITED_FREE', 'Status must be DORMANT_UNLIMITED_FREE');
  console.log('  ✔ Initial dormant state (PREMIUM_DISABLED = true, 1.50 EUR/month) verified');

  // 2. Evaluator check: Free user gets 100% unrestricted access
  const freeUserId = 'usr_free_user_123';
  const projectAccess = premium.isFeatureAllowed(db, freeUserId, 'max_projects');
  assert.strictEqual(projectAccess.granted, true, 'User must have full access granted');
  assert.strictEqual(projectAccess.mode, 'DORMANT_UNLIMITED_ACCESS', 'Mode must report dormant unlimited access');

  const backupAccess = premium.isFeatureAllowed(db, freeUserId, 'backups_enabled');
  assert.strictEqual(backupAccess.granted, true, 'Backups must be allowed without restrictions');

  const pcAccess = premium.isFeatureAllowed(db, freeUserId, 'max_connected_pcs');
  assert.strictEqual(pcAccess.granted, true, 'Connected PCs must be unrestricted');
  console.log('  ✔ 100% unrestricted access for all users while dormant verified');

  // 3. Admin toggle updates with audit log
  const adminId = 'usr_admin_master';
  premium.updateSettings(db, { adminUserId: adminId, enabled: true });

  const updatedSettings = premium.getSettings(db);
  assert.strictEqual(updatedSettings.premium_mode_enabled, true, 'Admin can toggle setting');

  const auditEvents = db.prepare('SELECT * FROM audit_events WHERE action = ?').all('UPDATE_PREMIUM_SETTINGS');
  assert.strictEqual(auditEvents.length, 1, 'Audit log MUST record the admin toggle action');
  const details = JSON.parse(auditEvents[0].details_json);
  assert.strictEqual(details.oldSettings.premium_mode_enabled, false, 'Old value recorded in audit');
  assert.strictEqual(details.newSettings.premium_mode_enabled, true, 'New value recorded in audit');
  console.log('  ✔ Admin toggle with strict audit logging verified');
}

module.exports = runPremiumDormantTests;

if (require.main === module) {
  runPremiumDormantTests();
}
