'use client';

import React, { useState, useEffect } from 'react';
import { useCustomerProfile, useUpdateCustomerProfile } from '@/lib/hooks/useDashboard';
import { useAuthStore } from '@mymeddevices/shared-core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Mail,
  Phone,
  Save,
  Loader2,
  BellOff,
  Info,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Package,
  Clock,
  Sparkles,
  Smartphone,
  RefreshCw,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Channel {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const channels: Channel[] = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: Phone },
  { id: 'push', label: 'Push', icon: Bell },
];

interface NotificationCategory {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: {
    id: string;
    label: string;
    description: string;
    channels: { email?: boolean; sms?: boolean; push?: boolean };
  }[];
}

const defaultPreferences = {
  // Email preferences
  emailOrderUpdates: true,
  emailShippingUpdates: true,
  emailMarketing: false,
  emailNewsletter: true,
  emailSecurity: true,
  emailColdChain: true,
  emailWishlistSale: true,
  // SMS preferences
  smsOrderUpdates: true,
  smsShippingUpdates: true,
  smsMarketing: false,
  smsSecurity: true,
  smsColdChain: true,
  smsWishlistSale: false,
  // Push preferences
  pushOrderUpdates: true,
  pushShippingUpdates: true,
  pushMarketing: false,
  pushSecurity: true,
  pushColdChain: true,
  pushWishlistSale: true,
  // Other
  emailFrequency: 'instant' as 'instant' | 'daily' | 'weekly',
  pushEnabled: false,
  paused: false,
};

