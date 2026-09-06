/* ══════════════════════════════════════════════════════════════════════════
   Trailer floor planning for non-uniform skids.

   The previous model assumed every load was standard 48x40 GMA pallets in a
   fixed 26-slot grid. Real LTL mixes 48x48 chemical skids, 42x42 beverage,
   36x36 half-pallets and oversized crates on one trailer, so the fixed grid
   both misreported remaining space and hid over-height / over-length problems.

   This lays freight out the way a trailer is actually loaded: row by row from
   the nose to the doors, each row as wide as the trailer allows.

   Deliberately CONSERVATIVE. Each load starts a new row rather than sharing a
   part-filled row with a differently-sized load. A real loader can sometimes
   tuck a small skid beside a large one, so this can report slightly more
   linear feet than a perfect load would use. That direction is the safe one:
   warning that freight might not fit is recoverable, promising it fits when it
   doesn't strands a driver at a dock.
   ══════════════════════════════════════════════════════════════════════════ */

// Interior dimensions in inches. Exterior width is 102", but posts, liner and
// load bars leave roughly 100" usable, and that is what freight has to fit in.
export const TRAILER_PRESETS = {
  "53_dry_van": { label: `53' Dry Van`, lengthIn: 636, widthIn: 100, heightIn: 110, maxPayloadLbs: 45000 },
  "48_dry_van": { label: `48' Dry Van`, lengthIn: 576, widthIn: 100, heightIn: 108, maxPayloadLbs: 45000 },
  "26_straight": { label: `26' Straight Truck`, lengthIn: 312, widthIn: 96, heightIn: 96, maxPayloadLbs: 12000 },
  "20_reefer": { label: `20' Reefer`, lengthIn: 228, widthIn: 92, heightIn: 88, maxPayloadLbs: 8000 },
};

export const DEFAULT_TRAILER = TRAILER_PRESETS["53_dry_van"];

/* Common North American skid footprints. `length` runs along the trailer,
   `width` runs across it, before any rotation the packer decides on. */
export const SKID_PRESETS = [
  { label: "GMA Standard 48×40", lengthIn: 48, widthIn: 40, heightIn: 48 },
  { label: "Square 48×48", lengthIn: 48, widthIn: 48, heightIn: 48 },
  { label: "Beverage 42×42", lengthIn: 42, widthIn: 42, heightIn: 48 },
  { label: "Half 48×20", lengthIn: 48, widthIn: 20, heightIn: 48 },
  { label: "Euro 47×32", lengthIn: 47.2, widthIn: 31.5, heightIn: 48 },
  { label: "Square 36×36", lengthIn: 36, widthIn: 36, heightIn: 48 },
];

// Used only when a load carries no dimensions at all. Callers must surface
// `assumedDimensions` so this is never mistaken for measured data.
export const ASSUMED_SKID = { lengthIn: 48, widthIn: 40, heightIn: 48 };

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/* Smallest credible skid dimension, in inches. Nothing shippable on a pallet
   measures a few inches on any axis, so a value below this is a data-entry
   slip — a stray spinner click turning an empty field into 0.3" — not real
   freight. Caught explicitly because it otherwise plans as a valid skid and
   silently reports a trailer as nearly empty. */
export const MIN_PLAUSIBLE_IN = 6;

export const implausibleDimensions = (load) => {
  const bad = [];
  const check = (value, axis) => {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0 && n < MIN_PLAUSIBLE_IN) {
      bad.push(`${axis} ${n}"`);
    }
  };
  check(load.skid_length_in ?? load.skidLengthIn, "length");
  check(load.skid_width_in ?? load.skidWidthIn, "width");
  check(load.skid_height_in ?? load.skidHeightIn, "height");
  return bad;
};

/* Read a load's skid spec, reporting whether it was supplied or assumed. */
export const skidSpecFor = (load) => {
  const lengthIn = num(load.skid_length_in ?? load.skidLengthIn);
  const widthIn = num(load.skid_width_in ?? load.skidWidthIn);
  const heightIn = num(load.skid_height_in ?? load.skidHeightIn);

  const supplied = Boolean(lengthIn && widthIn);

  return {
    lengthIn: lengthIn || ASSUMED_SKID.lengthIn,
    widthIn: widthIn || ASSUMED_SKID.widthIn,
    heightIn: heightIn || ASSUMED_SKID.heightIn,
    // Height alone doesn't make a footprint, so it's tracked separately.
    heightSupplied: Boolean(heightIn),
    supplied,
    assumed: !supplied,
    stackable: Boolean(load.is_stackable ?? load.isStackable),
    maxStack: num(load.max_stack_count ?? load.maxStackCount) || 2,
    noRotate: Boolean(load.no_rotate ?? load.noRotate),
    count: Math.max(1, Number(load.pieces ?? load.palletCount ?? 1) || 1),
  };
};

/* Choose how to turn a skid. A 48×40 laid with its 40" side across fits two
   across a 100" trailer using 48" of length; turned 90° it also fits two
   across using 40" of length, which is better. Efficiency is skids per inch
   of trailer length consumed. */
const bestOrientation = (skid, trailerWidthIn) => {
  const options = [
    { acrossWidthIn: skid.widthIn, rowDepthIn: skid.lengthIn, rotated: false },
  ];
  if (!skid.noRotate) {
    options.push({ acrossWidthIn: skid.lengthIn, rowDepthIn: skid.widthIn, rotated: true });
  }

  let best = null;
  for (const opt of options) {
    const perRow = Math.floor(trailerWidthIn / opt.acrossWidthIn);
    if (perRow < 1) continue; // too wide for the trailer in this orientation
    const efficiency = perRow / opt.rowDepthIn;
    if (!best || efficiency > best.efficiency) best = { ...opt, perRow, efficiency };
  }
  return best;
};

