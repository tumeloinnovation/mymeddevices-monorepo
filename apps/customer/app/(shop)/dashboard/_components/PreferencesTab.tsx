"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BellIcon, MailIcon, PhoneIcon, GlobeIcon } from "lucide-react"

export function PreferencesTab() {
  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BellIcon className="size-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-order">Order Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails about your order status
                </p>
              </div>
              <Switch id="email-order" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-promo">Promotional Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive special offers and discounts
                </p>
              </div>
              <Switch id="email-promo" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-newsletter">Newsletter</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly health tips and product updates
                </p>
              </div>
              <Switch id="email-newsletter" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-security">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important security notifications
                </p>
              </div>
              <Switch id="email-security" defaultChecked />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Email Frequency</h4>
            <Select defaultValue="instant">
              <SelectTrigger>
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

      {/* SMS Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PhoneIcon className="size-5" />
            SMS Preferences
          </CardTitle>
          <CardDescription>
            Manage your text message notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-order">Order Updates via SMS</Label>
              <p className="text-sm text-muted-foreground">
                Get text messages about your orders
              </p>
            </div>
            <Switch id="sms-order" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-promo">Promotional SMS</Label>
              <p className="text-sm text-muted-foreground">
                Exclusive offers via text message
              </p>
            </div>
            <Switch id="sms-promo" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-security">Security Alerts via SMS</Label>
              <p className="text-sm text-muted-foreground">
                Important security notifications
              </p>
            </div>
            <Switch id="sms-security" defaultChecked />
          </div>
        </CardContent>
      </Card>


      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  )
}
