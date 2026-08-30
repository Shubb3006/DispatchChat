import axios from "axios";

const testWebhook = async () => {
  try {
    const payload = {
      type: "INSERT",
      table: "loads",
      schema: "public",
      record: {
        id: "test-load-999",
        load_number: "10099",
        shipper_name: "Apex Logistics",
        customer_name: "Walmart Distribution",
        consignee_street_address: "777 Commerce Way, Dallas TX",
        pieces: 14,
        weight: 18500,
        driver_id: "0bc42344-0e93-4eaf-a5ca-55aef138aeca"
      }
    };

    console.log("Sending Webhook payload to http://localhost:5500/api/load/webhook...");
    const res = await axios.post("http://localhost:5500/api/load/webhook", payload);
    console.log("Response:", res.status, res.data);
  } catch (err) {
    console.error("Webhook test error:", err.response?.data || err.message);
  }
};

testWebhook();
