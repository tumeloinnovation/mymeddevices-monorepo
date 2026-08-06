"use client";

import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Send,
  CheckCircle2,
  Clock,
  Smartphone,
  BarChart3,
  Sparkles,
  Trash2,
  Copy,
  Zap,
  PhoneCall,
  CheckCheck,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface SMSBroadcast {
  id: string;
  sender_id: string;
  segment: string;
  message: string;
  recipients_count: number;
  delivery_rate: number;
  status: "delivered" | "scheduled" | "sending" | "failed";
  sent_at?: string;
  cost_ksh: number;
}

const INITIAL_SMS_BROADCASTS: SMSBroadcast[] = [
  {
    id: "sms-1",
    sender_id: "MEDDEVICES",
    segment: "Nairobi Metropolitan Clinics",
    message: "FLASH DEAL: Get 20% off all PPB-certified pulse oximeters & patient monitors today on MyMedDevices. Order via M-Pesa: mymeddevices.co.ke/flash",
    recipients_count: 850,
    delivery_rate: 98.4,
    status: "delivered",
    sent_at: "2026-08-04 02:15 PM",
    cost_ksh: 680,
  },
  {
    id: "sms-2",
    sender_id: "MEDDEVICES",
    segment: "Verified Medical Vendors",
    message: "IMPORTANT: Upload your KMPDB license renewals before Aug 15 to keep your vendor store active. Support: 0700-123-456",
    recipients_count: 320,
    delivery_rate: 99.1,
    status: "delivered",
    sent_at: "2026-08-02 11:00 AM",
    cost_ksh: 256,
  },
  {
    id: "sms-3",
    sender_id: "MEDDEVICES",
    segment: "County Hospital Procurement Officers",
    message: "New shipment of Oxygen Concentrators & ICU Beds arrived. Fast delivery across all 47 counties. View catalog: mymeddevices.co.ke/icu",
    recipients_count: 410,
    delivery_rate: 97.6,
    status: "delivered",
    sent_at: "2026-07-28 09:30 AM",
    cost_ksh: 328,
  },
];

export default function SMSMarketingPage() {
  const [broadcasts, setBroadcasts] = useState<SMSBroadcast[]>(INITIAL_SMS_BROADCASTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    sender_id: "MEDDEVICES",
    segment: "Nairobi Metropolitan Clinics",
    message: "",
    test_phone: "",
  });

  const filteredBroadcasts = broadcasts.filter(
    (b) =>
      b.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.segment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSentSMS = broadcasts.reduce((sum, b) => sum + b.recipients_count, 0);
  const totalCost = broadcasts.reduce((sum, b) => sum + b.cost_ksh, 0);
  const avgDelivery = (
    broadcasts.reduce((sum, b) => sum + b.delivery_rate, 0) / (broadcasts.length || 1)
  ).toFixed(1);

  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error("SMS message content cannot be empty");
      return;
    }

    const recipientEstimate = 650;
    const newBroadcast: SMSBroadcast = {
      id: `sms-${Date.now()}`,
      sender_id: formData.sender_id,
      segment: formData.segment,
      message: formData.message,
      recipients_count: recipientEstimate,
      delivery_rate: 99.0,
      status: "delivered",
      sent_at: new Date().toLocaleString(),
      cost_ksh: recipientEstimate * 0.8,
    };

    setBroadcasts([newBroadcast, ...broadcasts]);
    setIsModalOpen(false);
    toast.success(`SMS broadcast sent to ${recipientEstimate} recipients!`);
    setFormData({
      sender_id: "MEDDEVICES",
      segment: "Nairobi Metropolitan Clinics",
      message: "",
      test_phone: "",
    });
  };

  const charCount = formData.message.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SMS Marketing & Broadcast Alerts</h1>
            <p className="text-muted-foreground text-sm">
              Send SMS notifications, promotional blasts, and restock alerts to Kenyan healthcare providers.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Compose SMS Broadcast
          </Button>
        </div>

        {/* Header Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total SMS Sent</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSentSMS.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Dispatched text messages</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Delivery Rate</CardTitle>
              <CheckCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{avgDelivery}%</div>
              <p className="text-xs text-muted-foreground mt-1">Safaricom & Airtel deliverability</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Spent</CardTitle>
              <Zap className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">KSh {totalCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Bulk SMS carrier costs</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">SMS Credit Balance</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">45,820</div>
              <p className="text-xs text-muted-foreground mt-1">Available SMS credits</p>
            </CardContent>
          </Card>
        </div>

        {/* Table & Filter */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search SMS message content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sender ID & Segment</TableHead>
                    <TableHead className="w-[40%]">Message Content</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Delivery Rate</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBroadcasts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No SMS broadcasts found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBroadcasts.map((sms) => (
                      <TableRow key={sms.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                            {sms.sender_id}
                          </Badge>
                          <div className="font-semibold text-xs text-foreground mt-1">{sms.segment}</div>
                          {sms.sent_at && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {sms.sent_at}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-mono text-foreground leading-relaxed line-clamp-2">
                            "{sms.message}"
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {sms.message.length} chars ({Math.ceil(sms.message.length / 160)} SMS segment)
                          </p>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {sms.recipients_count.toLocaleString()} phones
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {sms.delivery_rate}% Delivered
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">
                          KSh {sms.cost_ksh.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(sms.message);
                                  toast.success("SMS text copied to clipboard!");
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" /> Copy Text
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setBroadcasts((prev) => prev.filter((b) => b.id !== sms.id));
                                  toast.success("SMS record deleted");
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compose SMS Slide-over Sheet */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto p-6">
          <form onSubmit={handleSendSMS} className="space-y-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Smartphone className="h-5 w-5 text-primary" /> Compose Bulk SMS Broadcast
              </SheetTitle>
              <SheetDescription>
                Send SMS notifications to Kenyan medical contacts via Safaricom/Airtel gateway.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="sender_id">Sender ID Header</Label>
                <Select
                  value={formData.sender_id}
                  onValueChange={(val) => setFormData({ ...formData, sender_id: val })}
                >
                  <SelectTrigger id="sender_id">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEDDEVICES">MEDDEVICES (Approved Brand)</SelectItem>
                    <SelectItem value="MYMEDPRO">MYMEDPRO (B2B Supply)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment">Target Recipient Group</Label>
                <Select
                  value={formData.segment}
                  onValueChange={(val) => setFormData({ ...formData, segment: val })}
                >
                  <SelectTrigger id="segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nairobi Metropolitan Clinics">Nairobi Metropolitan Clinics</SelectItem>
                    <SelectItem value="County Hospital Procurement Officers">County Hospital Procurement Officers</SelectItem>
                    <SelectItem value="Verified Medical Vendors">Verified Medical Vendors</SelectItem>
                    <SelectItem value="All Registered Buyers">All Registered Buyers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="message">SMS Message Text *</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {charCount} / 160 chars ({smsCount} SMS)
                  </span>
                </div>
                <Textarea
                  id="message"
                  rows={5}
                  placeholder="e.g. FLASH SALE: 15% discount on all patient monitors. Order online: mymeddevices.co.ke"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 border-t pt-3">
                <Label htmlFor="test_phone" className="text-xs font-semibold">Test Single Phone Number (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="test_phone"
                    placeholder="e.g. +254712345678"
                    value={formData.test_phone}
                    onChange={(e) => setFormData({ ...formData, test_phone: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!formData.test_phone) {
                        toast.error("Please enter a phone number");
                        return;
                      }
                      toast.success(`Test SMS dispatched to ${formData.test_phone}!`);
                    }}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                <Send className="mr-2 h-4 w-4" /> Dispatch Broadcast
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
