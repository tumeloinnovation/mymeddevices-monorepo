'use client';

import { Lock, Mail } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { PasswordInput } from '../common/PasswordInput';
import { cn } from '../../../lib/utils';
import { getButtonClass, getIconBgClass, getIconColor } from '../auth-theme';

interface LoginStepProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onForgotPassword?: () => void;
  showForgotPassword?: boolean;
  submitLabel?: string;
}

export function LoginStep({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  isLoading = false,
  error = null,
  onForgotPassword,
  showForgotPassword = true,
  submitLabel = 'Login',
}: LoginStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Icon and title */}
      <div className="space-y-2 text-center">
        <div className={cn('mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4', getIconBgClass())}>
          <Lock className={cn('w-6 h-6', getIconColor())} />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome Back
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="login-email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11"
            required
            disabled={isLoading}
            autoFocus
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="login-password">Password</Label>
          {showForgotPassword && onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className={cn('text-xs hover:underline', getIconColor())}
            >
              Forgot Password?
            </button>
          )}
        </div>
        <PasswordInput
          id="login-password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        className={cn('w-full h-11', getButtonClass())}
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : submitLabel}
      </Button>
    </form>
  );
}
