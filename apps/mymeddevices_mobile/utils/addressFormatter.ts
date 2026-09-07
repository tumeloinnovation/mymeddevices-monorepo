import deliveryFees from "@/utils/deliveryFees.json";

export interface CleanAddressResult {
  formattedAddress: string;
  region: string;
  matchedCounty: string;
  deliveryFee: number;
}

const normalize = (str: string) =>
  str
    .toLowerCase()
    .replace(/\s*county$/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();

/**
 * Takes geocoded location components and returns clean, human-readable, non-repetitive words.
 * Avoids repeated road names (e.g. "Embu-Meru highway, Embu-Meru highway...") and isolates the County.
 */
export function formatGeocodedAddress(
  loc: {
    name?: string | null;
    street?: string | null;
    district?: string | null;
    city?: string | null;
    subregion?: string | null;
    region?: string | null;
    country?: string | null;
  }
): CleanAddressResult {
  const feesList = deliveryFees as { code: string; state: string; price: number }[];

  // Determine the county/region
  const candidateRegions = [loc.region, loc.subregion, loc.city, loc.district]
    .filter(Boolean)
    .map((r) => (r as string).trim());

  let matchedCounty = "";
  let deliveryFee = 200;

  for (const candidate of candidateRegions) {
    const normCand = normalize(candidate);
    const match = feesList.find((item) => {
      const normState = normalize(item.state);
      return (
        normState === normCand ||
        normCand.includes(normState) ||
        normState.includes(normCand)
      );
    });

    if (match) {
      matchedCounty = match.state.replace(/\s*County$/i, "").trim();
      deliveryFee = match.price;
      break;
    }
  }

  if (!matchedCounty) {
    matchedCounty = (loc.region || loc.subregion || loc.city || "Nairobi")
      .replace(/\s*County$/i, "")
      .trim();
  }

  // Deduplicate and filter parts to avoid "Embu-Meru highway, Embu-Meru highway"
  const rawParts = [
    loc.name,
    loc.street,
    loc.district,
    loc.city || loc.subregion,
    matchedCounty,
  ];

  const seen = new Set<string>();
  const cleanParts: string[] = [];

  for (const part of rawParts) {
    if (!part) continue;
    const trimmed = part.trim();
    if (!trimmed) continue;

    const norm = normalize(trimmed);
    // Ignore generic Kenya, unnamed roads or coordinates
    if (norm === "kenya" || norm.startsWith("unnamed") || norm.length <= 1) continue;

    // Check if we already have this part or a substantial substring
    let isDuplicate = false;
    for (const prev of seen) {
      if (prev === norm || prev.includes(norm) || norm.includes(prev)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.add(norm);
      cleanParts.push(trimmed.replace(/\s*County$/i, "").trim());
    }
  }

  // Keep it concise: at most 2 parts, e.g. "Embu-Meru Highway, Tharaka-Nithi"
  let formattedAddress = cleanParts.slice(0, 2).join(", ");
  if (!formattedAddress) {
    formattedAddress = `${matchedCounty}, Kenya`;
  }

  return {
    formattedAddress,
    region: matchedCounty,
    matchedCounty,
    deliveryFee,
  };
}
