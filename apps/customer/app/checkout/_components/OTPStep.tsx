'use client';

import { useState, useEffect } from 'react';
import { Mail, Loader2, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { useCheckoutAuthStore } from '@/lib/store/useAuthStore';
import { toast } from 'sonner';
import type { AuthUser } from '@/lib/auth/types';

interface OTPStepProps {
  onBack?: () => void;
}

export function OTPStep({ onBack }: OTPStepProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiryTime, setExpiryTime] = useState(300); // 5 minutes in seconds

  const { user, setOTPVerified, setError } = useCheckoutAuthStore();
  const email = user?.email || '';

  useEffect(() => {
    // Resend cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    // Expiry timer
    if (expiryTime > 0) {
      const timer = setTimeout(() => setExpiryTime(expiryTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (expiryTime === 0) {
      toast.error('Verification code expired. Please request a new one.');
    }
  }, [expiryTime]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mock OTP Verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Email verified successfully! ');

      // Mock user data
      const mockUser: AuthUser = {
        id: 123,
        email: email,
        displayName: email.split('@')[0],
        firstName: '',
        lastName: '',
        phone: '',
        role: 'customer',
        is_active: true,
      };

      setOTPVerified(mockUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      setError(message);
      toast.error(message);
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    try {
      // Mock resend
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('New code sent to your email ');
      setResendCooldown(60); // 60 second cooldown
      setExpiryTime(300); // Reset expiry
      setOtp('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend code';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isLoading) {
      const form = document.getElementById('otp-form') as HTMLFormElement;
      form?.requestSubmit();
    }
  }, [otp, isLoading]);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Check Your Email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to
        </p>
        <p className="text-sm font-medium">{email}</p>
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-xs"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Change email
          </Button>
        )}
      </div>

      <form id="otp-form" onSubmit={handleVerify} className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Expires in: <span className={expiryTime < 60 ? 'text-red-600 font-medium' : ''}>
                {formatTime(expiryTime)}
              </span>
            </span>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || otp.length !== 6 || expiryTime === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>Verify Code</>
          )}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isLoading}
        >
          {resendCooldown > 0 ? (
            <>Resend in {resendCooldown}s</>
          ) : (
            <>Resend Code</>
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Enter any 6-digit code to continue.
      </p>
    </div>
  );
}
