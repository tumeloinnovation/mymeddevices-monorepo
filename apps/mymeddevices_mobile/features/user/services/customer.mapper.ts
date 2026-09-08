import {
  BackendAddress,
  BackendCustomer,
  Billing,
  Customer,
  Shipping,
} from "@/types/user";

function resolveAddress(
  addresses: BackendAddress[] | any[] | undefined,
  type: "shipping" | "billing",
  fallback?: any
) {
  if (!addresses || !addresses.length) return fallback;
  return (
    addresses.find((a) => a.type === type && a.is_default) ||
    addresses.find((a) => a.type === type) ||
    fallback
  );
}

function mapAddressFields(
  address: any,
  fallbackName: { first: string; last: string },
  fallbackCompany: string,
  fallbackPhone: string
) {
  return {
    first_name: address?.first_name || fallbackName.first,
    last_name: address?.last_name || fallbackName.last,
    company: address?.company || fallbackCompany,
    phone: address?.phone || fallbackPhone,
    address_1: address?.address_line1 || address?.address || "",
    address_2: address?.address_line2 || "",
    city: address?.city || "Nairobi",
    state: address?.state || "Nairobi",
    postcode: address?.postal_code || "00100",
    country: address?.country || "KE",
  };
}

/**
 * Maps FastAPI BackendCustomer and BackendAddress schemas into the mobile Customer model.
 */
export function mapBackendCustomer(
  c: BackendCustomer | any,
  addresses?: BackendAddress[] | any[]
): Customer {
  const first = c?.first_name || "";
  const last = c?.last_name || "";
  const email = c?.email || "";
  const phone = c?.phone || "";
  const company = c?.company || "";
  const fallbackName = { first, last };

  const defaultShipping = resolveAddress(addresses, "shipping", addresses?.[0]);
  const defaultBilling = resolveAddress(addresses, "billing", defaultShipping);

  const shipping: Shipping = mapAddressFields(
    defaultShipping,
    fallbackName,
    company,
    phone
  );

  const billing: Billing = {
    ...mapAddressFields(defaultBilling, fallbackName, company, phone),
    email,
  };

  return {
    id: c?.id || 1,
    email,
    first_name: first,
    last_name: last,
    role: "customer",
    username: email,
    billing,
    shipping,
    avatar_url: c?.avatar_url || "",
    loyalty_points: c?.loyalty_points || 0,
    loyalty_tier: c?.loyalty_tier || "Bronze",
    is_paying_customer: true,
  };
}
