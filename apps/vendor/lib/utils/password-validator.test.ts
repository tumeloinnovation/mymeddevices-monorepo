import { describe, it, expect } from 'vitest';
import { validatePassword, getPasswordRequirements } from './password-validator';

describe('password-validator', () => {
  it('returns all 5 requirement definitions', () => {
    const requirements = getPasswordRequirements();
    expect(requirements).toHaveLength(5);
    expect(requirements.map(r => r.id)).toEqual(['length', 'uppercase', 'lowercase', 'number', 'special']);
  });

  it('validates a strong password successfully', () => {
    const result = validatePassword('MedDevice#2026');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('identifies missing uppercase and special characters', () => {
    const result = validatePassword('weakpassword1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one uppercase letter');
    expect(result.errors).toContain('At least one special character');
  });

  it('identifies short password length', () => {
    const result = validatePassword('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least 8 characters');
  });

  it('identifies missing numbers', () => {
    const result = validatePassword('StrongPassword!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one number');
  });
});
