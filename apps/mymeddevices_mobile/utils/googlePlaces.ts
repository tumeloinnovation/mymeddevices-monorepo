export interface ParsedGoogleAddress {
  address_1: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
  formattedAddress: string;
  region: string;
  lat?: number;
  lng?: number;
}

export function parseGoogleAddress(
  details: any,
  data?: any
): ParsedGoogleAddress {
  const components = details?.address_components || [];
  let street_number = "";
  let route = "";
  let city = "";
  let state = "";
  let country = "";
  let postal_code = "";

  components.forEach((comp: any) => {
    const types: string[] = comp.types || [];
    if (types.includes("street_number")) street_number = comp.long_name;
    if (types.includes("route")) route = comp.long_name;
    if (
      types.includes("locality") ||
      types.includes("administrative_area_level_3") ||
      types.includes("sublocality")
    ) {
      city = comp.long_name;
    }
    if (types.includes("administrative_area_level_1")) {
      state = comp.long_name || comp.short_name;
    }
    if (types.includes("country")) country = comp.long_name;
    if (types.includes("postal_code")) postal_code = comp.long_name;
  });

  const formattedAddress =
    details?.formatted_address || data?.description || "";
  const address_1 = `${street_number} ${route}`.trim() || formattedAddress;
  const region = (state || city || "Nairobi").replace(/\s*County$/i, "").trim();

  return {
    address_1,
    city: city || region || "Nairobi",
    state: state || region || "Nairobi",
    country: country || "KE",
    postcode: postal_code || "00100",
    formattedAddress,
    region,
    lat: details?.geometry?.location?.lat,
    lng: details?.geometry?.location?.lng,
  };
}

export default parseGoogleAddress;
