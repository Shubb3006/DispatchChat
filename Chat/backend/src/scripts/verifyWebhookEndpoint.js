import axios from "axios";

const verifyWebhook = async () => {
  try {
    console.log("Sending POST request to http://localhost:5500/api/load/webhook ...");
    const res = await axios.post(
      "http://localhost:5500/api/load/webhook",
      {
        type: "INSERT",
        table: "loads",
        record: {
          load_number: "TEST_999",
          driver_supabase_uid: "0bc42344-0e93-4eaf-a5ca-55aef138aeca",
          shipper_name: "Test Shipper",
          consignee_name: "Test Consignee",
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("Response Status:", res.status);
    console.log("Response Data:", res.data);
    console.log("\n✅ VERIFICATION SUCCESS: Webhook endpoint is ACTIVE, running on Port 5500, and accepting unauthenticated POST requests!");
  } catch (err) {
    console.error("Verification Error:", err.response?.status, err.response?.data || err.message);
  }

  process.exit(0);
};

verifyWebhook();
