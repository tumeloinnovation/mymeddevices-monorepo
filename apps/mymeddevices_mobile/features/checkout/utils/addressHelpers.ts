import { DeliveryLocation } from "@/stores/useDeliveryLocationStore";
import { Customer } from "@/types/user";
import { parseGoogleAddress } from "@/utils/googlePlaces";

/**
 * Creates a DeliveryLocation object from Google Places selection data and details.
 */
export function createCustomDeliveryLocation(
  data: any,
  details: any,
  matchDeliveryFee: (region: string) => number
): { location: DeliveryLocation; state: string; cleanAddress: string } {
  const parsed = details ? parseGoogleAddress(details, data) : null;
  const state =
    parsed?.city ||
    parsed?.state ||
    parsed?.region ||
    data?.structured_formatting?.secondary_text?.split(",")?.[0]?.trim() ||
    "Kenya";
  const fee = matchDeliveryFee(parsed?.region || state);
  const cleanAddress =
    parsed?.formattedAddress || data?.structured_formatting?.main_text || state;

  const location: DeliveryLocation = {
    code: "CUSTOM",
    state,
    price: fee,
    formattedAddress: cleanAddress,
    label: data?.structured_formatting?.main_text || parsed?.city || state,
  };

  return { location, state, cleanAddress };
}

/**
 * Compiles a deduplicated list of saved delivery locations from the user profile
 * and local store.
 */
export function buildCombinedSavedAddresses(
  customer: Customer | null,
  isAuthenticated: boolean,
  savedAddresses: DeliveryLocation[],
  matchDeliveryFee: (region: string) => number
): DeliveryLocation[] {
  const list: DeliveryLocation[] = [];
  const seenAddresses = new Set<string>();

  const addUnique = (loc: DeliveryLocation) => {
    const key = (loc.formattedAddress || loc.state).trim().toLowerCase();
    if (!seenAddresses.has(key)) {
      seenAddresses.add(key);
      list.push(loc);
    }
  };

  if (isAuthenticated && customer?.shipping?.address_1) {
    const shipState = customer.shipping.city || customer.shipping.state || "Kenya";
    addUnique({
      id: "profile-shipping",
      code: "PROFILE_SHIPPING",
      state: shipState,
      price: matchDeliveryFee(shipState),
      formattedAddress: `${customer.shipping.address_1}${customer.shipping.city ? `, ${customer.shipping.city}` : ""}`,
      label: "Primary Shipping Address",
      isDefault: true,
    });
  }

  for (const saved of savedAddresses) {
    if (
      saved.id !== "default-nairobi" &&
      saved.label !== "Default Location" &&
      saved.state !== "Nairobi County"
    ) {
      addUnique(saved);
    }
  }

  return list;
}
