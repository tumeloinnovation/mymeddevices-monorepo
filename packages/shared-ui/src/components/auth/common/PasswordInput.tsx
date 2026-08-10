'use client';

import { useState } from 'react';
import { Input } from '../../ui/input';
import { Eye, EyeOff, Lock } from 'lucide-react';
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
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'pl-10 pr-10 h-11 rounded-xl border-input/80 bg-background/50 focus-visible:ring-2 focus-visible:ring-[#e0752b]/30 focus-visible:border-[#e0752b] transition-all text-sm',
            className
          )}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-0 h-full flex items-center text-muted-foreground/70 hover:text-foreground transition-colors z-10"
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
