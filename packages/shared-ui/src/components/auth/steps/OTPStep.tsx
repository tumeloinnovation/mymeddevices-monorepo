'use client';

import { useState, useEffect } from 'react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { cn } from '../../../lib/utils';
import { OTPInput } from '../common/OTPInput';

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
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Icon and Header */}
      <div className="text-center space-y-1.5 mb-5">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#e0752b]/10 border border-[#e0752b]/20 flex items-center justify-center mb-3 shadow-xs">
          <Mail className="w-6 h-6 text-[#e0752b]" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">Verify Your Email</h3>
        <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
          We sent a 6-digit code to{' '}
          <span className="text-foreground font-semibold break-all">{email}</span>
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <span>{error}</span>
        </div>
      )}

      {/* OTP Input section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp" className="text-xs font-semibold text-center block text-foreground/90">
            Enter 6-Digit Code
          </Label>
          <OTPInput
            value={otp}
            onChange={setOtp}
            length={length}
            disabled={isLoading}
            onComplete={(code) => {
              setOtp(code);
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
          className="w-full h-11 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 active:scale-[0.98] bg-[#e0752b] hover:bg-[#c86221] text-white border-0"
          disabled={isLoading || otp.length !== length}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Verifying Code...
            </span>
          ) : (
            'Verify & Continue'
          )}
        </Button>

        <div className="flex items-center justify-between text-xs pt-1 px-1">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className="text-xs font-semibold text-[#e0752b] hover:underline disabled:text-muted-foreground transition-colors"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Didn't receive code? Resend"}
          </button>
          <button
            type="button"
            onClick={onChangeEmail}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Edit Email
          </button>
        </div>
      </div>
    </form>
  );
}
