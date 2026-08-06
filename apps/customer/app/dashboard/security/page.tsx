'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useCustomerProfile, useUpdateCustomerProfile } from '@/lib/hooks/useDashboard'
import { customerService } from '@/lib/services/customer-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@mymeddevices/shared-core'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Shield,
  Key,
  Smartphone,
  Monitor,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  X,
  LogOut,
} from 'lucide-react'
import { toast } from 'sonner'
import { PasswordStrengthChecklist } from './_components/password-strength-checklist'
import { SecurityScoreWidget } from './_components/security-score-widget'

// ─── Types ───────────────────────────────────────────────────────────────

interface Device {
  id: string
  name: string
  type: 'desktop' | 'mobile' | 'tablet'
  location: string
  lastActive: string
  isCurrent: boolean
}

// ─── Device Icon ─────────────────────────────────────────────────────────

function DeviceIcon({ type }: { type: 'desktop' | 'mobile' | 'tablet' }) {
  switch (type) {
    case 'desktop':
      return <Monitor className="size-4" />
    case 'mobile':
      return <Smartphone className="size-4" />
    default:
      return <Monitor className="size-4" />
  }
}

// ─── Password Section ────────────────────────────────────────────────────

function PasswordSection() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (!/[0-9]/.test(formData.newPassword)) {
      toast.error('Password must include at least one number')
      return
    }
    setSubmitting(true)
    try {
      const { changePassword } = useAuthStore.getState()
      await changePassword({
        old_password: formData.currentPassword,
        new_password: formData.newPassword,
      })
      toast.success('Password updated successfully')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update password'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="size-5 text-muted-foreground" />
          Password
        </CardTitle>
        <CardDescription>Change your password or reset it if you have forgotten it</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={show.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShow({ ...show, current: !show.current })}
              >
                {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={show.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShow({ ...show, new: !show.new })}
              >
                {show.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.newPassword && (
              <PasswordStrengthChecklist password={formData.newPassword} />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={show.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShow({ ...show, confirm: !show.confirm })}
              >
                {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t mt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              {submitting ? 'Saving...' : 'Update Password'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
              }
              disabled={submitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Two-Factor Section ──────────────────────────────────────────────────

function TwoFactorSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Smartphone className="size-5 text-muted-foreground" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
          <Shield className="size-5 text-blue-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">MFA is under development</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Two-Factor Authentication is coming soon to secure your medical credentials.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 opacity-70">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Smartphone className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Authenticator App</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Use authenticator app for 2FA</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>Configure</Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Smartphone className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">SMS Codes</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Receive SMS codes for verification</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>Enable</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Active Sessions Section ─────────────────────────────────────────────

function SessionsSection() {
  const { data: devices, isLoading, refetch } = useQuery({
    queryKey: ['customer', 'devices'],
    queryFn: () => customerService.getDevices(),
  })
  const deleteMutation = useMutation({
    mutationFn: (deviceId: string) => customerService.deleteDevice(deviceId),
    onSuccess: () => {
      refetch()
    },
  })
  const deleteAllMutation = useMutation({
    mutationFn: (currentDeviceId: string) => customerService.signOutAllDevices(currentDeviceId),
    onSuccess: () => {
      refetch()
    },
  })

  const [localDeviceId, setLocalDeviceId] = useState<string | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalDeviceId(localStorage.getItem('device_id'))
    }
  }, [])

  const mappedDevices = devices?.map((device) => ({
    ...device,
    is_current: device.is_current || (localDeviceId ? device.id === localDeviceId : false),
  }))

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    return new Intl.DateTimeFormat('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString))
  }

  // Assume the current device is the one with is_current: true
  const currentDevice = mappedDevices?.find(d => d.is_current)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Monitor className="size-5 text-muted-foreground" />
          Active Sessions
        </CardTitle>
        <CardDescription>Manage devices that are signed into your account</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          mappedDevices?.map((device) => (
            <div key={device.id} className="flex items-start justify-between p-3 border rounded-lg hover:border-accent transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <DeviceIcon type={device.name?.toLowerCase().includes('mobile') || device.name?.toLowerCase().includes('phone') ? 'mobile' : 'desktop'} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{device.name || 'Unknown Device'}</p>
                    {device.is_current && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Last active: {formatDate(device.last_active)}</p>
                </div>
              </div>
              {!device.is_current && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate(device.id)}
                  disabled={deleteMutation.isPending}
                >
                  <LogOut className="mr-2 h-3 w-3" />
                  {deleteMutation.isPending ? '...' : 'Sign Out'}
                </Button>
              )}
            </div>
          ))
        )}
        {currentDevice && mappedDevices && mappedDevices.length > 1 && (
          <div className="pt-2">
            <Button 
              variant="outline" 
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={() => deleteAllMutation.mutate(currentDevice.id)}
              disabled={deleteAllMutation.isPending}
            >
              {deleteAllMutation.isPending ? 'Signing out...' : 'Sign Out All Other Devices'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Login Alerts Section ────────────────────────────────────────────────

function LoginAlertsSection() {
  const { data: profile, isLoading } = useCustomerProfile()
  const updateMutation = useUpdateCustomerProfile()

  const emailAlerts = profile?.email_security ?? true
  const smsAlerts = profile?.sms_security ?? true

  const toggleEmailAlerts = async (checked: boolean) => {
    try {
      await updateMutation.mutateAsync({ email_security: checked })
      toast.success(checked ? 'Email alerts enabled' : 'Email alerts disabled')
    } catch {
      toast.error('Failed to update alert settings')
    }
  }

  const toggleSmsAlerts = async (checked: boolean) => {
    try {
      await updateMutation.mutateAsync({ sms_security: checked })
      toast.success(checked ? 'SMS alerts enabled' : 'SMS alerts disabled')
    } catch {
      toast.error('Failed to update alert settings')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Login Alerts</CardTitle>
          <CardDescription>Get notified when someone signs into your account</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Login Alerts</CardTitle>
        <CardDescription>Get notified when someone signs into your account</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/5 transition-colors">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="email-alerts" className="font-medium cursor-pointer">Email Alerts</Label>
            <p className="text-xs text-muted-foreground">Receive email for new sign-ins</p>
          </div>
          <Switch
            id="email-alerts"
            checked={emailAlerts}
            onCheckedChange={toggleEmailAlerts}
          />
        </div>
        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/5 transition-colors">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="sms-alerts" className="font-medium cursor-pointer">SMS Alerts</Label>
            <p className="text-xs text-muted-foreground">Receive text message for new sign-ins</p>
          </div>
          <Switch
            id="sms-alerts"
            checked={smsAlerts}
            onCheckedChange={toggleSmsAlerts}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Danger Zone Section ─────────────────────────────────────────────────

function DangerZoneSection() {
  const router = useRouter()
  const { deleteAccount } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      toast.error('Please enter your password')
      return
    }
    if (!confirmDelete) {
      toast.error('Please confirm you want to delete your account')
      return
    }

    setIsDeleting(true)
    try {
      await deleteAccount({ password, confirm: true })
      toast.success('Your account has been deleted successfully')
      setOpen(false)
      router.push('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-base text-destructive flex items-center gap-2">
          <AlertTriangle className="size-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>Irreversible actions that affect your account</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
          <div>
            <p className="text-sm font-medium text-destructive">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all associated data</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="bg-destructive hover:bg-destructive/90">
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="size-5" />
                  Delete Account permanently?
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  This action is irreversible. All of your personal medical profiles, addresses, prescriptions, and order history will be permanently anonymized.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDelete} className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="delete-password">Confirm Password</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    placeholder="Enter your current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-muted/50 rounded-lg">
                  <input
                    id="confirm-delete-checkbox"
                    type="checkbox"
                    checked={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.checked)}
                    className="mt-1 size-4 rounded border-gray-300 text-destructive focus:ring-destructive cursor-pointer"
                  />
                  <Label
                    htmlFor="confirm-delete-checkbox"
                    className="text-xs font-normal text-muted-foreground leading-normal cursor-pointer select-none"
                  >
                    I confirm that I want to delete my account permanently and understand this cannot be undone.
                  </Label>
                </div>
                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false)
                      setPassword('')
                      setConfirmDelete(false)
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={isDeleting || !password || !confirmDelete}
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Security Page ──────────────────────────────────────────────────

export default function SecurityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Security</h1>
        <p className="text-muted-foreground mt-2">Manage your password and security settings.</p>
      </div>

      <SecurityScoreWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PasswordSection />
        <TwoFactorSection />
      </div>

      <SessionsSection />
      <LoginAlertsSection />
      <DangerZoneSection />
    </div>
  )
}
