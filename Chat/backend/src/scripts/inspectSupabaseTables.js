import axios from "axios";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

const inspectSupabase = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    console.log("Fetching loads table sample...");
    const loadsRes = await axios.get(`${supabaseUrl}/rest/v1/loads?select=*&limit=2`, { headers });
    console.log("Loads sample:", JSON.stringify(loadsRes.data, null, 2));

    console.log("\nFetching documents table sample...");
    const docsRes = await axios.get(`${supabaseUrl}/rest/v1/documents?select=*&limit=2`, { headers });
    console.log("Documents sample:", JSON.stringify(docsRes.data, null, 2));
  } catch (err) {
    console.error("Error inspecting Supabase:", err.response?.data || err.message);
  }

  process.exit(0);
};

inspectSupabase();
