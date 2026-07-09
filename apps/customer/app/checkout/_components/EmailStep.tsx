'use client';

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCheckoutAuthStore } from '@/lib/store/useAuthStore';
import { toast } from 'sonner';

interface EmailStepProps {
  onGuestCheckout?: () => void;
}

export function EmailStep({ onGuestCheckout }: EmailStepProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setCheckoutEmail: setStoreEmail, setError } = useCheckoutAuthStore();

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const store = useCheckoutAuthStore.getState();
      await store.initiateRegistration({ email, role: 'customer' });
      setStoreEmail(email);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to send verification code';
      if (message.includes('already exists') || message.includes('already registered')) {
        toast.error('An account already exists with this email. Redirecting to login...');
        useCheckoutAuthStore.getState().setCheckoutStep('login');
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-orange-600" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Verify Your Email</h2>
        <p className="text-sm text-muted-foreground">
          Enter your email to continue securely with your order
        </p>

      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            autoFocus
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending code...
            </>
          ) : (
            <>Continue</>
          )}
        </Button>
      </form>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            setStoreEmail('');
            useCheckoutAuthStore.getState().setCheckoutStep('login');
          }}
        >
          Already have an account? Login
        </Button>

        {onGuestCheckout && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onGuestCheckout}
            >
              Continue as Guest
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        We'll send you a verification code to confirm your email address.
      </p>
    </div>
  );
}
