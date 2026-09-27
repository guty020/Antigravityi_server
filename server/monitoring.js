/**
 * Antigravity Connector - 24/7 Monitoring & Auto-Repair Engine
 * Follows Prompt 12:
 * - Supervises machines, heartbeats, backups, integrations, and tasks
 * - Generates structured alerts
 * - Proposes non-destructive auto-repairs
 * - Requires explicit approval for any non-trivial repair
 */

const crypto = require('node:crypto');
const { logAuditEvent } = require('./security');

class MonitoringEngine {
  constructor() {
    this.heartbeatThresholdMs = 35000; // 35 seconds
  }

  /**
   * Run a health check pass across all resources
   */
  async runMonitoringCycle(db) {
    const alerts = [];
    const now = Date.now();
    const isoNow = new Date().toISOString();

    // 1. Check Machines Heartbeats
    const machines = db.prepare("SELECT * FROM machines WHERE status != 'OFFLINE'").all();
    for (const machine of machines) {
      if (machine.last_heartbeat_at) {
        const lastHb = new Date(machine.last_heartbeat_at).getTime();
        if (now - lastHb > this.heartbeatThresholdMs) {
          // Mark machine offline
          db.prepare("UPDATE machines SET status = 'OFFLINE', updated_at = ? WHERE id = ?").run(isoNow, machine.id);

          const alertId = 'alt_' + crypto.randomUUID();
          db.prepare(`
            INSERT INTO monitoring_alerts (id, user_id, resource_type, resource_id, severity, title, message, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            alertId,
            machine.user_id,
            'machine',
            machine.id,
            'HIGH',
            `PC Desconectado: ${machine.name}`,
            `No se ha recibido heartbeat en los ultimos 35s. Estado cambiado a OFFLINE.`,
            'ACTIVE',
            isoNow
          );
          alerts.push({ id: alertId, title: `PC Desconectado: ${machine.name}`, severity: 'HIGH' });
        }
      }
    }

    // 2. Check Failed Tasks
    const failedTasks = db.prepare(`
      SELECT * FROM tasks
      WHERE status = 'FAILED' AND created_at > datetime('now', '-1 hour')
    `).all();

    for (const task of failedTasks) {
      const existingAlert = db.prepare(`
        SELECT id FROM monitoring_alerts WHERE resource_type = 'task' AND resource_id = ? AND status = 'ACTIVE'
      `).get(task.id);

      if (!existingAlert) {
        const alertId = 'alt_' + crypto.randomUUID();
        db.prepare(`
          INSERT INTO monitoring_alerts (id, user_id, resource_type, resource_id, severity, title, message, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          alertId,
          task.user_id,
          'task',
          task.id,
          'MEDIUM',
          `Fallo en Tarea: ${task.title}`,
          `La tarea finalizo con error: ${task.error_message || 'Fallo desconocido'}`,
          'ACTIVE',
          isoNow
        );
        alerts.push({ id: alertId, title: `Fallo en Tarea: ${task.title}`, severity: 'MEDIUM' });
      }
    }

    return {
      timestamp: isoNow,
      status: alerts.length > 0 ? 'WARNING' : 'HEALTHY',
      newAlertsCount: alerts.length,
      alerts
    };
  }

  /**
   * Auto-Repair Pipeline: Propose repair solution
   */
  proposeAutoRepair(alert) {
    if (alert.resource_type === 'machine') {
      return {
        type: 'RECONNECT_AGENT',
        action: 'Reiniciar el servicio local del Agent Connector en la maquina',
        command: 'node agent.js --reconnect',
        requiresApproval: false,
        isDestructive: false
      };
    }

    if (alert.resource_type === 'task') {
      return {
        type: 'RETRY_TASK',
        action: 'Reintentar tarea con diagnostico previo y backup automatico',
        requiresApproval: true,
        isDestructive: false
      };
    }

    return {
      type: 'MANUAL_INSPECTION',
      action: 'Inspeccionar logs y verificar conectividad de red',
      requiresApproval: false,
      isDestructive: false
    };
  }

  /**
   * Resolve an alert
   */
  resolveAlert(db, alertId, userId) {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE monitoring_alerts
      SET status = 'RESOLVED', resolved_at = ?
      WHERE id = ? AND user_id = ?
    `).run(now, alertId, userId);

    logAuditEvent(db, {
      userId,
      action: 'RESOLVE_ALERT',
      resourceType: 'monitoring_alerts',
      resourceId: alertId,
      riskLevel: 'LOW',
      details: { resolvedAt: now }
    });

    return { success: true, alertId, resolvedAt: now };
  }
}

module.exports = new MonitoringEngine();
