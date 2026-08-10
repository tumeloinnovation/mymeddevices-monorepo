'use client';

import { Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { PasswordInput } from '../common/PasswordInput';
import { cn } from '../../../lib/utils';
import { getButtonClass } from '../auth-theme';

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
  submitLabel = 'Login to Account',
}: LoginStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Header section with brand icon */}
      <div className="text-center space-y-1.5 mb-5">
        <div className="mx-auto w-11 h-11 rounded-2xl bg-[#e0752b]/10 border border-[#e0752b]/20 flex items-center justify-center mb-3 shadow-xs transition-transform duration-200 hover:scale-105">
          <Lock className="w-5 h-5 text-[#e0752b]" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          Welcome back
        </h3>
        <p className="text-xs text-muted-foreground">
          Enter your credentials to access your account & orders
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <span>{error}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <Label htmlFor="login-email" className="text-xs font-semibold text-foreground/90">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11 rounded-xl border-input/80 bg-background/50 focus-visible:ring-2 focus-visible:ring-[#e0752b]/30 focus-visible:border-[#e0752b] transition-all text-sm"
            required
            disabled={isLoading}
            autoFocus
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="login-password" className="text-xs font-semibold text-foreground/90">
            Password
          </Label>
          {showForgotPassword && onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-medium text-[#e0752b] hover:underline transition-colors"
            >
              Forgot password?
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

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 active:scale-[0.98] bg-[#e0752b] hover:bg-[#c86221] text-white border-0"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Logging in...
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
