'use client';

/**
 * @deprecated Use CustomerAuthModal from @mymeddevices/shared-ui instead.
 * This component will be removed. CustomerAuthModal provides a unified teal/cyan theme.
 */

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCheckoutAuthStore } from '@/lib/store/useAuthStore';
import { Address } from '@/lib/hooks/useCheckoutLogic';
import { EmailStep } from './EmailStep';
import { OTPStep } from './OTPStep';
import { ProfileStep } from './ProfileStep';
import { LoginStep } from './LoginStep';
import { CheckCircle2 } from 'lucide-react';

interface CheckoutAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  allowGuestCheckout?: boolean;
  delivery?: Address | null;
  customer?: {
    name: string;
    phone: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export function CheckoutAuthModal({
  open,
  onOpenChange,
  onComplete,
  allowGuestCheckout = true,
  delivery,
  customer,
}: CheckoutAuthModalProps) {
  const { checkoutStep: step, isAuthenticated, setCheckoutStep: setStep, hydrated } = useCheckoutAuthStore();

  // Initialize step to 'email' when modal opens
  useEffect(() => {
    if (open && hydrated && !step) {
      setStep('email');
    }
  }, [open, hydrated, step, setStep]);

  useEffect(() => {
    if (isAuthenticated && step === 'complete') {
      onComplete?.();
      // Keep modal open briefly to show success
      setTimeout(() => onOpenChange(false), 500);
    }
  }, [isAuthenticated, step, onComplete, onOpenChange]);

  // Show loading state while hydrating (inside the dialog)
  if (!hydrated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Loading</DialogTitle>
            <DialogDescription className="sr-only">
              Loading authentication...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleGuestCheckout = () => {
    onOpenChange(false);
  };

  const handleBackFromOTP = () => {
    setStep('email');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Checkout Authentication</DialogTitle>
          <DialogDescription className="sr-only">
            Verify your email to continue with checkout
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-4">
          <div className={`h-1.5 w-16 rounded-full transition-all ${step === 'email' || step === 'login' || !step ? 'bg-orange-600' : 'bg-orange-200'
            }`} />
          <div className={`h-1.5 w-16 rounded-full transition-all ${step === 'otp' ? 'bg-orange-600' : step === 'profile' || step === 'complete' ? 'bg-orange-200' : 'bg-gray-200'
            }`} />
          <div className={`h-1.5 w-16 rounded-full transition-all ${step === 'profile' ? 'bg-orange-600' : step === 'complete' ? 'bg-orange-200' : 'bg-gray-200'
            }`} />
        </div>

        {/* Step Content */}
        <div className="animate-in fade-in-0 duration-300">
          {(step === 'email' || !step) && (
            <EmailStep
              onGuestCheckout={allowGuestCheckout ? handleGuestCheckout : undefined}
            />
          )}
          {step === 'login' && (
            <LoginStep />
          )}
          {step === 'otp' && (
            <OTPStep onBack={handleBackFromOTP} />
          )}
          {step === 'profile' && (
            <ProfileStep delivery={delivery} customer={customer} />
          )}
          {step === 'complete' && (
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">All Set!</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirecting you to checkout...
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
