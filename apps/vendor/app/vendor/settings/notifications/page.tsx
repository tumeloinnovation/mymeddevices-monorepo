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
  const { profile, loading, error } = useProfile();

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
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-slate-500">Choose how you want to be notified of store events.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified of store events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Order Alerts</Label>
                <p className="text-sm text-slate-500">Receive email notifications for every new order.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-slate-500">Notify me when products go below threshold.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Payout Notifications</Label>
                <p className="text-sm text-slate-500">Notify me when a payout is processed.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={() => toast.success('Preferences updated successfully')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Update Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

