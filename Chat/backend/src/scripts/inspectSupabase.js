import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const inspectSupabase = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Connecting to Supabase at:", supabaseUrl);

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };
  const timeout = 10000;


  try {
    // 1. Fetch Auth Users
    console.log("\n--- Supabase Auth Users ---");
    const authRes = await axios.get(`${supabaseUrl}/auth/v1/admin/users`, { headers, timeout });
    const users = authRes.data.users || authRes.data || [];
    console.log(`Found ${users.length} Auth Users:`);
    users.forEach((u) => {
      console.log(`- ID: ${u.id} | Email: ${u.email || "N/A"} | Role: ${u.role || "N/A"}`);
    });
  } catch (err) {
    console.error("Auth Users error:", err.response?.data || err.message);
  }

  try {
    // 2. Fetch Drivers Table (if exists)
    console.log("\n--- Supabase 'drivers' Table ---");
    const driversRes = await axios.get(`${supabaseUrl}/rest/v1/drivers?select=*`, { headers, timeout });
    console.log("Drivers:", driversRes.data);
  } catch (err) {
    console.log("No 'drivers' table or access issue:", err.response?.statusText || err.message);
  }

  try {
    // 3. Fetch Users Table (if exists)
    console.log("\n--- Supabase 'users' / 'profiles' Table ---");
    const profilesRes = await axios.get(`${supabaseUrl}/rest/v1/profiles?select=*`, { headers, timeout });
    console.log("Profiles:", profilesRes.data);
  } catch (err) {
    console.log("No 'profiles' table or access issue:", err.response?.statusText || err.message);
  }

  try {
    // 4. Fetch Loads Table (if exists)
    console.log("\n--- Supabase 'loads' Table ---");
    const loadsRes = await axios.get(`${supabaseUrl}/rest/v1/loads?select=*`, { headers, timeout });
    console.log("Loads:", loadsRes.data);
  } catch (err) {
    console.log("No 'loads' table or access issue:", err.response?.statusText || err.message);
  }

  process.exit(0);
};

inspectSupabase();