/**
 * Plan a trailer floor from a set of loads with independent skid dimensions.
 *
 * @param {Array} loads    loads carrying pieces + optional skid dimensions
 * @param {Object} trailer one of TRAILER_PRESETS
 * @returns {Object} rows, usage totals, and any blocking problems
 */
export const planTrailer = (loads = [], trailer = DEFAULT_TRAILER) => {
  const rows = [];
  const perLoad = [];
  const problems = [];

  let lengthUsedIn = 0;
  let totalWeightLbs = 0;
  let anyAssumed = false;

  loads.forEach((load, loadIndex) => {
    const skid = skidSpecFor(load);
    if (skid.assumed) anyAssumed = true;

    const loadNumber = load.load_number || load.tracking_number || load.id;

    const nonsense = implausibleDimensions(load);
    if (nonsense.length) {
      problems.push({
        severity: "blocking",
        loadNumber,
        message: `Load ${loadNumber}: ${nonsense.join(", ")} is too small to be a real skid. Check the measurement before planning against it.`,
      });
    }
    const weight = Number(load.weight ?? load.weightLbs) || 0;
    totalWeightLbs += weight;

    const orientation = bestOrientation(skid, trailer.widthIn);

    // A skid wider than the trailer in every allowed orientation cannot load.
    if (!orientation) {
      problems.push({
        severity: "blocking",
        loadNumber,
        message: `Load ${loadNumber}: skid ${skid.lengthIn}"×${skid.widthIn}" does not fit across a ${trailer.widthIn}" trailer${skid.noRotate ? " and is marked do-not-rotate" : ""}.`,
      });
      perLoad.push({ load, loadNumber, skid, fits: false, rowsUsed: 0, lengthUsedIn: 0 });
      return;
    }

    if (skid.heightIn > trailer.heightIn) {
      problems.push({
        severity: "blocking",
        loadNumber,
        message: `Load ${loadNumber}: skid height ${skid.heightIn}" exceeds the ${trailer.heightIn}" trailer interior.`,
      });
    }

    // Stacking takes skids off the floor entirely.
    let stackHeight = 1;
    if (skid.stackable) {
      const fitsHigh = Math.floor(trailer.heightIn / skid.heightIn);
      stackHeight = Math.max(1, Math.min(skid.maxStack, fitsHigh));
    }
    const floorSkids = Math.ceil(skid.count / stackHeight);

    const rowsNeeded = Math.ceil(floorSkids / orientation.perRow);
    const loadStartIn = lengthUsedIn;
    let placed = 0;

    for (let r = 0; r < rowsNeeded; r++) {
      const inThisRow = Math.min(orientation.perRow, floorSkids - placed);
      rows.push({
        loadIndex,
        loadNumber,
        startIn: lengthUsedIn,
        depthIn: orientation.rowDepthIn,
        count: inThisRow,
        perRow: orientation.perRow,
        skidAcrossIn: orientation.acrossWidthIn,
        rotated: orientation.rotated,
        stackHeight,
        // Sequence numbers for labelling, matching the old P#n display.
        seqFrom: placed * stackHeight + 1,
        seqTo: Math.min(skid.count, (placed + inThisRow) * stackHeight),
      });
      placed += inThisRow;
      lengthUsedIn += orientation.rowDepthIn;
    }

    perLoad.push({
      load,
      loadNumber,
      skid,
      orientation,
      stackHeight,
      floorSkids,
      fits: true,
      rowsUsed: rowsNeeded,
      startIn: loadStartIn,
      lengthUsedIn: lengthUsedIn - loadStartIn,
      weight,
    });
  });

  const overflowIn = Math.max(0, lengthUsedIn - trailer.lengthIn);
  if (overflowIn > 0) {
    problems.push({
      severity: "blocking",
      message: `Freight needs ${(lengthUsedIn / 12).toFixed(1)} ft of floor but the ${trailer.label} has ${(trailer.lengthIn / 12).toFixed(1)} ft — over by ${(overflowIn / 12).toFixed(1)} ft.`,
    });
  }

  if (totalWeightLbs > trailer.maxPayloadLbs) {
    problems.push({
      severity: "blocking",
      message: `Payload ${totalWeightLbs.toLocaleString()} lbs exceeds the ${trailer.maxPayloadLbs.toLocaleString()} lbs limit for this equipment.`,
    });
  }

  if (anyAssumed) {
    problems.push({
      severity: "info",
      message: `Some loads have no skid dimensions on file. Those are planned as ${ASSUMED_SKID.lengthIn}"×${ASSUMED_SKID.widthIn}" GMA pallets — set real dimensions for an accurate plan.`,
    });
  }

  return {
    trailer,
    rows,
    perLoad,
    problems,
    lengthUsedIn,
    lengthRemainingIn: Math.max(0, trailer.lengthIn - lengthUsedIn),
    overflowIn,
    floorUsagePct: Math.min(100, Math.round((lengthUsedIn / trailer.lengthIn) * 100)),
    totalWeightLbs,
    weightUsagePct: Math.min(100, Math.round((totalWeightLbs / trailer.maxPayloadLbs) * 100)),
    totalSkids: loads.reduce((n, l) => n + skidSpecFor(l).count, 0),
    anyAssumed,
    fits: problems.every((p) => p.severity !== "blocking"),
  };
};
