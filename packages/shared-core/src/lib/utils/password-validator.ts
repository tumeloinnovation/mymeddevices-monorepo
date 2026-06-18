/**
 * Password Validation Utility
 * 
 * Validates passwords according to MyMedDevices security requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}

const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
} as const;

const SPECIAL_CHAR_REGEX = /[@$!%*?&#]/;
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /[0-9]/;

/**
 * Validates a password against security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (!password) {
        return {
            valid: false,
            errors: ['Password is required'],
        };
    }

    // Check minimum length
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    }

    // Check for uppercase letter
    if (PASSWORD_REQUIREMENTS.requireUppercase && !UPPERCASE_REGEX.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (PASSWORD_REQUIREMENTS.requireLowercase && !LOWERCASE_REGEX.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (PASSWORD_REQUIREMENTS.requireNumber && !NUMBER_REGEX.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Check for special character
    if (PASSWORD_REQUIREMENTS.requireSpecialChar && !SPECIAL_CHAR_REGEX.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&#)');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Returns a list of password requirements as user-friendly strings
 */
export function getPasswordRequirements(): string[] {
    return [
        `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
        'At least one uppercase letter (A-Z)',
        'At least one lowercase letter (a-z)',
        'At least one number (0-9)',
        'At least one special character (@$!%*?&#)',
    ];
}

/**
 * Generates a random password that meets all requirements
 * Useful for temporary passwords or testing
 */
export function generateSecurePassword(length: number = 12): string {
    if (length < PASSWORD_REQUIREMENTS.minLength) {
        length = PASSWORD_REQUIREMENTS.minLength;
    }

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@$!%*?&#';
    const allChars = uppercase + lowercase + numbers + special;

    // Ensure at least one of each required character type
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
}

/**
 * Gets password strength level based on characteristics
 * Returns: 'weak' | 'medium' | 'strong' | 'very-strong'
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' | 'very-strong' {
    const result = validatePassword(password);

    if (!result.valid) {
        return 'weak';
    }

    let score = 0;

    // Length bonuses
    if (password.length >= 12) score += 2;
    else if (password.length >= 10) score += 1;

    // Variety bonuses
    if (/[A-Z].*[A-Z]/.test(password)) score += 1; // Multiple uppercase
    if (/[a-z].*[a-z]/.test(password)) score += 1; // Multiple lowercase
    if (/[0-9].*[0-9]/.test(password)) score += 1; // Multiple numbers
    if (/[@$!%*?&#].*[@$!%*?&#]/.test(password)) score += 1; // Multiple special chars

    let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
    if (score >= 6) strength = 'very-strong';
    else if (score >= 4) strength = 'strong';
    else if (score >= 2) strength = 'medium';

    // Apply length-based caps to enforce realistic security levels
    if (password.length < 10) {
        return 'weak';
    }
    if (password.length < 12 && (strength === 'strong' || strength === 'very-strong')) {
        return 'medium';
    }
    if (password.length < 14 && strength === 'very-strong') {
        return 'strong';
    }

    return strength;
}
