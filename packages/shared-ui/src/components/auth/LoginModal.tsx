'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuthStore } from '@mymeddevices/shared-core';
import { SetEmailModal } from './SetEmailModal';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, User, Phone, Building, UserCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { cn, srOnly } from '../../lib/utils';

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type AuthMode = 'login' | 'register';
type UserType = 'customer' | 'vendor';
type RegistrationStep = 'email' | 'otp' | 'profile' | 'success';

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [userType, setUserType] = useState<UserType>('customer');
    const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    // Login fields
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Registration email & OTP
    const [registerEmail, setRegisterEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // User profile fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

    // Vendor specific
    const [companyName, setCompanyName] = useState('');

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            // Reset state on close
            setTimeout(() => {
                setMode('login');
                setUserType('customer');
                setRegistrationStep('email');
                setLoginEmail('');
                setLoginPassword('');
                setRegisterEmail('');
                setOtp('');
                setFirstName('');
                setLastName('');
                setPhone('');
                setRegisterPassword('');
                setCompanyName('');
                setIsLoading(false);
                setError(null);
            }, 300);
        }
    }, [open]);

    useEffect(() => {
        // Clear error when switching mode
        setError(null);
    }, [mode]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { login } = useAuthStore.getState();
            await login({ email: loginEmail, password: loginPassword });
            // Removed toast.success as it's handled in store
            // Removed redirect as requested
            onOpenChange(false);
        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.message || 'Login failed. Please try again.';
            setError(msg);
            // toast.error is also often handled in store, but store only does success?
            // Checking store... store calls toast.success. It does NOT call toast.error in login.
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { initiateRegistration } = useAuthStore.getState();
            await initiateRegistration({
                email: registerEmail,
                role: userType,
            });
            setRegistrationStep('otp');
        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.message || 'Failed to send verification code.';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        setIsLoading(true);
        setError(null);

        try {
            const { initiateRegistration } = useAuthStore.getState();
            await initiateRegistration({
                email: registerEmail,
                role: userType,
            });
            setResendCooldown(60);
        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.message || 'Failed to resend verification code.';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { verifyOTP } = useAuthStore.getState();
            await verifyOTP(registerEmail, otp, 'verification');
            setRegistrationStep('profile');
        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.message || 'Invalid verification code.';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { completeRegistration, login } = useAuthStore.getState();
            await completeRegistration({
                email: registerEmail,
                password: registerPassword,
                first_name: firstName || undefined,
                last_name: lastName || undefined,
                phone: phone || undefined,
                company_name: userType === 'vendor' ? companyName : undefined,
            });

            if (userType === 'vendor') {
                setRegistrationStep('success');
            } else {
                await login({ email: registerEmail, password: registerPassword });
                onOpenChange(false);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.detail || err?.message || 'Registration failed.';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
                    {/* Visually hidden title for screen readers */}
                    <DialogTitle className={srOnly()}>
                        {mode === 'login' ? 'Login to your account' : 'Create a new account'}
                    </DialogTitle>
                    <DialogDescription className={srOnly()}>
                        {mode === 'login' ? 'Enter your email and password to access your account' : 'Sign up for a new customer or vendor account'}
                    </DialogDescription>
                    <div className="flex flex-col h-full max-h-[90vh]">
                        {/* Header Section */}
                        <div className="bg-primary p-8 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <img
                                        src="/logos/logo-landscape.png"
                                        alt="MyMedDevices Logo"
                                        className="h-10 brightness-0 invert"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                            if (fallback) fallback.classList.remove('hidden');
                                        }}
                                    />
                                    <div className="hidden text-xl font-bold tracking-tight text-white">
                                        MyMedDevices
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold mb-1">
                                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                                </h2>
                                <p className="text-primary-foreground/80 text-sm">
                                    {mode === 'login' 
                                        ? 'Access your account and orders' 
                                        : userType === 'customer' 
                                            ? 'Join our medical device marketplace'
                                            : 'Start selling your medical devices'}
                                </p>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 bg-background">
                            {/* Mode Switcher */}
                            <div className="flex p-1 bg-muted rounded-xl mb-6">
                                <button
                                    onClick={() => setMode('login')}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                        mode === 'login' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => setMode('register')}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                        mode === 'register' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Register
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 rotate-180" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {mode === 'login' ? (
                                /* Login Form */
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="login-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                className="pl-10 h-11"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="login-password">Password</Label>
                                            <button
                                                type="button"
                                                onClick={() => setIsForgotPasswordOpen(true)}
                                                className="text-xs text-primary hover:underline"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="login-password"
                                                type={showLoginPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                className="pl-10 pr-10 h-11"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                className="absolute right-3 top-0 h-full flex items-center text-muted-foreground hover:text-foreground z-10"
                                            >
                                                {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Login to Account'}
                                    </Button>
                                </form>
                            ) : (
                                /* Registration Flow */
                                <div className="space-y-6">
                                    {registrationStep === 'email' && (
                                        <form 
                                            onSubmit={handleSendOTP} 
                                            className="space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="reg-email">{userType === 'customer' ? 'Email Address' : 'Business Email'}</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="reg-email"
                                                        type="email"
                                                        placeholder={userType === 'customer' ? 'you@example.com' : 'sales@company.com'}
                                                        value={registerEmail}
                                                        onChange={(e) => setRegisterEmail(e.target.value)}
                                                        className="pl-10 h-11"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="text-center text-sm text-muted-foreground">
                                                {userType === 'customer' ? (
                                                    <span>Registering as a customer. <button type="button" onClick={() => setUserType('vendor')} className="text-primary hover:underline">Register as vendor instead</button></span>
                                                ) : (
                                                    <span>Registering as a vendor. <button type="button" onClick={() => setUserType('customer')} className="text-primary hover:underline">Register as customer instead</button></span>
                                                )}
                                            </div>

                                            <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue to Verification'}
                                            </Button>
                                        </form>
                                    )}

                                    {registrationStep === 'otp' && (
                                        <form onSubmit={handleVerifyOTP} className="space-y-4 text-center">
                                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                                                <Mail className="h-6 w-6 text-primary" />
                                            </div>
                                            <h3 className="text-lg font-bold">Check Your Email</h3>
                                            <p className="text-sm text-muted-foreground">
                                                We sent a code to <span className="text-foreground font-medium">{registerEmail}</span>
                                            </p>
                                            <div className="space-y-4 pt-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Enter 6-digit code"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    className="h-12 text-center text-2xl tracking-[0.5em] font-bold"
                                                    required
                                                />
                                                <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading || otp.length !== 6}>
                                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Code'}
                                                </Button>
                                                <button
                                                    type="button"
                                                    onClick={handleResendOTP}
                                                    disabled={resendCooldown > 0 || isLoading}
                                                    className="text-xs text-primary hover:underline disabled:text-muted-foreground"
                                                >
                                                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Didn\'t receive code? Resend'}
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setRegistrationStep('email')}
                                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto mt-4"
                                            >
                                                <ArrowLeft className="h-3 w-3" /> Change Email
                                            </button>
                                        </form>
                                    )}

                                    {registrationStep === 'profile' && (
                                        <form onSubmit={handleRegister} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="fname">First Name</Label>
                                                    <Input id="fname" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="lname">Last Name</Label>
                                                    <Input id="lname" value={lastName} onChange={e => setLastName(e.target.value)} required />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254..." required />
                                            </div>
                                            
                                            {userType === 'vendor' && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="company">Company Name</Label>
                                                    <Input id="company" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Business Name" required />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="reg-pass">Create Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="reg-pass"
                                                        type={showRegisterPassword ? 'text' : 'password'}
                                                        value={registerPassword}
                                                        onChange={e => setRegisterPassword(e.target.value)}
                                                        className="pr-10"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                        className="absolute right-3 top-0 h-full flex items-center text-muted-foreground z-10"
                                                    >
                                                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <Button type="submit" className="w-full h-11 font-semibold mt-4" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Complete Registration'}
                                            </Button>
                                        </form>
                                    )}

                                    {registrationStep === 'success' && (
                                        <div className="text-center py-4 space-y-4">
                                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                            </div>
                                            <h3 className="text-xl font-bold">Application Received!</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Thank you for applying to be a vendor. Our team will review your application and get back to you within 24-48 hours.
                                            </p>
                                            <Button onClick={() => onOpenChange(false)} className="w-full h-11">
                                                Got it, thanks!
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <SetEmailModal
                open={isForgotPasswordOpen}
                onOpenChange={setIsForgotPasswordOpen}
            />
        </>
    );
}
