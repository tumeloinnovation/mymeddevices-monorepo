'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { useCheckoutAuthStore } from '@/lib/store/useAuthStore';
import CheckoutAuthGate from './CheckoutAuthGate';

export default function CustomerSection({ customer, setCustomer, onNext, onSignIn }: any) {
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const { isAuthenticated, user, hydrated: authHydrated, completeCheckoutProfile } = useCheckoutAuthStore();

  // Helper to get display name with proper fallbacks
  const getDisplayName = () => {
    if (isAuthenticated && user) {
      // Prefer firstName + lastName over displayName to avoid showing username/email
      const nameFromNames = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return nameFromNames || user.displayName || user.email?.split('@')[0] || '';
    }
    return customer.name;
  };

  const validatePhone = (phone: string) => {
    if (!phone) {
      setPhoneError('Phone number is required');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handlePhoneChange = (e: any) => {
    const value = e.target.value;
    setCustomer((c: any) => ({ ...c, phone: value }));
    if (phoneError) validatePhone(value);
  };

  const handleEmailChange = (e: any) => {
    const value = e.target.value;
    setCustomer((c: any) => ({ ...c, email: value }));
    if (emailError) validateEmail(value);
  };

  const handleNext = () => {
    if (!customer.name) {
      // Could add name validation
      return;
    }
    const isPhoneValid = validatePhone(customer.phone);
    const isEmailValid = validateEmail(customer.email);

    if (!isPhoneValid || !isEmailValid) {
      return;
    }

    onNext();
  };

  if (!isAuthenticated && !isGuestMode) {
    return (
      <CheckoutAuthGate
        onSignIn={onSignIn}
        onGuest={() => setIsGuestMode(true)}
      />
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="space-y-4">
          {/* Enhanced Authentication Badge */}
          {isAuthenticated && user && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-green-900">
                    Verified Account
                  </p>
                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">
                    ✓ Active
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate font-medium">{user.email}</span>
                </p>
                {getDisplayName() && (
                  <p className="text-xs text-green-600 mt-1.5 font-medium">
                    {getDisplayName()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Loading state while auth is hydrating */}
          {!authHydrated && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
              <p className="text-sm text-gray-600">Loading your information...</p>
            </div>
          )}

          <div>
            <Label htmlFor="fullname" className="pt-2 my-2">
              Full name
            </Label>
            <div className="relative">
              <Input
                id="fullname"
                placeholder="e.g. Jane Doe"
                value={getDisplayName()}
                onChange={(e: any) => setCustomer((c: any) => ({ ...c, name: e.target.value }))}
                disabled={isAuthenticated && !!getDisplayName()}
                className={isAuthenticated && getDisplayName() ? 'bg-green-50/50 border-green-200' : ''}
              />
              {isAuthenticated && getDisplayName() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
            {isAuthenticated && getDisplayName() && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Loaded from your verified account
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="pt-2 my-2">
              Email Address
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={customer.email || (isAuthenticated && user?.email) || ''}
                onChange={handleEmailChange}
                onBlur={() => validateEmail(customer.email)}
                disabled={isAuthenticated && !!user?.email}
                className={isAuthenticated && user?.email ? 'bg-green-50/50 border-green-200' : ''}
              />
              {isAuthenticated && user?.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
            {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
            {isAuthenticated && user?.email && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Loaded from your verified account
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="pt-2 my-2">
              Phone number
            </Label>
            <div className="relative">
              <Input
                id="phone"
                placeholder="0712345678"
                value={customer.phone}
                onChange={handlePhoneChange}
                onBlur={() => validatePhone(customer.phone)}
                disabled={isAuthenticated && !!user?.phone}
                className={isAuthenticated && user?.phone ? 'bg-green-50/50 border-green-200' : ''}
              />
              {isAuthenticated && user?.phone && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
            {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
            {isAuthenticated && user?.phone && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Loaded from your verified account
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleNext}>Continue to review</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
