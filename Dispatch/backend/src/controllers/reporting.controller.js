import pool from "../config/db.js";
import { sendEmail } from "../services/emailNotifier.service.js";

/**
 * Executive Reporting Controller
 * ------------------------------
 * Computes P&L, customer revenue, AR aging, fleet utilization and monthly
 * history straight from the live database. Nothing is fabricated: when a
 * table/column is missing or empty, the endpoint returns zeros / nulls /
 * empty arrays and names the components it could NOT compute.
 *
 * Tables used (see backend/databases/*.sql):
 *   loads              rate, status, pickup_date, delivery_date, delivered_at,
 *                      shipper_city, consignee_city, origin, destination,
 *                      customer_id, customer_name, driver_id, load_number
 *   invoices           total, status, issue_date, due_date, customer_id,
 *                      customer_name, shipment_id, tracking_number, load_id
 *   driver_settlements total_gross_pay, total_miles, loaded_miles, period_start/end
 *   load_legs          load_id, driver_id, miles
 *   trips              fuel_cost, total_tolls, total_miles (runtime-extended)
 *   detention_events   amount, status
 *   drivers / trucks   status counts, driver names
 */

/* ----------------------------- helpers ----------------------------- */

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (v) => Math.round(num(v) * 100) / 100;

const parseDays = (raw, fallback = 30) => {
  const d = parseInt(raw, 10);
  if (!Number.isFinite(d) || d < 1) return fallback;
  return Math.min(d, 365);
};

/**
 * Runs a query; on failure (missing table 42P01 / missing column 42703 /
 * anything else) returns null instead of throwing, so an optional data
 * source can degrade gracefully.
 */
async function safeQuery(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    console.warn("[reporting] optional query skipped:", err.message);
    return null;
  }
}

/**
 * loads.delivered_at / loads.customer_id are added lazily elsewhere
 * (loadStatus.service.js). Make sure they exist before we query them,
 * following the same additive lazy-DDL pattern used across this codebase.
 */
let columnsEnsured = false;
async function ensureReportingColumns() {
  if (columnsEnsured) return;
  try {
    await pool.query(`
      ALTER TABLE loads ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
      ALTER TABLE loads ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
    `);
    columnsEnsured = true;
  } catch (err) {
    console.warn("[reporting] ensure columns:", err.message);
  }
}

// City extraction: prefer the structured shipper_city / consignee_city
// columns (migration 127), fall back to the first segment of the free-text
// origin / destination fields.
const ORIGIN_CITY_SQL = `COALESCE(NULLIF(TRIM(l.shipper_city), ''), NULLIF(TRIM(SPLIT_PART(l.origin, ',', 1)), ''), 'Unknown')`;
const DEST_CITY_SQL = `COALESCE(NULLIF(TRIM(l.consignee_city), ''), NULLIF(TRIM(SPLIT_PART(l.destination, ',', 1)), ''), 'Unknown')`;

// A load counts inside the reporting period by its most meaningful date.
const LOAD_PERIOD_DATE = `COALESCE(l.delivered_at, l.delivery_date, l.pickup_date, l.created_at)`;

const DELIVERED_PREDICATE = `(l.delivered_at IS NOT NULL OR LOWER(TRIM(l.status)) IN ('delivered', 'completed'))`;

const UNPAID_INVOICE_PREDICATE = `LOWER(TRIM(COALESCE(i.status, 'draft'))) NOT IN ('paid', 'void', 'cancelled', 'canceled', 'written_off')`;

/* ------------------------------- 1. P&L ------------------------------- */

