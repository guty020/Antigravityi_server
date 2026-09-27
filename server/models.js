/**
 * Antigravity Connector — Multi-Model AI Quota & Cloud Usage Engine
 * Manages quota tracking, encrypted API keys, and real-time usage meters for:
 * - Google Gemini (Antigravity Engine & Code Assist)
 * - Anthropic Claude
 * - OpenAI GPT-4o
 * - Supabase Edge Functions
 * - Firebase Cloud Services
 * - Vercel AI & Edge
 */

const crypto = require('node:crypto');
const { encryptSecret, decryptSecret } = require('./security');

const DEFAULT_MODELS = [
  {
    modelId: 'gemini-2-flash',
    modelName: 'Google Gemini 2.0 Flash (Antigravity Core)',
    provider: 'google',
    quotaLimit: 1000000,
    quotaUsed: 165000,
    unit: 'tokens/día'
  },
  {
    modelId: 'gemini-code-assist',
    modelName: 'Gemini Code Assist Pro (IDE Context)',
    provider: 'google',
    quotaLimit: 500000,
    quotaUsed: 42000,
    unit: 'tokens/día'
  },
  {
    modelId: 'claude-3-5-sonnet',
    modelName: 'Anthropic Claude 3.5 Sonnet (Antigravity Bridge)',
    provider: 'anthropic',
    quotaLimit: 250000,
    quotaUsed: 82500,
    unit: 'tokens/día'
  },
  {
    modelId: 'gpt-4o',
    modelName: 'OpenAI GPT-4o / Codex Multi-Modal Engine',
    provider: 'openai',
    quotaLimit: 500000,
    quotaUsed: 145000,
    unit: 'tokens/día'
  },
  {
    modelId: 'supabase-edge',
    modelName: 'Supabase PostgreSQL & Edge Functions AI',
    provider: 'supabase',
    quotaLimit: 50000,
    quotaUsed: 4800,
    unit: 'invocaciones/mes'
  },
  {
    modelId: 'firebase-cloud',
    modelName: 'Firebase Cloud Functions & Vector Search',
    provider: 'firebase',
    quotaLimit: 100000,
    quotaUsed: 12300,
    unit: 'invocaciones/mes'
  },
  {
    modelId: 'vercel-ai',
    modelName: 'Vercel AI SDK & Serverless Edge',
    provider: 'vercel',
    quotaLimit: 100,
    quotaUsed: 18.5,
    unit: 'GB transferencia'
  }
];

function seedDefaultQuotas(db, userId) {
  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO ai_model_quotas (
      id, user_id, model_id, model_name, provider,
      quota_limit, quota_used, unit, status, last_used_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
  `);

  DEFAULT_MODELS.forEach(m => {
    const id = 'qta_' + crypto.randomUUID();
    insertStmt.run(
      id, userId, m.modelId, m.modelName, m.provider,
      m.quotaLimit, m.quotaUsed, m.unit, now, now, now
    );
  });
}

function getUserQuotas(db, userId) {
  let rows = db.prepare(`
    SELECT * FROM ai_model_quotas WHERE user_id = ? ORDER BY provider ASC, model_name ASC
  `).all(userId);

  if (rows.length === 0) {
    seedDefaultQuotas(db, userId);
    rows = db.prepare(`
      SELECT * FROM ai_model_quotas WHERE user_id = ? ORDER BY provider ASC, model_name ASC
    `).all(userId);
  }

  let totalPctAvailable = 0;

  const quotas = rows.map(r => {
    const limit = Number(r.quota_limit) || 1;
    const used = Number(r.quota_used) || 0;
    const pctUsed = Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
    const pctAvailable = 100 - pctUsed;
    totalPctAvailable += pctAvailable;

    let healthColor = 'emerald'; // green
    if (pctUsed >= 85) {
      healthColor = 'rose'; // red
    } else if (pctUsed >= 60) {
      healthColor = 'amber'; // yellow
    }

    return {
      id: r.id,
      modelId: r.model_id,
      modelName: r.model_name,
      provider: r.provider,
      quotaLimit: limit,
      quotaUsed: used,
      unit: r.unit,
      percentageUsed: pctUsed,
      percentageAvailable: pctAvailable,
      healthColor,
      hasApiKey: Boolean(r.encrypted_api_key),
      status: r.status,
      lastUsedAt: r.last_used_at
    };
  });

  const averageAvailability = quotas.length > 0
    ? Math.round(totalPctAvailable / quotas.length)
    : 100;

  return {
    quotas,
    summary: {
      totalModels: quotas.length,
      averageAvailability,
      activeProviders: [...new Set(quotas.map(q => q.provider))],
      timestamp: new Date().toISOString()
    }
  };
}

function connectModelApiKey(db, userId, modelId, apiKey) {
  if (!apiKey || apiKey.length < 4) {
    throw new Error('API Key o token inválido');
  }

  const encrypted = encryptSecret(apiKey);
  const now = new Date().toISOString();

  // Ensure record exists
  const existing = db.prepare(`
    SELECT id FROM ai_model_quotas WHERE user_id = ? AND model_id = ?
  `).get(userId, modelId);

  if (!existing) {
    seedDefaultQuotas(db, userId);
  }

  db.prepare(`
    UPDATE ai_model_quotas
    SET encrypted_api_key = ?, status = 'ACTIVE', updated_at = ?
    WHERE user_id = ? AND model_id = ?
  `).run(encrypted, now, userId, modelId);

  return { success: true, modelId, message: 'Clave de modelo vinculada y encriptada de forma segura' };
}

function simulateUsage(db, userId, modelId, amount = null) {
  const existing = db.prepare(`
    SELECT * FROM ai_model_quotas WHERE user_id = ? AND model_id = ?
  `).get(userId, modelId);

  if (!existing) {
    seedDefaultQuotas(db, userId);
  }

  const target = db.prepare(`
    SELECT * FROM ai_model_quotas WHERE user_id = ? AND model_id = ?
  `).get(userId, modelId);

  let delta = amount;
  if (!delta) {
    if (target.unit.includes('GB')) {
      delta = 1.25;
    } else if (target.unit.includes('invocaciones')) {
      delta = 350;
    } else {
      delta = Math.floor(Math.random() * 8000) + 2500;
    }
  }

  const newUsed = Math.min(target.quota_limit, Number(target.quota_used) + delta);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE ai_model_quotas
    SET quota_used = ?, last_used_at = ?, updated_at = ?
    WHERE user_id = ? AND model_id = ?
  `).run(newUsed, now, now, userId, modelId);

  return {
    success: true,
    modelId,
    consumed: delta,
    newTotalUsed: newUsed,
    percentageAvailable: Math.max(0, 100 - Math.round((newUsed / target.quota_limit) * 100))
  };
}

module.exports = {
  getUserQuotas,
  connectModelApiKey,
  simulateUsage
};
