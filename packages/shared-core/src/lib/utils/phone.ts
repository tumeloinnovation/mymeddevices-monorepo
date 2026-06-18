/**
 * Validates and normalizes a Kenyan phone number to +254 format.
 * 
 * Accepts formats:
 * - +254XXXXXXXXX (12 digits with country code)
 * - 254XXXXXXXXX (12 digits without +)
 * - 07XXXXXXXX (10 digits with leading 0)
 * - 01XXXXXXXX (10 digits with leading 0, new series)
 * - 7XXXXXXXX (9 digits)
 * - 1XXXXXXXX (9 digits, new series)
 * 
 * @param raw - The raw phone number input
 * @returns The normalized phone number in +254XXXXXXXXX format, or null if invalid
 */
export function validateAndNormalizeKenyanPhone(raw: string): string | null {
    if (!raw) return null;

    // 1. Sanitize: Remove all non-digit characters (keep digits only)
    let clean = raw.replace(/\D/g, '');

    // 2. Handle known prefixes to isolate the significant 9 digits
    // Case: 2547XXXXXXXX (12 digits) -> Strip 254
    if (clean.startsWith('254') && clean.length === 12) {
        clean = clean.substring(3);
    }
    // Case: 07XXXXXXXX (10 digits) -> Strip 0
    else if (clean.startsWith('0') && clean.length === 10) {
        clean = clean.substring(1);
    }
    // Case: 7XXXXXXXX (9 digits) -> Keep as is
    else if (clean.length !== 9) {
        return null; // Invalid length
    }

    // 3. Validate the significant digits (Must start with 7 or 1)
    // 7... = Standard mobile (07...)
    // 1... = New series (01...)
    if (!/^(7|1)[0-9]{8}$/.test(clean)) {
        return null;
    }

    // 4. Return Normalized Format
    return `+254${clean}`;
}

/**
 * Validates a Kenyan phone number without normalizing.
 * Use this for simple validation checks.
 * 
 * @param phone - The phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidKenyanPhone(phone: string): boolean {
    return validateAndNormalizeKenyanPhone(phone) !== null;
}

/**
 * Known Safaricom prefixes (after the country code 254)
 * These are the 2-3 digit prefixes that identify Safaricom numbers
 */
const SAFARICOM_PREFIXES = [
    // 07XX series
    '70',  // 0700-0709
    '71',  // 0710-0719
    '72',  // 0720-0729
    '79',  // 0790-0799
    // 01XX series (newer allocations)
    '110', // 0110X
    '111', // 0111X
    '112', // 0112X
    '113', // 0113X
    '114', // 0114X
    '115', // 0115X
];

/**
 * Checks if a phone number is a Safaricom number (M-Pesa compatible).
 * 
 * Safaricom prefixes include:
 * - 070X, 071X, 072X, 079X (traditional)
 * - 0110, 0111, 0112, 0113, 0114, 0115 (newer allocations)
 * 
 * @param phone - The phone number to check (any format)
 * @returns true if the number is Safaricom/M-Pesa compatible, false otherwise
 */
export function isSafaricomNumber(phone: string): boolean {
    const normalized = validateAndNormalizeKenyanPhone(phone);
    if (!normalized) return false;

    // Extract the significant digits after +254
    const significantDigits = normalized.substring(4); // Remove "+254"

    // Check if it starts with any known Safaricom prefix
    return SAFARICOM_PREFIXES.some(prefix => significantDigits.startsWith(prefix));
}

/**
 * Validates and checks if a phone number is Safaricom/M-Pesa compatible.
 * Returns the normalized number if valid, null otherwise.
 * 
 * @param phone - The phone number to validate
 * @returns The normalized phone number if Safaricom, null otherwise
 */
export function validateSafaricomNumber(phone: string): string | null {
    const normalized = validateAndNormalizeKenyanPhone(phone);
    if (!normalized) return null;

    return isSafaricomNumber(normalized) ? normalized : null;
}
