import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const testUploadBOL = async () => {
  try {
    console.log("Testing POST /api/load/upload-bol...");
    // Base64 1x1 test PNG
    const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const res = await axios.post("http://localhost:5500/api/load/upload-bol", {
      load_id: "10006",
      bol_image: dummyImage,
    }, {
      headers: {
        "Content-Type": "application/json",
      }
    });

    console.log("Response Status:", res.status);
    console.log("Response Data:", res.data);
    console.log("\n✅ UPLOAD BOL VERIFICATION SUCCESSFUL!");
  } catch (err) {
    console.error("Test Error:", err.response?.data || err.message);
  }

  process.exit(0);
};

testUploadBOL();
