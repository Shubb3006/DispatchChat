import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Simple free translation proxy (using MyMemory API)
router.post("/translate", protectedRoute, async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) return res.status(400).json({ message: "Missing data" });

    // Using MyMemory API (Free/Anonymous limit 1000 words/day)
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
    const data = await response.json();

    const translatedText = data?.responseData?.translatedText;
    res.json({ translatedText });
  } catch (error) {
    console.error("Translation error:", error.message);
    res.status(500).json({ message: "Translation service failed" });
  }
});

export default router;
