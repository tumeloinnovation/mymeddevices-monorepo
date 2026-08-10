'use client';

import { Mail, ArrowRight, UserCheck, Store } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

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
  submitLabel = 'Continue to Verification',
  description = 'Enter your email to create your account',
}: EmailStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Step Header */}
      <div className="text-center space-y-1.5 mb-6">
        <div className="mx-auto w-11 h-11 rounded-2xl bg-[#e0752b]/10 border border-[#e0752b]/20 flex items-center justify-center mb-3 shadow-xs transition-transform duration-200 hover:scale-105">
          <Mail className="w-5 h-5 text-[#e0752b]" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">
          {userType === 'customer' ? 'Create Customer Account' : 'Register Vendor Store'}
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <span>{error}</span>
        </div>
      )}

      {/* Account Type Selector (Customer vs Vendor) */}
      {showUserTypeToggle && onUserTypeChange && (
        <div className="grid grid-cols-2 gap-2 mb-2 p-1 bg-muted/40 rounded-2xl border border-border/40">
          <button
            type="button"
            onClick={() => onUserTypeChange('customer')}
            className={cn(
              'flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all',
              userType === 'customer'
                ? 'bg-background shadow-xs text-[#e0752b] border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
          <button
            type="button"
            onClick={() => onUserTypeChange('vendor')}
            className={cn(
              'flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl transition-all',
              userType === 'vendor'
                ? 'bg-background shadow-xs text-[#0e599b] border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Vendor</span>
          </button>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <Label htmlFor="reg-email" className="text-xs font-semibold text-foreground/90">
          {userType === 'customer' ? 'Email Address' : 'Business Email'}
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            id="reg-email"
            type="email"
            placeholder={
              userType === 'customer' ? 'you@example.com' : 'sales@company.com'
            }
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11 rounded-xl border-input/80 bg-background/50 focus-visible:ring-2 focus-visible:ring-[#e0752b]/30 focus-visible:border-[#e0752b] transition-all text-sm"
            required
            disabled={isLoading}
            autoFocus
          />
        </div>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full h-11 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 active:scale-[0.98] bg-[#e0752b] hover:bg-[#c86221] text-white border-0"
        disabled={isLoading || !email}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Sending Code...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {submitLabel}
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>

      {/* Login link */}
      {showLoginLink && onLoginClick && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-xl font-medium text-xs border-border/80 hover:bg-muted/50"
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
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground text-[10px] tracking-wider">Or</span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="w-full h-10 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={onGuestClick}
          >
            Continue as Guest
          </Button>
        </>
      )}

      <p className="text-[11px] text-center text-muted-foreground/80 pt-1">
        We'll send a 6-digit verification code to confirm your email address.
      </p>
    </form>
  );
}
