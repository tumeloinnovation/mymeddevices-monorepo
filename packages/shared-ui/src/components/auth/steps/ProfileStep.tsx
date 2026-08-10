'use client';

import { User, Phone, Building, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { PasswordInput } from '../common/PasswordInput';
import { VendorAddressAutocomplete } from '../common/VendorAddressAutocomplete';
import { cn } from '../../../lib/utils';

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
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Header section */}
      {!isRegistration && (
        <div className="text-center space-y-1.5 mb-5">
          <div className="mx-auto w-11 h-11 rounded-2xl bg-[#e0752b]/10 border border-[#e0752b]/20 flex items-center justify-center mb-2 shadow-xs">
            <User className="w-5 h-5 text-[#e0752b]" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Complete Your Profile
          </h3>
          <p className="text-xs text-muted-foreground">
            Tell us a bit more about yourself to finalize setup
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <span>{error}</span>
        </div>
      )}

      {/* Responsive Name fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-xs font-semibold text-foreground/90">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            className="h-11 rounded-xl border-input/80 bg-background/50 focus-visible:ring-2 focus-visible:ring-[#e0752b]/30 focus-visible:border-[#e0752b] transition-all text-sm"
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-xs font-semibold text-foreground/90">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            className="h-11 rounded-xl border-input/80 bg-background/50 focus-visible:ring-2 focus-visible:ring-[#e0752b]/30 focus-visible:border-[#e0752b] transition-all text-sm"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Phone Number Input */}
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-xs font-semibold text-foreground/90">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254 700 000 000"
            className="pl-10 h-11 rounded-xl border-input/80 bg-background/50 focus-visible:ring-2 focus-visible:ring-[#e0752b]/30 focus-visible:border-[#e0752b] transition-all text-sm"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Vendor Company Name */}
      {isVendor && setCompanyName && (
        <div className="space-y-1.5">
          <Label htmlFor="company" className="text-xs font-semibold text-foreground/90">Company / Store Name</Label>
          <div className="relative">
            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Medical Supplies"
              className="pl-10 h-11 rounded-xl border-input/80 bg-background/50 focus-visible:ring-2 focus-visible:ring-[#0e599b]/30 focus-visible:border-[#0e599b] transition-all text-sm"
              required
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Vendor Address Input */}
      {isVendor && setVendorAddress && (
        <div className="space-y-1.5">
          <VendorAddressAutocomplete
            onPlaceSelected={setVendorAddress}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Selected Address Card */}
      {isVendor && vendorAddress && (
        <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-1">
          <p className="text-xs font-semibold text-foreground">Verified Store Address:</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{vendorAddress.formatted_address || vendorAddress.address}</p>
        </div>
      )}

      {/* Password Creation */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">Create Password</Label>
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

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 active:scale-[0.98] bg-[#e0752b] hover:bg-[#c86221] text-white border-0 mt-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Completing Account...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Complete Registration
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>
    </form>
  );
}
