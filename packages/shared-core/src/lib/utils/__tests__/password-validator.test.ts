import {
    validatePassword,
    getPasswordRequirements,
    generateSecurePassword,
    getPasswordStrength,
    type PasswordValidationResult,
} from '../password-validator';

describe('Password Validator', () => {
    describe('validatePassword', () => {
        it('should validate a strong password', () => {
            const result = validatePassword('MyPass123!');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject empty password', () => {
            const result = validatePassword('');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password is required');
        });

        it('should reject password shorter than 8 characters', () => {
            const result = validatePassword('Pass1!');
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('8 characters'))).toBe(true);
        });

        it('should reject password without uppercase letter', () => {
            const result = validatePassword('mypass123!');
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
        });

        it('should reject password without lowercase letter', () => {
            const result = validatePassword('MYPASS123!');
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('lowercase'))).toBe(true);
        });

        it('should reject password without number', () => {
            const result = validatePassword('MyPassword!');
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('number'))).toBe(true);
        });

        it('should reject password without special character', () => {
            const result = validatePassword('MyPass123');
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('special character'))).toBe(true);
        });

        it('should return multiple errors for very weak password', () => {
            const result = validatePassword('weak');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });

        it('should accept password with all required characteristics', () => {
            const passwords = [
                'Abcdef12!',
                'MySecure123@',
                'P@ssw0rd',
                'Test1234!',
                'Strong#Pass1',
            ];

            passwords.forEach(password => {
                const result = validatePassword(password);
                expect(result.valid).toBe(true);
            });
        });

        it('should accept all valid special characters', () => {
            const specialChars = '@$!%*?&#';

            specialChars.split('').forEach(char => {
                const password = `MyPass123${char}`;
                const result = validatePassword(password);
                expect(result.valid).toBe(true);
            });
        });
    });

    describe('getPasswordRequirements', () => {
        it('should return array of requirement strings', () => {
            const requirements = getPasswordRequirements();
            expect(Array.isArray(requirements)).toBe(true);
            expect(requirements.length).toBeGreaterThan(0);
        });

        it('should include all requirement categories', () => {
            const requirements = getPasswordRequirements().join(' ');
            expect(requirements).toContain('8 characters');
            expect(requirements).toContain('uppercase');
            expect(requirements).toContain('lowercase');
            expect(requirements).toContain('number');
            expect(requirements).toContain('special character');
        });
    });

    describe('generateSecurePassword', () => {
        it('should generate a valid password', () => {
            const password = generateSecurePassword();
            const result = validatePassword(password);
            expect(result.valid).toBe(true);
        });

        it('should generate password of specified length', () => {
            const password = generateSecurePassword(12);
            expect(password.length).toBe(12);
        });

        it('should enforce minimum length', () => {
            const password = generateSecurePassword(5); // Less than min (8)
            expect(password.length).toBeGreaterThanOrEqual(8);
        });

        it('should generate different passwords each time', () => {
            const password1 = generateSecurePassword();
            const password2 = generateSecurePassword();
            expect(password1).not.toBe(password2);
        });

        it('should include at least one of each required character type', () => {
            const password = generateSecurePassword(12);
            expect(/[A-Z]/.test(password)).toBe(true);
            expect(/[a-z]/.test(password)).toBe(true);
            expect(/[0-9]/.test(password)).toBe(true);
            expect(/[@$!%*?&#]/.test(password)).toBe(true);
        });
    });

    describe('getPasswordStrength', () => {
        it('should return "weak" for invalid password', () => {
            const strength = getPasswordStrength('weak');
            expect(strength).toBe('weak');
        });

        it('should return "weak" for short valid password', () => {
            const strength = getPasswordStrength('Pass123!');
            expect(strength).toBe('weak');
        });

        it('should return "medium" for decent password', () => {
            const strength = getPasswordStrength('MyPass123!');
            expect(strength).toBe('medium');
        });

        it('should return "strong" for good password', () => {
            const strength = getPasswordStrength('MyStr0ng!Pass');
            expect(strength).toBe('strong');
        });

        it('should return "very-strong" for excellent password', () => {
            const strength = getPasswordStrength('MyV3ry!Str0ng@P@ssw0rd');
            expect(strength).toBe('very-strong');
        });

        it('should consider password length in strength', () => {
            const short = getPasswordStrength('Pass123!');
            const medium = getPasswordStrength('MyPass123!');
            const long = getPasswordStrength('MyLongPassword123!');

            // Longer passwords should be stronger or equal
            expect(['weak', 'medium', 'strong', 'very-strong'].indexOf(long))
                .toBeGreaterThanOrEqual(['weak', 'medium', 'strong', 'very-strong'].indexOf(short));
        });

        it('should consider character variety in strength', () => {
            const simple = getPasswordStrength('Password1!');
            const varied = getPasswordStrength('P@ssW0rd!123');

            const strengthOrder = ['weak', 'medium', 'strong', 'very-strong'];
            expect(strengthOrder.indexOf(varied))
                .toBeGreaterThanOrEqual(strengthOrder.indexOf(simple));
        });
    });
});
