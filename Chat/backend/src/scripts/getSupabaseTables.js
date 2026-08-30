import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const getSupabaseTables = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  const tables = ["users", "user", "app_users", "fleet_users", "dispatchers", "trucks", "trailers", "loads"];

  for (const table of tables) {
    try {
      const res = await axios.get(`${supabaseUrl}/rest/v1/${table}?select=*&limit=5`, { headers });
      console.log(`\n=== Table: ${table} ===`);
      console.log(res.data);
    } catch (err) {
      // Table doesn't exist
    }
  }

  process.exit(0);
};

getSupabaseTables();
