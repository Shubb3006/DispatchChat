import pool from "../src/config/db.js";

async function initRouteOptimizationTables() {
  try {
    console.log("Initializing route optimization tables...");

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS route_notes (
        id SERIAL PRIMARY KEY,
        load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_route_notes_load_id ON route_notes(load_id);
      CREATE INDEX IF NOT EXISTS idx_route_notes_created_at ON route_notes(created_at DESC);

      CREATE TABLE IF NOT EXISTS route_deviations (
        id SERIAL PRIMARY KEY,
        load_id INTEGER NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
        trip_id INTEGER REFERENCES trips(id),
        deviation_type VARCHAR(50),
        description TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        distance_off_route DECIMAL(5, 2),
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_route_deviations_load_id ON route_deviations(load_id);
      CREATE INDEX IF NOT EXISTS idx_route_deviations_trip_id ON route_deviations(trip_id);
      CREATE INDEX IF NOT EXISTS idx_route_deviations_detected_at ON route_deviations(detected_at DESC);
    `;

    await pool.query(createTableSQL);
    console.log("✅ Route optimization tables created successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing route optimization tables:", error);
    process.exit(1);
  }
}

initRouteOptimizationTables();
