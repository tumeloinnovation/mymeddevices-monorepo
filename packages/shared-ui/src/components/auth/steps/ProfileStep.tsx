'use client';

import { User, Phone, Building } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { PasswordInput } from '../common/PasswordInput';
import { VendorAddressAutocomplete } from '../common/VendorAddressAutocomplete';
import { cn } from '../../../lib/utils';
import { getButtonClass, getIconBgClass, getIconColor } from '../auth-theme';

interface ProfileStepProps {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  isVendor?: boolean;
  companyName?: string;
  setCompanyName?: (value: string) => void;
  passwordValidation?: {
    valid: boolean;
    errors: string[];
  };
  // Address for vendor registration (from Google Places autocomplete)
  vendorAddress?: {
    place_id: string;
    formatted_address?: string;
    address?: string;
    lat: number;
    lng: number;
    city?: string;
    country?: string;
    region?: string;
  } | null;
  setVendorAddress?: (place: {
    place_id: string;
    formatted_address?: string;
    address?: string;
    lat: number;
    lng: number;
    city?: string;
    country?: string;
    region?: string;
  }) => void;
  // isRegistration flag for hiding header
  isRegistration?: boolean;
}

export function ProfileStep({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  password,
  setPassword,
  onSubmit,
  isLoading = false,
  error = null,
  isVendor = false,
  companyName = '',
  setCompanyName,
  passwordValidation,
  vendorAddress = null,
  setVendorAddress,
  isRegistration = false,
}: ProfileStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Icon and title - hidden for registration mode */}
      {!isRegistration && (
        <div className="space-y-2 text-center">
          <div className={cn('mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4', getIconBgClass())}>
            <User className={cn('w-6 h-6', getIconColor())} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Complete Your Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Tell us a bit more about yourself
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254..."
            className="pl-10"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Company name for vendors */}
      {isVendor && setCompanyName && (
        <div className="space-y-2">
          <Label htmlFor="company">Company Name</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Business Name"
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Address field - required for vendor registration */}
      {isVendor && setVendorAddress && (
        <VendorAddressAutocomplete
          onPlaceSelected={setVendorAddress}
          disabled={isLoading}
        />
      )}

      {/* Selected address display for vendors */}
      {isVendor && vendorAddress && (
        <div className="p-3 bg-muted/50 rounded-md border">
          <p className="text-sm font-medium">Selected Address:</p>
          <p className="text-xs text-muted-foreground mt-1">{vendorAddress.formatted_address || vendorAddress.address}</p>
          <p className="text-xs text-muted-foreground">
            {vendorAddress.city && `${vendorAddress.city}, `}
            {vendorAddress.country}
          </p>
        </div>
      )}

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Create Password</Label>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="Create a strong password"
          required
          disabled={isLoading}
          showRequirements={true}
          validation={passwordValidation}
        />
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        className={cn('w-full h-11', getButtonClass())}
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Complete Registration'}
      </Button>
    </form>
  );
}
