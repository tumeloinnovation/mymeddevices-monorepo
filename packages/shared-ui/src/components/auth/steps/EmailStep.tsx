'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { getIconBgClass, getIconColor, getButtonClass } from '../auth-theme';

interface EmailStepProps {
  email: string;
  setEmail: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  userType?: 'customer' | 'vendor';
  onUserTypeChange?: (type: 'customer' | 'vendor') => void;
  showUserTypeToggle?: boolean;
  showLoginLink?: boolean;
  onLoginClick?: () => void;
  showGuestOption?: boolean;
  onGuestClick?: () => void;
  submitLabel?: string;
  description?: string;
}

export function EmailStep({
  email,
  setEmail,
  onSubmit,
  isLoading = false,
  error = null,
  userType = 'customer',
  onUserTypeChange,
  showUserTypeToggle = false,
  showLoginLink = true,
  onLoginClick,
  showGuestOption = false,
  onGuestClick,
  submitLabel = 'Continue',
  description = 'Enter your email to continue',
}: EmailStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Icon and title - only show when not in user type toggle mode */}
      {!showUserTypeToggle && (
        <div className="space-y-2 text-center">
          <div className={cn('mx-auto', getIconBgClass(), 'mb-4')}>
            <Mail className={cn('w-6 h-6', getIconColor())} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Verify Your Email</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Email input */}
      <div className="space-y-2">
        <Label htmlFor="email">
          {userType === 'customer' ? 'Email Address' : 'Business Email'}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder={
              userType === 'customer' ? 'you@example.com' : 'sales@company.com'
            }
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11"
            required
            disabled={isLoading}
            autoFocus
          />
        </div>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        className={cn('w-full h-11', getButtonClass())}
        disabled={isLoading || !email}
      >
        {isLoading ? 'Sending...' : submitLabel}
      </Button>

      {/* User type toggle */}
      {showUserTypeToggle && onUserTypeChange && (
        <div className="text-center text-sm text-muted-foreground">
          {userType === 'customer' ? (
            <span>
              Registering as a customer.{' '}
              <button
                type="button"
                onClick={() => onUserTypeChange('vendor')}
                className={cn('hover:underline', getIconColor())}
              >
                Register as vendor instead
              </button>
            </span>
          ) : (
            <span>
              Registering as a vendor.{' '}
              <button
                type="button"
                onClick={() => onUserTypeChange('customer')}
                className={cn('hover:underline', getIconColor())}
              >
                Register as customer instead
              </button>
            </span>
          )}
        </div>
      )}

      {/* Login link */}
      {showLoginLink && onLoginClick && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onLoginClick}
        >
          Already have an account? Login
        </Button>
      )}

      {/* Guest checkout option */}
      {showGuestOption && onGuestClick && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onGuestClick}
          >
            Continue as Guest
          </Button>
        </>
      )}

      <p className="text-xs text-center text-muted-foreground">
        We'll send you a verification code to confirm your email address.
      </p>
    </form>
  );
}