export const getPnl = async (req, res) => {
  try {
    await ensureReportingColumns();
    const days = parseDays(req.query.days);
    const params = [days];
    const periodFilter = `>= NOW() - make_interval(days => $1)`;

    // --- Revenue -------------------------------------------------------
    const invoiceRev = await safeQuery(
      `SELECT COALESCE(SUM(i.total), 0) AS revenue, COUNT(*)::int AS cnt
         FROM invoices i
        WHERE COALESCE(i.issue_date::timestamp, i.created_at) ${periodFilter}`,
      params
    );

    const loadRev = await safeQuery(
      `SELECT COALESCE(SUM(l.rate), 0) AS revenue, COUNT(*)::int AS cnt
         FROM loads l
        WHERE ${LOAD_PERIOD_DATE} ${periodFilter}`,
      params
    );

    const detentionRev = await safeQuery(
      `SELECT COALESCE(SUM(de.amount), 0) AS amount
         FROM detention_events de
        WHERE de.created_at ${periodFilter}
          AND de.status NOT IN ('written_off')`,
      params
    );

    const invoiced = round2(invoiceRev?.rows[0]?.revenue);
    const invoiceCount = invoiceRev?.rows[0]?.cnt ?? 0;
    const loadRevenue = round2(loadRev?.rows[0]?.revenue);
    const loadCount = loadRev?.rows[0]?.cnt ?? 0;
    const grossSource = invoiced > 0 ? "invoices" : "loads";
    const gross = grossSource === "invoices" ? invoiced : loadRevenue;

    // --- Costs (only components the DB can actually provide) -----------
    const componentsComputed = [];
    const componentsUnavailable = [];
    let totalCost = 0;

    const settlements = await safeQuery(
      `SELECT COALESCE(SUM(s.total_gross_pay), 0) AS amount, COUNT(*)::int AS cnt
         FROM driver_settlements s
        WHERE s.period_end >= (CURRENT_DATE - $1::int)`,
      params
    );
    let driverSettlements = null;
    let settlementCount = null;
    if (settlements) {
      driverSettlements = round2(settlements.rows[0].amount);
      settlementCount = settlements.rows[0].cnt;
      totalCost += driverSettlements;
      componentsComputed.push("driverSettlements");
    } else {
      componentsUnavailable.push("driverSettlements");
    }

    // trips.fuel_cost / total_tolls are runtime-extended columns
    // (trip.controller.js lazy DDL) — treat as optional.
    const tripCosts = await safeQuery(
      `SELECT COALESCE(SUM(t.fuel_cost), 0) AS fuel, COALESCE(SUM(t.total_tolls), 0) AS tolls
         FROM trips t
        WHERE t.created_at ${periodFilter}`,
      params
    );
    let fuelEstimate = null;
    let tolls = null;
    if (tripCosts) {
      fuelEstimate = round2(tripCosts.rows[0].fuel);
      tolls = round2(tripCosts.rows[0].tolls);
      totalCost += fuelEstimate + tolls;
      componentsComputed.push("fuelEstimate", "tolls");
    } else {
      componentsUnavailable.push("fuelEstimate", "tolls");
    }

    // --- Miles (load_legs first, driver_settlements as fallback) --------
    const legMiles = await safeQuery(
      `SELECT COALESCE(SUM(ll.miles), 0) AS miles
         FROM load_legs ll
         JOIN loads l ON l.id = ll.load_id
        WHERE ${LOAD_PERIOD_DATE} ${periodFilter}`,
      params
    );
    const settlementMiles = await safeQuery(
      `SELECT COALESCE(SUM(s.total_miles), 0) AS miles
         FROM driver_settlements s
        WHERE s.period_end >= (CURRENT_DATE - $1::int)`,
      params
    );

    let totalMiles = null;
    let milesSource = null;
    if (legMiles && num(legMiles.rows[0].miles) > 0) {
      totalMiles = round2(legMiles.rows[0].miles);
      milesSource = "load_legs";
    } else if (settlementMiles && num(settlementMiles.rows[0].miles) > 0) {
      totalMiles = round2(settlementMiles.rows[0].miles);
      milesSource = "driver_settlements";
    }

    // --- Lane yield: origin city -> destination city, top 10 by revenue -
    const laneSqlWithMiles = `
      SELECT ${ORIGIN_CITY_SQL} AS origin_city,
             ${DEST_CITY_SQL} AS destination_city,
             COUNT(*)::int AS load_count,
             COALESCE(SUM(l.rate), 0) AS revenue,
             SUM(lm.miles) AS miles
        FROM loads l
        LEFT JOIN (
              SELECT load_id, SUM(miles) AS miles
                FROM load_legs
               GROUP BY load_id
             ) lm ON lm.load_id = l.id
       WHERE ${LOAD_PERIOD_DATE} ${periodFilter}
       GROUP BY 1, 2
       ORDER BY revenue DESC
       LIMIT 10`;

    let laneRows = await safeQuery(laneSqlWithMiles, params);
    if (!laneRows) {
      // load_legs table missing — same query without the miles join
      laneRows = await safeQuery(
        `SELECT ${ORIGIN_CITY_SQL} AS origin_city,
                ${DEST_CITY_SQL} AS destination_city,
                COUNT(*)::int AS load_count,
                COALESCE(SUM(l.rate), 0) AS revenue,
                NULL AS miles
           FROM loads l
          WHERE ${LOAD_PERIOD_DATE} ${periodFilter}
          GROUP BY 1, 2
          ORDER BY revenue DESC
          LIMIT 10`,
        params
      );
    }

    const lanes = (laneRows?.rows || []).map((r) => {
      const miles = r.miles === null ? null : round2(r.miles);
      const revenue = round2(r.revenue);
      return {
        originCity: r.origin_city,
        destinationCity: r.destination_city,
        loadCount: r.load_count,
        revenue,
        miles,
        rpm: miles && miles > 0 ? round2(revenue / miles) : null,
      };
    });

    totalCost = round2(totalCost);
    const detentionBilled = detentionRev ? round2(detentionRev.rows[0].amount) : null;

    return res.json({
      success: true,
      periodDays: days,
      periodStart: new Date(Date.now() - days * 86400000).toISOString(),
      periodEnd: new Date().toISOString(),
      revenue: {
        invoiced,
        invoiceCount,
        loadRevenue,
        loadCount,
        detentionBilled,
        gross,
        grossSource,
      },
      costs: {
        driverSettlements,
        settlementCount,
        fuelEstimate,
        tolls,
        total: totalCost,
        componentsComputed,
        componentsUnavailable,
      },
      net: round2(gross - totalCost),
      miles: { totalMiles, source: milesSource },
      revenuePerMile: totalMiles && totalMiles > 0 ? round2(gross / totalMiles) : null,
      costPerMile: totalMiles && totalMiles > 0 ? round2(totalCost / totalMiles) : null,
      lanes,
    });
  } catch (error) {
    console.error("[reporting] P&L error:", error);
    return res.status(500).json({ success: false, message: "Server error computing P&L" });
  }
};

