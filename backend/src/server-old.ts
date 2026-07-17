import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import Database from 'better-sqlite3';
import multer from 'multer';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// -------------------------------------------------------------
// Database Initialization (Ozack-2 Logic Port)
// -------------------------------------------------------------
// const DB_PATH = path.join(process.cwd(), 'dispatch_database.db');
// const db = new Database(DB_PATH);

// function initDb() {
//   db.exec(`
//     CREATE TABLE IF NOT EXISTS loads (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       broker TEXT,
//       load_num TEXT,
//       po_num TEXT,
//       pb_num TEXT,
//       customer_name TEXT,
//       customer_contact TEXT,
//       shipper_name TEXT,
//       shipper_addr TEXT,
//       shipper_city TEXT,
//       shipper_contact TEXT,
//       pickup_date TEXT,
//       consignee_name TEXT,
//       consignee_addr TEXT,
//       consignee_city TEXT,
//       consignee_contact TEXT,
//       delivery_date TEXT,
//       skids TEXT,
//       pieces TEXT,
//       dims TEXT,
//       weight TEXT,
//       total_footage TEXT,
//       equipment TEXT,
//       dispatcher TEXT,
//       division TEXT,
//       custom_broker TEXT,
//       commodity TEXT,
//       notes TEXT,
//       delivery_type TEXT,
//       truck TEXT,
//       trailer TEXT,
//       port_of_entry TEXT,
//       path_bol TEXT,
//       path_pod TEXT,
//       path_skid TEXT,
//       status TEXT DEFAULT 'Dispatched'
//     );
//   `);

//   db.exec(`
//     CREATE TABLE IF NOT EXISTS locations (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       name TEXT UNIQUE,
//       address TEXT,
//       city_st_zip TEXT,
//       contact TEXT
//     );
//   `);

//   db.exec(`
//     CREATE TABLE IF NOT EXISTS routing (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       load_id INTEGER,
//       stop_type TEXT,
//       location_name TEXT,
//       address TEXT,
//       city_st_zip TEXT,
//       date_time TEXT,
//       FOREIGN KEY (load_id) REFERENCES loads (id)
//     );
//   `);
// }
// initDb();

// -------------------------------------------------------------
// Multer Configuration (Document Upload)
// -------------------------------------------------------------
const DOCS_DIR = path.join(process.cwd(), 'Saved_Dispatches', 'Mobile_Uploads');
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, DOCS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const loadNumber = req.params.load_number || 'UNKNOWN';
    const docType = req.body.doc_type || 'DOC';
    cb(null, `Load_${loadNumber}_${docType}${ext}`);
  }
});
const upload = multer({ storage: storage });

// Lazy initializer for Gemini client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// -------------------------------------------------------------
// Ozack-2 Logic Ported Endpoints
// -------------------------------------------------------------

// 1. Secure Login (With Multi-User Support)
const VALID_USERS: Record<string, string> = {
  "Nick": "Nick2656@",
  "Driver2": "Demo123"
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (VALID_USERS[username] && VALID_USERS[username] === password) {
    return res.json({ status: "success", driver_name: username });
  }
  
  return res.status(401).json({ detail: "Invalid Username or Password" });
});

