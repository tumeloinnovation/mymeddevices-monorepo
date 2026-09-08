/**
 * Normalizes a phone number to standard Kenyan international format (e.g. 2547XXXXXXXX or 2541XXXXXXXX).
 */
export function formatMpesaPhoneNumber(phone: string): string {
  let cleaned = (phone || "").replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = `254${cleaned.substring(1)}`;
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = `254${cleaned}`;
  }
  return cleaned;
}
