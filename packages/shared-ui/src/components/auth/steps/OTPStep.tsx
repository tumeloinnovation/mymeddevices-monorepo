'use client';

import { useState, useEffect } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { cn } from '../../../lib/utils';
import { OTPInput } from '../common/OTPInput';
import { getIconBgClass, getIconColor, getButtonClass } from '../auth-theme';

interface OTPStepProps {
  email: string;
  otp: string;
  setOtp: (otp: string) => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  onResend: () => void | Promise<void>;
  onChangeEmail: () => void;
  isLoading?: boolean;
  error?: string | null;
  length?: number;
}

export function OTPStep({
  email,
  otp,
  setOtp,
  onSubmit,
  onResend,
  onChangeEmail,
  isLoading = false,
  error = null,
  length = 6,
}: OTPStepProps) {
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setResendCooldown(60);
    await onResend();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Icon and title */}
      <div className="space-y-2 text-center">
        <div className={cn('mx-auto', getIconBgClass(), 'mb-4')}>
          <Mail className={cn('w-6 h-6', getIconColor())} />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Check Your Email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a code to{' '}
          <span className="text-foreground font-medium">{email}</span>
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* OTP input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp" className="text-center">
            Verification Code
          </Label>
          <OTPInput
            value={otp}
            onChange={setOtp}
            length={length}
            disabled={isLoading}
            onComplete={(code) => {
              setOtp(code);
              // Auto-submit after a brief delay to let the input update
              setTimeout(() => {
                const form = document.querySelector('form');
                if (form && !isLoading) {
                  form.requestSubmit();
                }
              }, 100);
            }}
          />
        </div>

        <Button
          type="submit"
          className={cn('w-full h-11', getButtonClass())}
          disabled={isLoading || otp.length !== length}
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Button>

        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className={cn('hover:underline disabled:text-muted-foreground', getIconColor())}
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Didn't receive code? Resend"}
          </button>
          <button
            type="button"
            onClick={onChangeEmail}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Change Email
          </button>
        </div>
      </div>
    </form>
  );
}