export default function CommunicationPage() {
  const { user } = useAuthStore();
  const { data: profile, isLoading, isError } = useCustomerProfile();
  const updateMutation = useUpdateCustomerProfile();

  const [prefs, setPrefs] = useState(defaultPreferences);
  const [loaded, setLoaded] = useState(false);
  const [pushPermission, setPushPermission] = useState<'default' | 'granted' | 'denied'>('default');

  useEffect(() => {
    if (profile && !loaded) {
      setPrefs((prev) => ({
        ...prev,
        emailOrderUpdates: (profile as any).email_order_updates ?? true,
        emailShippingUpdates: (profile as any).email_shipping_updates ?? true,
        emailMarketing: (profile as any).email_promotions ?? (profile as any).marketing_enabled ?? false,
        emailNewsletter: (profile as any).email_newsletter ?? true,
        emailSecurity: (profile as any).email_security ?? true,
        smsOrderUpdates: (profile as any).sms_order_updates ?? true,
        smsShippingUpdates: (profile as any).sms_shipping_updates ?? true,
        smsMarketing: (profile as any).sms_promotions ?? false,
        smsSecurity: (profile as any).sms_security ?? true,
        pushOrderUpdates: (profile as any).push_order_updates ?? true,
        pushShippingUpdates: (profile as any).push_shipping_updates ?? true,
        pushMarketing: (profile as any).push_marketing ?? false,
        pushSecurity: (profile as any).push_security ?? true,
        emailFrequency: ((profile as any).email_frequency ?? 'instant') as 'instant',
        pushEnabled: (profile as any).push_enabled ?? false,
        paused: (profile as any).paused ?? false,
      }));
      setLoaded(true);
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission as 'default' | 'granted' | 'denied');
    }
  }, [profile, loaded]);

  const update = (key: keyof typeof defaultPreferences, value: any) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const getChannelPref = (channelId: string, typeId: string): boolean => {
    const key = `${channelId}${typeId.charAt(0).toUpperCase() + typeId.slice(1)}` as keyof typeof defaultPreferences;
    return (prefs as any)[key] ?? true;
  };

  const handleToggle = (channelId: string, typeId: string) => {
    if (channelId === 'push' && pushPermission === 'default') {
      requestPushPermission();
      return;
    }
    const key = `${channelId}${typeId.charAt(0).toUpperCase() + typeId.slice(1)}` as keyof typeof defaultPreferences;
    update(key, !(prefs as any)[key]);
  };

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushPermission(permission as 'default' | 'granted' | 'denied');
      if (permission === 'granted') {
        update('pushEnabled', true);
        toast.success('Push notifications enabled for this browser');
      } else {
        toast.error('Push notifications blocked by browser.');
      }
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        email_order_updates: prefs.emailOrderUpdates,
        email_promotions: prefs.emailMarketing,
        email_newsletter: prefs.emailNewsletter,
        email_security: prefs.emailSecurity,
        sms_order_updates: prefs.smsOrderUpdates,
        sms_promotions: prefs.smsMarketing,
        sms_security: prefs.smsSecurity,
        email_frequency: prefs.emailFrequency,
        marketing_enabled: prefs.emailMarketing,
        ...(prefs.paused && { paused: prefs.paused }),
      } as any);
      toast.success('Communication preferences saved successfully');
    } catch {
      toast.error('Failed to save preferences');
    }
  };

  const notificationSections: NotificationCategory[] = [
    {
      title: 'Order & Shipment Procurement',
      description: 'Milestone tracking, M-Pesa transaction confirmations, and cold-chain logs',
      icon: Truck,
      items: [
        {
          id: 'orderUpdates',
          label: 'Order Confirmation & Payments',
          description: 'Instant verification when an order or Daraja M-Pesa payment is confirmed.',
          channels: { email: true, sms: true, push: true },
        },
        {
          id: 'shippingUpdates',
          label: 'Dispatch & Courier Tracking',
          description: 'Real-time waybill updates and courier dispatch notifications via G4S Kenya.',
          channels: { email: true, sms: true, push: true },
        },
        {
          id: 'coldChain',
          label: 'Cold-Chain & Storage Logs',
          description: 'Temperature compliance logs for temperature-sensitive reagents and vaccines.',
          channels: { email: true, sms: true, push: true },
        },
      ],
    },
    {
      title: 'Account Security & Compliance',
      description: 'Crucial notifications regarding identity, credentials, and regulatory notices',
      icon: ShieldCheck,
      items: [
        {
          id: 'security',
          label: 'Security & Sign-in Alerts',
          description: 'Immediate alert upon new device login, password changes, or MFA adjustments.',
          channels: { email: true, sms: true, push: true },
        },
      ],
    },
    {
      title: 'Commercial Offers & Catalog Updates',
      description: 'Discounts on saved equipment, inventory restocks, and medical bulletins',
      icon: Sparkles,
      items: [
        {
          id: 'wishlistSale',
          label: 'Wishlist Price Drops & Restocks',
          description: 'Alerts when saved medical devices or consumables drop in price or return to stock.',
          channels: { email: true, sms: false, push: true },
        },
        {
          id: 'marketing',
          label: 'Promotional Offers & Bundles',
          description: 'Discounts on clinic procurement packages and bulk surgical supplies.',
          channels: { email: true, sms: false, push: false },
        },
        {
          id: 'newsletter',
          label: 'Clinical Bulletins & PPB Updates',
          description: 'Monthly medical equipment digests, PPB compliance notes, and safety guidelines.',
          channels: { email: true, sms: false, push: false },
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-36 rounded-2xl bg-muted/40 animate-pulse border border-border/70" />
        <div className="h-64 rounded-2xl bg-muted/30 animate-pulse border border-border/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Hero Banner */}
      <Card className="border border-border/80 shadow-xs overflow-hidden rounded-2xl bg-card">
        <div className="p-6 md:p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
                <Bell className="h-3.5 w-3.5" />
                <span>Notification & Channel Protocol</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Communication Preferences
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Choose how and when you receive order invoices, M-Pesa payment receipts, G4S Kenya dispatch waybills, and critical account security alerts.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrefs(defaultPreferences);
                  toast.info('Preferences reset to default recommendations');
                }}
                className="rounded-xl text-xs font-semibold border-border bg-card hover:bg-muted shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                <span>Reset Defaults</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="gap-2 rounded-xl text-xs font-semibold shadow-xs"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>{updateMutation.isPending ? 'Saving...' : 'Save Preferences'}</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Channel Hub Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Email Hub Card */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
            <Mail className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Email Delivery
              </span>
              <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                Active
              </span>
            </div>
            <p className="text-xs font-bold text-foreground truncate">
              {user?.email || (profile as any)?.email || 'account@mymeddevices.com'}
            </p>
            <p className="text-[11px] text-muted-foreground capitalize">
              Frequency: <strong>{prefs.emailFrequency}</strong>
            </p>
          </div>
        </div>

        {/* SMS Hub Card */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Phone className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                SMS Channel
              </span>
              <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                Safaricom / Airtel
              </span>
            </div>
            <p className="text-xs font-bold text-foreground truncate">
              {(profile as any)?.phone || '+254 7XX XXX XXX'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Order OTP & STK Push receipts
            </p>
          </div>
        </div>

        {/* Push Notification Hub Card */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Push Alerts
              </span>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold',
                  pushPermission === 'granted'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {pushPermission === 'granted' ? 'Enabled' : 'Browser Default'}
              </span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {pushPermission === 'granted' ? 'Real-time Browser Push' : 'Push Inactive'}
            </p>
            {pushPermission !== 'granted' && (
              <button
                onClick={requestPushPermission}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                Enable Push Notifications →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Global Pause / Vacation Mode Toggle */}
      <Card className={cn('border rounded-2xl transition-colors', prefs.paused ? 'border-amber-300 bg-amber-500/10' : 'border-border/80 bg-card')}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'p-2.5 rounded-xl shrink-0',
                  prefs.paused ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-muted/50 text-muted-foreground'
                )}
              >
                {prefs.paused ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-sm text-foreground">
                  {prefs.paused ? 'Commercial Communications Muted' : 'Pause All Non-Critical Communications'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {prefs.paused
                    ? 'You will only receive critical security alerts and active delivery OTPs while muted.'
                    : 'Temporarily mute marketing, promotions, and newsletter digests without changing individual settings.'}
                </p>
              </div>
            </div>

            <Switch
              checked={prefs.paused}
              onCheckedChange={(v) => update('paused', v)}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Categorized Notification Matrix */}
      <div className="space-y-6">
        {notificationSections.map((section) => {
          const SectionIcon = section.icon;

          return (
            <Card key={section.title} className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
              <CardHeader className="p-5 sm:p-6 border-b border-border/60 bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <SectionIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                      {section.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Channels Table Header */}
                <div className="grid grid-cols-12 gap-2 px-5 sm:px-6 py-3 border-b border-border/50 bg-muted/20 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-6 sm:col-span-6">Notification Type</div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Email</span>
                  </div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">SMS</span>
                  </div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <Bell className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Push</span>
                  </div>
                </div>

                {/* Items Rows */}
                <div className="divide-y divide-border/50">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 px-5 sm:px-6 py-4 items-center hover:bg-muted/10 transition-colors"
                    >
                      <div className="col-span-6 sm:col-span-6 space-y-0.5 pr-2">
                        <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Email Switch */}
                      <div className="col-span-2 flex justify-center">
                        {item.channels.email !== false ? (
                          <Switch
                            checked={getChannelPref('email', item.id)}
                            onCheckedChange={() => handleToggle('email', item.id)}
                            disabled={prefs.paused && item.id !== 'security'}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground/40 font-mono">—</span>
                        )}
                      </div>

                      {/* SMS Switch */}
                      <div className="col-span-2 flex justify-center">
                        {item.channels.sms !== false ? (
                          <Switch
                            checked={getChannelPref('sms', item.id)}
                            onCheckedChange={() => handleToggle('sms', item.id)}
                            disabled={prefs.paused && item.id !== 'security'}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground/40 font-mono">—</span>
                        )}
                      </div>

                      {/* Push Switch */}
                      <div className="col-span-2 flex justify-center">
                        {item.channels.push !== false ? (
                          <Switch
                            checked={getChannelPref('push', item.id)}
                            onCheckedChange={() => handleToggle('push', item.id)}
                            disabled={prefs.paused && item.id !== 'security'}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground/40 font-mono">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 5. Email Digest Frequency */}
      <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
        <CardHeader className="p-5 sm:p-6 border-b border-border/60 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                Email Digest Delivery Frequency
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Set how often you want commercial digests and healthcare procurement summaries consolidated.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'instant',
                title: 'Instant Real-Time',
                subtitle: 'Immediate delivery',
                description: 'Receive notifications as events occur without any delay.',
              },
              {
                id: 'daily',
                title: 'Daily Evening Digest',
                subtitle: 'Once per day (6:00 PM EAT)',
                description: 'A single consolidated summary email of the day’s activities.',
              },
              {
                id: 'weekly',
                title: 'Weekly Monday Rollup',
                subtitle: 'Once per week (Monday 8:00 AM EAT)',
                description: 'A weekly executive summary of procurement pricing and catalog updates.',
              },
            ].map((option) => {
              const isSelected = prefs.emailFrequency === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => update('emailFrequency', option.id as any)}
                  className={cn(
                    'p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 relative shadow-2xs',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <p className="font-bold text-sm text-foreground">{option.title}</p>
                      <p className="text-[11px] font-semibold text-primary">{option.subtitle}</p>
                    </div>
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full border flex items-center justify-center transition-colors shrink-0 mt-0.5',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{option.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

