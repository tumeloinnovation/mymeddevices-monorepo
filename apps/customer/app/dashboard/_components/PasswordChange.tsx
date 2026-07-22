'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@mymeddevices/shared-core';
import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, X } from 'lucide-react';

export function PasswordChange() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const passwordStrength = (password: string): string => {
        if (password.length === 0) return '';
        if (password.length < 8) return 'weak';
        if (
            password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password)
        ) {
            return 'strong';
        }
        return 'medium';
    };

    const strength = passwordStrength(formData.newPassword);

    const handleCancel = () => {
        setFormData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (formData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!/[0-9]/.test(formData.newPassword)) {
            toast.error('Password must include at least one number');
            return;
        }

        setIsSubmitting(true);
        try {
            const { changePassword } = useAuthStore.getState();
            await changePassword({ old_password: formData.currentPassword, new_password: formData.newPassword });
            toast.success('Password updated successfully');
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update password. Please check your current password.';
            toast.error(message);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                            <Input
                                id="currentPassword"
                                type={showPasswords.current ? 'text' : 'password'}
                                value={formData.currentPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, currentPassword: e.target.value })
                                }
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                    setShowPasswords({
                                        ...showPasswords,
                                        current: !showPasswords.current,
                                    })
                                }
                            >
                                {showPasswords.current ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPasswords.new ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, newPassword: e.target.value })
                                }
                                required
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
                        {formData.newPassword && (
                            <div className="mt-2">
                                <div className="flex gap-1">
                                    <div
                                        className={`h-1 flex-1 rounded ${strength === 'weak'
                                            ? 'bg-red-500'
                                            : strength === 'medium'
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                            }`}
                                    />
                                    <div
                                        className={`h-1 flex-1 rounded ${strength === 'medium' || strength === 'strong'
                                            ? strength === 'medium'
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                            : 'bg-gray-200'
                                            }`}
                                    />
                                    <div
                                        className={`h-1 flex-1 rounded ${strength === 'strong' ? 'bg-green-500' : 'bg-gray-200'
                                            }`}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Password strength:{' '}
                                    <span
                                        className={
                                            strength === 'weak'
                                                ? 'text-red-500'
                                                : strength === 'medium'
                                                    ? 'text-yellow-500'
                                                    : 'text-green-500'
                                        }
                                    >
                                        {strength}
                                    </span>
                                </p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Must be at least 8 characters with a number and special character
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, confirmPassword: e.target.value })
                                }
                                required
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
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t">
                        <Button
                            type="submit"
                            className="gap-2"
                            disabled={isSubmitting}
                        >
                            <Lock className="h-4 w-4" />
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
