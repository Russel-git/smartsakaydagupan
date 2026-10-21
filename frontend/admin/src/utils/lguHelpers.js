/**
 * Formats a municipality or city name into its official LGU designation.
 * e.g., "Calasiao" -> "Municipality of Calasiao"
 *       "Binmaley" -> "Municipality of Binmaley"
 *       "Lingayen" -> "Municipality of Lingayen"
 *       "Mangaldan" -> "Municipality of Mangaldan"
 *       "Dagupan" -> "City of Dagupan"
 *       "San Carlos" -> "City of San Carlos"
 */
export const formatLguJurisdiction = (municipality) => {
  if (!municipality) return "City of Dagupan";
  const m = String(municipality).trim();
  const lower = m.toLowerCase();
  if (lower === "dagupan" || lower === "dagupan city") return "City of Dagupan";
  if (lower.startsWith("city of ")) return m;
  if (lower.endsWith(" city")) return `City of ${m.slice(0, -5).trim()}`;
  if (lower.startsWith("municipality of ")) return m;
  return `Municipality of ${m}`;
};

/**
 * Returns municipality title for sidebar brand subtitle and breadcrumbs.
 * e.g., "Calasiao" -> "Municipality of Calasiao"
 *       "Dagupan" -> "Dagupan City"
 */
export const formatMunicipalityShort = (municipality) => {
  if (!municipality) return "Dagupan City";
  const m = String(municipality).trim();
  const lower = m.toLowerCase();
  if (lower === "dagupan" || lower === "dagupan city") return "Dagupan City";
  if (lower.endsWith(" city")) return m;
  if (lower.startsWith("city of ")) return `${m.slice(8).trim()} City`;
  if (lower.startsWith("municipality of ")) return m;
  return `Municipality of ${m}`;
};

/**
 * Returns LGU Action Desk full title for the given municipality
 * e.g., "LGU Action Desk - Municipality of Calasiao"
 *       "LGU Action Desk - Municipality of Binmaley"
 *       "LGU Action Desk - City of Dagupan"
 */
export const getLguActionDeskTitle = (municipality) => {
  return `LGU Action Desk - ${formatLguJurisdiction(municipality)}`;
};
