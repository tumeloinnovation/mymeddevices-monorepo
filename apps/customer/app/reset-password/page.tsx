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
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get('token');
    const userId = searchParams.get('user_id');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const passwordValidation = validatePassword(formData.newPassword);
    const requirements = getPasswordRequirements();

    // Validate token and user_id on mount
    useEffect(() => {
        if (!token || !userId) {
            setError('Invalid password reset link. Please request a new one.');
        }
    }, [token, userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token || !userId) {
            setError('Invalid password reset link. Please request a new one.');
            return;
        }

        // Validate password
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
            await useAuthStore.getState().resetPassword(token || '', formData.newPassword, userId || '');

            setIsSuccess(true);

            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to reset password. The link may have expired.';
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show error state if invalid link
    if (error && (!token || !userId)) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                            <XCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
                        </div>
                        <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
                        <CardDescription className="text-base mt-2">
                            {error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Link href="/">
                            <Button>Go to Homepage</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show success state
    if (isSuccess) {
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
                    <CardTitle className="text-2xl">Reset Your Password</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Enter your new password below
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            className="w-full gap-2"
                            disabled={isSubmitting || !passwordValidation.valid || formData.newPassword !== formData.confirmPassword}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Resetting Password...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4" />
                                    Reset Password
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                            Back to Homepage
                        </Link>
                    </div>
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
