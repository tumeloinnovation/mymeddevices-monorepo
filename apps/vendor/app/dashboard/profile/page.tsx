"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, MapPin, Building2, CreditCard, Clock } from "lucide-react";
import {
  vendorService,
  VendorProfileResponse,
  VendorProfileUpdate,
  StoreInfoSchema,
  AddressSchema,
  PaymentDetailsSchema,
} from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function VendorProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<VendorProfileResponse | null>(null);

  const [storeInfo, setStoreInfo] = useState<StoreInfoSchema>({
    store_name: "",
    store_description: "",
    store_logo_url: "",
    business_email: "",
    business_phone: "",
  });
  const [address, setAddress] = useState<AddressSchema>({
    street: "",
    city: "",
    region: "",
    country: "KE",
    latitude: undefined,
    longitude: undefined,
    place_id: "",
  });
  const [payment, setPayment] = useState<PaymentDetailsSchema>({
    mpesa_phone: "",
    mpesa_business_name: "",
    mpesa_till_number: "",
    mpesa_paybill_number: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_name: "",
    bank_branch: "",
    bank_swift_code: "",
    bank_iban: "",
  });
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string }>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await vendorService.getMyProfile();
      setProfile(data);
      setStoreInfo({
        store_name: data.store_name || "",
        store_description: data.store_description || "",
        store_logo_url: data.store_logo_url || "",
        business_email: data.business_email || "",
        business_phone: data.business_phone || "",
      });
      setAddress({
        street: data.address_street || "",
        city: data.address_city || "",
        region: data.address_region || "",
        country: data.address_country || "KE",
        latitude: data.latitude,
        longitude: data.longitude,
        place_id: data.place_id || "",
      });
      setPayment({
        mpesa_phone: data.mpesa_phone || "",
        mpesa_business_name: data.mpesa_business_name || "",
        mpesa_till_number: data.mpesa_till_number || "",
        mpesa_paybill_number: data.mpesa_paybill_number || "",
        bank_account_name: data.bank_account_name || "",
        bank_account_number: data.bank_account_number || "",
        bank_name: data.bank_name || "",
        bank_branch: data.bank_branch || "",
        bank_swift_code: data.bank_swift_code || "",
        bank_iban: data.bank_iban || "",
      });
      if (data.business_hours) {
        setBusinessHours(data.business_hours as Record<string, { open: string; close: string }>);
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: VendorProfileUpdate = {
        store_info: storeInfo,
        address,
        payment_details: payment,
        operational_details: {
          business_hours: Object.keys(businessHours).length > 0 ? businessHours : undefined,
        },
      };
      await vendorService.updateMyProfile(updateData);
      toast.success("Profile updated successfully");
      loadProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const setBusinessHour = (day: string, field: "open" | "close", value: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day] ?? { open: "09:00", close: "17:00" }, [field]: value },
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const approvalStatus = profile?.approval_status || "pending";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Store Profile</h1>
            <Badge
              variant={
                approvalStatus === "approved" ? "default" :
                approvalStatus === "pending" ? "outline" :
                approvalStatus === "rejected" ? "destructive" : "secondary"
              }
            >
              {approvalStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your store branding, location, and payment details
          </p>
        </div>
        {approvalStatus !== "approved" && (
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            <Save className="size-4 mr-2" />
            Save Profile
          </Button>
        )}
      </div>

      {approvalStatus === "rejected" && profile?.rejection_reason && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive text-sm">Application Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{profile.rejection_reason}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Update your profile and it will be re-submitted for review.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="store"><Building2 className="size-4 mr-2" /> Store</TabsTrigger>
          <TabsTrigger value="address"><MapPin className="size-4 mr-2" /> Address</TabsTrigger>
          <TabsTrigger value="payment"><CreditCard className="size-4 mr-2" /> Payment</TabsTrigger>
          <TabsTrigger value="hours"><Clock className="size-4 mr-2" /> Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Your public store branding and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store_name">Store Name *</Label>
                <Input
                  id="store_name"
                  value={storeInfo.store_name}
                  onChange={e => setStoreInfo(prev => ({ ...prev, store_name: e.target.value }))}
                  placeholder="My Medical Store"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_description">Store Description</Label>
                <Textarea
                  id="store_description"
                  value={storeInfo.store_description || ""}
                  onChange={e => setStoreInfo(prev => ({ ...prev, store_description: e.target.value }))}
                  placeholder="Tell customers about your medical equipment store..."
                  className="h-24"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_logo_url">Store Logo URL</Label>
                <Input
                  id="store_logo_url"
                  value={storeInfo.store_logo_url || ""}
                  onChange={e => setStoreInfo(prev => ({ ...prev, store_logo_url: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    type="email"
                    value={storeInfo.business_email || ""}
                    onChange={e => setStoreInfo(prev => ({ ...prev, business_email: e.target.value }))}
                    placeholder="store@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_phone">Business Phone</Label>
                  <Input
                    id="business_phone"
                    value={storeInfo.business_phone || ""}
                    onChange={e => setStoreInfo(prev => ({ ...prev, business_phone: e.target.value }))}
                    placeholder="+254 712 345 678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Physical Location</CardTitle>
              <CardDescription>Your store or warehouse location with coordinates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={address.street || ""}
                  onChange={e => setAddress(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="123 Kenyatta Avenue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={address.city || ""}
                    onChange={e => setAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Nairobi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region / County</Label>
                  <Input
                    id="region"
                    value={address.region || ""}
                    onChange={e => setAddress(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="Nairobi County"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={address.country || "KE"}
                    onChange={e => setAddress(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="KE"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="place_id">Google Place ID</Label>
                  <Input
                    id="place_id"
                    value={address.place_id || ""}
                    onChange={e => setAddress(prev => ({ ...prev, place_id: e.target.value }))}
                    placeholder="ChIJ..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={address.latitude ?? ""}
                    onChange={e => setAddress(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="-1.2921"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={address.longitude ?? ""}
                    onChange={e => setAddress(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="36.8219"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>M-Pesa Details</CardTitle>
              <CardDescription>Mobile money payment information for payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa_phone">M-Pesa Phone</Label>
                  <Input
                    id="mpesa_phone"
                    value={payment.mpesa_phone || ""}
                    onChange={e => setPayment(prev => ({ ...prev, mpesa_phone: e.target.value }))}
                    placeholder="+254 712 345 678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mpesa_business_name">M-Pesa Business Name</Label>
                  <Input
                    id="mpesa_business_name"
                    value={payment.mpesa_business_name || ""}
                    onChange={e => setPayment(prev => ({ ...prev, mpesa_business_name: e.target.value }))}
                    placeholder="Business Name on M-Pesa"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa_till">Till Number</Label>
                  <Input
                    id="mpesa_till"
                    value={payment.mpesa_till_number || ""}
                    onChange={e => setPayment(prev => ({ ...prev, mpesa_till_number: e.target.value }))}
                    placeholder="123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mpesa_paybill">Paybill Number</Label>
                  <Input
                    id="mpesa_paybill"
                    value={payment.mpesa_paybill_number || ""}
                    onChange={e => setPayment(prev => ({ ...prev, mpesa_paybill_number: e.target.value }))}
                    placeholder="654321"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>Bank account information for direct deposits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account_name">Account Holder Name</Label>
                <Input
                  id="bank_account_name"
                  value={payment.bank_account_name || ""}
                  onChange={e => setPayment(prev => ({ ...prev, bank_account_name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={payment.bank_name || ""}
                    onChange={e => setPayment(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="Equity Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_branch">Branch</Label>
                  <Input
                    id="bank_branch"
                    value={payment.bank_branch || ""}
                    onChange={e => setPayment(prev => ({ ...prev, bank_branch: e.target.value }))}
                    placeholder="Nairobi CBD"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={payment.bank_account_number || ""}
                  onChange={e => setPayment(prev => ({ ...prev, bank_account_number: e.target.value }))}
                  placeholder="1234567890"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_swift">SWIFT Code</Label>
                  <Input
                    id="bank_swift"
                    value={payment.bank_swift_code || ""}
                    onChange={e => setPayment(prev => ({ ...prev, bank_swift_code: e.target.value }))}
                    placeholder="EQBLKENA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_iban">IBAN (if applicable)</Label>
                  <Input
                    id="bank_iban"
                    value={payment.bank_iban || ""}
                    onChange={e => setPayment(prev => ({ ...prev, bank_iban: e.target.value }))}
                    placeholder="KE12 3456 7890 1234 5678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>Set your store's operating hours (24-hour format)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map(day => (
                <div key={day} className="grid grid-cols-3 items-center gap-3 py-2 border-b last:border-0">
                  <Label className="capitalize font-medium">{day}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={businessHours[day]?.open || "09:00"}
                      onChange={e => setBusinessHour(day, "open", e.target.value)}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={businessHours[day]?.close || "17:00"}
                      onChange={e => setBusinessHour(day, "close", e.target.value)}
                      className="w-28"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          <Save className="size-4 mr-2" />
          Save Profile
        </Button>
      </div>
    </div>
    </DashboardLayout>
  );
}
