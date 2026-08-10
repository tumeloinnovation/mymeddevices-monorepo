'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Phone, 
  Save, 
  Loader2, 
  BellOff, 
  Info,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Check,
  X,
  Zap,
  Calendar,
  CalendarDays,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { IconToggleSwitch } from '@/components/ui/icon-toggle-switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfile } from '@/lib/api/hooks/useProfile';

interface NotificationType {
  id: string;
  label: string;
  description: string;
}

interface Channel {
  id: 'email' | 'sms' | 'push';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const vendorNotificationTypes: NotificationType[] = [
  { id: 'newOrders', label: 'New Order Alerts', description: 'Instant notification when a customer places an order for your items' },
  { id: 'fulfillment', label: 'Fulfillment & Delivery', description: 'Updates on order item processing, shipping, and delivery status' },
  { id: 'lowStock', label: 'Low Stock & Inventory', description: 'Alerts when product inventory falls below reorder thresholds' },
  { id: 'payouts', label: 'Payout & Revenue Settlements', description: 'Confirmation notices for M-Pesa or bank payout transfers' },
  { id: 'supportTickets', label: 'Support & Inquiry Threads', description: 'Messages from customer support or marketplace administrators' },
  { id: 'security', label: 'Account Security Alerts', description: 'Critical account logins, password changes, and 2FA notices' },
];

const channels: Channel[] = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: Phone },
  { id: 'push', label: 'Push', icon: Bell },
];

const defaultVendorPreferences = {
  // Email preferences
  emailNewOrders: true,
  emailFulfillment: true,
  emailLowStock: true,
  emailPayouts: true,
  emailSupportTickets: true,
  emailSecurity: true,
  // SMS preferences
  smsNewOrders: true,
  smsFulfillment: false,
  smsLowStock: true,
  smsPayouts: true,
  smsSupportTickets: false,
  smsSecurity: true,
  // Push preferences
  pushNewOrders: true,
  pushFulfillment: true,
  pushLowStock: true,
  pushPayouts: true,
  pushSupportTickets: true,
  pushSecurity: true,
  // Config
  emailFrequency: 'instant' as 'instant' | 'daily' | 'weekly',
  pushEnabled: false,
  paused: false,
};

