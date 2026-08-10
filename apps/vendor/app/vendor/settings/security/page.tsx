'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  Check, 
  X, 
  Smartphone, 
  Laptop, 
  Globe, 
  AlertCircle,
  LogOut,
  ShieldAlert,
  History,
  CheckCircle2,
  Shield,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@mymeddevices/shared-core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SecuritySettingsPage() {
  const { changePassword } = useAuthStore();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [authMethod, setAuthMethod] = useState<'sms' | 'email'>('email');
  const [sessions, setSessions] = useState([
    { id: 's1', browser: 'Chrome on macOS (Nairobi, KE)', ip: '197.232.48.12', lastActive: 'Active Now', current: true, device: 'desktop' },
    { id: 's2', browser: 'Safari on iOS 18 (Nairobi, KE)', ip: '197.232.48.99', lastActive: '2 hours ago', current: false, device: 'mobile' },
    { id: 's3', browser: 'Firefox on Ubuntu (Mombasa, KE)', ip: '41.203.220.5', lastActive: '3 days ago', current: false, device: 'desktop' },
  ]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: standardSchemaResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword') || '';

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    if (pass.length >= 8) score += 20;
    if (pass.length >= 12) score += 10;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[a-z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 15;
    if (/[^A-Za-z0-9]/.test(pass)) score += 15;

    if (score < 40) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' };
    if (score < 70) return { score, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-600' };
    if (score < 90) return { score, label: 'Strong', color: 'bg-blue-500', textColor: 'text-blue-600' };
    return { score, label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
  };

  const strength = getPasswordStrength(newPasswordValue);

  const requirements = [
    { label: 'At least 8 characters long', met: newPasswordValue.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(newPasswordValue) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(newPasswordValue) },
    { label: 'One number (0-9)', met: /[0-9]/.test(newPasswordValue) },
    { label: 'One special character (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(newPasswordValue) },
  ];

  const onSubmit = async (data: PasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await changePassword({
        old_password: data.currentPassword,
        new_password: data.newPassword,
      });
      toast.success('Password updated successfully! Please use your new password next time you log in.');
      reset();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle2FA = () => {
    const nextState = !twoFactorEnabled;
    setTwoFactorEnabled(nextState);
    if (nextState) {
      toast.success('Two-Factor Authentication (2FA) has been enabled for your vendor store.');
    } else {
      toast.info('Two-Factor Authentication (2FA) disabled.');
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
    toast.success('Session revoked successfully.');
  };

  const handleRevokeAllOtherSessions = () => {
    setSessions(sessions.filter((s) => s.current));
    toast.success('All other active sessions have been logged out.');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security & Password</h1>
        <p className="text-slate-500">Manage your vendor password, two-factor authentication, and active store sessions.</p>
      </div>

      {/* Security Tabs Container */}
      <Tabs defaultValue="password" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          <TabsTrigger value="password" className="gap-2 text-xs font-semibold">
            <KeyRound className="h-4 w-4" />
            Password
          </TabsTrigger>
          <TabsTrigger value="2fa" className="gap-2 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            2FA Security
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2 text-xs font-semibold">
            <Globe className="h-4 w-4" />
            Active Sessions
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Password Management (1 Row, 2 Columns) */}
        <TabsContent value="password">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Password Change Form */}
            <Card className="border-border/50 shadow-xl shadow-foreground/5">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-emerald-600" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your vendor account password to protect store access.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                        {...register('currentPassword')}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        {...register('newPassword')}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Password Strength Meter */}
                  {newPasswordValue.length > 0 && (
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Password Strength</span>
                        <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <div className="space-y-1 pt-1">
                        {requirements.map((req, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                            {req.met ? (
                              <Check className="h-3 w-3 text-emerald-500 font-bold shrink-0" />
                            ) : (
                              <X className="h-3 w-3 text-slate-400 shrink-0" />
                            )}
                            <span className={req.met ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        {...register('confirmPassword')}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Column 2: Password Security Policy & Best Practices */}
            <Card className="border-border/50 shadow-xl shadow-foreground/5 flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    Vendor Account Guidelines
                  </CardTitle>
                  <CardDescription>Best practices for maintaining vendor portal access and data safety.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      Strong Password Enforcement
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                      Your vendor password controls store payouts, order updates, and inventory changes. Use a unique password not shared across other websites.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Checkpoints</h4>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>Never share store credentials with external employees or third-party agencies.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>Update passwords immediately if you suspect unauthorized activity or device loss.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>Changing your password automatically revokes active refresh tokens across secondary devices.</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </div>
              <div className="p-6 pt-0 border-t border-border/20 mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 pt-4">
                  <span>Last Password Change</span>
                  <Badge variant="outline" className="font-mono text-[11px]">30 days ago</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Two-Factor Authentication (1 Row, 2 Columns) */}
        <TabsContent value="2fa">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: 2FA Settings & Verification Toggle */}
            <Card className="border-border/50 shadow-xl shadow-foreground/5">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Two-Factor Authentication (2FA)
                </CardTitle>
                <CardDescription>Require a verification code every time you sign in to your vendor dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="space-y-0.5 max-w-[75%]">
                    <p className="font-semibold text-sm">2FA Status</p>
                    <p className="text-xs text-slate-500">
                      {twoFactorEnabled ? 'Active — Your store account is protected with OTP verification.' : 'Disabled — Turn on 2FA for enhanced protection.'}
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={handleToggle2FA}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verification Channel</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('email')}
                      className={`p-3.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                        authMethod === 'email'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-medium'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">Email OTP</span>
                      <span className="text-[11px] text-slate-500">Code sent to registered business email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('sms')}
                      className={`p-3.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                        authMethod === 'sms'
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-medium'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">SMS Verification</span>
                      <span className="text-[11px] text-slate-500">Code sent via M-Pesa phone number</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Column 2: 2FA Benefits & Compliance Card */}
            <Card className="border-border/50 shadow-xl shadow-foreground/5">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-emerald-600" />
                  Marketplace Compliance Standard
                </CardTitle>
                <CardDescription>Why 2FA is recommended for medical equipment sellers.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                    Financial & Catalog Safeguard
                  </p>
                  <p className="leading-relaxed opacity-90">
                    Medical device vendors handle sensitive transaction payouts and regulated equipment inventory. 2FA prevents fraudulent store modifications or unauthorized withdrawal changes.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs p-2.5 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-500">Registered Phone</span>
                    <span className="font-medium font-mono">+254 7** *** 123</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2.5 rounded bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-500">Registered Business Email</span>
                    <span className="font-medium font-mono">vendor@mymeddevices.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Active Sessions (1 Row, 2 Columns) */}
        <TabsContent value="sessions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Active Signed-In Devices List */}
            <Card className="border-border/50 shadow-xl shadow-foreground/5">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-600" />
                  Active Devices & Sessions
                </CardTitle>
                <CardDescription>Devices currently authenticated in your vendor portal.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {sess.device === 'mobile' ? (
                          <Smartphone className="h-4 w-4" />
                        ) : (
                          <Laptop className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{sess.browser}</p>
                          {sess.current && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                              Current Device
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          IP: {sess.ip} • {sess.lastActive}
                        </p>
                      </div>
                    </div>
                    {!sess.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(sess.id)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-8"
                      >
                        <LogOut className="h-3.5 w-3.5 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Column 2: Session Actions & Security Controls */}
            <Card className="border-border/50 shadow-xl shadow-foreground/5 flex flex-col justify-between">
              <div>
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <History className="h-5 w-5 text-emerald-600" />
                    Session Management Controls
                  </CardTitle>
                  <CardDescription>Revoke access to signed-in devices if you lost a device or suspect compromised credentials.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      Global Logout Safeguard
                    </p>
                    <p className="leading-relaxed opacity-90">
                      If you notice unfamiliar locations or devices in your session log, click below to terminate all active store sessions except your current device.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={handleRevokeAllOtherSessions}
                      disabled={sessions.filter(s => !s.current).length === 0}
                      className="w-full text-xs font-semibold border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out All Other Devices ({sessions.filter(s => !s.current).length})
                    </Button>
                  </div>
                </CardContent>
              </div>
              <div className="p-6 pt-0 border-t border-border/20 mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 pt-4">
                  <span>Session Timeout Policy</span>
                  <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">24 Hours Inactive</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
