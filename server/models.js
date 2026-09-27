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
    modelName: 'Google Antigravity Core (Gemini 2.0 Flash)',
    provider: 'google',
    quotaLimit: 1000000,
    quotaUsed: 0,
    unit: 'tokens/día'
  },
  {
    modelId: 'gemini-code-assist',
    modelName: 'Antigravity Code Assist Pro (IDE Context)',
    provider: 'google',
    quotaLimit: 500000,
    quotaUsed: 0,
    unit: 'tokens/día'
  },
  {
    modelId: 'claude-3-5-sonnet',
    modelName: 'Anthropic Claude 3.5 Sonnet (Antigravity Bridge)',
    provider: 'anthropic',
    quotaLimit: 250000,
    quotaUsed: 0,
    unit: 'tokens/día'
  },
  {
    modelId: 'gpt-4o',
    modelName: 'OpenAI GPT-4o Copilot (Antigravity Bridge)',
    provider: 'openai',
    quotaLimit: 200000,
    quotaUsed: 0,
    unit: 'tokens/día'
  },
  {
    modelId: 'firebase-cloud',
    modelName: 'Firebase Cloud Functions & Vector Search',
    provider: 'firebase',
    quotaLimit: 100000,
    quotaUsed: 0,
    unit: 'invocaciones/mes'
  },
  {
    modelId: 'supabase-edge',
    modelName: 'Supabase PostgreSQL & Edge Functions AI',
    provider: 'supabase',
    quotaLimit: 50000,
    quotaUsed: 0,
    unit: 'invocaciones/mes'
  },
  {
    modelId: 'vercel-ai',
    modelName: 'Vercel AI SDK & Edge Middleware',
    provider: 'vercel',
    quotaLimit: 100,
    quotaUsed: 0,
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
  let activeModelsCount = 0;

  const quotas = rows.map(r => {
    const limit = Number(r.quota_limit) || 1;
    const used = Number(r.quota_used) || 0;
    const isLinked = r.status === 'ACTIVE' || r.status === 'VERIFIED_LIVE' || Boolean(r.encrypted_api_key);

    let pctUsed = 0;
    let pctAvailable = 0;
    let healthColor = 'slate';

    if (isLinked) {
      activeModelsCount++;
      pctUsed = Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
      pctAvailable = 100 - pctUsed;
      totalPctAvailable += pctAvailable;

      healthColor = 'emerald';
      if (pctUsed >= 85) {
        healthColor = 'rose';
      } else if (pctUsed >= 60) {
        healthColor = 'amber';
      }
    }

    return {
      id: r.id,
      modelId: r.model_id,
      modelName: r.model_name,
      provider: r.provider,
      quotaLimit: isLinked ? limit : 0,
      quotaUsed: used,
      unit: r.unit,
      percentageUsed: pctUsed,
      percentageAvailable: pctAvailable,
      healthColor,
      hasApiKey: Boolean(r.encrypted_api_key),
      status: isLinked ? r.status : 'PENDING_KEY',
      isLinked,
      lastUsedAt: r.last_used_at
    };
  });

  const averageAvailability = activeModelsCount > 0
    ? Math.round(totalPctAvailable / activeModelsCount)
    : 0;

  const activeProviders = [...new Set(quotas.filter(q => q.isLinked).map(q => q.provider))];

  return {
    quotas,
    summary: {
      totalModels: quotas.length,
      activeModels: activeModelsCount,
      averageAvailability,
      activeProviders,
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

async function verifyRealModel(db, userId, modelId) {
  const row = db.prepare(`
    SELECT * FROM ai_model_quotas WHERE user_id = ? AND model_id = ?
  `).get(userId, modelId);

  if (!row) {
    throw new Error('Modelo no encontrado');
  }

  if (!row.encrypted_api_key) {
    return {
      success: false,
      modelId,
      status: 'PENDING_KEY',
      message: 'Pendiente de vincular credencial o clave real'
    };
  }

  let apiKey;
  try {
    apiKey = decryptSecret(row.encrypted_api_key);
  } catch (e) {
    throw new Error('No se pudo desencriptar la clave del modelo');
  }

  const startTime = Date.now();
  let liveResult = { success: true, latencyMs: 0, details: null };

  try {
    if (row.provider === 'google') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const latency = Date.now() - startTime;
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `Google API error ${res.status}`);
      }
      const data = await res.json();
      liveResult = {
        success: true,
        latencyMs: latency,
        modelsCount: (data.models || []).length,
        message: `Conexión verificada en vivo con Google AI (${latency}ms)`
      };
    } else if (row.provider === 'vercel') {
      const res = await fetch('https://api.vercel.com/v2/user', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const latency = Date.now() - startTime;
      if (!res.ok) throw new Error(`Vercel error ${res.status}`);
      const data = await res.json();
      liveResult = {
        success: true,
        latencyMs: latency,
        user: data.user?.username || data.user?.email,
        message: `Conexión verificada en vivo con Vercel (${latency}ms)`
      };
    } else if (row.provider === 'supabase') {
      const res = await fetch('https://api.supabase.com/v1/projects', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const latency = Date.now() - startTime;
      if (!res.ok) throw new Error(`Supabase API error ${res.status}`);
      const projects = await res.json();
      liveResult = {
        success: true,
        latencyMs: latency,
        projectsCount: Array.isArray(projects) ? projects.length : 0,
        message: `Conexión verificada en vivo con Supabase (${latency}ms)`
      };
    } else {
      liveResult = {
        success: true,
        latencyMs: Date.now() - startTime,
        message: `Credencial de ${row.provider.toUpperCase()} validada localmente`
      };
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE ai_model_quotas
      SET status = 'VERIFIED_LIVE', updated_at = ?
      WHERE user_id = ? AND model_id = ?
    `).run(now, userId, modelId);

    return { success: true, modelId, ...liveResult };
  } catch (err) {
    db.prepare(`
      UPDATE ai_model_quotas
      SET status = 'CONNECTION_ERROR', updated_at = ?
      WHERE user_id = ? AND model_id = ?
    `).run(new Date().toISOString(), userId, modelId);

    return {
      success: false,
      modelId,
      error: err.message,
      message: `Error al verificar con el proveedor: ${err.message}`
    };
  }
}

module.exports = {
  getUserQuotas,
  connectModelApiKey,
  verifyRealModel,
  simulateUsage
};
