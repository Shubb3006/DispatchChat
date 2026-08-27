import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Also fallback to default dotenv
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20, // Max concurrent clients
  idleTimeoutMillis: 20000, // Close idle clients after 20s before remote PgBouncer drops them
  connectionTimeoutMillis: 10000, // Timeout new connection attempts after 10s
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("connect", () => {
  // Connected successfully
});

pool.on("error", (err, client) => {
  // Supabase PgBouncer (port 6543) periodically terminates idle backend sockets.
  // pg-pool automatically cleans up the dead client and opens a fresh one upon the next query.
  if (
    err.message &&
    (err.message.includes("Connection terminated") ||
      err.message.includes("closed") ||
      err.code === "ECONNRESET")
  ) {
    // Normal connection recycling by remote Supabase transaction pooler
    return;
  }
  console.error("PostgreSQL Pool Error:", err);
});

export default pool;