/* --------------------------- 2. Customers --------------------------- */

export const getCustomerReport = async (req, res) => {
  try {
    await ensureReportingColumns();
    const days = parseDays(req.query.days);
    const params = [days];
    const periodFilter = `>= NOW() - make_interval(days => $1)`;

    // Loads grouped by customer (customers table joined via customer_id,
    // free-text loads.customer_name as fallback identity).
    const loadRows = await safeQuery(
      `SELECT c.id AS customer_id,
              COALESCE(NULLIF(TRIM(c.company_name), ''), NULLIF(TRIM(l.customer_name), ''), 'Unknown Customer') AS customer_name,
              COUNT(*)::int AS load_count,
              COALESCE(SUM(l.rate), 0) AS load_revenue,
              COUNT(*) FILTER (WHERE ${DELIVERED_PREDICATE})::int AS delivered_count,
              COUNT(*) FILTER (
                    WHERE l.delivered_at IS NOT NULL AND l.delivery_date IS NOT NULL
              )::int AS measurable_count,
              COUNT(*) FILTER (
                    WHERE l.delivered_at IS NOT NULL AND l.delivery_date IS NOT NULL
                      AND l.delivered_at <= l.delivery_date
              )::int AS on_time_count
         FROM loads l
         LEFT JOIN customers c ON c.id = l.customer_id
        WHERE ${LOAD_PERIOD_DATE} ${periodFilter}
        GROUP BY c.id, 2`,
      params
    );

    // Invoiced revenue per customer in the same period (merged by name key).
    const invoiceRows = await safeQuery(
      `SELECT COALESCE(NULLIF(TRIM(c.company_name), ''), NULLIF(TRIM(i.customer_name), ''), 'Unknown Customer') AS customer_name,
              COALESCE(SUM(i.total), 0) AS invoiced,
              COUNT(*)::int AS invoice_count
         FROM invoices i
         LEFT JOIN customers c ON c.id = i.customer_id
        WHERE COALESCE(i.issue_date::timestamp, i.created_at) ${periodFilter}
        GROUP BY 1`,
      params
    );

    const invoicedByName = new Map(
      (invoiceRows?.rows || []).map((r) => [
        r.customer_name,
        { invoiced: round2(r.invoiced), invoiceCount: r.invoice_count },
      ])
    );

    const customers = (loadRows?.rows || [])
      .map((r) => {
        const inv = invoicedByName.get(r.customer_name) || null;
        const measurable = r.measurable_count;
        return {
          customerId: r.customer_id || null,
          customerName: r.customer_name,
          loadCount: r.load_count,
          loadRevenue: round2(r.load_revenue),
          invoicedRevenue: inv ? inv.invoiced : 0,
          invoiceCount: inv ? inv.invoiceCount : 0,
          deliveredCount: r.delivered_count,
          onTimeCount: measurable > 0 ? r.on_time_count : null,
          onTimePct:
            measurable > 0 ? round2((r.on_time_count / measurable) * 100) : null,
        };
      })
      .sort(
        (a, b) =>
          Math.max(b.loadRevenue, b.invoicedRevenue) -
          Math.max(a.loadRevenue, a.invoicedRevenue)
      )
      .slice(0, 10);

    const totals = (loadRows?.rows || []).reduce(
      (acc, r) => {
        acc.revenue = round2(acc.revenue + num(r.load_revenue));
        acc.loadCount += r.load_count;
        return acc;
      },
      { revenue: 0, loadCount: 0 }
    );

    return res.json({
      success: true,
      periodDays: days,
      periodStart: new Date(Date.now() - days * 86400000).toISOString(),
      periodEnd: new Date().toISOString(),
      customers,
      totals,
    });
  } catch (error) {
    console.error("[reporting] customer report error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error computing customer report" });
  }
};

