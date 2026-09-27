/**
 * Security, Cryptography & Emergency Mode Test Suite (Prompt 10 & 02)
 */

const assert = require('node:assert');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { initSchema } = require('../server/db');
const {
  hashPassword,
  verifyPassword,
  encryptSecret,
  decryptSecret,
  isPathSafe,
  scanEnvSecrets,
  logAuditEvent
} = require('../server/security');

function runSecurityTests() {
  console.log('\n[TEST SUITE] Security, Cryptography & Emergency Mode');

  // 1. Password Hashing
  const rawPassword = 'SecureUserPassword2026!';
  const { hash, salt } = hashPassword(rawPassword);
  assert.ok(hash.length >= 64, 'Password hash should be 64+ bytes hex');
  assert.ok(salt.length >= 32, 'Salt should be random hex');
  assert.strictEqual(verifyPassword(rawPassword, salt, hash), true, 'Valid password verification must succeed');
  assert.strictEqual(verifyPassword('WrongPass', salt, hash), false, 'Invalid password must be rejected');
  console.log('  ✔ Password hashing (scrypt) with per-user salt verified');

  // 2. AES-256-GCM Encryption / Decryption
  const secretApiKey = 'sk_live_antigravity_token_secret_998877';
  const encryptedPayload = encryptSecret(secretApiKey);
  assert.ok(encryptedPayload.includes('iv'), 'Encrypted payload must contain IV');
  assert.ok(encryptedPayload.includes('authTag'), 'Encrypted payload must contain GCM authTag');
  assert.strictEqual(decryptSecret(encryptedPayload), secretApiKey, 'Decrypted secret must match original plaintext');
  assert.strictEqual(decryptSecret('invalid_json'), null, 'Corrupted payload must fail safely');
  console.log('  ✔ AES-256-GCM authenticated encryption/decryption verified');

  // 3. Path Traversal Protection
  const allowedRoots = [
    path.resolve('C:/Projects/AllowedApp'),
    path.resolve('D:/Workspaces')
  ];

  assert.strictEqual(isPathSafe('C:/Projects/AllowedApp/src/index.js', allowedRoots), true, 'Safe child path must be allowed');
  assert.strictEqual(isPathSafe('C:/Windows/System32/cmd.exe', allowedRoots), false, 'System32 path traversal must be blocked');
  assert.strictEqual(isPathSafe('C:/Projects/AllowedApp/../../Windows', allowedRoots), false, 'Relative traversal out of root must be blocked');
  console.log('  ✔ Path traversal prevention verified against allowlist');

  // 4. Secret Scanner (Never leaks plaintext)
  const envFileContent = `
    PORT=3000
    NODE_ENV=production
    DATABASE_URL=postgres://admin:super_secret_pw@localhost:5432/db
    API_SECRET_KEY=secret_token_12345
    PUBLIC_SITE_NAME=Antigravity Demo
  `;
  const scan = scanEnvSecrets(envFileContent);
  assert.strictEqual(scan.detected, true, 'Environment file detected');
  assert.strictEqual(scan.totalVars, 5, 'Found 5 variables');
  assert.strictEqual(scan.secretsCount, 2, 'Found 2 potential secrets (DATABASE_URL, API_SECRET_KEY)');
  assert.ok(!JSON.stringify(scan).includes('super_secret_pw'), 'Plaintext secret value must NEVER be present in scan output!');
  console.log('  ✔ Safe secret scanning without plaintext leakage verified');

  // 5. Emergency Mode & Audit Trail
  const db = new DatabaseSync(':memory:');
  initSchema(db);

  logAuditEvent(db, {
    userId: 'usr_admin',
    action: 'TEST_AUDIT',
    resourceType: 'system',
    riskLevel: 'LOW',
    details: { test: true }
  });

  const auditEvents = db.prepare('SELECT * FROM audit_events').all();
  assert.strictEqual(auditEvents.length, 1, 'Audit event must be immutably recorded');
  assert.strictEqual(auditEvents[0].action, 'TEST_AUDIT', 'Audit action matches');
  console.log('  ✔ Audit trail event persistence verified');
}

module.exports = runSecurityTests;

if (require.main === module) {
  runSecurityTests();
}
