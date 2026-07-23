'use client';

import { Lock } from 'lucide-react';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { PasswordInput } from '../common/PasswordInput';
import { cn } from '../../../lib/utils';

interface PasswordStepProps {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  submitLabel?: string;
  showConfirmPassword?: boolean;
  passwordValidation?: {
    valid: boolean;
    errors: string[];
  };
  description?: string;
}

export function PasswordStep({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  isLoading = false,
  error = null,
  submitLabel = 'Continue',
  showConfirmPassword = true,
  passwordValidation,
  description = 'Create a secure password for your account',
}: PasswordStepProps) {
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Icon and title */}
      <div className="space-y-2 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-teal-600" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {showConfirmPassword ? 'Set Your Password' : 'Enter Your Password'}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">
          {showConfirmPassword ? 'New Password' : 'Password'}
        </Label>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
          disabled={isLoading}
          autoFocus
          showRequirements={showConfirmPassword}
          validation={passwordValidation}
        />
      </div>

      {/* Confirm Password */}
      {showConfirmPassword && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        disabled={
          isLoading ||
          (passwordValidation && !passwordValidation.valid) ||
          (showConfirmPassword && (!passwordsMatch || !confirmPassword))
        }
      >
        {isLoading ? 'Processing...' : submitLabel}
      </Button>
    </form>
  );
}