/* ---------------------------- 3. AR aging ---------------------------- */

const bucketFor = (daysOutstanding) => {
  if (daysOutstanding <= 30) return "0-30";
  if (daysOutstanding <= 60) return "31-60";
  if (daysOutstanding <= 90) return "61-90";
  return "90+";
};

export const getArAging = async (req, res) => {
  try {
    const unpaid = await safeQuery(
      `SELECT i.id,
              COALESCE(NULLIF(TRIM(i.shipment_id), ''), NULLIF(TRIM(i.tracking_number), '')) AS invoice_ref,
              i.customer_id,
              COALESCE(NULLIF(TRIM(c.company_name), ''), NULLIF(TRIM(i.customer_name), ''), 'Unknown Customer') AS customer_name,
              c.email AS customer_email,
              i.issue_date,
              i.due_date,
              i.total,
              i.status,
              GREATEST(
                0,
                (CURRENT_DATE - COALESCE(i.due_date, i.issue_date, i.created_at::date))::int
              ) AS days_outstanding
         FROM invoices i
         LEFT JOIN customers c ON c.id = i.customer_id
        WHERE ${UNPAID_INVOICE_PREDICATE}
        ORDER BY days_outstanding DESC, i.total DESC`
    );

    const buckets = {
      "0-30": { count: 0, amount: 0 },
      "31-60": { count: 0, amount: 0 },
      "61-90": { count: 0, amount: 0 },
      "90+": { count: 0, amount: 0 },
    };

    let totalOutstanding = 0;
    const invoices = (unpaid?.rows || []).map((r) => {
      const balance = round2(r.total);
      const bucket = bucketFor(r.days_outstanding);
      buckets[bucket].count += 1;
      buckets[bucket].amount = round2(buckets[bucket].amount + balance);
      totalOutstanding = round2(totalOutstanding + balance);
      return {
        id: r.id,
        invoiceNumber: r.invoice_ref || r.id,
        customerId: r.customer_id || null,
        customerName: r.customer_name,
        customerEmail: r.customer_email || null,
        issueDate: r.issue_date,
        dueDate: r.due_date,
        balance,
        status: r.status,
        daysOutstanding: r.days_outstanding,
        bucket,
      };
    });

    // DSO = AR / (revenue / days). Revenue basis: all invoices issued in the
    // trailing 90 days (industry-standard trailing window).
    const DSO_WINDOW_DAYS = 90;
    const revRes = await safeQuery(
      `SELECT COALESCE(SUM(i.total), 0) AS revenue
         FROM invoices i
        WHERE COALESCE(i.issue_date::timestamp, i.created_at) >= NOW() - make_interval(days => $1)`,
      [DSO_WINDOW_DAYS]
    );
    const windowRevenue = round2(revRes?.rows[0]?.revenue);
    const dso =
      windowRevenue > 0
        ? round2(totalOutstanding / (windowRevenue / DSO_WINDOW_DAYS))
        : null;

    return res.json({
      success: true,
      asOf: new Date().toISOString(),
      invoices,
      buckets,
      totalOutstanding,
      dso,
      dsoBasis: { periodDays: DSO_WINDOW_DAYS, revenue: windowRevenue },
    });
  } catch (error) {
    console.error("[reporting] AR aging error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error computing AR aging" });
  }
};

