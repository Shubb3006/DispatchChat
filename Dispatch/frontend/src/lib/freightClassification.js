/* ══════════════════════════════════════════════════════════════════════════
   Freight classification.

   These four attributes used to share one `house_status` dropdown backed by a
   flat list of 44 mixed values, so a load could not be both "FTL" and
   "IN TRANSIT" — picking a status erased the size. They are independent
   attributes and are modelled as such.

   Stored values are stable codes; labels are what dispatch reads.
   ══════════════════════════════════════════════════════════════════════════ */

export const FREIGHT_SIZES = [
  { value: "FTL", label: "FTL — Full Truckload" },
  { value: "LTL", label: "LTL — Less Than Truckload" },
];

export const FREIGHT_TYPES = [
  { value: "DRY", label: "Dry" },
  { value: "REEFER", label: "Reefer — Refrigerated" },
  { value: "HEATER", label: "Heater — Heated" },
];

/* Descriptive only — this records what equipment the load is on. It does not
   drive the trailer planner's capacity math; that stays under the planner's own
   trailer selector so choosing a value here never silently changes numbers on
   another screen. */
export const TRAILER_TYPES = [
  { value: "53FT_DRY_VAN", label: `53ft Dry Van` },
  { value: "53FT_REEFER", label: `53ft Reefer` },
  { value: "53FT_HEATER", label: `53ft Heater` },
  { value: "CONTAINER", label: "Container" },
  { value: "STRAIGHT_BODY", label: "Straight Body" },
];

export const COMMITMENTS = [
  { value: "normal", label: "Normal" },
  { value: "appointment", label: "Appointment" },
  { value: "guaranteed", label: "Guaranteed" },
  { value: "guaranteed_appointment", label: "Guaranteed + Appointment" },
];

/* Operational status is NOT here. It lives in lib/loadStatuses.js as the
   canonical loads.status registry, shared with the Kanban board, so the two
   cannot drift. This module covers the four descriptive attributes only. */

const labelFrom = (options, value, fallback = "—") =>
  options.find((o) => o.value === value)?.label ?? (value || fallback);

export const freightSizeLabel = (v) => labelFrom(FREIGHT_SIZES, v);
export const freightTypeLabel = (v) => labelFrom(FREIGHT_TYPES, v);
export const trailerTypeLabel = (v) => labelFrom(TRAILER_TYPES, v, "Not set");
export const commitmentLabel = (v) => labelFrom(COMMITMENTS, v || "normal");

export const readFreightSize = (load) =>
  load?.freight_size || load?.freightSize || "FTL";
export const readFreightType = (load) =>
  load?.freight_type || load?.freightType || "DRY";
export const readTrailerType = (load) =>
  load?.trailer_type || load?.trailerType || "";
export const readCommitment = (load) =>
  load?.commitment || load?.deliveryCommitment || "normal";
