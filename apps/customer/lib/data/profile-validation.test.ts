import { describe, it, expect } from 'vitest';
import { profileSchema, calculateProfileCompleteness, getMissingFields } from './profile-validation';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';

describe('profileSchema & standardSchemaResolver Integration', () => {
  it('1. successfully parses and normalizes a valid profile with 07XXXXXXXX phone number', () => {
    const validData = {
      firstName: 'Jane',
      lastName: 'Wanjiku',
      displayName: 'Jane W.',
      phone: '0712345678',
    };

    const result = profileSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('+254712345678');
      expect(result.data.firstName).toBe('Jane');
    }
  });

  it('2. successfully parses a valid profile with +254XXXXXXXXX phone number', () => {
    const validData = {
      firstName: 'David',
      lastName: 'Otieno',
      displayName: 'David',
      phone: '+254722123456',
    };

    const result = profileSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('+254722123456');
    }
  });

  it('3. rejects invalid names with numeric or prohibited characters', () => {
    const invalidData = {
      firstName: 'Jane123',
      lastName: 'Wanjiku<script>',
      phone: '+254712345678',
    };

    const result = profileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.firstName).toBeDefined();
      expect(errors.lastName).toBeDefined();
    }
  });

  it('4. rejects invalid phone formats', () => {
    const invalidPhoneData = {
      firstName: 'Jane',
      lastName: 'Wanjiku',
      phone: '123456',
    };

    const result = profileSchema.safeParse(invalidPhoneData);
    expect(result.success).toBe(false);
  });

  it('5. works seamlessly with standardSchemaResolver for React Hook Form', async () => {
    const resolver = standardSchemaResolver(profileSchema);
    const validValues = {
      firstName: 'Sarah',
      lastName: 'Mutua',
      phone: '+254700112233',
    };

    const resolution = await resolver(validValues, {}, {
      fields: {},
      shouldUseNativeValidation: false,
    });

    expect(resolution.errors).toEqual({});
    expect(resolution.values.phone).toBe('+254700112233');
  });

  it('6. calculates profile completeness percentage correctly', () => {
    const emptyProfile = {};
    expect(calculateProfileCompleteness(emptyProfile)).toBe(0);

    const requiredOnly = {
      firstName: 'Sarah',
      lastName: 'Mutua',
      phone: '+254700112233',
    };
    expect(calculateProfileCompleteness(requiredOnly)).toBe(60);

    const completeProfile = {
      firstName: 'Sarah',
      lastName: 'Mutua',
      phone: '+254700112233',
      displayName: 'Sarah M.',
      avatar_url: 'https://example.com/avatar.jpg',
      hasAddress: true,
    };
    expect(calculateProfileCompleteness(completeProfile)).toBe(100);
  });

  it('7. reports missing fields accurately', () => {
    const partialProfile = {
      firstName: 'Sarah',
      phone: '+254700112233',
    };
    const missing = getMissingFields(partialProfile);
    expect(missing).toContain('last name');
    expect(missing).toContain('display name');
    expect(missing).toContain('shipping address');
    expect(missing).not.toContain('first name');
    expect(missing).not.toContain('phone number');
  });
});
