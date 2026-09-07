import deliveryFees from "@/utils/deliveryFees.json";

export interface ShippingRate {
  id: string;
  name: string;
  rate: number;
}

const FALLBACK_SHIPPING_RATE = 200; // Default rate in KES

const normalize = (str: string) =>
  str
    .toLowerCase()
    .replace(/\s*county$/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();

export const getShippingRates = async (
  region: string,
  _subtotal?: string
): Promise<ShippingRate[]> => {
  try {
    if (!region) {
      return [
        {
          id: "standard",
          name: "Standard Delivery",
          rate: FALLBACK_SHIPPING_RATE,
        },
      ];
    }

    const normalizedRegion = normalize(region);
    const feesList = deliveryFees as { code: string; state: string; price: number }[];

    // 1. Direct or partial match on normalized county name
    let matchedFee = feesList.find((item) => {
      const stateNorm = normalize(item.state);
      return (
        stateNorm === normalizedRegion ||
        normalizedRegion.includes(stateNorm) ||
        stateNorm.includes(normalizedRegion)
      );
    });

    // 2. If region has words separated by comma or space (e.g. "Tharaka-Nithi, Kenya"), check individual tokens
    if (!matchedFee) {
      const tokens = region
        .toLowerCase()
        .split(/[,/\s-]+/)
        .map((t) => t.replace(/[^a-z0-9]/g, "").trim())
        .filter((t) => t.length >= 3 && t !== "county" && t !== "kenya");

      for (const token of tokens) {
        const found = feesList.find((item) => normalize(item.state).includes(token));
        if (found) {
          matchedFee = found;
          break;
        }
      }
    }

    const rate = matchedFee ? matchedFee.price : FALLBACK_SHIPPING_RATE;
    const name = matchedFee ? `${matchedFee.state} Delivery` : "Doorstep Delivery";

    return [
      {
        id: matchedFee ? matchedFee.code : "standard",
        name,
        rate,
      },
    ];
  } catch {
    return [
      {
        id: "standard",
        name: "Standard Delivery",
        rate: FALLBACK_SHIPPING_RATE,
      },
    ];
  }
};
