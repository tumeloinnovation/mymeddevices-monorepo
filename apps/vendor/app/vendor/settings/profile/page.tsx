'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Bell, 
  Lock, 
  Upload,
  Save,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useProfile } from '@/lib/api/hooks/useProfile';

export default function SettingsPage() {
  const { profile, loading, error, updateProfile } = useProfile();
  
  // Local state for profile inputs
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync profile values when loaded
  useEffect(() => {
    if (profile) {
      setStoreName(profile.store_name || '');
      setDescription(profile.description || '');
      setBusinessEmail(profile.business_email || '');
      setBusinessPhone(profile.business_phone || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const success = await updateProfile({
        store_name: storeName,
        description,
        business_email: businessEmail,
        business_phone: businessPhone,
      });
      if (success) {
        toast.success('Store profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <h2 className="font-semibold">Failed to load settings</h2>
        <p className="text-sm">Please make sure you are logged in as a vendor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Profile</h1>
        <p className="text-slate-500">Manage your store details and branding.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <CardDescription>Update your store details and branding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="space-y-2">
              <Label>Store Logo</Label>
              <div className="h-32 w-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <Upload className="h-6 w-6 text-slate-400" />
                <span className="text-[10px] text-slate-500 font-medium text-center px-2">Upload Logo (1:1)</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input 
                  id="store-name" 
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="store-status">Verification Status</Label>
                <div className="flex items-center">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded uppercase">
                    {profile?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="store-description">Store Description</Label>
            <Textarea 
              id="store-description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your store..." 
              className="min-h-[100px]"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="support-email">Business Contact Email</Label>
              <Input 
                id="support-email" 
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support-phone">Business Contact Phone</Label>
              <Input 
                id="support-phone" 
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveProfile} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

