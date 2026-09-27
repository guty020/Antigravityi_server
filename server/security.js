/**
 * Antigravity Connector - Security, Crypto, and Authorization Engine
 */

const crypto = require('node:crypto');
const path = require('node:path');

// Master encryption key for storing provider tokens securely at rest
const MASTER_SECRET = process.env.APP_SECRET || 'antigravity_master_secret_2026_super_secure_key_32b';
const CIPHER_ALGO = 'aes-256-gcm';

function getDerivedKey() {
  return crypto.scryptSync(MASTER_SECRET, 'salt_antigravity_vault', 32);
}

/**
 * Hash password with per-user salt using scrypt
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    salt,
    hash: derivedKey.toString('hex')
  };
}

/**
 * Verify password against stored hash and salt
 */
function verifyPassword(password, salt, hash) {
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(derivedKey.toString('hex')), Buffer.from(hash));
}

/**
 * Encrypt sensitive credentials (e.g. OAuth tokens, API keys) using AES-256-GCM
 */
function encryptSecret(plaintext) {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(12);
  const key = getDerivedKey();
  const cipher = crypto.createCipheriv(CIPHER_ALGO, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return JSON.stringify({
    iv: iv.toString('hex'),
    authTag,
    encrypted
  });
}

/**
 * Decrypt sensitive credentials using AES-256-GCM
 */
function decryptSecret(encryptedPayload) {
  if (!encryptedPayload) return null;
  try {
    const { iv, authTag, encrypted } = JSON.parse(encryptedPayload);
    const key = getDerivedKey();
    const decipher = crypto.createDecipheriv(CIPHER_ALGO, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

/**
 * Generate a cryptographically secure random session token
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a 6-digit numeric pairing code (e.g. "482-195")
 */
function generatePairingCode() {
  const num1 = crypto.randomInt(100, 999);
  const num2 = crypto.randomInt(100, 999);
  return `${num1}-${num2}`;
}

/**
 * Safe path traversal validator
 * Returns true if targetPath is strictly inside one of the allowedPaths
 */
function isPathSafe(targetPath, allowedPaths) {
  if (!targetPath || !Array.isArray(allowedPaths) || allowedPaths.length === 0) {
    return false;
  }
  const resolvedTarget = path.resolve(targetPath).toLowerCase();
  return allowedPaths.some(allowed => {
    const resolvedAllowed = path.resolve(allowed).toLowerCase();
    return resolvedTarget === resolvedAllowed || resolvedTarget.startsWith(resolvedAllowed + path.sep);
  });
}

/**
 * Secret scanner for environment files
 * Identifies keys without ever returning secret values!
 */
function scanEnvSecrets(envContent) {
  if (!envContent) return { detected: false, totalVars: 0, secretKeys: [] };

  const lines = envContent.split(/\r?\n/);
  const secretKeys = [];
  let totalVars = 0;

  const secretKeywords = [
    'KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'PASS', 'PRIVATE',
    'AUTH', 'CREDENTIAL', 'API_KEY', 'DATABASE_URL', 'ACCESS_KEY'
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=/);
    if (match) {
      totalVars++;
      const keyName = match[1];
      const isSensitive = secretKeywords.some(keyword => keyName.toUpperCase().includes(keyword));
      if (isSensitive) {
        secretKeys.push(keyName);
      }
    }
  }

  return {
    detected: true,
    totalVars,
    secretsCount: secretKeys.length,
    secretKeys
  };
}

/**
 * Record an immutable audit log event
 */
function logAuditEvent(db, { userId, action, resourceType, resourceId, riskLevel = 'LOW', ip = null, details = {} }) {
  const id = 'audit_' + crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO audit_events (id, user_id, action, resource_type, resource_id, risk_level, ip_address, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, action, resourceType, resourceId || null, riskLevel, ip, JSON.stringify(details), now);
  return id;
}

module.exports = {
  hashPassword,
  verifyPassword,
  encryptSecret,
  decryptSecret,
  generateSessionToken,
  generatePairingCode,
  isPathSafe,
  scanEnvSecrets,
  logAuditEvent
};
