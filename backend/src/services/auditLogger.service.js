import pool from "../config/db.js";

/**
 * Ensure audit_logs table exists
 */
export const ensureAuditTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          username VARCHAR(100) NOT NULL DEFAULT 'System / Automation',
          user_role VARCHAR(50) DEFAULT 'DISPATCHER',
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(100),
          entity_identifier VARCHAR(100),
          change_summary TEXT NOT NULL,
          details JSONB DEFAULT '{}'::jsonb,
          ip_address VARCHAR(50),
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    `);
  } catch (err) {
    console.warn("Audit logs table verification warning:", err.message);
  }
};

/**
 * Automatically compute field-level differences between two state snapshots
 * @param {Object} oldObj - Previous state object
 * @param {Object} newObj - Updated state object
 * @param {Array<string>} ignoredFields - Array of keys to skip
 * @returns {Object} Diff dictionary { fieldName: { old: val1, new: val2 } }
 */
export const computeFieldDiff = (oldObj = {}, newObj = {}, ignoredFields = ["updated_at", "created_at"]) => {
  const diff = {};
  if (!oldObj || !newObj) return diff;

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    if (ignoredFields.includes(key)) continue;

    const oldVal = oldObj[key];
    const newVal = newObj[key];

    // Normalize null / undefined / empty string
    const normOld = oldVal === undefined || oldVal === null ? "" : String(oldVal);
    const normNew = newVal === undefined || newVal === null ? "" : String(newVal);

    if (normOld !== normNew) {
      diff[key] = {
        old: oldVal ?? null,
        new: newVal ?? null
      };
    }
  }

  return diff;
};

/**
 * Record an audit log entry to the database
 */
export const recordAuditLog = async ({
  userId = null,
  username = null,
  userRole = null,
  action = "UPDATE",
  entityType = "LOAD",
  entityId = null,
  entityIdentifier = null,
  changeSummary = "",
  details = {},
  ipAddress = null,
  userAgent = null,
  req = null
}) => {
  try {
    await ensureAuditTable();

    // Extract user info from req if provided
    let finalUserId = userId;
    let finalUsername = username;
    let finalRole = userRole;
    let finalIp = ipAddress;
    let finalUserAgent = userAgent;

    if (req) {
      if (!finalUserId && req.user?.id) finalUserId = req.user.id;
      if (!finalUsername && req.user?.username) finalUsername = req.user.username;
      if (!finalRole && req.user?.role) finalRole = req.user.role;
      if (!finalIp) finalIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || req.ip;
      if (!finalUserAgent) finalUserAgent = req.headers["user-agent"];
    }

    if (!finalUsername) {
      finalUsername = "System Dispatcher";
    }

    const result = await pool.query(
      `
      INSERT INTO audit_logs (
        user_id,
        username,
        user_role,
        action,
        entity_type,
        entity_id,
        entity_identifier,
        change_summary,
        details,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
      `,
      [
        finalUserId,
        finalUsername,
        finalRole || "DISPATCHER",
        action.toUpperCase(),
        entityType.toUpperCase(),
        entityId ? String(entityId) : null,
        entityIdentifier ? String(entityIdentifier) : null,
        changeSummary || `Updated ${entityType} ${entityIdentifier || entityId || ""}`,
        JSON.stringify(details || {}),
        finalIp ? String(finalIp).slice(0, 50) : null,
        finalUserAgent ? String(finalUserAgent).slice(0, 255) : null
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Failed to record audit log:", error.message);
    return null;
  }
};
