import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const testSupabaseUpdate = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  try {
    console.log("Updating load #10006 status in Supabase...");
    const res = await axios.patch(
      `${supabaseUrl}/rest/v1/loads?load_number=eq.10006`,
      { status: "in_transit", cargo: "Skid picture & BOL attached" },
      { headers }
    );
    console.log("Supabase PATCH response:", res.status, res.data);
  } catch (err) {
    console.error("Supabase update error:", err.response?.data || err.message);
  }

  process.exit(0);
};

testSupabaseUpdate();
