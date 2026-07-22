'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuthStore } from '@mymeddevices/shared-core';
import { useCustomerProfile, useUpdateCustomerProfile, useUploadAvatar } from '@/lib/hooks/useDashboard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileFormData } from '@/lib/data/profile-validation';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Camera, Loader2, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const formVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  },
};

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
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      phone: '',
    },
    mode: 'onBlur', // Validate on blur for better UX
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

  const getInitial = (name: string | undefined) =>
    name ? name[0].toUpperCase() : '';

  const initials = user
    ? (getInitial(form.watch('firstName') || user.firstName) +
        getInitial(form.watch('lastName') || user.lastName)) || 'U'
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

      // Reset success animation after 2 seconds
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

    // Show preview
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
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Unsaved changes warning */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
            >
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You have unsaved changes. Don't forget to save!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar section */}
        <motion.div
          variants={formVariants.item}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-4"
        >
          <div
            className="relative group cursor-pointer"
            onClick={handleAvatarClick}
          >
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview || avatarUrl} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {isUploadingAvatar && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40"
                >
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </motion.div>
              )}
              {!isUploadingAvatar && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity"
                >
                  <Camera className="h-6 w-6 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <p className="font-medium">
              {form.watch('displayName') ||
                [form.watch('firstName'), form.watch('lastName')]
                  .filter(Boolean)
                  .join(' ') || 'User'}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click avatar to change photo
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </motion.div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <motion.div
              variants={formVariants.container}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <motion.div variants={formVariants.item}>
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          className={cn(
                            form.formState.errors.firstName &&
                              'border-destructive focus-visible:ring-destructive'
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={formVariants.item}>
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          {...field}
                          className={cn(
                            form.formState.errors.lastName &&
                              'border-destructive focus-visible:ring-destructive'
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={formVariants.item} className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        This is how your name appears on your account
                      </p>
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                variants={formVariants.item}
                className="md:col-span-2"
              >
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Email cannot be changed. Contact support if needed.
                </p>
              </motion.div>

              <motion.div variants={formVariants.item} className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <PhoneInput
                        id="phone"
                        label="Phone Number"
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.phone?.message}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Used for order updates and delivery notifications
                      </p>
                    </FormItem>
                  )}
                />
              </motion.div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              variants={formVariants.item}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3 pt-4 border-t"
            >
              <Button
                type="submit"
                className="gap-2"
                disabled={!form.formState.isDirty || form.formState.isSubmitting || updateProfile.isPending}
              >
                {form.formState.isSubmitting || updateProfile.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : showSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handleCancel}
                disabled={form.formState.isSubmitting || updateProfile.isPending || !form.formState.isDirty}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </motion.div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
