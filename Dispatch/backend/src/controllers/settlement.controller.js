import pool from "../config/db.js";
import { ensureSettlementTable, calculateSettlement } from "../services/settlement.service.js";
import { recordAuditLog } from "../services/auditLogger.service.js";

// GET All Settlements with Filtering & Pagination
export const getSettlements = async (req, res) => {
  try {
    await ensureSettlementTable();
    const { driver_id, status, search, page = 1, limit = 50 } = req.query;

    let query = `SELECT * FROM driver_settlements WHERE 1=1`;
    const params = [];

    if (driver_id && driver_id !== "ALL") {
      params.push(driver_id);
      query += ` AND driver_id = $${params.length}`;
    }

    if (status && status !== "ALL") {
      params.push(status.toUpperCase());
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (settlement_number ILIKE $${params.length} OR driver_name ILIKE $${params.length} OR truck_number ILIKE $${params.length})`;
    }

    // Count total
    const countRes = await pool.query(query.replace("SELECT *", "SELECT COUNT(*)"), params);
    const total = parseInt(countRes.rows[0]?.count || 0);

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      settlements: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Error fetching settlements:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// GET Single Settlement by ID
export const getSettlementById = async (req, res) => {
  try {
    await ensureSettlementTable();
    const { id } = req.params;

    const result = await pool.query(`SELECT * FROM driver_settlements WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Settlement not found" });
    }

    res.json({ success: true, settlement: result.rows[0] });
  } catch (error) {
    console.error("Error fetching settlement details:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// POST Generate New Settlement
export const generateSettlement = async (req, res) => {
  try {
    await ensureSettlementTable();
    const settlementData = calculateSettlement(req.body);

    const result = await pool.query(
      `
      INSERT INTO driver_settlements (
        settlement_number, driver_id, driver_name, driver_code, truck_number,
        period_start, period_end, pay_model, total_loads, loaded_miles,
        empty_miles, total_miles, rate_per_loaded_mile, rate_per_empty_mile,
        gross_percentage, gross_freight_revenue, base_pay, extra_stop_pay,
        detention_pay, layover_pay, reimbursements, total_gross_pay,
        deductions, total_deductions, net_payout, currency, status,
        loads_included, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29
      ) RETURNING *;
      `,
      [
        settlementData.settlement_number,
        settlementData.driver_id,
        settlementData.driver_name,
        settlementData.driver_code,
        settlementData.truck_number,
        settlementData.period_start,
        settlementData.period_end,
        settlementData.pay_model,
        settlementData.total_loads,
        settlementData.loaded_miles,
        settlementData.empty_miles,
        settlementData.total_miles,
        settlementData.rate_per_loaded_mile,
        settlementData.rate_per_empty_mile,
        settlementData.gross_percentage,
        settlementData.gross_freight_revenue,
        settlementData.base_pay,
        settlementData.extra_stop_pay,
        settlementData.detention_pay,
        settlementData.layover_pay,
        settlementData.reimbursements,
        settlementData.total_gross_pay,
        JSON.stringify(settlementData.deductions),
        settlementData.total_deductions,
        settlementData.net_payout,
        settlementData.currency,
        settlementData.status,
        JSON.stringify(settlementData.loads_included),
        req.body.notes || null,
      ]
    );

    const created = result.rows[0];

    // Record Audit Trail
    await recordAuditLog({
      req,
      action: "SETTLEMENT_GENERATED",
      entityType: "SETTLEMENT",
      entityId: created.id,
      entityIdentifier: `Settlement ${created.settlement_number}`,
      changeSummary: `Generated payroll settlement ${created.settlement_number} for driver ${created.driver_name} ($${created.net_payout} CAD)`,
      details: {
        driver: created.driver_name,
        net_payout: created.net_payout,
        total_miles: created.total_miles,
        loads_count: created.total_loads,
      },
    });

    res.status(201).json({
      success: true,
      settlement: created,
      message: `Settlement ${created.settlement_number} generated successfully`,
    });
  } catch (error) {
    console.error("Error generating settlement:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// PUT Update Settlement Status (APPROVE, PAY, REJECT)
export const updateSettlementStatus = async (req, res) => {
  try {
    await ensureSettlementTable();
    const { id } = req.params;
    const { status, approved_by } = req.body;

    const paidAt = status === "PAID" ? new Date() : null;
    const approvedAt = status === "APPROVED" || status === "PAID" ? new Date() : null;

    const result = await pool.query(
      `
      UPDATE driver_settlements
      SET
        status = $1,
        approved_by = COALESCE($2, approved_by),
        approved_at = CASE WHEN $1 IN ('APPROVED', 'PAID') THEN CURRENT_TIMESTAMP ELSE approved_at END,
        paid_at = CASE WHEN $1 = 'PAID' THEN CURRENT_TIMESTAMP ELSE paid_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
      `,
      [status.toUpperCase(), approved_by || "Admin Dispatcher", id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Settlement not found" });
    }

    const updated = result.rows[0];

    await recordAuditLog({
      req,
      action: `SETTLEMENT_${status.toUpperCase()}`,
      entityType: "SETTLEMENT",
      entityId: updated.id,
      entityIdentifier: `Settlement ${updated.settlement_number}`,
      changeSummary: `Settlement ${updated.settlement_number} status updated to ${status.toUpperCase()} (${updated.driver_name})`,
      details: {
        new_status: status,
        net_payout: updated.net_payout,
      },
    });

    res.json({
      success: true,
      settlement: updated,
      message: `Settlement status updated to ${status}`,
    });
  } catch (error) {
    console.error("Error updating settlement status:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// GET Settlement Payroll KPI Metrics
export const getSettlementStats = async (req, res) => {
  try {
    await ensureSettlementTable();

    const statsRes = await pool.query(`
      SELECT
        COUNT(*) as total_settlements,
        COALESCE(SUM(total_gross_pay), 0) as total_gross_payroll,
        COALESCE(SUM(net_payout), 0) as total_net_payroll,
        COALESCE(SUM(total_miles), 0) as total_settled_miles,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as pending_approval_count,
        COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid_count,
        COALESCE(AVG(net_payout), 0) as avg_payout
      FROM driver_settlements;
    `);

    res.json({
      success: true,
      stats: statsRes.rows[0] || {},
    });
  } catch (error) {
    console.error("Error getting settlement stats:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
