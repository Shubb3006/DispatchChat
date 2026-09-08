import {
  generateEManifest,
  transmitManifestToCbp,
  getEManifest,
  ensureEManifestsTable,
} from "../services/eManifestGenerator.service.js";

/**
 * POST /api/emanifests/generate
 * Generate ACE manifest + BOL for a load
 */
export async function generateManifest(req, res) {
  try {
    await ensureEManifestsTable();

    const { loadId } = req.body;

    if (!loadId) {
      return res.status(400).json({ success: false, message: "loadId is required" });
    }

    const manifest = await generateEManifest(loadId);

    return res.json({
      success: true,
      manifest,
      message: `Generated manifest ${manifest.manifestNumber} and BOL ${manifest.bolNumber}`,
    });
  } catch (err) {
    console.error("[E-Manifest Controller] Generate error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/emanifests/load/:loadId
 * Retrieve manifest for a load
 */
export async function getManifest(req, res) {
  try {
    const { loadId } = req.params;

    if (!loadId) {
      return res.status(400).json({ success: false, message: "loadId is required" });
    }

    const manifest = await getEManifest(loadId);

    if (!manifest) {
      return res.status(404).json({ success: false, message: "Manifest not found" });
    }

    return res.json({
      success: true,
      manifest,
    });
  } catch (err) {
    console.error("[E-Manifest Controller] Get error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/emanifests/:manifestId/transmit
 * Transmit manifest to CBP
 */
export async function transmitManifest(req, res) {
  try {
    const { manifestId } = req.params;

    if (!manifestId) {
      return res.status(400).json({ success: false, message: "manifestId is required" });
    }

    const manifest = await transmitManifestToCbp(manifestId);

    return res.json({
      success: true,
      manifest,
      message: `Manifest ${manifest.manifest_number} transmitted to CBP at ${manifest.transmitted_at}`,
    });
  } catch (err) {
    console.error("[E-Manifest Controller] Transmit error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/emanifests/:manifestId/bol
 * Download BOL as HTML (for printing)
 */
export async function downloadBol(req, res) {
  try {
    const { manifestId } = req.params;

    if (!manifestId) {
      return res.status(400).json({ success: false, message: "manifestId is required" });
    }

    // Fetch from DB (would need a query to get by manifestId)
    // For now, return placeholder
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="bol-${manifestId}.html"`);
    res.send("<html><body>BOL Content</body></html>");
  } catch (err) {
    console.error("[E-Manifest Controller] BOL download error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/emanifests/:manifestId/ace
 * Download ACE manifest as XML
 */
export async function downloadAceManifest(req, res) {
  try {
    const { manifestId } = req.params;

    if (!manifestId) {
      return res.status(400).json({ success: false, message: "manifestId is required" });
    }

    // Fetch from DB (would need a query to get by manifestId)
    // For now, return placeholder
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", `attachment; filename="ace-${manifestId}.xml"`);
    res.send("<?xml version=\"1.0\"?><ACEManifest></ACEManifest>");
  } catch (err) {
    console.error("[E-Manifest Controller] ACE download error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
