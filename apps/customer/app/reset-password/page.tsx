'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { validatePassword, getPasswordRequirements } from '@/lib/utils/password-validator';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Step = 1 | 2 | 3 | 'success';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get URL params (from email link or forgot-password redirect)
    const urlToken = searchParams.get('token');
    const urlEmail = searchParams.get('user_id') || searchParams.get('email');
    const urlStep = searchParams.get('step');

    // State for multi-step form
    const [step, setStep] = useState<Step>(urlToken && urlEmail ? 2 : urlStep === 'otp' ? 2 : 1);
    const [email, setEmail] = useState(urlEmail || '');
    const [otpCode, setOtpCode] = useState(urlToken || '');
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendLoading, setResendLoading] = useState(false);

    const passwordValidation = validatePassword(formData.newPassword);
    const requirements = getPasswordRequirements();

    // Step 1: Request OTP code
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setIsSubmitting(true);
        try {
            await useAuthStore.getState().forgotPassword(email);
            setStep(2);
            toast.success('Verification code sent to your email');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send reset code';
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 2: Verify OTP code format and proceed
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!otpCode || otpCode.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        // Proceed to password entry - actual verification happens on submit
        setStep(3);
    };

    // Step 3: Reset password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!passwordValidation.valid) {
            setError(passwordValidation.errors.join('. '));
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        try {
            await useAuthStore.getState().resetPassword(otpCode, formData.newPassword, email);
            setStep('success');

            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to reset password. The code may have expired.';
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Resend OTP code
    const handleResendCode = async () => {
        setResendLoading(true);
        setError(null);
        try {
            await useAuthStore.getState().forgotPassword(email);
            toast.success('New verification code sent to your email');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to resend code';
            setError(message);
            toast.error(message);
        } finally {
            setResendLoading(false);
        }
    };

    // Success state
    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                        </div>
                        <CardTitle className="text-2xl">Password Reset Successful!</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Your password has been updated. You can now log in with your new password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                            Redirecting to login...
                        </p>
                        <Link href="/login">
                            <Button>Go to Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">
                        {step === 1 ? 'Forgot Password?' : step === 2 ? 'Enter Verification Code' : 'Reset Your Password'}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        {step === 1
                            ? 'Enter your email to receive a verification code'
                            : step === 2
                            ? `Enter the 6-digit code sent to ${email || 'your email'}`
                            : 'Enter your new password below'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* Step 1: Email Input */}
                    {step === 1 && (
                        <form onSubmit={handleRequestCode} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="pl-9"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting || !email}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Verification Code
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </>
                                )}
                            </Button>

                            <div className="mt-4 text-center">
                                <Link
                                    href="/login"
                                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* Step 2: OTP Input */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="otp">Verification Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    value={otpCode}
                                    onChange={(e) => {
                                        // Only allow digits
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtpCode(value);
                                    }}
                                    placeholder="123456"
                                    className="text-center text-2xl tracking-widest"
                                    maxLength={6}
                                    required
                                    disabled={isSubmitting}
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground text-center">
                                    Enter the 6-digit code from your email
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={otpCode.length !== 6}
                            >
                                <>
                                    Continue
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            </Button>

                            <div className="flex items-center justify-between mt-4">
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={resendLoading}
                                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                                >
                                    {resendLoading ? 'Sending...' : 'Resend Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                                >
                                    Change Email
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Password Input */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={formData.newPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, newPassword: e.target.value })
                                        }
                                        placeholder="Enter new password"
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() =>
                                            setShowPasswords({
                                                ...showPasswords,
                                                new: !showPasswords.new,
                                            })
                                        }
                                    >
                                        {showPasswords.new ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                {/* Password requirements */}
                                {formData.newPassword && (
                                    <div className="mt-2 space-y-1">
                                        {requirements.map((reqObj, index) => {
                                            const req = reqObj.label;
                                            const isValid = !passwordValidation.errors.includes(req);
                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex items-center gap-2 text-xs ${
                                                        isValid ? 'text-green-600' : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {isValid ? (
                                                        <CheckCircle className="h-3 w-3" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3" />
                                                    )}
                                                    {req}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, confirmPassword: e.target.value })
                                        }
                                        placeholder="Confirm new password"
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() =>
                                            setShowPasswords({
                                                ...showPasswords,
                                                confirm: !showPasswords.confirm,
                                            })
                                        }
                                    >
                                        {showPasswords.confirm ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                                    <p className="text-xs text-red-500">Passwords do not match</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={
                                    isSubmitting ||
                                    !passwordValidation.valid ||
                                    formData.newPassword !== formData.confirmPassword
                                }
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Reset Password
                                    </>
                                )}
                            </Button>

                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                                >
                                    Back to Code Entry
                                </button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                            <CardTitle className="text-2xl">Loading...</CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
