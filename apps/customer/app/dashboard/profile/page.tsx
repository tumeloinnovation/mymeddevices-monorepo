'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PersonalInfo } from '@/app/dashboard/_components/PersonalInfo';
import { ProfileCompletenessRing } from './_components/profile-completeness-ring';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@mymeddevices/shared-core';
import { useCustomerProfile, useCustomerAddresses } from '@/lib/hooks/useDashboard';
import { useLoyaltyPoints } from '@/lib/hooks/useLoyalty';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Award,
  AlertCircle,
  Check,
  MapPin,
  Shield,
  CreditCard,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Lock,
  Building,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { calculateProfileCompleteness, getMissingFields } from '@/lib/data/profile-validation';
import { formatCurrency } from '@/lib/utils/utils';

function ProfilePageContent() {
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useCustomerProfile();
  const { data: addresses } = useCustomerAddresses();
  const { points: loyaltyPoints, tier: loyaltyTier } = useLoyaltyPoints();

  const getInitial = (name: string | undefined) => (name ? name[0].toUpperCase() : '');

  const initials = user
    ? (getInitial(user.firstName) + getInitial(user.lastName)) || user.email?.[0]?.toUpperCase() || 'U'
    : 'U';

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })
    : '2024';

  const defaultAddress = addresses?.find((addr: any) => addr.is_default_shipping || addr.is_default) || addresses?.[0];

  // Prepare profile data for completeness calculation
  const profileData = {
    firstName: profile?.first_name || user?.firstName || '',
    lastName: profile?.last_name || user?.lastName || '',
    displayName: user?.displayName || '',
    phone: profile?.phone || '',
    avatar_url: user?.avatar_url || profile?.avatar_url,
    hasAddress: (addresses?.length ?? 0) > 0,
  };

  const percentage = calculateProfileCompleteness(profileData);
  const missingFields = getMissingFields(profileData);
  const isComplete = percentage === 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Profile Hero Identity Header */}
      <Card className="border border-border/80 shadow-xs overflow-hidden rounded-2xl bg-card">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-border shadow-xs">
                <AvatarImage src={user?.avatar_url || profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="text-xl font-extrabold bg-primary/20 text-primary rounded-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                    {user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Healthcare Buyer'}
                  </h1>
                  <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-primary/30 bg-primary/10 text-primary capitalize">
                    {user?.role || 'Customer'}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {user?.email} {profile?.phone && <span>• <strong className="font-mono text-foreground">{profile.phone}</strong></span>}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span>Member since {memberSince}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs font-semibold border-border bg-card hover:bg-muted">
                <Link href="/dashboard/orders">
                  <span>My Orders</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs font-semibold border-border bg-card hover:bg-muted">
                <Link href="/dashboard/security">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Security & Password</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Completeness Strip */}
        <div className="px-6 py-3.5 bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">
              Profile Completeness: <strong className="text-foreground">{percentage}%</strong>
            </span>
          </div>
          {isComplete ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Your account details are 100% complete
            </span>
          ) : (
            <span className="text-amber-700 dark:text-amber-300 font-medium">
              Add {missingFields.join(', ')} to achieve 100% profile score.
            </span>
          )}
        </div>
      </Card>

      {/* 2. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editable Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <PersonalInfo />
        </div>

        {/* Right Column: Account Snapshot, Loyalty & Addresses (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Completeness Card */}
          <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-border/60 bg-muted/10">
              <CardTitle className="text-sm font-bold text-foreground">Profile Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-center py-1">
                <ProfileCompletenessRing profile={profileData} />
              </div>

              {!isComplete && missingFields.length > 0 && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Remaining steps:
                  </p>
                  <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
                    {missingFields.map((field) => (
                      <li key={field} className="flex items-center gap-2 text-[11px]">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="capitalize">Add {field}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isComplete && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">All profile information verified</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Loyalty Rewards Snapshot */}
          <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-border/60 bg-muted/10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-bold text-foreground">Loyalty Rewards</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs capitalize font-bold border-amber-300 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                {loyaltyTier}
              </Badge>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Reward Points</span>
                <span className="text-lg font-extrabold text-foreground">{loyaltyPoints.toLocaleString()} pts</span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold border-border bg-card hover:bg-muted">
                <Link href="/dashboard/loyalty" className="flex items-center justify-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-primary" />
                  <span>View Rewards Catalog</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 3. Primary Delivery Address Preview */}
          <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
            <CardHeader className="py-4 px-5 border-b border-border/60 bg-muted/10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold text-foreground">Primary Delivery Address</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              {defaultAddress ? (
                <div className="space-y-1 text-muted-foreground leading-relaxed">
                  <p className="font-bold text-foreground text-sm">
                    {defaultAddress.first_name} {defaultAddress.last_name}
                  </p>
                  <p>{defaultAddress.address_line1 || (defaultAddress as any).address_1}</p>
                  {defaultAddress.city && <p>{defaultAddress.city}, {defaultAddress.country || 'Kenya'}</p>}
                  {defaultAddress.phone && <p className="font-mono text-primary pt-1">📞 {defaultAddress.phone}</p>}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">No saved addresses yet.</p>
              )}

              <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold border-border bg-card hover:bg-muted mt-2">
                <Link href="/dashboard/addresses" className="flex items-center justify-center gap-1.5">
                  <span>Manage All Addresses ({addresses?.length || 0})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ErrorBoundary>
      <ProfilePageContent />
    </ErrorBoundary>
  );
}

