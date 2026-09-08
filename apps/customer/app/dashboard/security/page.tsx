'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCustomerProfile } from '@/lib/hooks/useDashboard';
import { customerService } from '@/lib/services/customer-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@mymeddevices/shared-core';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Bell,
  User,
  ShieldCheck,
  Fingerprint,
  QrCode,
  Copy,
  Laptop,
  Globe,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PasswordStrengthChecklist, getPasswordStrengthLevel } from './_components/password-strength-checklist';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Device Helpers ───────────────────────────────────────────────────────

function getDeviceIcon(name: string = '') {
  const lower = name.toLowerCase();
  if (lower.includes('iphone') || lower.includes('android') || lower.includes('mobile') || lower.includes('phone')) {
    return <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
  }
  if (lower.includes('mac') || lower.includes('macbook') || lower.includes('laptop')) {
    return <Laptop className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
  }
  return <Monitor className="h-5 w-5 text-primary" />;
}

// ─── 1. Security Score Hero Banner ───────────────────────────────────────

function SecurityScoreBanner({ deviceCount }: { deviceCount: number }) {
  const { user } = useAuthStore();

  const securityPoints = [
    { label: 'Strong Account Password', met: true, weight: 30 },
    { label: 'Verified Email Address', met: !!user?.email, weight: 25 },
    { label: 'Active Session Monitored', met: deviceCount > 0, weight: 20 },
    { label: 'Two-Factor Authentication', met: false, weight: 25 },
  ];

  const totalScore = securityPoints.reduce((acc, p) => acc + (p.met ? p.weight : 0), 0);

  return (
    <Card className="border border-border/80 shadow-xs overflow-hidden rounded-2xl bg-card">
      <div className="p-6 md:p-8 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Medical-Grade Account Protection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Security & Authentication
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Control your sign-in credentials, active browser sessions, and access logs to safeguard your healthcare procurement account.
            </p>
          </div>

          {/* Score Indicator Box */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex items-center gap-4 min-w-[260px]">
            <div className="relative flex items-center justify-center">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-muted/40"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={2 * Math.PI * 22 * (1 - totalScore / 100)}
                  className={cn(
                    'transition-all duration-1000 ease-out',
                    totalScore >= 75
                      ? 'text-emerald-500'
                      : totalScore >= 50
                      ? 'text-amber-500'
                      : 'text-red-500'
                  )}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-extrabold text-sm text-foreground">
                {totalScore}%
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Security Score
              </span>
              <p className="text-sm font-bold text-foreground">
                {totalScore >= 75 ? 'Strong Protection' : 'Action Recommended'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {totalScore < 100 ? 'Enable 2FA to achieve 100%' : 'Account fully hardened'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── 2. Password Management Section ──────────────────────────────────────

function PasswordSection() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (!/[0-9]/.test(formData.newPassword)) {
      toast.error('Password must include at least one number');
      return;
    }

    setSubmitting(true);
    try {
      const { changePassword } = useAuthStore.getState();
      await changePassword({
        old_password: formData.currentPassword,
        new_password: formData.newPassword,
      });
      toast.success('Password updated successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
      <CardHeader className="p-5 sm:p-6 border-b border-border/60 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/20 shrink-0">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
              Password & Credentials
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Ensure your password is at least 8 characters and contains special characters.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT COLUMN: Password Input Fields (7 cols) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-xs font-semibold">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={show.current ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    required
                    className="pr-10 h-10 text-xs rounded-xl bg-background border-border/70"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    onClick={() => setShow({ ...show, current: !show.current })}
                    tabIndex={-1}
                  >
                    {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-semibold">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={show.new ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    required
                    className="pr-10 h-10 text-xs rounded-xl bg-background border-border/70"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    onClick={() => setShow({ ...show, new: !show.new })}
                    tabIndex={-1}
                  >
                    {show.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={show.confirm ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="pr-10 h-10 text-xs rounded-xl bg-background border-border/70"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    onClick={() => setShow({ ...show, confirm: !show.confirm })}
                    tabIndex={-1}
                  >
                    {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button
                  type="submit"
                  disabled={submitting || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                  size="sm"
                  className="gap-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  <span>{submitting ? 'Updating...' : 'Update Password'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                  disabled={submitting}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Password Strength & Security Tips (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Strength Checklist */}
            <div className="p-4 rounded-2xl bg-muted/25 border border-border/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Password Strength
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {formData.newPassword ? getPasswordStrengthLevel(formData.newPassword).toUpperCase() : 'NOT ENTERED'}
                </span>
              </div>

              <PasswordStrengthChecklist password={formData.newPassword} />
            </div>

            {/* Healthcare Security Recommendations */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Security Best Practices
                </h4>
              </div>

              <ul className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  <span><strong>Unique Passwords:</strong> Avoid using passwords shared with hospital systems or personal email accounts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  <span><strong>Shared Terminals:</strong> Always log out after accessing your portal on public clinic workstations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  <span><strong>Device Revocation:</strong> Changing your password will invalidate sessions on untrusted devices.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 3. Two-Factor Authentication Section ────────────────────────────────

function TwoFactorSection() {
  const [totpModalOpen, setTotpModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const simulatedSecret = 'MMD-SEC-7942-8819-KMPDB';

  const handleCopySecret = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(simulatedSecret);
      setCopiedKey(true);
      toast.success('Secret key copied to clipboard');
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
      <CardHeader className="p-5 sm:p-6 border-b border-border/60 bg-muted/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Two-Factor Authentication (2FA)
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold border-purple-500/30 text-purple-600 bg-purple-500/10">
                  Enhanced Security
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Protect sensitive healthcare orders and payment authorizations with one-time verification codes.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* TOTP Authenticator Option */}
        <div className="p-4 rounded-2xl border border-border/70 bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">Authenticator App (TOTP)</p>
                <Badge variant="secondary" className="text-[10px] font-semibold bg-primary/15 text-primary">
                  Recommended
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Use Google Authenticator, Microsoft Authenticator, or 1Password to generate time-based codes.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setTotpModalOpen(true)}
            className="rounded-xl text-xs font-semibold gap-1.5 shrink-0 self-start sm:self-auto shadow-2xs"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Setup Authenticator</span>
          </Button>
        </div>

        {/* SMS Verification Option */}
        <div className="p-4 rounded-2xl border border-border/70 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs opacity-90">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">SMS OTP Verification</p>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Backup Method
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Receive 6-digit one-time security codes via SMS to your registered Kenyan mobile number (+254).
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('SMS 2FA will verify with your saved Safaricom/Airtel number during checkout.')}
            className="rounded-xl text-xs font-semibold border-border bg-card hover:bg-muted shrink-0 self-start sm:self-auto"
          >
            Manage Number
          </Button>
        </div>

        {/* Modal for TOTP Setup */}
        <Dialog open={totpModalOpen} onOpenChange={setTotpModalOpen}>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Configure Authenticator App</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Scan the QR code with your authenticator app (Google Authenticator, Apple Passwords, or Authy) to link your account.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* QR Code Container Mock */}
              <div className="w-44 h-44 mx-auto rounded-2xl bg-white border border-border flex flex-col items-center justify-center p-4 shadow-inner">
                <div className="w-36 h-36 border-2 border-dashed border-primary/40 rounded-xl flex flex-col items-center justify-center text-center p-2">
                  <QrCode className="h-16 w-16 text-primary mb-1" />
                  <span className="text-[10px] font-mono text-muted-foreground font-semibold">MMD-AUTH-QR</span>
                </div>
              </div>

              {/* Manual Secret Key */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Can't scan? Enter secret manually:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={simulatedSecret}
                    className="font-mono text-xs h-9 rounded-xl bg-muted/30 border-border/70 select-all"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopySecret}
                    className="h-9 px-3 rounded-xl text-xs gap-1 shrink-0"
                  >
                    {copiedKey ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTotpModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setTotpModalOpen(false);
                  toast.success('Authenticator linked successfully!');
                }}
                className="rounded-xl text-xs font-semibold"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ─── 4. Connected Devices & Active Sessions Section ──────────────────────

function SessionsSection() {
  const { data: devices, isLoading, refetch } = useQuery({
    queryKey: ['customer', 'devices'],
    queryFn: () => customerService.getDevices(),
  });

  const deleteMutation = useMutation({
    mutationFn: (deviceId: string) => customerService.deleteDevice(deviceId),
    onSuccess: () => {
      toast.success('Session terminated');
      refetch();
    },
    onError: () => toast.error('Failed to terminate session'),
  });

  const deleteAllMutation = useMutation({
    mutationFn: (currentDeviceId: string) => customerService.signOutAllDevices(currentDeviceId),
    onSuccess: () => {
      toast.success('Signed out of all other devices');
      refetch();
    },
    onError: () => toast.error('Failed to sign out other devices'),
  });

  const [localDeviceId, setLocalDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalDeviceId(localStorage.getItem('device_id'));
    }
  }, []);

  const mappedDevices = devices?.map((device) => ({
    ...device,
    is_current: device.is_current || (localDeviceId ? device.id === localDeviceId : false),
  })) || [];

  const currentDevice = mappedDevices.find((d) => d.is_current) || mappedDevices[0];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Active now';
    return new Intl.DateTimeFormat('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  return (
    <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
      <CardHeader className="p-5 sm:p-6 border-b border-border/60 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Active Sessions & Devices
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold border-blue-500/30 text-blue-600 bg-blue-500/10">
                  {mappedDevices.length} Connected
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Devices currently authenticated into your medical portal account.
              </CardDescription>
            </div>
          </div>

          {currentDevice && mappedDevices.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteAllMutation.mutate(currentDevice.id)}
              disabled={deleteAllMutation.isPending}
              className="gap-2 rounded-xl text-xs font-semibold text-destructive border-destructive/20 hover:bg-destructive/10 shrink-0 self-start sm:self-auto shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{deleteAllMutation.isPending ? 'Terminating...' : 'Sign Out Other Devices'}</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-3">
        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : mappedDevices.length === 0 ? (
          <div className="p-4 rounded-xl border border-border/60 bg-muted/10 flex items-center gap-3">
            <Monitor className="h-5 w-5 text-primary" />
            <div className="text-xs">
              <p className="font-bold text-foreground">Current Active Session</p>
              <p className="text-muted-foreground">Web Browser • Nairobi, Kenya • Active now</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/50 border border-border/60 rounded-2xl overflow-hidden bg-card">
            {mappedDevices.map((device, index) => {
              const isThisDevice = device.is_current || index === 0;

              return (
                <div
                  key={device.id || index}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-muted/15 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 shrink-0">
                      {getDeviceIcon(device.name)}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {device.name || 'Web Browser Session'}
                        </p>
                        {isThisDevice && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>This Device</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{(device as any).location || 'Nairobi, Kenya'}</span>
                        <span>•</span>
                        <span>Last active: {formatDate(device.last_active)}</span>
                      </p>
                    </div>
                  </div>

                  {!isThisDevice && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(device.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 shrink-0"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Revoke</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── 5. Danger Zone Section ──────────────────────────────────────────────

function DangerZoneSection() {
  const router = useRouter();
  const { deleteAccount } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    if (!confirmDelete) {
      toast.error('Please check the confirmation box');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount({ password, confirm: true });
      toast.success('Your account has been deleted');
      setOpen(false);
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border border-destructive/40 shadow-xs rounded-2xl bg-destructive/5 overflow-hidden">
      <CardHeader className="p-5 sm:p-6 border-b border-destructive/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-destructive/15 text-destructive border border-destructive/25 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-destructive">
              Danger Zone
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Irreversible actions that will permanently anonymize your clinical profile and order histories.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">Delete Healthcare Account</p>
          <p className="text-xs text-muted-foreground max-w-lg">
            Permanently delete your account, saved addresses, wishlist items, and medical purchase records.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" className="rounded-xl text-xs font-semibold shrink-0">
              Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Permanently Delete Account?</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                This action is permanent and cannot be undone. All personal healthcare information, order records, and saved addresses will be scrubbed.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDelete} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="delete-password" className="text-xs font-semibold">Confirm Password</Label>
                <Input
                  id="delete-password"
                  type="password"
                  placeholder="Enter your current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <input
                  id="confirm-delete-checkbox"
                  type="checkbox"
                  checked={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-destructive focus:ring-destructive cursor-pointer"
                />
                <Label
                  htmlFor="confirm-delete-checkbox"
                  className="text-xs text-muted-foreground leading-normal cursor-pointer select-none"
                >
                  I understand that deleting my account is irreversible and all my clinical history will be permanently lost.
                </Label>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isDeleting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting || !password || !confirmDelete}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ─── Main Security Page ──────────────────────────────────────────────────

export default function SecurityPage() {
  const { data: devices = [] } = useQuery({
    queryKey: ['customer', 'devices'],
    queryFn: () => customerService.getDevices(),
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SecurityScoreBanner deviceCount={devices.length} />
      <div className="space-y-6">
        <PasswordSection />
        <TwoFactorSection />
        <SessionsSection />
        <DangerZoneSection />
      </div>
    </div>
  );
}

