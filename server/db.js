/**
 * Antigravity Connector - Database Layer
 * Uses Node 24 native DatabaseSync (node:sqlite)
 * Zero external native compilation dependencies
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

// Ensure data directory exists
const DATA_DIR = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'antigravity_connector.db');

let dbInstance = null;

function getDb(customPath) {
  if (customPath) {
    const db = new DatabaseSync(customPath);
    initSchema(db);
    return db;
  }
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'developer', -- 'admin', 'developer', 'viewer'
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Connected Machines (Agent Connector)
    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      hostname TEXT,
      os TEXT NOT NULL,
      platform TEXT,
      arch TEXT,
      status TEXT NOT NULL DEFAULT 'OFFLINE', -- 'ONLINE', 'CONNECTING', 'OFFLINE', 'ERROR', 'MAINTENANCE'
      pairing_code TEXT,
      pairing_expires_at TEXT,
      pairing_token TEXT UNIQUE,
      allowed_paths_json TEXT NOT NULL DEFAULT '[]',
      capabilities_json TEXT NOT NULL DEFAULT '{}',
      last_heartbeat_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Workspaces
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      is_authorized INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
    );

    -- Discovered Projects
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      workspace_id TEXT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      framework TEXT,
      language TEXT,
      runtime TEXT,
      package_manager TEXT,
      git_branch TEXT,
      git_remote TEXT,
      git_last_commit TEXT,
      has_docker INTEGER NOT NULL DEFAULT 0,
      has_firebase INTEGER NOT NULL DEFAULT 0,
      has_supabase INTEGER NOT NULL DEFAULT 0,
      has_vercel INTEGER NOT NULL DEFAULT 0,
      has_netlify INTEGER NOT NULL DEFAULT 0,
      has_cloudflare INTEGER NOT NULL DEFAULT 0,
      env_detected INTEGER NOT NULL DEFAULT 0,
      env_vars_count INTEGER NOT NULL DEFAULT 0,
      secrets_detected_count INTEGER NOT NULL DEFAULT 0,
      passport_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
    );

    -- External Integrations
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL, -- 'github', 'gitlab', 'firebase', 'supabase', 'vercel', etc.
      status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED', -- 'NOT_CONFIGURED', 'CONFIGURED', 'CONNECTED', 'READY', 'DEGRADED', 'ERROR', 'NOT_SUPPORTED'
      encrypted_credentials TEXT,
      scopes_json TEXT NOT NULL DEFAULT '[]',
      config_json TEXT NOT NULL DEFAULT '{}',
      last_tested_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Tasks & Orchestrator
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      machine_id TEXT,
      project_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      intent TEXT,
      mode TEXT NOT NULL DEFAULT 'SUPERVISED', -- 'SUPERVISED', 'AUTOMATIC'
      risk_level TEXT NOT NULL DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'QUEUED', 'PLANNING', 'RUNNING', 'WAITING_INPUT', 'WAITING_APPROVAL', 'TESTING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED'
      approval_status TEXT NOT NULL DEFAULT 'NONE', -- 'NONE', 'PENDING', 'APPROVED', 'REJECTED'
      steps_json TEXT NOT NULL DEFAULT '[]',
      logs TEXT NOT NULL DEFAULT '',
      result_json TEXT NOT NULL DEFAULT '{}',
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    -- Backups (3-Levels: Git Checkpoint, Local Snapshot, Remote Backup)
    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      level TEXT NOT NULL, -- 'git_checkpoint', 'local_snapshot', 'remote_backup'
      backup_path TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      checksum TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CREATED', -- 'VERIFIED', 'CREATED', 'FAILED', 'RESTORED'
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Comprehensive Audit Trail
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      risk_level TEXT NOT NULL DEFAULT 'LOW',
      ip_address TEXT,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    -- System Global Settings
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_by TEXT,
      updated_at TEXT NOT NULL
    );

    -- Subscription Plans (Premium module)
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      interval TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0
    );

    -- User Subscriptions (Decoupled from users table)
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'dormant', -- 'dormant', 'inactive', 'active'
      provider TEXT NOT NULL DEFAULT 'stripe',
      customer_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
    );

    -- Feature Entitlements
    CREATE TABLE IF NOT EXISTS feature_entitlements (
      key TEXT PRIMARY KEY,
      default_value TEXT NOT NULL,
      premium_value TEXT NOT NULL,
      description TEXT NOT NULL
    );

    -- Monitoring Alerts
    CREATE TABLE IF NOT EXISTS monitoring_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      severity TEXT NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'RESOLVED'
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed default configuration if empty
  seedDefaults(db);
}

function seedDefaults(db) {
  const now = new Date().toISOString();

  // Settings
  const settingsCheck = db.prepare('SELECT count(*) as count FROM system_settings WHERE key = ?').get('premium_mode_enabled');
  if (settingsCheck.count === 0) {
    db.prepare('INSERT INTO system_settings (key, value_json, updated_by, updated_at) VALUES (?, ?, ?, ?)').run(
      'premium_mode_enabled',
      JSON.stringify(false),
      'system',
      now
    );
    db.prepare('INSERT INTO system_settings (key, value_json, updated_by, updated_at) VALUES (?, ?, ?, ?)').run(
      'premium_pricing',
      JSON.stringify({ default_price: 1.50, currency: 'EUR', interval: 'month' }),
      'system',
      now
    );
    db.prepare('INSERT INTO system_settings (key, value_json, updated_by, updated_at) VALUES (?, ?, ?, ?)').run(
      'emergency_mode_enabled',
      JSON.stringify(false),
      'system',
      now
    );
  }

  // Subscription plan
  const planCheck = db.prepare('SELECT count(*) as count FROM subscription_plans WHERE code = ?').get('premium_monthly');
  if (planCheck.count === 0) {
    db.prepare(`
      INSERT INTO subscription_plans (id, code, name, amount, currency, interval, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('plan_premium_monthly', 'premium_monthly', 'Antigravity Premium Monthly', 1.50, 'EUR', 'month', 0);
  }

  // Feature entitlements seed
  const entitlements = [
    { key: 'max_projects', def: '-1', prem: '-1', desc: 'Maximo de proyectos administrables (-1 = ilimitado)' },
    { key: 'sync_interval_seconds', def: '5', prem: '2', desc: 'Frecuencia de sincronizacion en segundos' },
    { key: 'max_connected_pcs', def: '-1', prem: '-1', desc: 'Numero maximo de PCs conectados simultaneamente' },
    { key: 'backups_enabled', def: 'true', prem: 'true', desc: 'Capacidad de realizar backups de 3 niveles' },
    { key: 'cloud_storage_mb', def: '10240', prem: '51200', desc: 'Almacenamiento de snapshots en MB' },
    { key: 'automation_pipelines', def: '-1', prem: '-1', desc: 'Pipelines de orquestacion automatica' },
    { key: 'monitoring_retention', def: '30', prem: '90', desc: 'Retencion de eventos de monitorizacion en dias' },
    { key: 'history_retention_days', def: '60', prem: '365', desc: 'Retencion de historial y auditoria en dias' },
    { key: 'ai_features_enabled', def: 'true', prem: 'true', desc: 'Acceso a diagnosticos y auto-reparacion asistida' }
  ];

  for (const ent of entitlements) {
    const exists = db.prepare('SELECT count(*) as count FROM feature_entitlements WHERE key = ?').get(ent.key);
    if (exists.count === 0) {
      db.prepare(`
        INSERT INTO feature_entitlements (key, default_value, premium_value, description)
        VALUES (?, ?, ?, ?)
      `).run(ent.key, ent.def, ent.prem, ent.desc);
    }
  }
}

module.exports = {
  getDb,
  initSchema
};
