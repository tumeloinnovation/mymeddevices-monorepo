"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Building2, MapPin, CreditCard, Clock, Mail, Phone, Globe, CheckCircle2, XCircle, Ban, RotateCcw } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { vendorService, VendorProfileResponse, useAuthStore } from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const DAY_NAMES: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { approveVendor, rejectVendor, suspendVendor, reactivateVendor } = useAuthStore();

  const [profile, setProfile] = useState<VendorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [actionType, setActionType] = useState<"approve" | "reject" | "suspend" | "reactivate" | null>(null);
  const [actionReason, setActionReason] = useState("");

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await vendorService.getAdminProfile(id);
      setProfile(data);
    } catch {
      toast.error("Failed to load vendor profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!profile || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "approve") await approveVendor(profile.user_id);
      else if (actionType === "reject") await rejectVendor(profile.user_id, actionReason);
      else if (actionType === "suspend") await suspendVendor(profile.user_id, actionReason);
      else if (actionType === "reactivate") await reactivateVendor(profile.user_id);
      setActionType(null);
      setActionReason("");
      loadProfile();
    } catch {
      // handled by store toast
    } finally {
      setActionLoading(false);
    }
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

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground">
          <Building2 className="size-12 mx-auto mb-4" />
          <p>Vendor profile not found</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard/vendors">Back to Vendors</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusVariant = profile.approval_status === "approved" ? "default"
    : profile.approval_status === "pending" ? "outline"
    : profile.approval_status === "rejected" ? "destructive" : "secondary";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/vendors">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Vendor Profile</h1>
          <Badge variant={statusVariant}>{profile.approval_status}</Badge>
        </div>

        {profile.rejection_reason && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-destructive">Reason: {profile.rejection_reason}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-muted-foreground" />
                  <CardTitle>Store Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Store Name</p>
                    <p className="font-medium">{profile.store_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-medium">{profile.company_name || "—"}</p>
                  </div>
                </div>
                {profile.store_description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{profile.store_description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Business Email</p>
                      <p className="font-medium">{profile.business_email || profile.user_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{profile.business_phone || profile.user_phone || "—"}</p>
                    </div>
                  </div>
                </div>
                {profile.store_logo_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Store Logo</p>
                    <img src={profile.store_logo_url} alt="Store logo" className="h-16 w-auto border rounded" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="size-5 text-muted-foreground" />
                  <CardTitle>Physical Location</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">
                  {[profile.address_street, profile.address_city, profile.address_region]
                    .filter(Boolean).join(", ") || "No address provided"}
                </p>
                <p className="text-sm text-muted-foreground">Country: {profile.address_country}</p>
                {(profile.latitude && profile.longitude) && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Coordinates: {profile.latitude}, {profile.longitude}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <Globe className="size-3" /> View on Google Maps
                    </a>
                  </div>
                )}
                {profile.place_id && (
                  <p className="text-xs text-muted-foreground">Place ID: {profile.place_id}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="size-5 text-muted-foreground" />
                  <CardTitle>Payment Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">M-Pesa</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{profile.mpesa_phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Business Name</p>
                      <p className="font-medium">{profile.mpesa_business_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Till Number</p>
                      <p className="font-medium">{profile.mpesa_till_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Paybill Number</p>
                      <p className="font-medium">{profile.mpesa_paybill_number || "—"}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Bank Account</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Account Name</p>
                      <p className="font-medium">{profile.bank_account_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Number</p>
                      <p className="font-medium">{profile.bank_account_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{profile.bank_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Branch</p>
                      <p className="font-medium">{profile.bank_branch || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">SWIFT Code</p>
                      <p className="font-medium">{profile.bank_swift_code || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IBAN</p>
                      <p className="font-medium">{profile.bank_iban || "—"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {profile.business_hours && Object.keys(profile.business_hours).length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="size-5 text-muted-foreground" />
                    <CardTitle>Business Hours</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(profile.business_hours as Record<string, { open: string; close: string }>).map(([day, hours]) => (
                      <div key={day} className="flex justify-between py-1 border-b last:border-0">
                        <span className="capitalize font-medium">{DAY_NAMES[day] || day}</span>
                        <span className="text-muted-foreground">{hours.open} - {hours.close}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.user_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.user_phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Verified</p>
                  <p className="font-medium">{profile.is_verified ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">VAT Number</p>
                  <p className="font-medium">{profile.vat_number || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registered</p>
                  <p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
                {profile.approved_at && (
                  <div>
                    <p className="text-muted-foreground">Approved</p>
                    <p className="font-medium">{new Date(profile.approved_at).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.approval_status === "pending" && (
                  <>
                    <Button className="w-full" onClick={() => setActionType("approve")}>
                      <CheckCircle2 className="size-4 mr-2" /> Approve
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={() => setActionType("reject")}>
                      <XCircle className="size-4 mr-2" /> Reject
                    </Button>
                  </>
                )}
                {profile.approval_status === "approved" && (
                  <Button variant="secondary" className="w-full" onClick={() => setActionType("suspend")}>
                    <Ban className="size-4 mr-2" /> Suspend
                  </Button>
                )}
                {profile.approval_status === "suspended" && (
                  <Button className="w-full" onClick={() => setActionType("reactivate")}>
                    <RotateCcw className="size-4 mr-2" /> Reactivate
                  </Button>
                )}
                {profile.approval_status === "rejected" && (
                  <Button className="w-full" onClick={() => setActionType("approve")}>
                    <CheckCircle2 className="size-4 mr-2" /> Approve
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!actionType} onOpenChange={open => !open && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Vendor"}
              {actionType === "reject" && "Reject Vendor"}
              {actionType === "suspend" && "Suspend Vendor"}
              {actionType === "reactivate" && "Reactivate Vendor"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && `Approve ${profile?.company_name || profile?.store_name}?`}
              {actionType === "reject" && `Reject ${profile?.company_name || profile?.store_name}?`}
              {actionType === "suspend" && `Suspend ${profile?.company_name || profile?.store_name}?`}
              {actionType === "reactivate" && `Reactivate ${profile?.company_name || profile?.store_name}?`}
            </DialogDescription>
          </DialogHeader>
          {(actionType === "reject" || actionType === "suspend") && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                placeholder="Provide a reason..."
                className="h-20"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={actionLoading || ((actionType === "reject" || actionType === "suspend") && !actionReason)}
            >
              {actionLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
              {actionType === "approve" && "Approve"}
              {actionType === "reject" && "Reject"}
              {actionType === "suspend" && "Suspend"}
              {actionType === "reactivate" && "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
