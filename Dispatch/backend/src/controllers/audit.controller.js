import pool from "../config/db.js";
import { ensureAuditTable, recordAuditLog } from "../services/auditLogger.service.js";

/**
 * GET all audit logs with dynamic filtering & pagination
 */
export const getAuditLogs = async (req, res) => {
  await ensureAuditTable();
  try {
    const {
      page = 1,
      limit = 50,
      entity_type,
      entity_id,
      action,
      username,
      search,
      startDate,
      endDate
    } = req.query;

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const params = [];
    let query = `
      SELECT 
        a.id,
        a.user_id,
        a.username,
        a.user_role,
        a.action,
        a.entity_type,
        a.entity_id,
        a.entity_identifier,
        a.change_summary,
        a.details,
        a.ip_address,
        a.created_at
      FROM audit_logs a
      WHERE 1=1
    `;

    if (entity_type && entity_type !== "ALL") {
      params.push(entity_type.toUpperCase());
      query += ` AND a.entity_type = $${params.length}`;
    }

    if (entity_id) {
      params.push(entity_id);
      query += ` AND a.entity_id = $${params.length}`;
    }

    if (action && action !== "ALL") {
      params.push(action.toUpperCase());
      query += ` AND a.action = $${params.length}`;
    }

    if (username && username !== "ALL") {
      params.push(username);
      query += ` AND a.username = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND a.created_at >= $${params.length}::timestamp`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND a.created_at <= $${params.length}::timestamp`;
    }

    if (search) {
      params.push(`%${search}%`);
      const sIdx = params.length;
      query += ` AND (
        a.change_summary ILIKE $${sIdx} OR
        a.entity_identifier ILIKE $${sIdx} OR
        a.username ILIKE $${sIdx} OR
        a.action ILIKE $${sIdx}
      )`;
    }

    // Count Total
    const countResult = await pool.query(
      query.replace("SELECT \n        a.id,\n        a.user_id,\n        a.username,\n        a.user_role,\n        a.action,\n        a.entity_type,\n        a.entity_id,\n        a.entity_identifier,\n        a.change_summary,\n        a.details,\n        a.ip_address,\n        a.created_at", "SELECT COUNT(*) AS total"),
      params
    );
    const totalCount = parseInt(countResult.rows[0]?.total || 0);

    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      logs: result.rows,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ success: false, message: "Error fetching audit logs", error: error.message });
  }
};

/**
 * GET full audit timeline for a specific entity (e.g. Load, Customs Entry, Driver)
 */
export const getEntityAuditLogs = async (req, res) => {
  await ensureAuditTable();
  try {
    const { entityType, entityId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM audit_logs
      WHERE (entity_type = $1 AND (entity_id = $2 OR entity_identifier ILIKE $3))
         OR (entity_identifier ILIKE $3)
      ORDER BY created_at DESC
      LIMIT 100
      `,
      [
        entityType.toUpperCase(),
        entityId,
        `%${entityId}%`
      ]
    );

    res.json({
      success: true,
      entity_type: entityType,
      entity_id: entityId,
      logs: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching entity audit logs:", error);
    res.status(500).json({ success: false, message: "Error fetching entity audit trail", error: error.message });
  }
};

/**
 * GET aggregate audit stats & activity summary
 */
export const getAuditStats = async (req, res) => {
  await ensureAuditTable();
  try {
    // 1. Total modifications today
    const todayResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM audit_logs 
      WHERE created_at >= CURRENT_DATE
    `);

    // 2. Active users today
    const usersResult = await pool.query(`
      SELECT DISTINCT username, user_role, COUNT(*) as action_count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY username, user_role
      ORDER BY action_count DESC
      LIMIT 10
    `);

    // 3. Action breakdown
    const actionBreakdownResult = await pool.query(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY action
      ORDER BY count DESC
      LIMIT 6
    `);

    // 4. Entity breakdown
    const entityBreakdownResult = await pool.query(`
      SELECT entity_type, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY entity_type
      ORDER BY count DESC
    `);

    // 5. Recent critical modifications (Status changes, Rate edits, Assignments)
    const recentCriticalResult = await pool.query(`
      SELECT *
      FROM audit_logs
      WHERE action IN ('STATUS_CHANGED', 'RATE_MODIFIED', 'DRIVER_ASSIGNED', 'CUSTOMS_TRANSMITTED', 'DETENTION_CLAIMED', 'DTC_CLEARED')
      ORDER BY created_at DESC
      LIMIT 8
    `);

    res.json({
      success: true,
      stats: {
        totalToday: parseInt(todayResult.rows[0]?.count || 0),
        activeUsers: usersResult.rows,
        topActions: actionBreakdownResult.rows,
        entityBreakdown: entityBreakdownResult.rows,
        recentCritical: recentCriticalResult.rows
      }
    });
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    res.status(500).json({ success: false, message: "Error fetching audit stats", error: error.message });
  }
};

/**
 * POST create explicit audit log entry (e.g. from frontend action)
 */
export const createAuditLog = async (req, res) => {
  try {
    const {
      action,
      entity_type,
      entity_id,
      entity_identifier,
      change_summary,
      details,
      username,
      user_role
    } = req.body;

    const log = await recordAuditLog({
      userId: req.user?.id,
      username: username || req.user?.username || "Nishan Dispatcher",
      userRole: user_role || req.user?.role || "DISPATCHER",
      action: action || "CUSTOM_ACTION",
      entityType: entity_type || "SYSTEM",
      entityId: entity_id,
      entityIdentifier: entity_identifier,
      changeSummary: change_summary,
      details: details || {},
      req
    });

    res.status(201).json({
      success: true,
      log,
      message: "Audit record created"
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
    res.status(500).json({ success: false, message: "Error creating audit log", error: error.message });
  }
};