/* -------------------------- 4. Utilization -------------------------- */

export const getUtilization = async (req, res) => {
  try {
    await ensureReportingColumns();
    const days = parseDays(req.query.days);
    const params = [days];
    const periodFilter = `>= NOW() - make_interval(days => $1)`;

    const truckRes = await safeQuery(
      `SELECT COALESCE(NULLIF(TRIM(status), ''), 'UNKNOWN') AS status, COUNT(*)::int AS cnt
         FROM trucks GROUP BY 1`
    );
    const driverRes = await safeQuery(
      `SELECT COALESCE(NULLIF(TRIM(status), ''), 'UNKNOWN') AS status, COUNT(*)::int AS cnt
         FROM drivers GROUP BY 1`
    );

    const toStatusMap = (rows) => {
      const byStatus = {};
      let total = 0;
      for (const r of rows || []) {
        byStatus[r.status] = r.cnt;
        total += r.cnt;
      }
      return { total, byStatus };
    };

    const loadStatusRes = await safeQuery(
      `SELECT LOWER(TRIM(COALESCE(NULLIF(l.status, ''), 'unknown'))) AS status, COUNT(*)::int AS cnt
         FROM loads l GROUP BY 1`
    );
    const loadByStatus = {};
    for (const r of loadStatusRes?.rows || []) loadByStatus[r.status] = r.cnt;

    const deliveredRes = await safeQuery(
      `SELECT COUNT(*)::int AS cnt
         FROM loads l
        WHERE ${DELIVERED_PREDICATE}
          AND COALESCE(l.delivered_at, l.delivery_date, l.created_at) ${periodFilter}`,
      params
    );

    // Loaded miles from load_legs for loads active/delivered in the period.
    const legMilesRes = await safeQuery(
      `SELECT COALESCE(SUM(ll.miles), 0) AS miles
         FROM load_legs ll
         JOIN loads l ON l.id = ll.load_id
        WHERE ${LOAD_PERIOD_DATE} ${periodFilter}`,
      params
    );
    const settlementMilesRes = await safeQuery(
      `SELECT COALESCE(SUM(s.loaded_miles), 0) AS miles
         FROM driver_settlements s
        WHERE s.period_end >= (CURRENT_DATE - $1::int)`,
      params
    );

    // Driver leaderboard (period): loads completed, revenue, miles.
    const leaderboardSql = (withNames) => `
      SELECT d.id AS driver_id,
             d.driver_code,
             ${
               withNames
                 ? `COALESCE(NULLIF(TRIM(CONCAT_WS(' ', d.first_name, d.last_name)), ''), u.username, d.driver_code)`
                 : `COALESCE(u.username, d.driver_code)`
             } AS driver_name,
             COUNT(l.id)::int AS loads_completed,
             COALESCE(SUM(l.rate), 0) AS revenue
        FROM loads l
        JOIN drivers d ON d.id = l.driver_id
        LEFT JOIN users u ON u.id = d.user_id
       WHERE ${DELIVERED_PREDICATE}
         AND COALESCE(l.delivered_at, l.delivery_date, l.created_at) ${periodFilter}
       GROUP BY d.id, d.driver_code, driver_name
       ORDER BY revenue DESC
       LIMIT 10`;

    // drivers.first_name/last_name come from migration 020 — fall back if absent.
    let leaderRes = await safeQuery(leaderboardSql(true), params);
    if (!leaderRes) leaderRes = await safeQuery(leaderboardSql(false), params);

    // Per-driver miles from load_legs (leg-level driver attribution).
    const driverMilesRes = await safeQuery(
      `SELECT ll.driver_id, COALESCE(SUM(ll.miles), 0) AS miles
         FROM load_legs ll
         JOIN loads l ON l.id = ll.load_id
        WHERE ll.driver_id IS NOT NULL
          AND ${LOAD_PERIOD_DATE} ${periodFilter}
        GROUP BY ll.driver_id`,
      params
    );
    const milesByDriver = new Map(
      (driverMilesRes?.rows || []).map((r) => [r.driver_id, round2(r.miles)])
    );

    const driverLeaderboard = (leaderRes?.rows || []).map((r) => ({
      driverId: r.driver_id,
      driverCode: r.driver_code || null,
      driverName: r.driver_name,
      loadsCompleted: r.loads_completed,
      revenue: round2(r.revenue),
      miles: milesByDriver.get(r.driver_id) ?? null,
    }));

    return res.json({
      success: true,
      periodDays: days,
      periodStart: new Date(Date.now() - days * 86400000).toISOString(),
      periodEnd: new Date().toISOString(),
      fleet: {
        trucks: toStatusMap(truckRes?.rows),
        drivers: toStatusMap(driverRes?.rows),
      },
      loads: {
        inTransit: loadByStatus["in_transit"] || 0,
        deliveredInPeriod: deliveredRes?.rows[0]?.cnt ?? 0,
        pending: loadByStatus["pending"] || 0,
        byStatus: loadByStatus,
      },
      loadedMiles: {
        fromLoadLegs: legMilesRes ? round2(legMilesRes.rows[0].miles) : null,
        fromSettlements: settlementMilesRes
          ? round2(settlementMilesRes.rows[0].miles)
          : null,
      },
      driverLeaderboard,
    });
  } catch (error) {
    console.error("[reporting] utilization error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error computing utilization" });
  }
};

