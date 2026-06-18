'use client'

import { useState, useEffect } from 'react'
import { useCustomerProfile, useUpdateCustomerProfile } from '@/lib/hooks/useDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bell, Mail, Phone, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const defaultPreferences = {
  emailOrderUpdates: true,
  emailPromotions: false,
  emailNewsletter: true,
  emailSecurity: true,
  smsOrderUpdates: true,
  smsPromotions: false,
  smsSecurity: true,
  emailFrequency: 'instant' as const,
}

export default function CommunicationPage() {
  const { data: profile, isLoading, isError } = useCustomerProfile()
  const updateMutation = useUpdateCustomerProfile()

  const [prefs, setPrefs] = useState(defaultPreferences)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (profile && !loaded) {
      setPrefs({
        emailOrderUpdates: profile.email_order_updates ?? true,
        emailPromotions: profile.email_promotions ?? profile.marketing_enabled ?? false,
        emailNewsletter: profile.email_newsletter ?? true,
        emailSecurity: profile.email_security ?? true,
        smsOrderUpdates: profile.sms_order_updates ?? true,
        smsPromotions: profile.sms_promotions ?? false,
        smsSecurity: profile.sms_security ?? true,
        emailFrequency: (profile.email_frequency ?? 'instant') as 'instant',
      })
      setLoaded(true)
    }
  }, [profile, loaded])

  const update = (key: keyof typeof defaultPreferences, value: boolean | string) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        email_order_updates: prefs.emailOrderUpdates,
        email_promotions: prefs.emailPromotions,
        email_newsletter: prefs.emailNewsletter,
        email_security: prefs.emailSecurity,
        sms_order_updates: prefs.smsOrderUpdates,
        sms_promotions: prefs.smsPromotions,
        sms_security: prefs.smsSecurity,
        email_frequency: prefs.emailFrequency,
        marketing_enabled: prefs.emailPromotions,
      })
      toast.success('Communication preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Communication Preferences</h1>
        <p className="text-muted-foreground">Manage your email and SMS notification preferences.</p>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Communication Preferences</h1>
        <p className="text-muted-foreground">Manage your email and SMS notification preferences.</p>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Failed to load preferences. Please try again later.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Communication Preferences</h1>
        <p className="text-muted-foreground mt-2">Manage your email and SMS notification preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>Choose which emails you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ToggleItem
              id="email-order"
              label="Order Updates"
              description="Receive emails about your order status"
              checked={prefs.emailOrderUpdates}
              onCheckedChange={(v) => update('emailOrderUpdates', v)}
            />
            <ToggleItem
              id="email-promo"
              label="Marketing & Promotions"
              description="Receive special offers, discounts, and promotions"
              checked={prefs.emailPromotions}
              onCheckedChange={(v) => update('emailPromotions', v)}
            />
            <ToggleItem
              id="email-newsletter"
              label="Newsletter"
              description="Weekly health tips and product updates"
              checked={prefs.emailNewsletter}
              onCheckedChange={(v) => update('emailNewsletter', v)}
            />
            <ToggleItem
              id="email-security"
              label="Security Alerts"
              description="Important security notifications about your account"
              checked={prefs.emailSecurity}
              onCheckedChange={(v) => update('emailSecurity', v)}
            />

            <div className="border-t pt-4">
              <Label htmlFor="email-frequency" className="text-sm font-medium">Email Frequency</Label>
              <p className="text-sm text-muted-foreground mb-3">How often you receive non-urgent emails</p>
              <Select value={prefs.emailFrequency} onValueChange={(v) => update('emailFrequency', v)}>
                <SelectTrigger id="email-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant (as they happen)</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="size-5" />
              SMS Preferences
            </CardTitle>
            <CardDescription>Manage your text message notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ToggleItem
              id="sms-order"
              label="Order Updates via SMS"
              description="Get text messages about your orders"
              checked={prefs.smsOrderUpdates}
              onCheckedChange={(v) => update('smsOrderUpdates', v)}
            />
            <ToggleItem
              id="sms-promo"
              label="Promotional SMS"
              description="Exclusive offers via text message"
              checked={prefs.smsPromotions}
              onCheckedChange={(v) => update('smsPromotions', v)}
            />
            <ToggleItem
              id="sms-security"
              label="Security Alerts via SMS"
              description="Important security notifications via text"
              checked={prefs.smsSecurity}
              onCheckedChange={(v) => update('smsSecurity', v)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Other Preferences
          </CardTitle>
          <CardDescription>Additional communication settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="browser-notifications">Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notifications in your browser</p>
            </div>
            <Switch id="browser-notifications" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => {
            setPrefs({
              ...defaultPreferences,
              emailPromotions: profile?.email_promotions ?? profile?.marketing_enabled ?? false,
            })
            setLoaded(true)
          }}
        >
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}

function ToggleItem({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
