/**
 * Test Suite: Multi-Provider Cloud Identities & AI Model Quotas
 */

const assert = require('node:assert');
const { getDb } = require('../server/db');
const modelsEngine = require('../server/models');
const { encryptSecret, decryptSecret } = require('../server/security');

function runModelsAndCloudIdentitiesTests() {
  console.log('\n[TEST SUITE] Multi-Provider Cloud Identities & AI Model Quotas');

  const db = getDb();
  const testUserId = 'test_usr_ai_' + Date.now();
  const now = new Date().toISOString();

  // Create test user in DB to satisfy foreign keys
  db.prepare(`
    INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at, updated_at)
    VALUES (?, ?, 'hash', 'salt', 'Test AI User', 'developer', ?, ?)
  `).run(testUserId, `${testUserId}@example.com`, now, now);

  // 1. Quota seeding and calculation
  const quotaData = modelsEngine.getUserQuotas(db, testUserId);
  assert.ok(quotaData.quotas.length >= 7, 'Debe inicializar al menos 7 modelos/servicios de IA');
  assert.ok(quotaData.summary.averageAvailability > 0, 'La disponibilidad media debe ser positiva');
  console.log('  ✔ Inicialización automática y cálculo de cuotas por modelo verificado');

  // 2. Encryption of API Keys
  const geminiModel = quotaData.quotas.find(q => q.modelId === 'gemini-2-flash');
  assert.ok(geminiModel, 'Modelo gemini-2-flash debe existir');

  const rawKey = 'AIzaSyDemoSecureKey2026';
  modelsEngine.connectModelApiKey(db, testUserId, 'gemini-2-flash', rawKey);

  const updatedQuotas = modelsEngine.getUserQuotas(db, testUserId);
  const updatedGemini = updatedQuotas.quotas.find(q => q.modelId === 'gemini-2-flash');
  assert.strictEqual(updatedGemini.hasApiKey, true, 'Debe indicar que la API Key está configurada');

  // Verify DB raw storage is encrypted (not plaintext)
  const row = db.prepare('SELECT encrypted_api_key FROM ai_model_quotas WHERE user_id = ? AND model_id = ?').get(testUserId, 'gemini-2-flash');
  assert.notStrictEqual(row.encrypted_api_key, rawKey, 'La clave nunca debe almacenarse en texto plano');
  assert.strictEqual(decryptSecret(row.encrypted_api_key), rawKey, 'Debe desencriptarse con la clave maestra');
  console.log('  ✔ Encriptación autenticada AES-256-GCM de API Keys de modelos verificada');

  // 3. Quota usage simulation
  const initialUsed = updatedGemini.quotaUsed;
  const simResult = modelsEngine.simulateUsage(db, testUserId, 'gemini-2-flash', 5000);
  assert.strictEqual(simResult.consumed, 5000, 'Debe registrar 5000 tokens consumidos');
  assert.strictEqual(simResult.newTotalUsed, initialUsed + 5000, 'El nuevo total debe incrementarse exactamente');
  console.log('  ✔ Simulación y consumo en tiempo real de cuotas verificado');

  // 4. Provider identities registration
  const providers = ['google', 'supabase', 'firebase', 'vercel', 'github'];
  providers.forEach(p => {
    const idnId = `idn_test_${p}_${Date.now()}`;
    const timestamp = new Date().toISOString();
    db.prepare(`
      INSERT INTO identities (id, user_id, provider, provider_user_id, email, display_name, scopes_json, is_verified, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(idnId, testUserId, p, `uid_${p}_123`, `test@${p}.com`, `Test ${p}`, '["read", "write"]', 1, '{}', timestamp, timestamp);
  });

  const allIdentities = db.prepare('SELECT count(*) as count FROM identities WHERE user_id = ?').get(testUserId).count;
  assert.strictEqual(allIdentities, 5, 'Debe soportar identidades de Google, Supabase, Firebase, Vercel y GitHub');
  console.log('  ✔ Identidades multi-proveedor (Google, Supabase, Firebase, Vercel, GitHub) verificadas');
}

module.exports = runModelsAndCloudIdentitiesTests;
