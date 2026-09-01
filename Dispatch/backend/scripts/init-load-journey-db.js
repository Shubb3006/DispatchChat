import pool from "../src/config/db.js";

async function initLoadJourneyTable() {
  try {
    console.log("Initializing load_journey table...");

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS load_journey (
        id SERIAL PRIMARY KEY,
        load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
        from_location VARCHAR(255),
        to_location VARCHAR(255),
        driver_id INTEGER REFERENCES drivers(id),
        status VARCHAR(50) NOT NULL DEFAULT 'in_transit',
        notes TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT valid_status CHECK (status IN ('pickup', 'in_transit', 'at_warehouse', 'at_freight_force', 'in_delivery', 'delivered', 'delayed'))
      );

      CREATE INDEX IF NOT EXISTS idx_load_journey_load_id ON load_journey(load_id);
      CREATE INDEX IF NOT EXISTS idx_load_journey_status ON load_journey(status);
      CREATE INDEX IF NOT EXISTS idx_load_journey_timestamp ON load_journey(timestamp DESC);
    `;

    await pool.query(createTableSQL);
    console.log("✅ load_journey table created successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing load_journey table:", error);
    process.exit(1);
  }
}

initLoadJourneyTable();
