/**
 * Task Orchestrator & 3-Level Backups Test Suite (Prompt 08 & 09)
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { initSchema } = require('../server/db');
const orchestrator = require('../server/orchestrator');
const backupManager = require('../server/backups');

async function runOrchestratorTests() {
  console.log('\n[TEST SUITE] Task Orchestrator, Workspace Locks & 3-Level Backups');

  // 1. Risk Classification
  assert.strictEqual(orchestrator.classifyRisk('Inspeccionar estado de archivos', 'git status'), 'LOW');
  assert.strictEqual(orchestrator.classifyRisk('Ejecutar pruebas unitarias', 'npm test'), 'MEDIUM');
  assert.strictEqual(orchestrator.classifyRisk('Subir cambios a repositorio', 'git push origin main'), 'HIGH');
  assert.strictEqual(orchestrator.classifyRisk('Desplegar en producción', 'vercel --prod'), 'CRITICAL');
  console.log('  ✔ Risk classification (LOW, MEDIUM, HIGH, CRITICAL) verified');

  // 2. 3-Level Backup - Local Snapshot & Checksum
  const testDir = path.resolve(__dirname, '..', 'server');
  const snapshotRes = backupManager.createLocalSnapshot(testDir, 'test_suite_project');
  assert.strictEqual(snapshotRes.status, 'VERIFIED', 'Local snapshot must be verified');
  assert.ok(snapshotRes.checksum.length === 64, 'Checksum must be SHA-256 (64 hex characters)');
  assert.ok(fs.existsSync(snapshotRes.backupPath), 'Snapshot archive must exist on disk');
  console.log('  ✔ Local snapshot compression and SHA-256 checksum verified');

  // 3. Workspace Mutex Lock
  const db = new DatabaseSync(':memory:');
  initSchema(db);

  const userId = 'usr_tester_1';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at, updated_at)
    VALUES (?, 'tester@test.com', 'hash', 'salt', 'Tester', 'developer', datetime('now'), datetime('now'))
  `).run(userId);

  db.prepare(`
    INSERT INTO machines (id, user_id, name, os, status, created_at, updated_at)
    VALUES ('mch_1', ?, 'Test PC', 'Windows', 'ONLINE', datetime('now'), datetime('now'))
  `).run(userId);

  const projectPath = path.resolve(__dirname, '..');
  db.prepare(`
    INSERT INTO projects (id, user_id, machine_id, name, path, framework, created_at, updated_at)
    VALUES ('prj_lock_test', ?, 'mch_1', 'Lock Project', ?, 'Node.js', datetime('now'), datetime('now'))
  `).run(userId, projectPath);

  // High risk task requires approval in SUPERVISED mode
  const task = await orchestrator.createTask(db, {
    userId,
    projectId: 'prj_lock_test',
    title: 'Deploy to Cloud',
    intent: 'deploy production',
    mode: 'SUPERVISED'
  });

  assert.strictEqual(task.status, 'WAITING_APPROVAL', 'CRITICAL task must start in WAITING_APPROVAL');
  assert.strictEqual(task.risk_level, 'CRITICAL', 'Deploy intent must be classified CRITICAL');
  console.log('  ✔ Supervised approval gate for CRITICAL operations verified');
}

module.exports = runOrchestratorTests;

if (require.main === module) {
  runOrchestratorTests();
}