/* ---------------------------- 5. Forecast ---------------------------- */

export const getForecast = async (req, res) => {
  try {
    await ensureReportingColumns();
    const MONTHS = 6;

    const loadSeries = await safeQuery(
      `SELECT TO_CHAR(DATE_TRUNC('month', ${LOAD_PERIOD_DATE}), 'YYYY-MM') AS month,
              COUNT(*)::int AS load_count,
              COALESCE(SUM(l.rate), 0) AS revenue
         FROM loads l
        WHERE ${LOAD_PERIOD_DATE} >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
          AND ${LOAD_PERIOD_DATE} < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        GROUP BY 1
        ORDER BY 1`
    );

    const invoiceSeries = await safeQuery(
      `SELECT TO_CHAR(DATE_TRUNC('month', COALESCE(i.issue_date::timestamp, i.created_at)), 'YYYY-MM') AS month,
              COUNT(*)::int AS invoice_count,
              COALESCE(SUM(i.total), 0) AS revenue
         FROM invoices i
        WHERE COALESCE(i.issue_date::timestamp, i.created_at) >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY 1
        ORDER BY 1`
    );

    // Fill in empty months so the frontend always gets a contiguous series.
    const months = [];
    const now = new Date();
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }

    const loadMap = new Map(
      (loadSeries?.rows || []).map((r) => [
        r.month,
        { loadCount: r.load_count, revenue: round2(r.revenue) },
      ])
    );
    const invMap = new Map(
      (invoiceSeries?.rows || []).map((r) => [
        r.month,
        { invoiceCount: r.invoice_count, revenue: round2(r.revenue) },
      ])
    );

    return res.json({
      success: true,
      months: MONTHS,
      loads: months.map((m) => ({
        month: m,
        loadCount: loadMap.get(m)?.loadCount ?? 0,
        revenue: loadMap.get(m)?.revenue ?? 0,
      })),
      invoices: months.map((m) => ({
        month: m,
        invoiceCount: invMap.get(m)?.invoiceCount ?? 0,
        revenue: invMap.get(m)?.revenue ?? 0,
      })),
    });
  } catch (error) {
    console.error("[reporting] forecast error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error computing forecast" });
  }
};

