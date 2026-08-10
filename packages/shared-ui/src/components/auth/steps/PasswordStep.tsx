'use client';

import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { PasswordInput } from '../common/PasswordInput';

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
  submitLabel = 'Reset Password',
  showConfirmPassword = true,
  passwordValidation,
  description = 'Set a new secure password for your account',
}: PasswordStepProps) {
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Header section */}
      <div className="text-center space-y-1.5 mb-5">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#e0752b]/10 border border-[#e0752b]/20 flex items-center justify-center mb-3 shadow-xs">
          <Lock className="w-6 h-6 text-[#e0752b]" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {showConfirmPassword ? 'Set New Password' : 'Enter Password'}
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <span>{error}</span>
        </div>
      )}

      {/* Password Input */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
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

      {/* Confirm Password Input */}
      {showConfirmPassword && (
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/90">Confirm New Password</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive font-medium">Passwords do not match</p>
          )}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 active:scale-[0.98] bg-[#e0752b] hover:bg-[#c86221] text-white border-0 mt-2"
        disabled={
          isLoading ||
          (passwordValidation && !passwordValidation.valid) ||
          (showConfirmPassword && (!passwordsMatch || !confirmPassword))
        }
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Updating Password...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {submitLabel}
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>
    </form>
  );
}
