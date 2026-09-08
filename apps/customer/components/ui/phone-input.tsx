'use client';

import * as React from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'ref'> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  id?: string;
}

/**
 * Phone input with automatic formatting for Kenyan phone numbers
 * - Accepts both 07XX and +2547XX formats
 * - Auto-formats to +254 XXX XXX XXX as user types
 * - Validates on blur
 */
export function PhoneInput({ value, onChange, label, error, id, className, ...props }: PhoneInputProps) {
  const [displayValue, setDisplayValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Update display value when prop changes - show raw digits only
  React.useEffect(() => {
    if (!value) {
      setDisplayValue('');
      return;
    }
    // Extract just the 9 digits for display
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('254')) {
      setDisplayValue(digits.substring(3, 12));
    } else if (digits.startsWith('0')) {
      setDisplayValue(digits.substring(1, 10));
    } else {
      setDisplayValue(digits.substring(0, 9));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); // Remove all non-digits

    // Handle country code
    if (input.startsWith('254')) {
      input = input.substring(3);
    } else if (input.startsWith('0')) {
      input = input.substring(1);
    }

    // Limit to 9 digits (Kenyan phone number length)
    if (input.length > 9) {
      input = input.substring(0, 9);
    }

    // Display just the raw digits, but store with +254 prefix
    setDisplayValue(input);

    // Format as +254 XXX XXX XXX for storage
    const formatted = input.length > 0 ? formatPhoneNumber(input) : '';
    onChange(formatted);
  };

  const handleBlur = () => {
    // Validate format on blur
    if (displayValue && !displayValue.match(/^\+254\s?\d{3}\s?\d{3}\s?\d{3}$/)) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className={cn(error && 'text-destructive')}>
          {label}
        </Label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
          +254
        </span>
        <Input
          ref={inputRef}
          id={id}
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn('pl-14', error && 'border-destructive focus-visible:ring-destructive', className)}
          placeholder="7XX XXX XXX"
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm font-medium text-destructive animate-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Format phone number to +254 XXX XXX XXX display format
 */
function formatPhoneNumber(digits: string): string {
  if (digits.length <= 3) return `+254 ${digits}`;
  if (digits.length <= 6) return `+254 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `+254 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/**
 * Format phone for display in input (without +254 prefix)
 */
function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) {
    return formatPhoneNumber(digits.substring(3));
  }
  return formatPhoneNumber(digits);
}

/**
 * Validate Kenyan phone number format
 */
export function validateKenyanPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Must be 12 digits with 254 prefix, or 10 digits with 0 prefix
  return /^\d{12}$/.test(digits) || /^\d{10}$/.test(digits);
}

/**
 * Normalize phone to +254XXXXXXXXX format
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+254${digits.substring(1)}`;
  }
  return `+254${digits}`;
}
