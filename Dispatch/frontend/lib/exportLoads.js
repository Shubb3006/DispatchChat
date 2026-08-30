// exportLoads.js
// Zero-dependency CSV export for freight loads.
// Produces one row per load with shipper + consignee location, cube/volume,
// weight, and freight charge. The .csv opens directly in Excel / Google Sheets.

// Loads may arrive as raw DB rows (snake_case, e.g. shipper_street_address) or
// the frontend fallback shape (camelCase, e.g. shipperAddress), so every
// accessor checks both spellings.
const firstDefined = (...vals) =>
  vals.find((v) => v !== undefined && v !== null && v !== "") ?? "";

const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toISOString().slice(0, 10);
};

const fmtNum = (v) => {
  if (v === undefined || v === null || v === "") return "";
  const n = Number(v);
  return isNaN(n) ? String(v) : String(n);
};

// Column order for the export. `numeric: true` keeps the value unquoted so a
// spreadsheet treats it as a number rather than text.
const COLUMNS = [
  { header: "Load #", get: (l) => firstDefined(l.load_number, l.loadNumber, l.tracking_number, l.trackingNumber, l.id) },
  { header: "Status", get: (l) => firstDefined(l.status) },
  { header: "Customer", get: (l) => firstDefined(l.customer_name, l.customerName) },

  { header: "Shipper Name", get: (l) => firstDefined(l.shipper_name, l.shipperName) },
  { header: "Shipper Address", get: (l) => firstDefined(l.shipper_street_address, l.shipper_address, l.shipperAddress) },
  { header: "Shipper City/District", get: (l) => firstDefined(l.shipper_district, l.shipper_city, l.shipperDistrict, l.shipperCity) },
  { header: "Shipper State", get: (l) => firstDefined(l.shipper_state, l.shipperState) },
  { header: "Shipper Zip", get: (l) => firstDefined(l.shipper_zipcode, l.shipper_zip, l.shipperZipcode) },
  { header: "Shipper Country", get: (l) => firstDefined(l.shipper_country, l.shipperCountry) },

  { header: "Consignee Name", get: (l) => firstDefined(l.consignee_name, l.consigneeName) },
  { header: "Consignee Address", get: (l) => firstDefined(l.consignee_street_address, l.consignee_address, l.consigneeAddress) },
  { header: "Consignee City/District", get: (l) => firstDefined(l.consignee_district, l.consignee_city, l.consigneeDistrict, l.consigneeCity) },
  { header: "Consignee State", get: (l) => firstDefined(l.consignee_state, l.consigneeState) },
  { header: "Consignee Zip", get: (l) => firstDefined(l.consignee_zipcode, l.consignee_zip, l.consigneeZipcode) },
  { header: "Consignee Country", get: (l) => firstDefined(l.consignee_country, l.consigneeCountry) },

  { header: "Commodity", get: (l) => firstDefined(l.commodity, l.cargoDescription, l.cargo) },
  { header: "Pieces", numeric: true, get: (l) => fmtNum(firstDefined(l.pieces, l.palletCount, l.pallets)) },
  { header: "Weight (lbs)", numeric: true, get: (l) => fmtNum(firstDefined(l.weight, l.weightLbs, l.weight_lbs)) },
  { header: "Cube / Volume (cu ft)", numeric: true, get: (l) => fmtNum(firstDefined(l.cube_volume, l.cubeVolume, l.cube)) },
  { header: "Freight Charge (USD)", numeric: true, get: (l) => fmtNum(firstDefined(l.rate, l.priceInvoice, l.freight_charge)) },

  { header: "Pickup Date", get: (l) => fmtDate(firstDefined(l.pickup_date, l.pickupDate)) },
  { header: "Delivery Date", get: (l) => fmtDate(firstDefined(l.delivery_date, l.deliveryDate, l.eta)) },
];

const escapeCsv = (value, numeric) => {
  const s = value === undefined || value === null ? "" : String(value);
  if (numeric && s !== "" && !isNaN(Number(s))) return s; // leave numbers unquoted
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

// Build the raw CSV text (header row + one row per load). Exported for testing.
export const buildLoadsCsv = (loads = []) => {
  const list = Array.isArray(loads) ? loads : [loads];
  const header = COLUMNS.map((c) => escapeCsv(c.header)).join(",");
  const rows = list.map((load) =>
    COLUMNS.map((c) => escapeCsv(c.get(load), c.numeric)).join(",")
  );
  return [header, ...rows].join("\r\n");
};

const triggerDownload = (csv, filename) => {
  // Prepend a UTF-8 BOM so Excel reads accented characters correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const stamp = () => new Date().toISOString().slice(0, 10);

// Export one or many loads to a downloaded CSV file. Pass the already-filtered
// list (e.g. filteredAndSortedShipments) to honour the current view.
export const exportLoadsToCsv = (loads = [], filename) => {
  const list = Array.isArray(loads) ? loads : [loads];
  triggerDownload(buildLoadsCsv(list), filename || `Loads-Export-${stamp()}.csv`);
  return list.length;
};

// Export a single load to its own file named after the load number.
export const exportSingleLoadToCsv = (load) => {
  if (!load) return 0;
  const num =
    firstDefined(load.load_number, load.loadNumber, load.tracking_number, load.trackingNumber, load.id) || "load";
  const safe = String(num).replace(/[^a-zA-Z0-9._-]/g, "_");
  return exportLoadsToCsv([load], `Load-${safe}.csv`);
};
