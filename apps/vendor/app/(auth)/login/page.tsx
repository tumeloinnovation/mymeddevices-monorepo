'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Loader2, Lock, Mail, Store,
  Package, ClipboardList, Building, Phone, KeyRound, ArrowLeft
} from 'lucide-react';
import { ForgotPasswordForm } from "@mymeddevices/shared-admin";
import { useAuth } from '@/lib/hooks/use-auth';
import AddressAutocomplete from '@/components/maps/AddressAutocomplete';
import { useGoogleMaps } from '@/components/maps/useGoogleMaps';

function getSafeReturnUrl(returnUrl: string | null): string | null {
  if (!returnUrl) return null;
  if (!returnUrl.startsWith('/') || returnUrl.startsWith('//')) return null;
  if (
    returnUrl.startsWith('/login') ||
    returnUrl.startsWith('/register') ||
    returnUrl.startsWith('/forgot-password') ||
    returnUrl.startsWith('/reset-password')
  ) {
    return null;
  }
  return returnUrl;
}

function AuthFlow({ 
  mode, 
  setMode, 
  email, 
  setEmail, 
  password, 
  setPassword 
}: { 
  mode: 'login' | 'register' | 'otp' | 'profile' | 'success' | 'forgot-password';
  setMode: (mode: 'login' | 'register' | 'otp' | 'profile' | 'success' | 'forgot-password') => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, initiateRegistration, completeRegistration, verifyOtp, forgotPassword, isAuthenticated } = useAuth();
  const { ready: mapsReady } = useGoogleMaps();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginJustCompleted, setLoginJustCompleted] = useState(false);

  // Register fields
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVat, setRegVat] = useState('');

  const [regAddressStreet, setRegAddressStreet] = useState('');
  const [regLatitude, setRegLatitude] = useState<number | null>(null);
  const [regLongitude, setRegLongitude] = useState<number | null>(null);
  const [regPlaceId, setRegPlaceId] = useState('');
  
  // OTP fields
  const [otpCode, setOtpCode] = useState('');
  const [tempUserId, setTempUserId] = useState('');

  // Forgot password email
  const [forgotEmail, setForgotEmail] = useState('');
  
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'));
  const redirectPath = returnUrl ?? '/vendor/dashboard';

  // Handle session expiration message
  useEffect(() => {
    const isExpired = searchParams.get('expired') === 'true';
    if (isExpired) {
      setError('Session expired. Please login again.');
    }
  }, [searchParams]);

  // Redirect if already authenticated (but not if we just completed login or have an error)
  useEffect(() => {
    // CRITICAL FIX: Check for refresh token to prevent redirect loop with stale auth state
    const hasRefreshToken = typeof window !== 'undefined' && localStorage.getItem('refresh_token');
    if (isAuthenticated && mode === 'login' && !loginJustCompleted && !error && !isLoading && hasRefreshToken) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectPath;
      } else {
        router.push(redirectPath);
      }
    }
  }, [isAuthenticated, redirectPath, router, mode, loginJustCompleted, error, isLoading]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      // Set flag to prevent useEffect from racing with our redirect
      setLoginJustCompleted(true);
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      if (typeof window !== 'undefined') {
        window.location.href = redirectPath;
      } else {
        router.push(redirectPath);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
      setLoginJustCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await initiateRegistration({
        email: regEmail,
        role: 'vendor'
      });
      setMode('otp');
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Registration failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await verifyOtp({
        userId: regEmail,
        code: otpCode,
        purpose: 'verification'
      });
      setMode('profile');
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Verification failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!regCompany) {
      setError('Company name is required.');
      setIsLoading(false);
      return;
    }

    if (!regAddressStreet || regLatitude === null || regLongitude === null) {
      setError('Store physical address selection is required.');
      setIsLoading(false);
      return;
    }

    try {
      await completeRegistration({
        email: regEmail,
        password: regPassword,
        phone: regPhone || undefined,
        company_name: regCompany,
        first_name: regFirstName || undefined,
        last_name: regLastName || undefined,
        address_street: regAddressStreet,
        latitude: regLatitude,
        longitude: regLongitude,
        place_id: regPlaceId || undefined,
      });
      
      setMode('success');
      // Reset registration form
      setRegEmail('');
      setRegPassword('');
      setRegCompany('');
      setRegPhone('');
      setRegVat('');
      setOtpCode('');
      setRegFirstName('');
      setRegLastName('');
      setRegAddressStreet('');
      setRegLatitude(null);
      setRegLongitude(null);
      setRegPlaceId('');
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Profile completion failed.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!forgotPassword) {
        throw new Error('Forgot password method not available on AuthProvider');
      }
      await forgotPassword(forgotEmail);
      toast.success('Password reset instructions sent. Please check your inbox.');
      setForgotEmail('');
      setMode('login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'success') {
    return (
      <Card className="border-none shadow-none bg-transparent ring-0">
        <CardContent className="p-0 text-center space-y-6 border-none">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <Package className="h-10 w-10 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Application Received!</h3>
            <p className="text-muted-foreground leading-relaxed">
              Thank you for applying to be a vendor. Our team will review your application and get back to you within 24-48 hours.
            </p>
          </div>
          <Button
            onClick={() => setMode('login')}
            className="w-full h-12 rounded-xl text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'forgot-password') {
    return <ForgotPasswordForm theme="vendor" onBackToLogin={() => setMode('login')} />;
  }

  if (mode === 'register') {
    return (
      <Card className="border-none shadow-none bg-transparent ring-0">
        <CardContent className="p-0 border-none">
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-3 rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="regEmail" className="text-sm font-medium">Business Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/75" />
                <Input
                  id="regEmail"
                  type="email"
                  placeholder="sales@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-input bg-background/50 focus-visible:ring-emerald-500/20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-emerald-600/25 bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending code...
                </>
              ) : (
                'Continue to Verification'
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Already have a vendor account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                  disabled={isLoading}
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'profile') {
    return (
      <Card className="border-none shadow-none bg-transparent ring-0">
        <CardContent className="p-0 border-none">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-3 rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="regFirstName" className="text-sm font-medium">First Name</Label>
                    <Input id="regFirstName" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="regLastName" className="text-sm font-medium">Last Name</Label>
                    <Input id="regLastName" value={regLastName} onChange={e => setRegLastName(e.target.value)} className="h-12 rounded-xl" required />
                </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="regCompany" className="text-sm font-medium">Company Name *</Label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/75" />
                <Input
                  id="regCompany"
                  type="text"
                  placeholder="MediTech Solutions"
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-input bg-background/50 focus-visible:ring-emerald-500/20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="regPhone" className="text-sm font-medium">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/75" />
                <Input
                  id="regPhone"
                  type="tel"
                  placeholder="+254711223344"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-input bg-background/50 focus-visible:ring-emerald-500/20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Store Physical Address *</Label>
              <AddressAutocomplete
                onPlaceSelected={(place) => {
                  setRegAddressStreet(place.formatted_address || place.address_1 || place.name || '');
                  setRegLatitude(place.lat);
                  setRegLongitude(place.lng);
                  setRegPlaceId(place.place_id);
                }}
                placeholder="Search store address..."
                countryRestriction={['ke', 'ug', 'tz']}
              />
              {regAddressStreet && (
                <p className="text-xs text-emerald-600 font-medium">
                  Selected: {regAddressStreet} ({regLatitude?.toFixed(4)}, {regLongitude?.toFixed(4)})
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="regPassword" className="text-sm font-medium">Create Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/75" />
                <Input
                  id="regPassword"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-input bg-background/50 focus-visible:ring-emerald-500/20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-emerald-600/25 bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                'Submit Vendor Application'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'otp') {
    return (
      <Card className="border-none shadow-none bg-transparent ring-0">
        <CardContent className="p-0 border-none">
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="py-3 rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="otpCode" className="text-sm font-medium">Verification Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/75" />
                <Input
                  id="otpCode"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="pl-11 h-12 rounded-xl border-input bg-background/50 focus-visible:ring-emerald-500/20 text-center tracking-widest font-mono text-lg font-bold"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-emerald-600/25 bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Account'
              )}
            </Button>
            
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center justify-center gap-1.5"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Login Mode
  return (
    <Card className="border-none shadow-none bg-transparent ring-0">
      <CardContent className="p-0 border-none">
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive" className="py-3 rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/75" />
              <Input
                id="email"
                type="email"
                placeholder="vendor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 rounded-xl border-input bg-background/50 focus-visible:ring-emerald-500/20"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-semibold transition-colors"
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/75" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 h-12 rounded-xl border-input bg-background/50 focus-visible:ring-emerald-500/20"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-emerald-600/25 bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Don't have a vendor account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                disabled={isLoading}
              >
                Register as a Vendor
              </button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'profile' | 'success' | 'forgot-password'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  let title = 'Welcome back';
  let desc = 'Enter your credentials to access the vendor portal';
  let icon = <Store className="h-7 w-7 text-white" />;

  if (mode === 'register') {
    title = 'Create Vendor Account';
    desc = 'Register as a supplier to start listing your medical equipment';
    icon = <Building className="h-7 w-7 text-white" />;
  } else if (mode === 'otp') {
    title = 'Verify Email';
    desc = 'Enter the 6-digit OTP code sent to your registered email';
    icon = <KeyRound className="h-7 w-7 text-white" />;
  } else if (mode === 'forgot-password') {
    title = 'Forgot password?';
    desc = "Enter your email and we'll send you instructions to reset your password.";
    icon = <KeyRound className="h-7 w-7 text-white" />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Brand Panel (Emerald themed for vendors) */}
      <div className="hidden lg:flex flex-col bg-emerald-600 text-white p-12 relative overflow-hidden">
        {/* Soft background light blooms */}
        <div className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[32rem] h-[32rem] bg-black/15 rounded-full -ml-48 -mb-48 blur-3xl" />
        
        {/* Concentric geometric circles to match the admin portal style */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52rem] h-[52rem] border border-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] border border-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] border border-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16rem] h-[16rem] border border-white/5 rounded-full pointer-events-none" />

        {/* Brand Logo - landscape logo image as requested */}
        <Link href="/" className="relative z-10 w-fit mb-16 block hover:opacity-90 transition-opacity">
          <Image
            src="/logos/logo-landscape.png"
            alt="MyMedDevices"
            width={180}
            height={48}
            className="brightness-0 invert h-auto w-auto"
            priority
          />
        </Link>

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-sm text-emerald-50 mb-8 w-fit shadow-xs font-medium">
            <Store className="h-4 w-4 text-emerald-200" />
            Vendor Portal
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
            Grow your medical equipment business.
          </h1>
          <p className="text-xl text-emerald-50/85 mb-12 leading-relaxed">
            Manage inventory, fulfill hospital orders, track payments, and scale your healthcare distribution.
          </p>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-md">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white">Inventory & Listings</h3>
              <p className="text-sm text-emerald-50/75 leading-relaxed">List your medical devices and manage stock in real time.</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center shadow-md">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white">Order Fulfillment</h3>
              <p className="text-sm text-emerald-50/75 leading-relaxed">Process bulk orders and track your vendor payouts.</p>
            </div>
          </div>
        </div>

        {/* Updated Tagline Row as requested */}
        <div className="relative z-10 mt-16 pt-8 border-t border-white/15">
          <p className="text-sm font-medium text-emerald-100/90 leading-relaxed">
            Kenya's leading platform connecting verified medical equipment suppliers with healthcare providers nationwide.
          </p>
        </div>
      </div>

      {/* Right: Auth Flow Form Container */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            {/* Mobile custom logo */}
            <Link href="/" className="block hover:opacity-90 transition-opacity">
              <Image
                src="/logos/logo-landscape.png"
                alt="MyMedDevices"
                width={180}
                height={48}
                className="h-auto w-auto"
                priority
              />
            </Link>
          </div>

          {mode !== 'forgot-password' && (
            <div className="text-center lg:text-left mb-8">
              <div className="hidden lg:inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl mb-6 shadow-lg shadow-emerald-600/25 transition-transform duration-300">
                {icon}
              </div>
              <h1 className="text-3xl font-bold mb-2 tracking-tight transition-all duration-300">
                {title}
              </h1>
              <p className="text-muted-foreground transition-all duration-300">
                {desc}
              </p>
            </div>
          )}

          <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>}>
            <AuthFlow 
              mode={mode} 
              setMode={setMode} 
              email={email} 
              setEmail={setEmail} 
              password={password} 
              setPassword={setPassword} 
            />
          </Suspense>

          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} MyMedDevices. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
