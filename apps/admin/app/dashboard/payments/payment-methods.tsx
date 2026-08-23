"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Smartphone,
  CreditCard,
  Building2,
  Truck,
  Power,
  PowerOff,
  Trash2,
  Loader2,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { apiClient } from "@mymeddevices/shared-core";

interface PaymentMethod {
  id: string;
  name: string;
  provider: string;
  description: string | null;
  is_enabled: boolean;
  is_default: boolean;
  status: string;
  mpesa_shortcode: string | null;
  mpesa_business_name: string | null;
  mpesa_environment: string;
  fee_type: string;
  fee_value: number;
  fee_min: number;
  fee_max: number | null;
  min_amount: number;
  max_amount: number;
  display_order: number;
  created_at: string;
}

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm-mpesa-stk",
    name: "M-Pesa STK Push (Express)",
    provider: "mpesa",
    description: "Instant mobile money payment via Safaricom Daraja STK Push prompt.",
    is_enabled: true,
    is_default: true,
    status: "active",
    mpesa_shortcode: "174379",
    mpesa_business_name: "MyMedDevices Kenya",
    mpesa_environment: "sandbox",
    fee_type: "fixed",
    fee_value: 0,
    fee_min: 0,
    fee_max: null,
    min_amount: 10,
    max_amount: 150000,
    display_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "pm-mpesa-paybill",
    name: "M-Pesa Manual Paybill",
    provider: "mpesa",
    description: "Manual paybill payment with transaction code verification for high-value orders.",
    is_enabled: true,
    is_default: false,
    status: "active",
    mpesa_shortcode: "888999",
    mpesa_business_name: "MyMedDevices Paybill",
    mpesa_environment: "production",
    fee_type: "fixed",
    fee_value: 0,
    fee_min: 0,
    fee_max: null,
    min_amount: 100,
    max_amount: 300000,
    display_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "pm-bank-wire",
    name: "Bank Wire / RTGS Transfer",
    provider: "bank_transfer",
    description: "Direct bank deposit for institutional B2B hospital procurement.",
    is_enabled: true,
    is_default: false,
    status: "active",
    mpesa_shortcode: null,
    mpesa_business_name: null,
    mpesa_environment: "production",
    fee_type: "fixed",
    fee_value: 0,
    fee_min: 0,
    fee_max: null,
    min_amount: 5000,
    max_amount: 5000000,
    display_order: 3,
    created_at: new Date().toISOString(),
  },
];

