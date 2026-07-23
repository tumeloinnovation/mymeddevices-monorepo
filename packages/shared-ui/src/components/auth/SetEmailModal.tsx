'use client';

/**
 * @deprecated Use CustomerAuthModal instead. This component will be removed in v2.0.0.
 * CustomerAuthModal provides a unified teal/cyan theme and works across all contexts.
 */

import { FormEvent, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@mymeddevices/shared-core';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SetEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'email' | 'otp' | 'password' | 'success';

export function SetEmailModal({ open, onOpenChange }: SetEmailModalProps) {
  // State for multi-step flow
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('email');
        setEmail('');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError(null);
        setResendCooldown(0);
      }, 300);
    }
  }, [open]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  // Step 1: Submit email and request OTP
  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await useAuthStore.getState().forgotPassword(trimmedEmail);
      setStep('otp');
      toast.success('Verification code sent to your email');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset code';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and proceed to password
  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    // Proceed to password entry (verification happens on reset)
    setStep('password');
  };

  // Step 3: Submit new password
  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await useAuthStore.getState().resetPassword(otpCode, newPassword, email);
      setStep('success');

      // Close modal after success
      setTimeout(() => {
        handleClose(false);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password. The code may have expired.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError(null);
    try {
      await useAuthStore.getState().forgotPassword(email);
      setResendCooldown(60);
      toast.success('New verification code sent');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to previous step
  const handleBack = () => {
    if (step === 'otp') setStep('email');
    else if (step === 'password') setStep('otp');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {step === 'email' && 'Reset Your Password'}
            {step === 'otp' && 'Enter Verification Code'}
            {step === 'password' && 'Set New Password'}
            {step === 'success' && 'Password Reset Successful'}
          </DialogTitle>
          <DialogDescription>
            {step === 'email' && 'Enter your email to receive a verification code'}
            {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
            {step === 'password' && 'Enter your new password below'}
            {step === 'success' && 'Your password has been updated successfully'}
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {error && step !== 'success' && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {/* Success State */}
        {step === 'success' ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              You can now log in with your new password
            </p>
          </div>
        ) : (
          <>
            {/* Step 1: Email Input */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="pl-10"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: OTP Input */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="otp-code">Verification Code</Label>
                  <Input
                    id="otp-code"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="text-center text-2xl tracking-[0.5em] font-bold h-12"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={otpCode.length !== 6}>
                  <>
                    Verify Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Change Email
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Password Input */}
            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pl-10 pr-10"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pl-10"
                      required
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Code Entry
                </button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
