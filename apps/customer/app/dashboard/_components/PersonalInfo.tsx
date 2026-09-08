'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { PhoneInput } from '@/components/ui/phone-input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@mymeddevices/shared-core';
import { useCustomerProfile, useUpdateCustomerProfile, useUploadAvatar } from '@/lib/hooks/useDashboard';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { profileSchema, type ProfileFormData } from '@/lib/data/profile-validation';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  X,
  Camera,
  Loader2,
  Check,
  AlertTriangle,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function PersonalInfo() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { data: profile, isLoading: profileLoading } = useCustomerProfile();
  const updateProfile = useUpdateCustomerProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: standardSchemaResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      phone: '',
    },
    mode: 'onBlur',
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        displayName: user?.displayName || '',
        phone: profile.phone || '',
      });
      setHasUnsavedChanges(false);
    }
  }, [profile, user?.displayName, form]);

  // Track unsaved changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const getInitial = (name: string | undefined) => (name ? name[0].toUpperCase() : '');

  const initials = user
    ? (getInitial(form.watch('firstName') || user.firstName) +
        getInitial(form.watch('lastName') || user.lastName)) ||
      user.email?.[0]?.toUpperCase() ||
      'U'
    : 'U';

  const avatarUrl = user?.avatar_url || profile?.avatar_url;

  const handleSave = async (data: ProfileFormData) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const result = await updateProfile.mutateAsync({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
      });

      updateUser({
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.displayName || [data.firstName, data.lastName].filter(Boolean).join(' '),
        phone: data.phone,
        avatar_url: result.avatar_url || user.avatar_url,
      });

      setShowSuccess(true);
      toast.success('Profile updated successfully');
      setHasUnsavedChanges(false);

      setTimeout(() => setShowSuccess(false), 2000);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    if (profile) {
      form.reset({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        displayName: user?.displayName || '',
        phone: profile.phone || '',
      });
      setHasUnsavedChanges(false);
      setAvatarPreview(null);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploadingAvatar(true);
      const result = await uploadAvatar.mutateAsync(file);
      if (user) {
        updateUser({ avatar_url: result.avatar_url });
      }
      toast.success('Avatar updated successfully');
      setAvatarPreview(null);
    } catch {
      toast.error('Failed to upload avatar');
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (profileLoading) {
    return (
      <Card className="border border-border/80 shadow-xs rounded-2xl bg-card">
        <CardHeader className="p-6 border-b border-border/60 bg-muted/10">
          <CardTitle className="text-base font-bold">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
      <CardHeader className="p-6 border-b border-border/60 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
              <User className="h-5 w-5 text-primary" />
              <span>Personal & Contact Information</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Update your identification details, contact numbers, and public buyer name.
            </CardDescription>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto text-xs font-semibold px-2.5 py-0.5 border-primary/30 bg-primary/10 text-primary">
            Healthcare Account
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Unsaved changes warning alert */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-medium"
            >
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>You have unsaved changes. Remember to click <strong>Save Changes</strong> below.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-2xl bg-muted/20 border border-border/60">
          <div className="relative group cursor-pointer shrink-0 mx-auto sm:mx-0" onClick={handleAvatarClick}>
            <Avatar className="h-20 w-20 rounded-2xl border-2 border-border shadow-xs">
              <AvatarImage src={avatarPreview || avatarUrl} className="object-cover" />
              <AvatarFallback className="text-lg font-extrabold bg-primary/15 text-primary rounded-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {isUploadingAvatar ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 backdrop-blur-xs">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-2xs">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <h4 className="font-bold text-sm text-foreground">Profile Picture</h4>
            <p className="text-xs text-muted-foreground">
              Click the photo to upload your avatar or medical clinic badge. PNG, JPG or WebP up to 10MB.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="mt-2 h-7 rounded-lg text-xs font-semibold gap-1.5 border-border bg-card hover:bg-muted"
            >
              <Camera className="h-3 w-3 text-muted-foreground" />
              <span>Change Photo</span>
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        {/* Form Inputs */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-foreground">
                      First Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Dr. Jane"
                        {...field}
                        className={cn(
                          "rounded-xl h-10 text-xs bg-card border-border/80 focus-visible:ring-1",
                          form.formState.errors.firstName && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-foreground">
                      Last Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Mwangi"
                        {...field}
                        className={cn(
                          "rounded-xl h-10 text-xs bg-card border-border/80 focus-visible:ring-1",
                          form.formState.errors.lastName && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Display Name */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-foreground">
                        Display / Buyer Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Jane Mwangi (Nairobi West Clinic)"
                          {...field}
                          className="rounded-xl h-10 text-xs bg-card border-border/80 focus-visible:ring-1"
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Shown across order invoices, support tickets, and vendor reviews.
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              {/* Verified Email */}
              <div className="md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>Email Address</span>
                  </Label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Verified Account
                  </span>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted/50 rounded-xl h-10 text-xs text-muted-foreground border-border/60 cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Your primary authentication identity. Contact customer support if you need to transfer email ownership.
                </p>
              </div>

              {/* Phone Input */}
              <div className="md:col-span-2 space-y-1">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <PhoneInput
                        id="phone"
                        label="Delivery & M-Pesa Phone Number"
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.phone?.message}
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Utilized for Daraja M-Pesa STK push payments and courier delivery dispatch updates.
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
              <Button
                type="submit"
                disabled={!form.formState.isDirty || form.formState.isSubmitting || updateProfile.isPending}
                className="gap-2 rounded-xl text-xs font-semibold h-10 shadow-xs"
              >
                {form.formState.isSubmitting || updateProfile.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : showSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Changes Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={form.formState.isSubmitting || updateProfile.isPending || !form.formState.isDirty}
                className="gap-1.5 rounded-xl text-xs font-semibold h-10 border-border bg-card hover:bg-muted"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Cancel</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

