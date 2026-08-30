import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function cleanField(val) {
  if (!val) return "";
  let str = String(val).trim();
  if (str.startsWith('="') && str.endsWith('"')) {
    str = str.slice(2, -1);
  } else if (str.startsWith("=") && str.length > 1) {
    str = str.slice(1);
  }
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.slice(1, -1);
  }
  return str.trim();
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === "," && !inQuotes) {
      result.push(cleanField(current));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(cleanField(current));
  return result;
}

async function main() {
  try {
    console.log("Expanding database schema...");
    await pool.query(`
      ALTER TABLE trucks ADD COLUMN IF NOT EXISTS type_code VARCHAR(20) DEFAULT 'TR';
      ALTER TABLE trucks ADD COLUMN IF NOT EXISTS type_description VARCHAR(100) DEFAULT 'Tractor (Semi)';
      ALTER TABLE trucks ADD COLUMN IF NOT EXISTS dot_number VARCHAR(50);
      ALTER TABLE trucks ADD COLUMN IF NOT EXISTS terminal VARCHAR(255) DEFAULT '1805 CHEMIN SAINT-FRANCOIS';
      ALTER TABLE trucks ADD COLUMN IF NOT EXISTS insurance_policy VARCHAR(100);
      ALTER TABLE trucks ADD COLUMN IF NOT EXISTS state_province VARCHAR(10) DEFAULT 'QC';

      ALTER TABLE trailers ADD COLUMN IF NOT EXISTS type_code VARCHAR(20) DEFAULT 'TL';
      ALTER TABLE trailers ADD COLUMN IF NOT EXISTS type_description VARCHAR(100) DEFAULT 'Semi truck trailer';
      ALTER TABLE trailers ADD COLUMN IF NOT EXISTS terminal VARCHAR(255) DEFAULT '1805 CHEMIN SAINT-FRANCOIS';
      ALTER TABLE trailers ADD COLUMN IF NOT EXISTS state_province VARCHAR(10) DEFAULT 'QC';

      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS dob VARCHAR(50);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS citizenship VARCHAR(100) DEFAULT 'Canada';
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS terminal VARCHAR(255) DEFAULT '1805 CHEMIN SAINT-FRANCOIS';
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS fast_id VARCHAR(100);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS travel_doc_number VARCHAR(100);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS travel_doc_type VARCHAR(50) DEFAULT 'Passport';
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS travel_doc_country VARCHAR(10) DEFAULT 'CA';
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS email VARCHAR(100);
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
    `);

    // 1. Trailers
    console.log("Reading and processing Trailers...");
    const trailerFile = path.join(__dirname, "../data/trailers_raw.csv");
    const trailerLines = fs.readFileSync(trailerFile, "utf-8").split("\n").map(l => l.trim()).filter(Boolean);
    const trailers = [];
    const seenTrailers = new Set();

    for (let i = 1; i < trailerLines.length; i++) {
      const parts = parseCSVLine(trailerLines[i]);
      if (!parts || parts.length < 5) continue;
      const [trailerNumber, typeCode, typeDescription, terminal, plateNumber, stateProvince] = parts;
      if (!trailerNumber || seenTrailers.has(trailerNumber)) continue;
      seenTrailers.add(trailerNumber);

      trailers.push({
        trailer_number: trailerNumber,
        trailer_type: typeDescription || "Semi truck trailer",
        type_code: typeCode || "TL",
        type_description: typeDescription || "Semi truck trailer",
        terminal: terminal || "1805 CHEMIN SAINT-FRANCOIS",
        plate_number: plateNumber || "",
        state_province: stateProvince || "QC",
        capacity: 45000,
        status: "AVAILABLE",
      });
    }

    // Batch insert trailers (chunks of 50)
    for (let i = 0; i < trailers.length; i += 50) {
      const chunk = trailers.slice(i, i + 50);
      const values = [];
      const placeholders = chunk.map((t, idx) => {
        const offset = idx * 9;
        values.push(t.trailer_number, t.trailer_type, t.type_code, t.type_description, t.terminal, t.plate_number, t.state_province, t.capacity, t.status);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
      }).join(", ");

      await pool.query(`
        INSERT INTO trailers (trailer_number, trailer_type, type_code, type_description, terminal, plate_number, state_province, capacity, status)
        VALUES ${placeholders}
        ON CONFLICT (trailer_number) DO UPDATE
        SET trailer_type = EXCLUDED.trailer_type,
            type_code = EXCLUDED.type_code,
            type_description = EXCLUDED.type_description,
            plate_number = EXCLUDED.plate_number,
            state_province = EXCLUDED.state_province;
      `, values);
    }
    console.log(`✅ ${trailers.length} Trailers inserted/updated!`);

    // 2. Trucks
    console.log("Reading and processing Trucks...");
    const truckFile = path.join(__dirname, "../data/trucks_raw.csv");
    const truckLines = fs.readFileSync(truckFile, "utf-8").split("\n").map(l => l.trim()).filter(Boolean);
    const trucks = [];
    const seenTrucks = new Set();

    for (let i = 1; i < truckLines.length; i++) {
      const parts = parseCSVLine(truckLines[i]);
      if (!parts || parts.length < 7) continue;
      const [truckNumber, typeCode, typeDescription, vinNumber, dotNumber, terminal, insurancePolicy, plateNumber, stateProvince] = parts;
      if (!truckNumber || truckNumber === "581" && !vinNumber || seenTrucks.has(truckNumber)) continue;
      seenTrucks.add(truckNumber);

      let make = "Volvo";
      let model = "VNL 860";
      if (vinNumber.startsWith("1FUJ")) { make = "Freightliner"; model = "Cascadia"; }
      else if (vinNumber.startsWith("3AKJ")) { make = "Freightliner"; model = "Cascadia 126"; }
      else if (vinNumber.startsWith("4V4")) { make = "Volvo"; model = "VNL 760"; }
      else if (vinNumber.startsWith("3HSD")) { make = "International"; model = "LT625"; }

      trucks.push({
        truck_number: truckNumber,
        type_code: typeCode || "TR",
        type_description: typeDescription || "Tractor (Semi)",
        vin: vinNumber || "",
        dot_number: dotNumber || "",
        terminal: terminal || "1805 CHEMIN SAINT-FRANCOIS",
        insurance_policy: insurancePolicy || "",
        plate_number: plateNumber || "",
        state_province: stateProvince || "QC",
        make,
        model,
        year: 2023,
        status: "AVAILABLE",
      });
    }

    // Batch insert trucks (chunks of 50)
    for (let i = 0; i < trucks.length; i += 50) {
      const chunk = trucks.slice(i, i + 50);
      const values = [];
      const placeholders = chunk.map((t, idx) => {
        const offset = idx * 13;
        values.push(t.truck_number, t.type_code, t.type_description, t.vin, t.dot_number, t.terminal, t.insurance_policy, t.plate_number, t.state_province, t.make, t.model, t.year, t.status);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13})`;
      }).join(", ");

      await pool.query(`
        INSERT INTO trucks (truck_number, type_code, type_description, vin, dot_number, terminal, insurance_policy, plate_number, state_province, make, model, year, status)
        VALUES ${placeholders}
        ON CONFLICT (truck_number) DO UPDATE
        SET vin = EXCLUDED.vin,
            plate_number = EXCLUDED.plate_number,
            make = EXCLUDED.make,
            model = EXCLUDED.model,
            state_province = EXCLUDED.state_province,
            dot_number = EXCLUDED.dot_number;
      `, values);
    }
    console.log(`✅ ${trucks.length} Trucks inserted/updated!`);

    // 3. Drivers
    console.log("Reading and processing Drivers...");
    const driverFile = path.join(__dirname, "../data/drivers_raw.csv");
    const driverLines = fs.readFileSync(driverFile, "utf-8").split("\n").map(l => l.trim()).filter(Boolean);
    const drivers = [];
    const seenDrivers = new Set();

    for (let i = 1; i < driverLines.length; i++) {
      const parts = parseCSVLine(driverLines[i]);
      if (!parts || parts.length < 5) continue;
      const [
        number,
        firstName,
        middleName,
        lastName,
        gender,
        dob,
        citizenship,
        terminal,
        fastId,
        travelDocNum,
        typeCode,
        typeDesc,
        stateProvince,
        country,
        travelDocNum2,
        typeCode2,
        typeDesc2,
        stateProv2,
        country2,
        primaryEmail,
        secondaryEmail,
        primaryCell
      ] = parts;

      if (!firstName && !lastName) continue;

      let driverCode = number || `DR${Math.floor(100 + Math.random() * 900)}`;
      if (driverCode.startsWith("=")) driverCode = driverCode.slice(1);
      if (!driverCode.startsWith("DR") && !isNaN(driverCode)) driverCode = `DR${driverCode}`;

      // Deduplicate driver codes
      let finalCode = driverCode;
      let suffix = 1;
      while (seenDrivers.has(finalCode)) {
        finalCode = `${driverCode}-${suffix++}`;
      }
      seenDrivers.add(finalCode);

      const name = [firstName, middleName, lastName].filter(Boolean).join(" ");
      const cdlNumber = travelDocNum2 || travelDocNum || `CDL-${Math.floor(100000 + Math.random() * 900000)}`;

      drivers.push({
        driver_code: finalCode,
        name,
        first_name: firstName || "",
        middle_name: middleName || "",
        last_name: lastName || "",
        gender: gender || "M",
        dob: dob || "1985-01-01",
        citizenship: citizenship || "Canada",
        terminal: terminal || "1805 CHEMIN SAINT-FRANCOIS",
        fast_id: fastId || "",
        travel_doc_number: travelDocNum || "",
        travel_doc_type: typeDesc || "Passport",
        travel_doc_country: country || "CA",
        license_number: cdlNumber,
        license_expiry: "2028-12-31",
        license_state: stateProv2 || stateProvince || "QC",
        email: primaryEmail || `${(firstName || "driver").toLowerCase().replace(/[^a-z0-9]/g, "")}@nishantransport.com`,
        phone_number: primaryCell || "514-695-4200",
        status: "AVAILABLE",
        current_duty_status: "OFF",
      });
    }

    // Batch insert drivers (chunks of 30)
    for (let i = 0; i < drivers.length; i += 30) {
      const chunk = drivers.slice(i, i + 30);
      const values = [];
      const placeholders = chunk.map((d, idx) => {
        const offset = idx * 19;
        values.push(
          d.driver_code,
          d.first_name,
          d.middle_name,
          d.last_name,
          d.gender,
          d.dob,
          d.citizenship,
          d.terminal,
          d.fast_id,
          d.travel_doc_number,
          d.travel_doc_type,
          d.travel_doc_country,
          d.license_number,
          d.license_expiry,
          d.license_state,
          d.email,
          d.phone_number,
          d.status,
          d.current_duty_status
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18}, $${offset + 19})`;
      }).join(", ");

      await pool.query(`
        INSERT INTO drivers (driver_code, first_name, middle_name, last_name, gender, dob, citizenship, terminal, fast_id, travel_doc_number, travel_doc_type, travel_doc_country, license_number, license_expiry, license_state, email, phone_number, status, current_duty_status)
        VALUES ${placeholders}
        ON CONFLICT (driver_code) DO UPDATE
        SET first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            travel_doc_number = EXCLUDED.travel_doc_number,
            license_number = EXCLUDED.license_number,
            email = EXCLUDED.email,
            phone_number = EXCLUDED.phone_number,
            license_state = EXCLUDED.license_state;
      `, values);
    }
    console.log(`✅ ${drivers.length} Drivers inserted/updated!`);

    // Write frontend dataset
    const outputDir = path.join(__dirname, "../../../frontend/src/data");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(
      path.join(outputDir, "nishanFleetData.json"),
      JSON.stringify({ trailers, trucks, drivers }, null, 2)
    );
    console.log("✅ Seeded JSON cache at Dispatch/frontend/src/data/nishanFleetData.json");

    console.log("🎉 Complete Nishan Transport fleet and driver database sync completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding fleet:", err);
    process.exit(1);
  }
}

main();
