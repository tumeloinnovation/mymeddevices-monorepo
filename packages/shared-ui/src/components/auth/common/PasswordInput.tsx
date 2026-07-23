'use client';

import { useState } from 'react';
import { Input } from '../../ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  showRequirements?: boolean;
  validation?: {
    valid: boolean;
    errors: string[];
  };
}

export function PasswordInput({
  id = 'password',
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  disabled = false,
  className,
  autoFocus = false,
  showRequirements = false,
  validation,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn('pr-10', className)}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-0 h-full flex items-center text-muted-foreground hover:text-foreground z-10"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showRequirements && validation && value && (
        <div className="mt-2 space-y-1">
          {validation.errors.length > 0 ? (
            validation.errors.map((error, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-red-500">
                <span>•</span>
                <span>{error}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <span>✓</span>
              <span>Password meets all requirements</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
