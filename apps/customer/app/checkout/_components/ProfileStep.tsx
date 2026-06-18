'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Lock, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCheckoutAuthStore } from '@/lib/store/useAuthStore';
import { toast } from 'sonner';
import { Address } from '@/lib/hooks/useCheckoutLogic';

interface ProfileStepProps {
  delivery?: Address | null;
  customer?: {
    name: string;
    phone: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export function ProfileStep({ customer }: ProfileStepProps) {
  const { user, completeCheckoutProfile, setError } = useCheckoutAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: customer?.firstName || (customer?.name ? customer.name.split(' ')[0] : '') || '',
    lastName: customer?.lastName || (customer?.name ? customer.name.split(' ').slice(1).join(' ') : '') || '',
    phone: customer?.phone || '',
    password: '',
  });

  // Update form data if customer prop changes
  useEffect(() => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || customer.firstName || (customer.name ? customer.name.split(' ')[0] : '') || '',
        lastName: prev.lastName || customer.lastName || (customer.name ? customer.name.split(' ').slice(1).join(' ') : '') || '',
        phone: prev.phone || customer.phone || '',
      }));
    }
  }, [customer]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.firstName.length < 2) {
      toast.error('First name must be at least 2 characters');
      return;
    }

    if (formData.lastName.length < 2) {
      toast.error('Last name must be at least 2 characters');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mock Profile Completion
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedUser = {
        ...user!,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        displayName: `${formData.firstName} ${formData.lastName}`,
      };

      completeCheckoutProfile(updatedUser);
      toast.success('Profile completed successfully! ');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete profile';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Complete Your Profile</h2>
        <p className="text-sm text-muted-foreground">
          Just a few more details to finish
        </p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-muted-foreground">
            Email: <span className="font-medium text-foreground">{user?.email}</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-medium text-green-600">
          Demo Mode: All data is saved locally
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              disabled={isLoading}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+254 712 345 678"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={isLoading}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={isLoading}
              className="pl-10 pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating profile...
            </>
          ) : (
            <>Complete Profile</>
          )}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
