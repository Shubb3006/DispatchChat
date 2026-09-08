import pool from "../config/db.js";

/**
 * Ensure work_orders table exists
 */
export async function ensureWorkOrdersTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        truck_number VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        fault_ref VARCHAR(100),
        assigned_mechanic VARCHAR(255),
        priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
        labor_hours NUMERIC(10,2) DEFAULT 2.0,
        labor_rate NUMERIC(10,2) DEFAULT 125.0,
        parts_list JSONB DEFAULT '[]'::jsonb,
        total_estimated_cost NUMERIC(12,2) DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        scheduled_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create index for fast lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_work_orders_truck_number
      ON work_orders(truck_number);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_work_orders_status
      ON work_orders(status);
    `);

    console.log("[DB] work_orders table ready");
  } catch (error) {
    console.error("[DB] ensureWorkOrdersTable error:", error);
    throw error;
  }
}

/**
 * Get all work orders with optional filters
 */
export async function getWorkOrders(filters = {}) {
  try {
    let query = "SELECT * FROM work_orders WHERE 1=1";
    const params = [];

    if (filters.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters.truckNumber) {
      query += ` AND truck_number = $${params.length + 1}`;
      params.push(filters.truckNumber);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    return result.rows || [];
  } catch (error) {
    console.error("getWorkOrders error:", error);
    throw error;
  }
}

/**
 * Get single work order by ID
 */
export async function getWorkOrderById(id) {
  try {
    const result = await pool.query("SELECT * FROM work_orders WHERE id = $1", [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("getWorkOrderById error:", error);
    throw error;
  }
}

/**
 * Create a new work order
 */
export async function createWorkOrder(orderData) {
  try {
    const laborHours = parseFloat(orderData.laborHours) || 2.0;
    const laborRate = parseFloat(orderData.laborRate) || 125.0;
    const partsList = orderData.partsList || [];

    // Calculate total cost
    const partsCost = partsList.reduce((acc, p) => {
      return acc + (parseFloat(p.cost) || 0) * (parseInt(p.qty) || 1);
    }, 0);
    const totalCost = Math.round((laborHours * laborRate + partsCost) * 100) / 100;

    const result = await pool.query(
      `INSERT INTO work_orders
       (truck_number, title, fault_ref, assigned_mechanic, priority,
        labor_hours, labor_rate, parts_list, total_estimated_cost, status, scheduled_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        orderData.truckNumber || "UNKNOWN",
        orderData.title || "General Maintenance",
        orderData.faultRef || null,
        orderData.assignedMechanic || null,
        orderData.priority || "NORMAL",
        laborHours,
        laborRate,
        JSON.stringify(partsList),
        totalCost,
        orderData.status || "PENDING",
        orderData.scheduledDate || new Date().toISOString().split("T")[0],
        orderData.notes || null,
      ]
    );

    const wo = result.rows[0];
    return {
      ...wo,
      parts_list: JSON.parse(wo.parts_list || "[]"),
    };
  } catch (error) {
    console.error("createWorkOrder error:", error);
    throw error;
  }
}

/**
 * Update work order status
 */
export async function updateWorkOrderStatus(id, status) {
  try {
    const result = await pool.query(
      `UPDATE work_orders
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const wo = result.rows[0];
    return {
      ...wo,
      parts_list: JSON.parse(wo.parts_list || "[]"),
    };
  } catch (error) {
    console.error("updateWorkOrderStatus error:", error);
    throw error;
  }
}

/**
 * Update entire work order
 */
export async function updateWorkOrder(id, updateData) {
  try {
    const sets = [];
    const params = [];
    let paramIndex = 1;

    // Build dynamic SET clause
    if (updateData.title !== undefined) {
      sets.push(`title = $${paramIndex++}`);
      params.push(updateData.title);
    }
    if (updateData.status !== undefined) {
      sets.push(`status = $${paramIndex++}`);
      params.push(updateData.status);
    }
    if (updateData.priority !== undefined) {
      sets.push(`priority = $${paramIndex++}`);
      params.push(updateData.priority);
    }
    if (updateData.laborHours !== undefined) {
      sets.push(`labor_hours = $${paramIndex++}`);
      params.push(updateData.laborHours);
    }
    if (updateData.partsList !== undefined) {
      sets.push(`parts_list = $${paramIndex++}`);
      params.push(JSON.stringify(updateData.partsList));
    }

    sets.push(`updated_at = NOW()`);

    if (sets.length === 1) {
      // Only updated_at was set
      const result = await pool.query(
        "SELECT * FROM work_orders WHERE id = $1",
        [id]
      );
      return result.rows[0] ? { ...result.rows[0], parts_list: JSON.parse(result.rows[0].parts_list || "[]") } : null;
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE work_orders
       SET ${sets.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return null;
    }

    const wo = result.rows[0];
    return {
      ...wo,
      parts_list: JSON.parse(wo.parts_list || "[]"),
    };
  } catch (error) {
    console.error("updateWorkOrder error:", error);
    throw error;
  }
}

/**
 * Delete work order
 */
export async function deleteWorkOrder(id) {
  try {
    const result = await pool.query(
      "DELETE FROM work_orders WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("deleteWorkOrder error:", error);
    throw error;
  }
}

/**
 * Get work order counts by status
 */
export async function getWorkOrderCounts() {
  try {
    const result = await pool.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM work_orders
      GROUP BY status
    `);

    const counts = {};
    for (const row of result.rows) {
      counts[row.status] = parseInt(row.count, 10);
    }

    return {
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      pending: counts.PENDING || 0,
      in_progress: counts.IN_PROGRESS || 0,
      completed: counts.COMPLETED || 0,
      ...counts,
    };
  } catch (error) {
    console.error("getWorkOrderCounts error:", error);
    throw error;
  }
}
