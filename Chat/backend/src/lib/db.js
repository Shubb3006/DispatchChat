import mongoose from "mongoose";
import dns from "dns";

// Resolve DNS SRV lookup issues on Windows / local ISP DNS restrictions
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (e) {
  // Ignore if not supported
}

const FALLBACK_MONGODB_URI =
  "mongodb://chat-db:Shubbie3031%40@ac-ajuvwlm-shard-00-00.a58xexj.mongodb.net:27017,ac-ajuvwlm-shard-00-01.a58xexj.mongodb.net:27017,ac-ajuvwlm-shard-00-02.a58xexj.mongodb.net:27017/chat_db?ssl=true&replicaSet=atlas-2c18v4-shard-0&authSource=admin&retryWrites=true&w=majority";

export const connectDB = async () => {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn("⚠️ MongoDB SRV connection failed, trying direct shard fallback URI:", error.message);
    try {
      const fallbackConn = await mongoose.connect(FALLBACK_MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`✅ MongoDB Connected (Fallback URI): ${fallbackConn.connection.host}`);
      return fallbackConn;
    } catch (fallbackError) {
      console.error("❌ MongoDB Connection Error:", fallbackError.message);
    }
  }
};



