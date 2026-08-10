'use client';

import { useState, useRef, useEffect } from 'react';
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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split current value into array of length N
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleDigitChange = (index: number, digitValue: string) => {
    const cleanDigits = digitValue.replace(/\D/g, '');
    if (!cleanDigits) {
      // Cleared or invalid char
      const newDigits = [...digits];
      newDigits[index] = '';
      const combined = newDigits.join('');
      onChange(combined);
      return;
    }

    if (cleanDigits.length > 1) {
      // Pasted multi-character string into single box
      const newCombined = (value.slice(0, index) + cleanDigits).slice(0, length);
      onChange(newCombined);
      const nextFocus = Math.min(index + cleanDigits.length, length - 1);
      inputRefs.current[nextFocus]?.focus();

      if (newCombined.length === length && onComplete) {
        onComplete(newCombined);
      }
      return;
    }

    // Single digit input
    const newDigits = [...digits];
    newDigits[index] = cleanDigits;
    const combined = newDigits.join('');
    onChange(combined);

    // Auto advance focus to next input box
    if (index < length - 1 && cleanDigits) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger completion if full
    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Empty box backspace: focus previous box and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const focusTarget = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusTarget]?.focus();
      if (pastedData.length === length && onComplete) {
        onComplete(pastedData);
      }
    }
  };

  return (
    <div className={cn('flex items-center justify-center gap-2 sm:gap-2.5 my-2', className)}>
      {digits.map((digit, index) => {
        const isFilled = Boolean(digit);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={length}
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'w-11 h-12 sm:w-12 sm:h-13 text-center text-xl font-bold rounded-xl transition-all duration-150 border',
              'bg-background/60 shadow-2xs focus:outline-hidden',
              isFilled
                ? 'border-[#e0752b] bg-[#e0752b]/5 text-[#e0752b] shadow-xs'
                : 'border-input/80 text-foreground hover:border-input',
              'focus-visible:ring-2 focus-visible:ring-[#e0752b]/30 focus-visible:border-[#e0752b] focus:scale-105',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        );
      })}
    </div>
  );
}
