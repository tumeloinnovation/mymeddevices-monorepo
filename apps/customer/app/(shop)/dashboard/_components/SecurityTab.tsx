"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  ShieldIcon,
  KeyIcon,
  SmartphoneIcon,
  MonitorIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { useState } from "react"

interface Device {
  id: string
  name: string
  type: "desktop" | "mobile" | "tablet"
  location: string
  lastActive: string
  isCurrent: boolean
}

const mockDevices: Device[] = [
  {
    id: "1",
    name: "Chrome on macOS",
    type: "desktop",
    location: "Nairobi, KE",
    lastActive: "Current session",
    isCurrent: true,
  },
  {
    id: "2",
    name: "Safari on iPhone",
    type: "mobile",
    location: "Nairobi, KE",
    lastActive: "2 hours ago",
    isCurrent: false,
  },
  {
    id: "3",
    name: "Chrome on Windows",
    type: "desktop",
    location: "Mombasa, KE",
    lastActive: "1 day ago",
    isCurrent: false,
  },
]

function DeviceCard({ device }: { device: Device }) {
  const getIcon = () => {
    switch (device.type) {
      case "desktop":
        return <MonitorIcon className="size-4" />
      case "mobile":
        return <SmartphoneIcon className="size-4" />
      default:
        return <MonitorIcon className="size-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              {getIcon()}
            </div>
            <div>
              <CardTitle className="text-base">{device.name}</CardTitle>
              <CardDescription>{device.location}</CardDescription>
            </div>
          </div>
          {device.isCurrent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Current
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Last active: {device.lastActive}
          </p>
          {!device.isCurrent && (
            <Button variant="outline" size="sm" className="text-destructive">
              Sign Out
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function SecurityTab() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  return (
    <div className="space-y-6">
      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldIcon className="size-5 text-green-600" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircleIcon className="size-5 text-green-600" />
            <span className="font-medium">Your account is secure</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            All security features are enabled and your account is protected.
          </p>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyIcon className="size-5" />
            Password
          </CardTitle>
          <CardDescription>
            Change your password or reset it if you've forgotten it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Last changed</p>
                <p className="text-sm text-muted-foreground">30 days ago</p>
              </div>
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Password strength</p>
                <p className="text-sm text-muted-foreground">Strong</p>
              </div>
              <CheckCircleIcon className="size-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircleIcon className="size-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                2FA is enabled
              </p>
              <p className="text-xs text-green-700">
                Your account has an extra layer of protection
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <SmartphoneIcon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Authenticator App</p>
                  <p className="text-xs text-muted-foreground">
                    Use authenticator app for 2FA
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <SmartphoneIcon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">SMS</p>
                  <p className="text-xs text-muted-foreground">
                    Receive SMS codes for verification
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Sessions</CardTitle>
          <CardDescription>
            Manage devices that are signed into your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDevices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="text-destructive">
              Sign Out All Other Devices
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Login Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Login Alerts</CardTitle>
          <CardDescription>
            Get notified when someone signs into your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-alerts">Email Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive email for new sign-ins
              </p>
            </div>
            <Switch id="email-alerts" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-alerts">SMS Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive text message for new sign-ins
              </p>
            </div>
            <Switch id="sms-alerts" />
          </div>
        </CardContent>
      </Card>

      {/* Dangerous Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangleIcon className="size-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Disable Account</p>
              <p className="text-xs text-muted-foreground">
                Temporarily disable your account
              </p>
            </div>
            <Button variant="outline" className="text-destructive">
              Disable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
