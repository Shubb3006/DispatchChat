import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const printSupabaseDrivers = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  try {
    const driversRes = await axios.get(`${supabaseUrl}/rest/v1/drivers?select=*`, { headers });
    console.log("=== SUPABASE DRIVERS TABLE ===");
    console.log(JSON.stringify(driversRes.data, null, 2));
  } catch (err) {
    console.error("Error fetching drivers:", err.response?.data || err.message);
  }

  try {
    const profilesRes = await axios.get(`${supabaseUrl}/rest/v1/profiles?select=*`, { headers });
    console.log("\n=== SUPABASE PROFILES TABLE ===");
    console.log(JSON.stringify(profilesRes.data, null, 2));
  } catch (err) {
    console.error("Error fetching profiles:", err.response?.data || err.message);
  }

  try {
    const authRes = await axios.get(`${supabaseUrl}/auth/v1/admin/users`, { headers });
    console.log("\n=== SUPABASE AUTH USERS ===");
    console.log(JSON.stringify(authRes.data, null, 2));
  } catch (err) {
    console.error("Error fetching auth users:", err.response?.data || err.message);
  }

  process.exit(0);
};

printSupabaseDrivers();