export default function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    provider: "mpesa",
    description: "",
    is_enabled: true,
    is_default: false,
    status: "active",
    mpesa_shortcode: "",
    mpesa_business_name: "",
    mpesa_environment: "sandbox",
    fee_type: "percentage",
    fee_value: 0,
    fee_min: 0,
    fee_max: null as number | null,
    min_amount: 1,
    max_amount: 150000,
    display_order: 0,
  });

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any>("/shopping/mobile-money/methods").catch(() => null);
      if (data && data.payment_methods) {
        setMethods(data.payment_methods);
      } else {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('admin_payment_methods') : null;
        setMethods(stored ? JSON.parse(stored) : DEFAULT_PAYMENT_METHODS);
      }
    } catch {
      setMethods(DEFAULT_PAYMENT_METHODS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      provider: method.provider,
      description: method.description || "",
      is_enabled: method.is_enabled,
      is_default: method.is_default,
      status: method.status,
      mpesa_shortcode: method.mpesa_shortcode || "",
      mpesa_business_name: method.mpesa_business_name || "",
      mpesa_environment: method.mpesa_environment,
      fee_type: method.fee_type,
      fee_value: method.fee_value,
      fee_min: method.fee_min,
      fee_max: method.fee_max,
      min_amount: method.min_amount,
      max_amount: method.max_amount,
      display_order: method.display_order,
    });
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingMethod(null);
    setFormData({
      name: "",
      provider: "mpesa",
      description: "",
      is_enabled: true,
      is_default: false,
      status: "active",
      mpesa_shortcode: "",
      mpesa_business_name: "",
      mpesa_environment: "simulation",
      fee_type: "percentage",
      fee_value: 0,
      fee_min: 0,
      fee_max: null,
      min_amount: 1,
      max_amount: 150000,
      display_order: 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {

      if (editingMethod) {
        const updated = methods.map((m) =>
          m.id === editingMethod.id ? { ...m, ...formData } : m
        );
        setMethods(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_payment_methods', JSON.stringify(updated));
        }
        toast.success("Payment method updated");
      } else {
        const newMethod: PaymentMethod = {
          id: `pm-${Date.now()}`,
          ...formData,
          created_at: new Date().toISOString(),
        };
        const updated = [...methods, newMethod];
        setMethods(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_payment_methods', JSON.stringify(updated));
        }
        toast.success("Payment method created");
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save payment method:", error);
      toast.error("Failed to save payment method");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (method: PaymentMethod) => {
    try {
      const updated = methods.map((m) =>
        m.id === method.id ? { ...m, is_enabled: !m.is_enabled } : m
      );
      setMethods(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_payment_methods', JSON.stringify(updated));
      }
      toast.success(`Payment method ${!method.is_enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error("Failed to toggle payment method:", error);
      toast.error("Failed to update payment method");
    }
  };


  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "mpesa":
        return <Smartphone className="h-4 w-4 text-green-600" />;
      case "card":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "bank_transfer":
        return <Building2 className="h-4 w-4 text-purple-600" />;
      case "cash_on_delivery":
        return <Truck className="h-4 w-4 text-orange-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-muted-foreground">
            Configure payment methods and their processing rules.
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Method
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Methods</CardTitle>
          <CardDescription>
            Active and inactive payment methods available to customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : methods.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payment methods configured</h3>
              <p className="text-muted-foreground mb-4">
                Add a payment method to start accepting payments.
              </p>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getProviderIcon(method.provider)}
                          <div>
                            <div className="flex items-center gap-2">
                              {method.name}
                              {method.is_default && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            {method.description && (
                              <p className="text-xs text-muted-foreground">
                                {method.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{method.provider}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {method.is_enabled ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {method.fee_type === "percentage"
                          ? `${method.fee_value}%`
                          : `KES ${method.fee_value}`}
                        {method.fee_min > 0 && ` (min: KES ${method.fee_min})`}
                      </TableCell>
                      <TableCell>
                        KES {method.min_amount.toLocaleString()} - KES {method.max_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={method.mpesa_environment === "production" ? "default" : "secondary"}>
                          {method.mpesa_environment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(method)}
                          >
                            {method.is_enabled ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(method)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
            <DialogDescription>
              Configure payment method settings and processing rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Method Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., M-Pesa Express"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this payment method"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                <Label htmlFor="is_enabled" className="cursor-pointer">
                  Enabled
                </Label>
                <Switch
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                <Label htmlFor="is_default" className="cursor-pointer">
                  Default
                </Label>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>

              <div className="space-y-2 rounded-md border p-4">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="h-8"
                />
              </div>
            </div>

            {formData.provider === "mpesa" && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-green-600" />
                    M-Pesa Configuration
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mpesa_shortcode">Shortcode</Label>
                      <Input
                        id="mpesa_shortcode"
                        value={formData.mpesa_shortcode}
                        onChange={(e) => setFormData({ ...formData, mpesa_shortcode: e.target.value })}
                        placeholder="e.g., 174379"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mpesa_business_name">Business Name</Label>
                      <Input
                        id="mpesa_business_name"
                        value={formData.mpesa_business_name}
                        onChange={(e) => setFormData({ ...formData, mpesa_business_name: e.target.value })}
                        placeholder="e.g., MyMedDevices"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mpesa_environment">Environment</Label>
                      <Select
                        value={formData.mpesa_environment}
                        onValueChange={(value) => setFormData({ ...formData, mpesa_environment: value })}
                      >
                        <SelectTrigger id="mpesa_environment">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simulation">Simulation</SelectItem>
                          <SelectItem value="sandbox">Sandbox</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Fees & Limits
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee_type">Fee Type</Label>
                  <Select
                    value={formData.fee_type}
                    onValueChange={(value) => setFormData({ ...formData, fee_type: value })}
                  >
                    <SelectTrigger id="fee_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee_value">
                    Fee Value ({formData.fee_type === "percentage" ? "%" : "KES"})
                  </Label>
                  <Input
                    id="fee_value"
                    type="number"
                    step="0.01"
                    value={formData.fee_value}
                    onChange={(e) => setFormData({ ...formData, fee_value: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee_min">Minimum Fee (KES)</Label>
                  <Input
                    id="fee_min"
                    type="number"
                    step="0.01"
                    value={formData.fee_min}
                    onChange={(e) => setFormData({ ...formData, fee_min: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee_max">Maximum Fee (KES, optional)</Label>
                  <Input
                    id="fee_max"
                    type="number"
                    step="0.01"
                    value={formData.fee_max || ""}
                    onChange={(e) => setFormData({ ...formData, fee_max: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_amount">Minimum Transaction (KES)</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    step="0.01"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({ ...formData, min_amount: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_amount">Maximum Transaction (KES)</Label>
                  <Input
                    id="max_amount"
                    type="number"
                    step="0.01"
                  value={formData.max_amount}
                    onChange={(e) => setFormData({ ...formData, max_amount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMethod ? "Update" : "Create"} Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
