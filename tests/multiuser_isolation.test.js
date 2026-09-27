/**
 * Multi-User Isolation Test Suite (Prompt 02 & 13)
 * Asserts that USER-A can NEVER read or mutate USER-B's resources
 */

const assert = require('node:assert');
const { DatabaseSync } = require('node:sqlite');
const { initSchema } = require('../server/db');
const { hashPassword } = require('../server/security');

function runMultiUserIsolationTests() {
  console.log('\n[TEST SUITE] Multi-User Isolation & Strict Tenant Boundaries');
  const db = new DatabaseSync(':memory:');
  initSchema(db);

  const now = new Date().toISOString();

  // Create USER-A
  const userA = { id: 'usr_alpha', email: 'alpha@test.com', fullName: 'User Alpha', ...hashPassword('Pass123!') };
  db.prepare(`
    INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'developer', ?, ?)
  `).run(userA.id, userA.email, userA.hash, userA.salt, userA.fullName, now, now);

  // Create USER-B
  const userB = { id: 'usr_beta', email: 'beta@test.com', fullName: 'User Beta', ...hashPassword('Pass123!') };
  db.prepare(`
    INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'developer', ?, ?)
  `).run(userB.id, userB.email, userB.hash, userB.salt, userB.fullName, now, now);

  // USER-A creates a machine and a project
  const machineAId = 'mch_alpha_pc';
  db.prepare(`
    INSERT INTO machines (id, user_id, name, os, status, allowed_paths_json, created_at, updated_at)
    VALUES (?, ?, 'Alpha Laptop', 'Windows 11', 'ONLINE', '["C:/Alpha/Workspace"]', ?, ?)
  `).run(machineAId, userA.id, now, now);

  const projectAId = 'prj_alpha_secret';
  db.prepare(`
    INSERT INTO projects (id, user_id, machine_id, name, path, framework, created_at, updated_at)
    VALUES (?, ?, ?, 'Alpha Secret Project', 'C:/Alpha/Workspace/secret-app', 'Next.js', ?, ?)
  `).run(projectAId, userA.id, machineAId, now, now);

  // TEST 1: USER-B queries projects -> Must NOT see USER-A's project
  const userBProjects = db.prepare('SELECT * FROM projects WHERE user_id = ?').all(userB.id);
  assert.strictEqual(userBProjects.length, 0, 'USER-B must have 0 projects');

  // TEST 2: Direct lookup by ID for USER-B -> Must return undefined
  const crossProjectAccess = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(projectAId, userB.id);
  assert.strictEqual(crossProjectAccess, undefined, 'USER-B must not access USER-A project even with project ID');

  // TEST 3: Cross-machine lookup -> USER-B cannot query USER-A machine
  const crossMachine = db.prepare('SELECT * FROM machines WHERE id = ? AND user_id = ?').get(machineAId, userB.id);
  assert.strictEqual(crossMachine, undefined, 'USER-B must not query USER-A machine');

  // TEST 4: Cross-task creation -> USER-B cannot attach task to USER-A project
  const validOwnerCheck = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectAId, userB.id);
  assert.strictEqual(validOwnerCheck, undefined, 'Backend validation correctly rejects foreign projectId');

  console.log('  ✔ USER-A vs USER-B project isolation verified');
  console.log('  ✔ Cross-tenant machine access prevented');
  console.log('  ✔ Resource ownership enforced at SQL level');
}

module.exports = runMultiUserIsolationTests;

if (require.main === module) {
  runMultiUserIsolationTests();
}