/* ------------------------- 6. AR reminder email ------------------------- */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const sendArReminder = async (req, res) => {
  try {
    const { invoiceId, invoice_number, to, subject, message } = req.body || {};

    if (!invoiceId && !invoice_number) {
      return res.status(400).json({
        success: false,
        message: "invoiceId or invoice_number is required",
      });
    }

    // Note: the invoices table has no invoice_number column — the visible
    // reference is shipment_id / tracking_number, so match those.
    let result = null;
    if (invoiceId && UUID_RE.test(String(invoiceId))) {
      result = await pool.query(
        `SELECT i.*, c.email AS customer_email,
                COALESCE(NULLIF(TRIM(c.company_name), ''), NULLIF(TRIM(i.customer_name), ''), 'Customer') AS resolved_customer_name
           FROM invoices i
           LEFT JOIN customers c ON c.id = i.customer_id
          WHERE i.id = $1
          LIMIT 1`,
        [invoiceId]
      );
    } else {
      const ref = String(invoice_number || invoiceId).trim();
      result = await pool.query(
        `SELECT i.*, c.email AS customer_email,
                COALESCE(NULLIF(TRIM(c.company_name), ''), NULLIF(TRIM(i.customer_name), ''), 'Customer') AS resolved_customer_name
           FROM invoices i
           LEFT JOIN customers c ON c.id = i.customer_id
          WHERE i.shipment_id = $1 OR i.tracking_number = $1
          ORDER BY i.created_at DESC
          LIMIT 1`,
        [ref]
      );
    }

    if (!result || result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    const inv = result.rows[0];
    const recipient = (to || inv.customer_email || "").trim();
    if (!recipient) {
      return res.status(400).json({
        success: false,
        message:
          "No recipient: provide 'to' in the request body or set an email on the customer record",
      });
    }

    const ref =
      inv.shipment_id || inv.tracking_number || String(inv.id).slice(0, 8);
    const total = round2(inv.total);
    const dueDate = inv.due_date
      ? new Date(inv.due_date).toISOString().slice(0, 10)
      : "N/A";
    const finalSubject =
      subject || `Payment Reminder — Invoice ${ref} (${inv.resolved_customer_name})`;
    const bodyMessage =
      message ||
      `This is a friendly reminder that invoice ${ref} for $${total.toLocaleString()} ` +
        `is outstanding (due ${dueDate}). Please arrange payment at your earliest convenience.`;

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:#0f172a;color:#38bdf8;padding:20px;font-weight:800;font-size:18px;">NISHAN TRANSPORT INC. — Accounts Receivable</div>
        <div style="padding:20px;color:#1e293b;font-size:14px;line-height:1.6;">
          <p>Hello ${escapeHtml(inv.resolved_customer_name)},</p>
          <p>${escapeHtml(bodyMessage)}</p>
          <table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
            <tr><td style="padding:8px 12px;color:#64748b;">Invoice</td><td style="padding:8px 12px;font-weight:700;">${escapeHtml(ref)}</td></tr>
            <tr><td style="padding:8px 12px;color:#64748b;">Amount Due</td><td style="padding:8px 12px;font-weight:700;">$${total.toLocaleString()}</td></tr>
            <tr><td style="padding:8px 12px;color:#64748b;">Due Date</td><td style="padding:8px 12px;font-weight:700;">${escapeHtml(dueDate)}</td></tr>
            <tr><td style="padding:8px 12px;color:#64748b;">Status</td><td style="padding:8px 12px;font-weight:700;">${escapeHtml(inv.status || "outstanding")}</td></tr>
          </table>
          <p style="margin-top:16px;">If payment has already been sent, please disregard this notice.</p>
        </div>
        <div style="padding:14px 20px;background:#f8fafc;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;">Nishan Transport Inc. • Accounts Receivable Department</div>
      </div>`;

    const text = `${finalSubject}\n\n${bodyMessage}\n\nInvoice: ${ref}\nAmount Due: $${total}\nDue Date: ${dueDate}`;

    const sendResult = await sendEmail({
      to: recipient,
      subject: finalSubject,
      html,
      text,
    });

    // Propagate the notifier's simulated flag honestly: simulated === true
    // means SMTP was not configured (or send failed) and NO real email left
    // the building.
    return res.status(sendResult.success ? 200 : 502).json({
      success: !!sendResult.success,
      simulated: !!sendResult.simulated,
      messageId: sendResult.messageId || null,
      to: recipient,
      subject: finalSubject,
      error: sendResult.error || sendResult.reason || null,
      invoice: {
        id: inv.id,
        invoiceNumber: ref,
        customerName: inv.resolved_customer_name,
        total,
        dueDate: inv.due_date,
        status: inv.status,
      },
    });
  } catch (error) {
    console.error("[reporting] AR reminder error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error sending AR reminder" });
  }
};
