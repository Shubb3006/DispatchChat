/**
 * Route-Based Team Assignment Service
 * 
 * Rules:
 * - Canada to USA: Team A (Cross-border US Inbound, PAPS required)
 * - USA to Canada: Team B (Cross-border CA Inbound, PARS required)
 * - Toronto to Montreal: Team C (Domestic Eastern Corridor)
 * - Montreal to Toronto: Team D (Domestic Eastern Corridor)
 * - Western Canada routes: Team E (Inter-provincial: AB, BC, SK, MB)
 */

const WESTERN_PROVINCES = ["AB", "BC", "SK", "MB", "ALBERTA", "BRITISH COLUMBIA", "SASKATCHEWAN", "MANITOBA"];
const WESTERN_CITIES = [
  "VANCOUVER", "SURREY", "CALGARY", "EDMONTON", "WINNIPEG",
  "REGINA", "SASKATOON", "KELOWNA", "KAMLOOPS", "LETHBRIDGE"
];

/**
 * Normalizes location string into country, state/province, and city
 */
export function parseLocationComponents({ city = "", state = "", country = "", fullAddress = "" }) {
  const text = `${city} ${state} ${country} ${fullAddress}`.toUpperCase();

  let detectedCountry = "USA";
  if (
    country.toUpperCase() === "CAN" ||
    country.toUpperCase() === "CANADA" ||
    text.includes(" CANADA") ||
    text.includes(", CAN") ||
    text.includes(", ON") ||
    text.includes(" ONTARIO") ||
    text.includes(", QC") ||
    text.includes(" QUEBEC") ||
    text.includes(", BC") ||
    text.includes(", AB") ||
    text.includes(", MB") ||
    text.includes(", SK")
  ) {
    detectedCountry = "CAN";
  } else if (
    country.toUpperCase() === "USA" ||
    country.toUpperCase() === "US" ||
    text.includes(" USA") ||
    text.includes(" UNITED STATES")
  ) {
    detectedCountry = "USA";
  }

  return {
    country: detectedCountry,
    rawText: text,
    city: city?.toUpperCase().trim(),
    state: state?.toUpperCase().trim(),
  };
}

/**
 * Evaluates origin and destination to assign operational team & cross-border requirements
 */
export function evaluateRouteTeam({
  originCity = "",
  originState = "",
  originCountry = "",
  originAddress = "",
  destinationCity = "",
  destinationState = "",
  destinationCountry = "",
  destinationAddress = "",
}) {
  const origin = parseLocationComponents({
    city: originCity,
    state: originState,
    country: originCountry,
    fullAddress: originAddress,
  });

  const dest = parseLocationComponents({
    city: destinationCity,
    state: destinationState,
    country: destinationCountry,
    fullAddress: destinationAddress,
  });

  // 1. Check City-specific corridors: Toronto <-> Montreal
  const isOrigToronto = origin.rawText.includes("TORONTO") || origin.rawText.includes("BRAMPTON") || origin.rawText.includes("MISSISSAUGA");
  const isDestMontreal = dest.rawText.includes("MONTREAL") || dest.rawText.includes("LAVAL") || dest.rawText.includes("DORVAL");
  const isOrigMontreal = origin.rawText.includes("MONTREAL") || origin.rawText.includes("LAVAL") || origin.rawText.includes("DORVAL");
  const isDestToronto = dest.rawText.includes("TORONTO") || dest.rawText.includes("BRAMPTON") || dest.rawText.includes("MISSISSAUGA");

  if (isOrigToronto && isDestMontreal) {
    return {
      assignedTeam: "Team C",
      teamDescription: "Team C — Toronto to Montreal Corridor",
      isCrossBorder: false,
      borderDirection: "DOMESTIC_CA",
      leadNumberType: null,
      customsDocRequired: false,
    };
  }

  if (isOrigMontreal && isDestToronto) {
    return {
      assignedTeam: "Team D",
      teamDescription: "Team D — Montreal to Toronto Corridor",
      isCrossBorder: false,
      borderDirection: "DOMESTIC_CA",
      leadNumberType: null,
      customsDocRequired: false,
    };
  }

  // 2. Check Western Canada routes
  const isOrigWest = WESTERN_PROVINCES.some((p) => origin.rawText.includes(p)) ||
    WESTERN_CITIES.some((c) => origin.rawText.includes(c));
  const isDestWest = WESTERN_PROVINCES.some((p) => dest.rawText.includes(p)) ||
    WESTERN_CITIES.some((c) => dest.rawText.includes(c));

  if (origin.country === "CAN" && dest.country === "CAN" && (isOrigWest || isDestWest)) {
    return {
      assignedTeam: "Team E",
      teamDescription: "Team E — Western Canada Routes",
      isCrossBorder: false,
      borderDirection: "DOMESTIC_CA",
      leadNumberType: null,
      customsDocRequired: false,
    };
  }

  // 3. Check Cross-Border: Canada to USA (Team A)
  if (origin.country === "CAN" && dest.country === "USA") {
    return {
      assignedTeam: "Team A",
      teamDescription: "Team A — Canada to USA (US Inbound)",
      isCrossBorder: true,
      borderDirection: "INBOUND_US",
      leadNumberType: "PAPS",
      scac: "NISD",
      customsDocRequired: true,
    };
  }

  // 4. Check Cross-Border: USA to Canada (Team B)
  if (origin.country === "USA" && dest.country === "CAN") {
    return {
      assignedTeam: "Team B",
      teamDescription: "Team B — USA to Canada (Canada Inbound)",
      isCrossBorder: true,
      borderDirection: "INBOUND_CA",
      leadNumberType: "PARS",
      scac: "22GY",
      customsDocRequired: true,
    };
  }

  // Fallback defaults
  return {
    assignedTeam: "Team A",
    teamDescription: "Team A — Primary Operations",
    isCrossBorder: origin.country !== dest.country,
    borderDirection: origin.country === "CAN" ? "INBOUND_US" : "INBOUND_CA",
    leadNumberType: origin.country === "CAN" ? "PAPS" : "PARS",
    customsDocRequired: origin.country !== dest.country,
  };
}
