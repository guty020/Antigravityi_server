/**
 * Antigravity Connector - Premium Infrastructure (Dormant / Desactivada)
 * Strictly implements Prompt 18:
 * - Master Flag: PREMIUM_DISABLED = true (premium_mode_enabled = false)
 * - 100% full unlimited access for all users while dormant
 * - Decoupled from user schema
 * - Default parameters: 1.50 EUR/month
 * - Full audit trail for admin toggle changes
 * - Stripe ready without charging
 */

const { logAuditEvent } = require('./security');

class PremiumManager {
  /**
   * Get current global premium settings
   */
  getSettings(db) {
    const enabledRow = db.prepare('SELECT value_json FROM system_settings WHERE key = ?').get('premium_mode_enabled');
    const pricingRow = db.prepare('SELECT value_json FROM system_settings WHERE key = ?').get('premium_pricing');

    const isEnabled = enabledRow ? JSON.parse(enabledRow.value_json) : false;
    const pricing = pricingRow ? JSON.parse(pricingRow.value_json) : { default_price: 1.50, currency: 'EUR', interval: 'month' };

    return {
      premium_mode_enabled: isEnabled,
      premium_default_price: pricing.default_price,
      premium_currency: pricing.currency,
      premium_billing_interval: pricing.interval,
      status: isEnabled ? 'ACTIVE_COMMERCIAL' : 'DORMANT_UNLIMITED_FREE'
    };
  }

  /**
   * Update global premium settings (Admin only, audited)
   */
  updateSettings(db, { adminUserId, enabled, defaultPrice, currency, interval, ip = null }) {
    const oldSettings = this.getSettings(db);
    const now = new Date().toISOString();

    if (typeof enabled === 'boolean') {
      db.prepare('UPDATE system_settings SET value_json = ?, updated_by = ?, updated_at = ? WHERE key = ?').run(
        JSON.stringify(enabled),
        adminUserId,
        now,
        'premium_mode_enabled'
      );
    }

    if (defaultPrice !== undefined || currency || interval) {
      const newPricing = {
        default_price: defaultPrice !== undefined ? Number(defaultPrice) : oldSettings.premium_default_price,
        currency: currency || oldSettings.premium_currency,
        interval: interval || oldSettings.premium_billing_interval
      };
      db.prepare('UPDATE system_settings SET value_json = ?, updated_by = ?, updated_at = ? WHERE key = ?').run(
        JSON.stringify(newPricing),
        adminUserId,
        now,
        'premium_pricing'
      );
    }

    const newSettings = this.getSettings(db);

    // Audit log
    logAuditEvent(db, {
      userId: adminUserId,
      action: 'UPDATE_PREMIUM_SETTINGS',
      resourceType: 'system_settings',
      resourceId: 'premium_mode_enabled',
      riskLevel: 'MEDIUM',
      ip,
      details: {
        oldSettings,
        newSettings
      }
    });

    return newSettings;
  }

  /**
   * Evaluate if a feature is allowed for a user
   * Rule: If premium_mode_enabled is false, ALWAYS return granted / allow = true!
   */
  isFeatureAllowed(db, userId, featureKey) {
    const settings = this.getSettings(db);

    // DORMANT RULE: while premium_mode_enabled == false, everything is granted without limits
    if (!settings.premium_mode_enabled) {
      return {
        granted: true,
        allowed: true,
        limit: -1,
        mode: 'DORMANT_UNLIMITED_ACCESS',
        message: 'Acceso total y completo sin restricciones concedido (Modo Gratuito Ilimitado activo)'
      };
    }

    // If premium is enabled, check user subscription
    const sub = db.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? AND status = ?').get(userId, 'active');
    const isSubscribed = Boolean(sub);

    const entitlement = db.prepare('SELECT * FROM feature_entitlements WHERE key = ?').get(featureKey);
    const val = isSubscribed 
      ? (entitlement ? entitlement.premium_value : '-1') 
      : (entitlement ? entitlement.default_value : '-1');

    return {
      granted: val !== 'false',
      allowed: val !== 'false',
      limit: val,
      mode: isSubscribed ? 'PREMIUM_SUBSCRIBER' : 'FREE_TIER',
      message: isSubscribed ? 'Plan Premium Activo' : 'Nivel Gratuito'
    };
  }

  /**
   * List subscription plans
   */
  listPlans(db) {
    return db.prepare('SELECT * FROM subscription_plans').all();
  }

  /**
   * Get user subscription status
   */
  getUserSubscription(db, userId) {
    const sub = db.prepare(`
      SELECT s.*, p.name as plan_name, p.amount, p.currency, p.interval
      FROM user_subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = ?
    `).get(userId);

    const settings = this.getSettings(db);

    return {
      subscription: sub || null,
      globalMode: settings.status,
      isDormant: !settings.premium_mode_enabled,
      hasFullAccess: true // Always true while dormant!
    };
  }
}

module.exports = new PremiumManager();
