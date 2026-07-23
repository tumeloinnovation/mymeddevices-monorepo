'use client';

import { useState, useEffect } from 'react';
import { Input } from '../../ui/input';
import { cn } from '../../../lib/utils';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  onComplete?: (code: string) => void;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
  className,
  onComplete,
}: OTPInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange(newValue);

    // Auto-submit when complete
    if (newValue.length === length && onComplete) {
      onComplete(newValue);
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder={Array(length).fill('0').join('')}
      value={value}
      onChange={handleChange}
      className={cn(
        'h-12 text-center text-2xl tracking-[0.5em] font-bold',
        'focus:border-teal-500 focus:ring-teal-500/20',
        className
      )}
      maxLength={length}
      required
      disabled={disabled}
      autoFocus={autoFocus}
    />
  );
}