// 2. Fetch Load
app.get('/api/load/:load_number', (req, res) => {
  try {
    const load_number = req.params.load_number;
    const stmt = db.prepare('SELECT * FROM loads WHERE pb_num = ? OR load_num = ? OR id = ?');
    const row = stmt.get(load_number, load_number, load_number) as any;
    
    if (row) {
      return res.json({
        load_number: load_number,
        shipper: `${row.shipper_name || 'No Name'} (${row.shipper_city || 'No City'})`,
        consignee: `${row.consignee_name || 'No Name'} (${row.consignee_city || 'No City'})`,
        status: row.status || 'Dispatched'
      });
    }
    
    return res.status(404).json({ detail: "Load not found in database" });
  } catch (error) {
    console.error('Error fetching load:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Update Status
app.put('/api/load/:load_number/status', (req, res) => {
  try {
    const load_number = req.params.load_number;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ detail: "Status is required" });
    }

    const stmt = db.prepare('UPDATE loads SET status = ? WHERE pb_num = ? OR load_num = ?');
    stmt.run(status, load_number, load_number);
    
    return res.json({ message: "Success" });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Document Upload
app.post('/api/upload/:load_number', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: "No file uploaded" });
    }
    return res.json({ status: "uploaded", path: req.file.path });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 1. AI Route Optimizer Copilot
app.post('/api/gemini/optimize-route', async (req, res) => {
  try {
    const { origin, destination, waypoints, cargoDescription, priority, vehicleType, weather, traffic } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const client = getGeminiClient();
    const prompt = `
      As an expert logistics and heavy-freight dispatcher, analyze and optimize this trucking route:
      - Origin: ${origin}
      - Destination: ${destination}
      - Cargo: ${cargoDescription || 'General LTL Freight'}
      - Priorities / Constraints: ${priority || 'Maximize fuel efficiency, manage driver HOS, avoid cross-border delays'}
      
      Current Route Parameters:
      - Vehicle Type: ${vehicleType || 'Class 8 Heavy Duty Semi-Truck'}
      - Weather Conditions: ${weather || 'Clear / Dry Roads'}
      - Traffic Conditions: ${traffic || 'Normal Flow'}

      Additional Stops / Waypoints (LTL Loads with Delivery Windows/Scheduled Times):
      ${JSON.stringify(waypoints || [])}

      Please do the following:
      1. Determine the absolute best sequence for the waypoints based on delivery windows/scheduled times, current weather limitations (e.g. adjust route speed/safety on icy roads), traffic conditions, and vehicle size limitations (e.g. low bridges or restricted commercial lanes for heavy semi-trucks).
      2. Justify why this is the optimal sequence (mention LTL load distribution: heavy cargo on bottom floor, light/priority cargo delivered, border crossing commercial lanes, and HOS limitations).
      3. Estimate the toll costs in USD.
      4. Estimate the diesel fuel consumption in gallons (assume a standard Class 8 heavy truck gets 6.5 MPG, adjust for vehicle types if smaller/reef_equipped).
      5. Provide concrete safety, customs, or driving tips (such as low bridge warnings, winter driving cautions if applicable, border clearing instructions for PAPS/PARS barcodes, or Samsara alert tips).
      
      Format the output strictly as JSON following this schema:
      {
        "optimizedSequence": [list of strings of companies/stop names in recommended order],
        "justification": "Detailed logistics reasoning",
        "tollEstimatesUsd": 120,
        "estimatedFuelGallons": 85,
        "drivingTips": ["Tip 1", "Tip 2", "Tip 3"]
      }
    `;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedSequence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'The optimal sequential order for visiting the stops'
            },
            justification: {
              type: Type.STRING,
              description: 'Professional logistical justification'
            },
            tollEstimatesUsd: {
              type: Type.NUMBER,
              description: 'Estimated toll road fees in USD'
            },
            estimatedFuelGallons: {
              type: Type.NUMBER,
              description: 'Estimated diesel fuel consumption'
            },
            drivingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Safety, HOS, low bridges, customs, or border tips'
            }
          },
          required: ['optimizedSequence', 'justification', 'tollEstimatesUsd', 'estimatedFuelGallons', 'drivingTips']
        }
      }
    });

    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error optimizing route with Gemini:', error);
    res.status(500).json({ 
      error: 'Failed to optimize route using Gemini', 
      details: error.message 
    });
  }
});

