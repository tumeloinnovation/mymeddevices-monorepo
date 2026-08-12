'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PersonalInfo } from '@/app/dashboard/_components/PersonalInfo';
import { ProfileCompletenessRing } from './_components/profile-completeness-ring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@mymeddevices/shared-core';
import { useCustomerProfile, useCustomerAddresses } from '@/lib/hooks/useDashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Award, AlertCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateProfileCompleteness, getMissingFields, type ProfileCompletenessData } from '@/lib/data/profile-validation';

function ProfilePageContent() {
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useCustomerProfile();
  const { data: addresses } = useCustomerAddresses();

  const getInitial = (name: string | undefined) =>
    name ? name[0].toUpperCase() : '';

  const initials = user
    ? (getInitial(user.firstName) + getInitial(user.lastName)) || 'U'
    : 'U';

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  // Prepare profile data for completeness calculation
  const profileData = {
    firstName: profile?.first_name || user?.firstName || '',
    lastName: profile?.last_name || user?.lastName || '',
    displayName: user?.displayName || '',
    phone: profile?.phone || '',
    avatar_url: user?.avatar_url || profile?.avatar_url,
    hasAddress: (addresses?.length ?? 0) > 0,
  };

  // Calculate completeness and missing fields
  const percentage = calculateProfileCompleteness(profileData);
  const missingFields = getMissingFields(profileData);
  const isComplete = percentage === 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and account details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PersonalInfo />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar with completeness ring */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <ProfileCompletenessRing profile={profileData} />
                  {isComplete && (
                    <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
                      <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <p className="font-semibold text-lg">
                  {user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>

              {/* Show missing fields or completion message */}
              {!isComplete && missingFields.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Complete your profile ({percentage}%)
                  </p>
                  <ul className="space-y-1">
                    {missingFields.map((field) => (
                      <li key={field} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span className="capitalize">Add {field}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isComplete && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Your profile is complete!
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="font-medium">{memberSince || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Loyalty Tier:</span>
                  <Badge variant="secondary" className="capitalize">
                    {profile?.loyalty_tier || 'bronze'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
