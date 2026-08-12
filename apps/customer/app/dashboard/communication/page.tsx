'use client';

import { useState, useEffect } from 'react';
import { useCustomerProfile, useUpdateCustomerProfile } from '@/lib/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Mail, Phone, Save, Loader2, BellOff, Info } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NotificationType {
  id: string;
  label: string;
  description: string;
}

interface Channel {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const notificationTypes: NotificationType[] = [
  { id: 'orderUpdates', label: 'Order Updates', description: 'Status changes for your orders' },
  { id: 'shippingUpdates', label: 'Shipping Updates', description: 'Delivery progress and tracking' },
  { id: 'marketing', label: 'Marketing', description: 'Special offers and promotions' },
  { id: 'newsletter', label: 'Newsletter', description: 'Weekly health tips and updates' },
  { id: 'security', label: 'Security Alerts', description: 'Critical account security notifications' },
];

const channels: Channel[] = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: Phone },
  { id: 'push', label: 'Push', icon: Bell },
];

const defaultPreferences = {
  // Email preferences
  emailOrderUpdates: true,
  emailShippingUpdates: true,
  emailMarketing: false,
  emailNewsletter: true,
  emailSecurity: true,
  // SMS preferences
  smsOrderUpdates: true,
  smsShippingUpdates: true,
  smsMarketing: false,
  smsSecurity: true,
  // Push preferences
  pushOrderUpdates: true,
  pushShippingUpdates: true,
  pushMarketing: false,
  pushSecurity: true,
  // Other
  emailFrequency: 'instant' as const,
  pushEnabled: false,
  paused: false,
};

export default function CommunicationPage() {
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

    // Check push notification permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission as 'default' | 'granted' | 'denied');
    }
  }, [profile, loaded]);

  const update = (key: keyof typeof defaultPreferences, value: boolean | string) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const getChannelPref = (channelId: string, typeId: string): boolean => {
    const key = `${channelId}${typeId.charAt(0).toUpperCase() + typeId.slice(1)}` as keyof typeof defaultPreferences;
    return prefs[key] as boolean;
  };

  const handleToggle = (channelId: string, typeId: string) => {
    if (channelId === 'push' && pushPermission === 'default') {
      requestPushPermission();
      return;
    }
    const key = `${channelId}${typeId.charAt(0).toUpperCase() + typeId.slice(1)}` as keyof typeof defaultPreferences;
    update(key, !prefs[key]);
  };

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushPermission(permission as 'default' | 'granted' | 'denied');
      if (permission === 'granted') {
        update('pushEnabled', true);
        toast.success('Push notifications enabled');
      } else {
        toast.error('Push notifications blocked. Please enable in your browser settings.');
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
        // Note: New fields like shipping updates and push preferences
        // would need to be added to the backend Customer model
      } as any);
      toast.success('Communication preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Communication Preferences</h1>
        <p className="text-muted-foreground">Manage how we contact you</p>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Communication Preferences</h1>
        <p className="text-muted-foreground">Manage how we contact you</p>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Failed to load preferences. Please try again later.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Communication Preferences</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Choose how and when you want to receive updates.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9"
            onClick={() => {
              setPrefs(defaultPreferences);
              setLoaded(true);
            }}
          >
            Reset to Defaults
          </Button>
          <Button size="sm" className="text-xs h-9 gap-1.5" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Pause All */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={prefs.paused ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {prefs.paused ? (
                  <BellOff className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                ) : (
                  <Bell className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">{prefs.paused ? 'Communications Paused' : 'Pause All Communications'}</p>
                  <p className="text-sm text-muted-foreground">
                    {prefs.paused
                      ? 'You will only receive security alerts while paused'
                      : 'Temporarily mute everything except security alerts'}
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
      </motion.div>

      {/* Matrix Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Select your preferred channels for each notification type</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-sm font-medium text-muted-foreground">Notification Type</div>
            {channels.map((channel) => (
              <div key={channel.id} className="text-center">
                <channel.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-sm font-medium">{channel.label}</span>
              </div>
            ))}
          </div>

          {/* Notification Type Rows */}
          <div className="space-y-4">
            {notificationTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-4 gap-4 items-center py-3 border-b last:border-0"
              >
                <div className="pr-4">
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                </div>
                {channels.map((channel) => {
                  const isPush = channel.id === 'push';
                  const isEnabled = getChannelPref(channel.id, type.id);
                  const isDisabled = prefs.paused && type.id !== 'security';

                  return (
                    <div key={channel.id} className="flex justify-center">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleToggle(channel.id, type.id)}
                        disabled={isDisabled}
                        className={isDisabled ? 'opacity-50' : ''}
                      />
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>

          {/* Push Permission Notice */}
          {pushPermission === 'denied' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg mt-4"
            >
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Push notifications are blocked in your browser. Enable them in your browser settings to receive push notifications.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Email Frequency */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Email Frequency</CardTitle>
          <CardDescription className="text-xs">How often you want to receive non-essential updates and digests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'instant',
                title: 'Instant',
                subtitle: 'As events happen',
                description: 'Receive real-time notifications immediately.',
              },
              {
                id: 'daily',
                title: 'Daily Digest',
                subtitle: 'Once per day',
                description: 'A single summary email delivered every evening.',
              },
              {
                id: 'weekly',
                title: 'Weekly Digest',
                subtitle: 'Once per week',
                description: 'A weekly rollup sent every Monday morning.',
              },
            ].map((option) => {
              const isSelected = prefs.emailFrequency === option.id;
              const isDisabled = prefs.paused;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => update('emailFrequency', option.id)}
                  className={cn(
                    'relative p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{option.title}</p>
                      <p className="text-[11px] font-medium text-primary">{option.subtitle}</p>
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
