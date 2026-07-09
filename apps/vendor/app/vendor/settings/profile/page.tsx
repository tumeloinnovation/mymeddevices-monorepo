'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Upload,
  Save,
  Loader2,
  Wallet,
  CreditCard
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useProfile } from '@/lib/api/hooks/useProfile';

export default function SettingsPage() {
  const { profile, loading, error, updateProfile } = useProfile();
  
  // Local state for profile inputs
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  
  // Payout details state
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  // Sync profile values when loaded
  useEffect(() => {
    if (profile) {
      setStoreName(profile.store_name || '');
      setDescription(profile.description || '');
      setBusinessEmail(profile.business_email || '');
      setBusinessPhone(profile.business_phone || '');
      setMpesaPhone(profile.mpesa_phone || '');
      setBankAccountNumber(profile.bank_account_number || '');
      setBankName(profile.bank_name || '');
      setBankAccountName(profile.bank_account_name || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const success = await updateProfile({
        store_info: {
          store_name: storeName,
          store_description: description,
          business_email: businessEmail,
          business_phone: businessPhone,
        },
        payment_details: {
          mpesa_phone: mpesaPhone || undefined,
          bank_account_number: bankAccountNumber || undefined,
          bank_name: bankName || undefined,
          bank_account_name: bankAccountName || undefined,
        }
      });
      if (success) {
        toast.success('Store settings updated successfully');
      } else {
        toast.error('Failed to update settings');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <h2 className="font-semibold">Failed to load settings</h2>
        <p className="text-sm">Please make sure you are logged in as a vendor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Profile Settings</h1>
        <p className="text-slate-500">Manage your store details, branding, and payout configurations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-border/50 shadow-xl shadow-foreground/5">
            <CardHeader className="border-b border-border/30">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-600" />
                Store Information
              </CardTitle>
              <CardDescription>Update your store branding and general details.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Store Logo</Label>
                  <div className="h-28 w-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-[10px] text-slate-500 font-medium text-center px-1">Upload (1:1)</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid gap-1.5">
                    <Label htmlFor="store-name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Store Name</Label>
                    <Input 
                      id="store-name" 
                      value={storeName} 
                      onChange={(e) => setStoreName(e.target.value)} 
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verification Status</Label>
                    <div className="flex items-center">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded uppercase">
                        {profile?.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="store-description" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Store Description</Label>
                <Textarea 
                  id="store-description" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers about your store..." 
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="support-email" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Business Contact Email</Label>
                <Input 
                  id="support-email" 
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)} 
                  className="h-11"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="support-phone" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Business Contact Phone</Label>
                <Input 
                  id="support-phone" 
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)} 
                  className="h-11"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 shadow-xl shadow-foreground/5">
            <CardHeader className="border-b border-border/30">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                Payout & Payment Details
              </CardTitle>
              <CardDescription>Setup your payout options to receive earnings.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* M-Pesa Setup */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  M-Pesa Payout
                </h3>
                <div className="grid gap-1.5">
                  <Label htmlFor="mpesa-phone" className="text-xs font-semibold uppercase tracking-wider text-slate-500">M-Pesa Phone Number</Label>
                  <Input 
                    id="mpesa-phone" 
                    placeholder="e.g. 0712345678"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)} 
                    className="h-11 font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">Mobile money payout will be sent to this number.</p>
                </div>
              </div>

              <hr className="border-border/50" />

              {/* Bank Account Setup */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Bank Account Payout
                </h3>
                
                <div className="grid gap-1.5">
                  <Label htmlFor="bank-name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bank Name</Label>
                  <Input 
                    id="bank-name" 
                    placeholder="e.g. Equity Bank, KCB"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)} 
                    className="h-11"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="bank-account-name" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account Holder Name</Label>
                  <Input 
                    id="bank-account-name" 
                    placeholder="Name matching bank records"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)} 
                    className="h-11"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="bank-account-number" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account Number</Label>
                  <Input 
                    id="bank-account-number" 
                    placeholder="Bank account number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)} 
                    className="h-11 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border/30">
        <Button 
          onClick={handleSaveProfile} 
          size="lg"
          className="bg-emerald-650 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/10 px-8 h-12"
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Save Profile & Payout Details
        </Button>
      </div>
    </div>
  );
}
