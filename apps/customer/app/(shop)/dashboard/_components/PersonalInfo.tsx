'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@mymeddevices/shared-core';
import { useCustomerProfile, useUpdateCustomerProfile, useUploadAvatar } from '@/lib/hooks/useDashboard';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Save, X, Camera, Loader2 } from 'lucide-react';
import type { UpdateProfileData } from '@/lib/data/profile-types';

export function PersonalInfo() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { data: profile, isLoading: profileLoading } = useCustomerProfile();
  const updateProfile = useUpdateCustomerProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UpdateProfileData>({
    firstName: '',
    lastName: '',
    displayName: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        displayName: user?.displayName || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, user?.displayName]);

  const handleChange = (field: keyof UpdateProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getInitial = (name: string | undefined) =>
    name ? name[0].toUpperCase() : '';

  const initials = user
    ? (getInitial(formData.firstName || user.firstName) + getInitial(formData.lastName || user.lastName)) || 'U'
    : 'U';

  const avatarUrl = user?.avatar_url || profile?.avatar_url;

  const handleSave = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    setIsSaving(true);
    try {
      const result = await updateProfile.mutateAsync({
        first_name: formData.firstName || undefined,
        last_name: formData.lastName || undefined,
        phone: formData.phone || undefined,
      });

      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: formData.displayName || [formData.firstName, formData.lastName].filter(Boolean).join(' '),
        phone: formData.phone,
        avatar_url: result.avatar_url || user.avatar_url,
      });

      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        displayName: user?.displayName || '',
        phone: profile.phone || '',
      });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadAvatar.mutateAsync(file);
      if (user) {
        updateUser({ avatar_url: result.avatar_url });
      }
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (profileLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <p className="font-medium">{formData.displayName || [formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">Click avatar to change photo</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed
            </p>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            className="gap-2"
            onClick={handleSave}
            disabled={isSaving || updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updateProfile.isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleCancel}
            disabled={isSaving || updateProfile.isPending}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