// 2. Real-time Document OCR Parser
app.post('/api/gemini/parse-document', async (req, res) => {
  try {
    const { documentType, base64Data, textFallback, fileName } = req.body;
    const client = getGeminiClient();

    let response;

    if (base64Data) {
      // Real Multimodal Call: Parse document from raw image/pdf base64
      const mimeType = fileName?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data
        }
      };
      
      const promptPart = {
        text: `
          Analyze this logistics document (${documentType?.toUpperCase() || 'Bill of Lading / Proof of Delivery'}).
          Extract all critical metadata for billing, invoicing, border crossing, and tracking.
          Identify shipper, consignee, BOL/PO number, specific items, weights, and whether a signature is present.
          Format the output strictly as JSON following the expected schema.
        `
      };

      response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts: [imagePart, promptPart] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shipperName: { type: Type.STRING },
              consigneeName: { type: Type.STRING },
              items: { type: Type.STRING, description: 'Description of items, count, pallet count' },
              weightLbs: { type: Type.NUMBER, description: 'Total weight in pounds (Lbs)' },
              bolNumber: { type: Type.STRING, description: 'BOL or Bill of Lading Number' },
              purchaseOrder: { type: Type.STRING, description: 'PO Number if found' },
              carrierName: { type: Type.STRING, description: 'Carrier or transport company' },
              signatureFound: { type: Type.BOOLEAN, description: 'Whether there is a signed receipt/POD signature' },
              confidence: { type: Type.NUMBER, description: 'Confidence score from 0 to 100' }
            },
            required: ['shipperName', 'consigneeName', 'items', 'weightLbs', 'bolNumber', 'signatureFound', 'confidence']
          }
        }
      });
    } else {
      // Text-based intelligence helper (fallback when document text is simulated or typed)
      const prompt = `
        A driver uploaded a document named "${fileName || 'Document.pdf'}" of type "${documentType || 'bol'}".
        Simulate OCR scanning and detail extraction based on this descriptor context: "${textFallback || 'A standard BOL for AeroParts Mississauga shipping 6 pallets of aircraft gears to Midwest Chicago'}".
        
        Please generate highly realistic extracted document details, structured strictly as JSON following this schema:
        {
          "shipperName": "Shipper Name",
          "consigneeName": "Consignee Name",
          "items": "Cargo Description (count, package)",
          "weightLbs": 8500,
          "bolNumber": "BOL-XXXXX",
          "purchaseOrder": "PO-XXXXX",
          "carrierName": "LogiSync Transportation",
          "signatureFound": true,
          "confidence": 95
        }
      `;

      response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shipperName: { type: Type.STRING },
              consigneeName: { type: Type.STRING },
              items: { type: Type.STRING },
              weightLbs: { type: Type.NUMBER },
              bolNumber: { type: Type.STRING },
              purchaseOrder: { type: Type.STRING },
              carrierName: { type: Type.STRING },
              signatureFound: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER }
            },
            required: ['shipperName', 'consigneeName', 'items', 'weightLbs', 'bolNumber', 'signatureFound', 'confidence']
          }
        }
      });
    }

    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error parsing document with Gemini:', error);
    res.status(500).json({ 
      error: 'Failed to parse document using Gemini OCR', 
      details: error.message 
    });
  }
});

// 3. Automated Customer Status Update
app.post('/api/gemini/customer-update', async (req, res) => {
  try {
    const { trackingNumber, customerName, origin, destination, currentStatus, speedMph, eta, borderStatus, cargoDescription } = req.body;
    
    if (!trackingNumber || !customerName) {
      return res.status(400).json({ error: 'Tracking number and customer name are required' });
    }

    const client = getGeminiClient();
    const prompt = `
      Draft a highly professional logistics update email for our customer "${customerName}" regarding shipment ${trackingNumber}:
      - Route: ${origin} to ${destination}
      - Active Status: ${currentStatus}
      - Current Speed: ${speedMph ? speedMph + ' MPH' : 'Stopped'}
      - Cargo Details: ${cargoDescription}
      - Border Manifest Status (Border Connect): ${borderStatus || 'none'}
      - Projected ETA: ${eta || 'Calculating'}

      Compose:
      1. A professional email subject.
      2. A clean, reassuring body containing shipment milestones, active tracking details, estimated delivery, and a paragraph explaining supply chain visibility under Samsara ELD telemetry.
      3. A list of 3 key highlights / milestones achieved or pending.

      Format the output strictly as JSON following this schema:
      {
        "subject": "Email Subject Line",
        "emailBody": "Markdown or HTML-formatted email body",
        "estimatedDelivery": "Formatted ETA string",
        "keyHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
      }
    `;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            emailBody: { type: Type.STRING },
            estimatedDelivery: { type: Type.STRING },
            keyHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['subject', 'emailBody', 'estimatedDelivery', 'keyHighlights']
        }
      }
    });

    const resultText = response.text || '{}';
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error('Error creating customer update with Gemini:', error);
    res.status(500).json({ 
      error: 'Failed to create customer update email', 
      details: error.message 
    });
  }
});


// -------------------------------------------------------------
// Vite Dev Server & Static Asset Routing
// -------------------------------------------------------------
// async function startServer() {
//   if (process.env.NODE_ENV !== 'production') {
//     // Mount Vite middleware in development
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: 'spa',
//     });
//     app.use(vite.middlewares);
//   } else {
//     // Serve static assets in production
//     const distPath = path.join(process.cwd(), 'dist');
//     app.use(express.static(distPath));
//     app.get('*', (req, res) => {
//       res.sendFile(path.join(distPath, 'index.html'));
//     });
//   }

//   app.listen(PORT, '0.0.0.0', () => {
//     console.log(`LogiSync Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
//   });
// }
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