export default function VendorNotificationSettingsPage() {
  const { profile, loading, error } = useProfile();
  const [prefs, setPrefs] = useState(defaultVendorPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [pushPermission, setPushPermission] = useState<'default' | 'granted' | 'denied'>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission as 'default' | 'granted' | 'denied');
    }
  }, []);

  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported by your browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === 'granted') {
        setPrefs(prev => ({ ...prev, pushEnabled: true }));
        toast.success('Browser push notifications enabled for store alerts.');
      } else if (permission === 'denied') {
        toast.error('Push notifications blocked in browser settings.');
      }
    } catch (err) {
      toast.error('Could not request notification permission.');
    }
  };

  const getChannelPref = (channelId: 'email' | 'sms' | 'push', typeId: string): boolean => {
    const key = `${channelId}${typeId.charAt(0).toUpperCase() + typeId.slice(1)}` as keyof typeof prefs;
    return Boolean(prefs[key]);
  };

  const handleToggle = (channelId: 'email' | 'sms' | 'push', typeId: string) => {
    const key = `${channelId}${typeId.charAt(0).toUpperCase() + typeId.slice(1)}` as keyof typeof prefs;
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      toast.success('Notification preferences updated successfully');
    } catch (err) {
      toast.error('Failed to update notification preferences');
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
        <h2 className="font-semibold">Failed to load notification settings</h2>
        <p className="text-sm">Please ensure you are logged in as a verified vendor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-slate-500">Configure how and when you want to receive store alerts, order updates, and payout notices.</p>
      </div>

      {/* 1. Channel Notification Matrix Card */}
      <Card className="border-border/50 shadow-xl shadow-foreground/5 overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Bell className="h-5 w-5 text-emerald-600" />
                Channel Notification Preferences
              </CardTitle>
              <CardDescription className="mt-1">
                Toggle notification channels on or off for each store event type.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-semibold text-xs px-3 py-1">
              Active Store Channels
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Header Row for Channels */}
          <div className="hidden sm:grid grid-cols-4 gap-4 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <div>Notification Category</div>
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <div key={channel.id} className="text-center flex items-center justify-center gap-2 py-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                  <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{channel.label}</span>
                </div>
              );
            })}
          </div>

          {/* Event Rows */}
          <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/60">
            {vendorNotificationTypes.map((type) => (
              <div key={type.id} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center pt-4 first:pt-0">
                {/* Category Info */}
                <div className="pr-2">
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {type.label}
                    {type.id === 'security' && (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] uppercase font-semibold">
                        Critical
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 leading-snug mt-0.5">{type.description}</p>
                </div>

                {/* Channel Toggles */}
                {channels.map((channel) => {
                  const isEnabled = getChannelPref(channel.id, type.id);
                  const isDisabled = prefs.paused && type.id !== 'security';

                  return (
                    <div 
                      key={channel.id} 
                      onClick={() => !isDisabled && handleToggle(channel.id, type.id)}
                      className={`flex items-center justify-between sm:justify-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isDisabled
                          ? 'opacity-40 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                          : isEnabled
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 hover:border-emerald-400'
                          : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-semibold sm:hidden text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <channel.icon className="h-3.5 w-3.5 text-emerald-600" />
                        {channel.label}
                      </span>
                      
                      <IconToggleSwitch
                        checked={isEnabled}
                        onCheckedChange={() => handleToggle(channel.id, type.id)}
                        disabled={isDisabled}
                        ariaLabel={`${type.label} ${channel.label} notification`}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Browser Desktop Push Permission Banner */}
          {pushPermission !== 'granted' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mt-6">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  {pushPermission === 'denied'
                    ? 'Browser push notifications are currently blocked. Enable notifications in your browser site settings.'
                    : 'Enable browser push notifications to receive real-time order alerts directly on your desktop.'}
                </span>
              </div>
              {pushPermission === 'default' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEnablePush}
                  className="text-xs font-bold shrink-0 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  Enable Desktop Push
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Email Notification Frequency Selection Cards */}
      <Card className="border-border/50 shadow-xl shadow-foreground/5 overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-emerald-600" />
                Email Notification Frequency
              </CardTitle>
              <CardDescription className="mt-1">
                Select your preferred dispatch schedule for routine store activity reports and non-critical order summaries.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-mono text-xs px-3 py-1">
              {prefs.emailFrequency.toUpperCase()} SCHEDULE
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                id: 'instant',
                title: 'Instant Alerts',
                schedule: 'Real-time dispatch',
                badge: 'Recommended',
                description: 'Emails are sent immediately as new orders, item fulfillment, or payout confirmations happen.',
                icon: Zap,
                badgeStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
                iconStyle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
              },
              {
                id: 'daily',
                title: 'Daily Digest',
                schedule: 'Every day at 08:00 EAT',
                badge: 'Balanced',
                description: 'A single consolidated morning email compiling all order summaries, inventory status, and notices.',
                icon: Calendar,
                badgeStyle: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800',
                iconStyle: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
              },
              {
                id: 'weekly',
                title: 'Weekly Summary',
                schedule: 'Every Monday at 08:00 EAT',
                badge: 'Low Traffic',
                description: 'A comprehensive weekly report analyzing sales performance, total orders, and weekly payouts.',
                icon: CalendarDays,
                badgeStyle: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
                iconStyle: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
              },
            ].map((option) => {
              const isSelected = prefs.emailFrequency === option.id;
              const Icon = option.icon;
              const isDisabled = prefs.paused;

              return (
                <div
                  key={option.id}
                  onClick={() => !isDisabled && setPrefs(prev => ({ ...prev, emailFrequency: option.id as any }))}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                    isDisabled
                      ? 'opacity-40 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-600 dark:border-emerald-500 shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-600/20'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-900/80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${option.iconStyle}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      {/* Selection Radio Circle */}
                      <div className={`flex items-center justify-center h-6 w-6 rounded-full border transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : 'border-slate-300 dark:border-slate-700 bg-transparent'
                      }`}>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{option.title}</h3>
                        <Badge variant="outline" className={`text-[10px] font-semibold uppercase px-2 py-0.5 ${option.badgeStyle}`}>
                          {option.badge}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {option.schedule}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Pause Non-Critical Notifications Card (Located at the bottom) */}
      <Card className={prefs.paused ? 'border-amber-300 bg-amber-50/80 dark:bg-amber-950/30' : 'border-border/50 shadow-xl shadow-foreground/5'}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-lg ${prefs.paused ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {prefs.paused ? (
                  <BellOff className="h-5 w-5 text-amber-600" />
                ) : (
                  <Bell className="h-5 w-5 text-slate-500" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {prefs.paused ? 'Store Notifications Paused' : 'Pause Non-Critical Notifications'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {prefs.paused
                    ? 'All marketing and order digests are currently paused. Account security alerts remain active.'
                    : 'Temporarily mute routine promotional and digest alerts during holiday breaks or maintenance.'}
                </p>
              </div>
            </div>
            
            <IconToggleSwitch
              checked={prefs.paused}
              onCheckedChange={(v) => setPrefs(prev => ({ ...prev, paused: v }))}
              activeColor="bg-amber-600 shadow-sm"
              activeIconColor="text-amber-600"
              activeLabel="PAUSED"
              inactiveLabel="ACTIVE"
              ariaLabel="Pause non-critical notifications"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions Toolbar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => {
            setPrefs(defaultVendorPreferences);
            toast.info('Preferences reset to default values.');
          }}
          className="h-11 px-5"
        >
          <RotateCcw className="mr-2 h-4 w-4 text-slate-400" />
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11 px-6"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
