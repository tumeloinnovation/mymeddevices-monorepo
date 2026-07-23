'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog';
import { useAuthStore, useCheckoutAuthStore } from '@mymeddevices/shared-core';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn, srOnly } from '../../lib/utils';
import { AuthHeader } from './common/AuthHeader';
import { ProgressIndicator, Step } from './common/ProgressIndicator';
import { EmailStep } from './steps/EmailStep';
import { OTPStep } from './steps/OTPStep';
import { ProfileStep } from './steps/ProfileStep';
import { LoginStep } from './steps/LoginStep';
import { validatePassword } from '../../lib/utils/password-validator';
import { getButtonClass } from './auth-theme';

type AuthMode = 'login' | 'register';
type AuthContext = 'modal' | 'checkout';
type RegistrationStep = 'email' | 'otp' | 'profile' | 'success' | 'complete';
type LoginStep = 'email' | 'login';

export interface CustomerAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AuthMode;
  initialMode?: AuthMode;
  context?: AuthContext;
  allowGuestCheckout?: boolean;
  delivery?: any;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  onComplete?: () => void;
}

export function CustomerAuthModal({
  open,
  onOpenChange,
  mode: controlledMode,
  initialMode = 'login',
  context = 'modal',
  allowGuestCheckout = true,
  delivery,
  customer,
  onComplete,
}: CustomerAuthModalProps) {
  // Mode state (controlled or uncontrolled)
  const [internalMode, setInternalMode] = useState<AuthMode>(initialMode);
  const mode = controlledMode !== undefined ? controlledMode : internalMode;

  // Registration flow state
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('email');
  const [loginStep, setLoginStep] = useState<LoginStep>('email');

  // User type for registration
  const [userType, setUserType] = useState<'customer' | 'vendor'>('customer');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vendorAddress, setVendorAddress] = useState<{
    place_id: string;
    formatted_address?: string;
    address?: string;
    lat: number;
    lng: number;
    city?: string;
    country?: string;
    region?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get auth stores
  const authStore = useAuthStore();
  const checkoutAuthStore = useCheckoutAuthStore();
  const { isAuthenticated, hydrated: authHydrated } = authStore;
  const { hydrated: checkoutHydrated } = checkoutAuthStore;
  const hydrated = context === 'checkout' ? checkoutHydrated : authHydrated;

  // Password validation
  const passwordValidation = validatePassword(password);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setInternalMode(initialMode);
        setRegistrationStep('email');
        setLoginStep('email');
        setUserType('customer');
        setEmail('');
        setOtp('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setCompanyName('');
        setVendorAddress(null);
        setError(null);
        setIsLoading(false);
      }, 300);
    } else {
      // Pre-fill customer data when available
      if (customer) {
        if (customer.email) setEmail(customer.email);
        if (customer.firstName) setFirstName(customer.firstName || '');
        if (customer.lastName) setLastName(customer.lastName || '');
        if (customer.phone) setPhone(customer.phone);
        if (customer.name) {
          // Split name into first/last if needed
          const names = customer.name.split(' ');
          if (names.length > 0 && !firstName) setFirstName(names[0]);
          if (names.length > 1 && !lastName) setLastName(names.slice(1).join(' '));
        }
      }
    }
  }, [open, initialMode, customer]);

  // Clear error when mode changes
  useEffect(() => {
    setError(null);
  }, [mode]);

  // Handle completion
  useEffect(() => {
    if (isAuthenticated && (registrationStep === 'complete' || registrationStep === 'success')) {
      onComplete?.();
      if (context === 'checkout') {
        // Keep modal open briefly to show success
        setTimeout(() => onOpenChange(false), 500);
      } else {
        onOpenChange(false);
      }
    }
  }, [isAuthenticated, registrationStep, onComplete, onOpenChange, context]);

  // Progress steps for checkout context
  const progressSteps: Step[] = [
    { id: 'email', label: 'Email', status: 'pending' },
    { id: 'otp', label: 'Verify', status: 'pending' },
    { id: 'profile', label: 'Profile', status: 'pending' },
  ];

  // Update progress steps based on current state
  const updateProgressSteps = (): Step[] => {
    if (mode === 'login') {
      return [
        { id: 'login', label: 'Login', status: 'active' },
      ];
    }

    const currentStepIndex = ['email', 'otp', 'profile'].indexOf(registrationStep);
    return progressSteps.map((step, index) => {
      if (index < currentStepIndex) return { ...step, status: 'complete' as const };
      if (index === currentStepIndex) return { ...step, status: 'active' as const };
      return { ...step, status: 'pending' as const };
    });
  };

  // Email step handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        // Registration flow - send OTP
        await authStore.initiateRegistration({
          email,
          role: userType,
        });
        setRegistrationStep('otp');
      } else {
        // Login flow - check if user exists, then either login or show login form
        // For now, go to login step
        setLoginStep('login');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to send verification code.';
      setError(msg);
      if (msg.includes('already exists') || msg.includes('already registered')) {
        toast.error('An account already exists with this email.');
        setInternalMode('login');
        setLoginStep('login');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // OTP verification handler
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authStore.verifyOTP(email, otp, 'verification');
      setRegistrationStep('profile');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Invalid verification code.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authStore.initiateRegistration({
        email,
        role: userType,
      });
      toast.success('Verification code resent!');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to resend code.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Profile completion handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!passwordValidation.valid) {
      setError(passwordValidation.errors.join('. '));
      setIsLoading(false);
      return;
    }

    // For vendor registration, validate required address fields
    if (userType === 'vendor') {
      if (!vendorAddress || !(vendorAddress.address || vendorAddress.formatted_address)) {
        setError('Please select a valid business address from the suggestions.');
        setIsLoading(false);
        return;
      }
    }

    try {
      await authStore.completeRegistration({
        email,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: phone || undefined,
        company_name: userType === 'vendor' ? companyName : undefined,
        // Vendor-specific address fields
        address_street: userType === 'vendor' ? (vendorAddress!.address || vendorAddress!.formatted_address) : undefined,
        latitude: userType === 'vendor' ? vendorAddress!.lat : undefined,
        longitude: userType === 'vendor' ? vendorAddress!.lng : undefined,
      });

      if (userType === 'vendor') {
        setRegistrationStep('success');
      } else {
        // Auto-login for customers
        await authStore.login({ email, password });
        setRegistrationStep('complete');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Registration failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authStore.login({ email, password });
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Login failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Guest checkout handler
  const handleGuestCheckout = () => {
    onOpenChange(false);
  };

  // Switch to login mode
  const switchToLogin = () => {
    setInternalMode('login');
    setLoginStep('email');
    setError(null);
  };

  // Switch to register mode
  const switchToRegister = () => {
    setInternalMode('register');
    setRegistrationStep('email');
    setError(null);
  };

  // Forgot password handler
  const handleForgotPassword = () => {
    // For now, just close modal and navigate to reset-password page
    onOpenChange(false);
    window.location.href = '/reset-password';
  };

  // Loading state while hydrating
  if (!hydrated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogTitle className={srOnly()}>Loading</DialogTitle>
          <DialogDescription className={srOnly()}>
            Loading authentication...
          </DialogDescription>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Get header content based on mode
  const getHeaderContent = () => {
    if (context === 'checkout') {
      return {
        title: mode === 'register' ? 'Create Account' : 'Login to Continue',
        description: mode === 'register'
          ? 'Join us to complete your order'
          : 'Access your account to continue checkout',
      };
    }
    return {
      title: mode === 'login' ? 'Welcome Back' : 'Create Account',
      description: mode === 'login'
        ? 'Access your account and orders'
        : 'Join our medical device marketplace',
    };
  };

  const headerContent = getHeaderContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
        <DialogTitle className={srOnly()}>
          {headerContent.title}
        </DialogTitle>
        <DialogDescription className={srOnly()}>
          {headerContent.description}
        </DialogDescription>

        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <AuthHeader
            title={headerContent.title}
            description={headerContent.description}
            showLogo={context === 'modal'}
          />

          {/* Progress indicator for checkout */}
          {context === 'checkout' && mode === 'register' && (
            <div className="px-8 pt-6">
              <ProgressIndicator steps={updateProgressSteps()} />
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-background">
            {/* Mode switcher for modal context */}
            {context === 'modal' && registrationStep === 'email' && loginStep === 'email' && (
              <div className="flex p-1 bg-muted rounded-xl mb-6">
                <button
                  onClick={switchToLogin}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                    mode === 'login'
                      ? 'bg-background shadow-sm text-orange-600'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Login
                </button>
                <button
                  onClick={switchToRegister}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                    mode === 'register'
                      ? 'bg-background shadow-sm text-orange-600'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Register
                </button>
              </div>
            )}

            {/* Login Mode */}
            {mode === 'login' && (
              <>
                {loginStep === 'email' && (
                  <EmailStep
                    email={email}
                    setEmail={setEmail}
                    onSubmit={(e) => {
                      e.preventDefault();
                      setLoginStep('login');
                    }}
                    isLoading={isLoading}
                    error={error}
                    submitLabel="Continue"
                    description="Enter your email to continue"
                    showUserTypeToggle={false}
                    showLoginLink={false}
                    showGuestOption={false}
                  />
                )}
                {loginStep === 'login' && (
                  <LoginStep
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    onSubmit={handleLogin}
                    isLoading={isLoading}
                    error={error}
                    onForgotPassword={handleForgotPassword}
                    showForgotPassword={true}
                    submitLabel="Login to Account"
                  />
                )}
              </>
            )}

            {/* Register Mode */}
            {mode === 'register' && (
              <>
                {registrationStep === 'email' && (
                  <EmailStep
                    email={email}
                    setEmail={setEmail}
                    onSubmit={handleEmailSubmit}
                    isLoading={isLoading}
                    error={error}
                    userType={userType}
                    onUserTypeChange={setUserType}
                    showUserTypeToggle={context === 'modal'}
                    showLoginLink={context === 'checkout'}
                    onLoginClick={switchToLogin}
                    showGuestOption={context === 'checkout' && allowGuestCheckout}
                    onGuestClick={handleGuestCheckout}
                    submitLabel="Continue to Verification"
                    description="Enter your email to create an account"
                  />
                )}
                {registrationStep === 'otp' && (
                  <OTPStep
                    email={email}
                    otp={otp}
                    setOtp={setOtp}
                    onSubmit={handleOTPSubmit}
                    onResend={handleResendOTP}
                    onChangeEmail={() => setRegistrationStep('email')}
                    isLoading={isLoading}
                    error={error}
                  />
                )}
                {registrationStep === 'profile' && (
                  <ProfileStep
                    firstName={firstName}
                    setFirstName={setFirstName}
                    lastName={lastName}
                    setLastName={setLastName}
                    phone={phone}
                    setPhone={setPhone}
                    password={password}
                    setPassword={setPassword}
                    onSubmit={handleProfileSubmit}
                    isLoading={isLoading}
                    error={error}
                    isVendor={userType === 'vendor'}
                    companyName={companyName}
                    setCompanyName={setCompanyName}
                    passwordValidation={passwordValidation}
                    vendorAddress={vendorAddress}
                    setVendorAddress={setVendorAddress}
                    isRegistration={true}
                  />
                )}
                {registrationStep === 'success' && (
                  <div className="text-center py-8 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Application Received!</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Thank you for applying to be a vendor. Our team will review your
                        application and get back to you within 24-48 hours.
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        'w-full h-11 rounded-lg font-semibold transition-colors',
                        getButtonClass()
                      )}
                    >
                      Got it, thanks!
                    </button>
                  </div>
                )}
                {registrationStep === 'complete' && (
                  <div className="text-center py-8 space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Registration Complete!</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {context === 'checkout'
                          ? 'Redirecting you to checkout...'
                          : 'Welcome to MyMedDevices!'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
