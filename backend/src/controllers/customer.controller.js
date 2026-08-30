import pool from "../config/db.js"

// ---------------------------------------------------------------------------
// Shared list-endpoint helpers (pagination + search + sort)
// Used by loads / customers / drivers / trucks / trailers / locations /
// invoices / users list endpoints.
// ---------------------------------------------------------------------------

/**
 * Parse limit/offset/q/sort query params.
 * hasListParams stays false when NONE of them are present, so callers can
 * return their legacy response shape unchanged.
 */
export const parseListParams = (query = {}, { defaultLimit = 50, maxLimit = 200 } = {}) => {
  const hasListParams = ["limit", "offset", "q", "sort"].some(
    (key) => query[key] !== undefined && query[key] !== null && String(query[key]).length > 0
  );

  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(limit) || limit <= 0) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  let offset = parseInt(query.offset, 10);
  if (!Number.isFinite(offset) || offset < 0) offset = 0;

  const q = typeof query.q === "string" && query.q.trim() ? query.q.trim() : null;
  const sort = typeof query.sort === "string" && query.sort.trim() ? query.sort.trim() : null;

  return { hasListParams, limit, offset, q, sort };
};

/**
 * Build an ILIKE search clause over the given columns.
 * Pushes the search value onto params and returns the SQL fragment.
 */
export const buildSearchClause = (q, columns, params) => {
  params.push(`%${q}%`);
  const idx = params.length;
  return `(${columns.map((col) => `${col}::text ILIKE $${idx}`).join(" OR ")})`;
};

/**
 * Resolve a whitelisted ORDER BY clause.
 * Accepts "column", "-column" or "column:desc" from the client; anything not
 * in the whitelist falls back to the endpoint's default ordering.
 */
export const resolveSortClause = (sort, whitelist, fallback) => {
  if (!sort) return fallback;
  let key = sort;
  let direction = "ASC";
  if (key.startsWith("-")) {
    key = key.slice(1);
    direction = "DESC";
  } else if (key.includes(":")) {
    const [col, dir] = key.split(":");
    key = col;
    direction = String(dir).toLowerCase() === "desc" ? "DESC" : "ASC";
  }
  const column = whitelist[key];
  if (!column) return fallback;
  return `ORDER BY ${column} ${direction}`;
};

// ---------------------------------------------------------------------------
// Customer-scoped access (users.customer_id)
// ---------------------------------------------------------------------------

let customerAccessColumnsEnsured = false;

/**
 * Lazily add users.customer_id + customers.notify_prefs (migrations 102/104)
 * so the feature works on next boot without manual steps.
 */
export const ensureCustomerAccessColumns = async () => {
  if (customerAccessColumnsEnsured) return;
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS notify_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);
    customerAccessColumnsEnsured = true;
  } catch (err) {
    console.warn("customer access columns verification warning:", err.message);
  }
};

/**
 * Resolve the requesting user's customer scope.
 * Returns { restricted: false } for staff roles, or
 * { restricted: true, customerId } for role=customer (any case variation).
 * A customer user with no linked customer_id gets { restricted: true,
 * customerId: null } and must see empty results.
 */
export const getCustomerScope = async (req) => {
  const role = String(req.user?.role || "").toLowerCase();
  if (role !== "customer") {
    return { restricted: false, customerId: null };
  }

  await ensureCustomerAccessColumns();

  try {
    const result = await pool.query(`SELECT customer_id FROM users WHERE id = $1`, [req.user.id]);
    return { restricted: true, customerId: result.rows[0]?.customer_id || null };
  } catch (err) {
    console.warn("getCustomerScope lookup warning:", err.message);
    // Fail closed: a customer user whose scope cannot be resolved sees nothing.
    return { restricted: true, customerId: null };
  }
};

/**
 * SQL fragment restricting a loads query (aliased `l`) to one customer.
 * Matches by loads.customer_id, with a legacy fallback on customer_email.
 */
export const buildLoadScopeClause = (customerId, params) => {
  params.push(customerId);
  const idx = params.length;
  return `(l.customer_id = $${idx} OR (l.customer_email IS NOT NULL AND LOWER(l.customer_email) IN (SELECT LOWER(email) FROM customers WHERE id = $${idx} AND email IS NOT NULL)))`;
};

// GET /api/customer/me — the customer record linked to the requesting user
export const getMyCustomer = async (req, res) => {
  try {
    await ensureCustomerAccessColumns();

    const userResult = await pool.query(`SELECT customer_id FROM users WHERE id = $1`, [req.user.id]);
    const customerId = userResult.rows[0]?.customer_id || null;

    if (!customerId) {
      return res.status(404).json({
        success: false,
        message: "No customer record linked to this user",
      });
    }

    const customerResult = await pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId]);
    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Linked customer record not found",
      });
    }

    return res.json({
      success: true,
      customer: customerResult.rows[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      zip_code,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO customers
      (
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        country,
        zip_code
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        country,
        zip_code,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get All Customers
export const getCustomers = async (req, res) => {
  try {
    const { hasListParams, limit, offset, q, sort } = parseListParams(req.query);

    // Legacy shape when no list params are present (backward compatible)
    if (!hasListParams) {
      const result = await pool.query(`
        SELECT *
        FROM customers
        ORDER BY created_at DESC
      `);

      return res.json({
        success: true,
        customers: result.rows,
      });
    }

    const params = [];
    const where = [];

    if (q) {
      where.push(
        buildSearchClause(
          q,
          ["company_name", "email", "phone", "city", "state", "country"],
          params
        )
      );
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orderSql = resolveSortClause(
      sort,
      {
        created_at: "created_at",
        company_name: "company_name",
        city: "city",
        state: "state",
      },
      "ORDER BY created_at DESC"
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT *, COUNT(*) OVER() AS __total
       FROM customers
       ${whereSql}
       ${orderSql}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const total = result.rows.length ? Number(result.rows[0].__total) : 0;
    const data = result.rows.map(({ __total, ...row }) => row);

    return res.json({ data, total, limit, offset });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Single Customer
export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM customers
      WHERE id=$1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      customer: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update Customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      zip_code,
      notify_prefs,
    } = req.body;

    await ensureCustomerAccessColumns();

    const result = await pool.query(
      `
      UPDATE customers
      SET
        company_name=$1,
        contact_person=$2,
        email=$3,
        phone=$4,
        address=$5,
        city=$6,
        state=$7,
        country=$8,
        zip_code=$9,
        notify_prefs=COALESCE($10, notify_prefs)
      WHERE id=$11
      RETURNING *
      `,
      [
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        country,
        zip_code,
        notify_prefs !== undefined && notify_prefs !== null ? JSON.stringify(notify_prefs) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      message: "Customer updated successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Delete Customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM customers
      WHERE id=$1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};