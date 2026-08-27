import axios from "axios";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

const inspectDocsSchema = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  try {
    // Try POST to documents table with dummy data to see column validation or successful insert
    console.log("Testing POST to documents table...");
    const res = await axios.post(
      `${supabaseUrl}/rest/v1/documents`,
      {
        load_id: "726a6bfc-a039-46e9-93b3-f087c7390a11",
        file_path: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        document_type: "BOL",
        is_approved: false,
      },
      { headers }
    );
    console.log("Insert Result:", JSON.stringify(res.data, null, 2));

    // Clean up test row
    if (res.data && res.data[0]?.id) {
      await axios.delete(`${supabaseUrl}/rest/v1/documents?id=eq.${res.data[0].id}`, { headers });
      console.log("Test row cleaned up!");
    }
  } catch (err) {
    console.error("Post Error:", err.response?.data || err.message);
  }

  process.exit(0);
};

inspectDocsSchema();
