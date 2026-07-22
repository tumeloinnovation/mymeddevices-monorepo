'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { PersonalInfo } from '@/app/dashboard/_components/PersonalInfo';
import { ProfileCompletenessRing } from './_components/profile-completeness-ring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@mymeddevices/shared-core';
import { useCustomerProfile, useCustomerAddresses } from '@/lib/hooks/useDashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Award } from 'lucide-react';
import { motion } from 'framer-motion';

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
                <ProfileCompletenessRing profile={profileData} />
              </div>

              <div className="text-center">
                <p className="font-semibold text-lg">
                  {user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>

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
