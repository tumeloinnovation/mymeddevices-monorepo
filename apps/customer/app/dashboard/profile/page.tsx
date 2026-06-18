'use client';

import { PersonalInfo } from '@/app/(shop)/dashboard/_components/PersonalInfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@mymeddevices/shared-core';
import { useCustomerProfile } from '@/lib/hooks/useDashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Award } from 'lucide-react';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useCustomerProfile();

  const getInitial = (name: string | undefined) =>
    name ? name[0].toUpperCase() : '';

  const initials = user
    ? (getInitial(user.firstName) + getInitial(user.lastName)) || 'U'
    : 'U';

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user?.avatar_url || profile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Member since:</span>
                  <span>{memberSince || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Loyalty Tier:</span>
                  <Badge variant="secondary" className="capitalize">
                    {profile?.loyalty_tier || 'bronze'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
