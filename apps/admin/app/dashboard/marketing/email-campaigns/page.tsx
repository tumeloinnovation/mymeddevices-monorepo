"use client";

import { useState } from "react";
import {
  Mail,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Send,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  BarChart3,
  MousePointerClick,
  Sparkles,
  Trash2,
  Copy,
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

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  segment: string;
  template: string;
  status: "sent" | "scheduled" | "draft" | "sending";
  recipients_count: number;
  open_rate: number;
  click_rate: number;
  sent_at?: string;
  scheduled_for?: string;
}

const INITIAL_CAMPAIGNS: EmailCampaign[] = [
  {
    id: "camp-1",
    name: "Q3 KMPDB Certified Diagnostic Clearance",
    subject: "Exclusive 15% Off Diagnostic Tools for Registered Clinics",
    segment: "Registered Clinics & Hospitals",
    template: "Promotional Offer HTML",
    status: "sent",
    recipients_count: 1420,
    open_rate: 42.8,
    click_rate: 18.4,
    sent_at: "2026-08-01 10:30 AM",
  },
  {
    id: "camp-2",
    name: "M-Pesa Express Checkout Announcement",
    subject: "Faster Medical Procurement: Instant M-Pesa STK Push Now Live",
    segment: "All Healthcare Procurement Buyers",
    template: "Feature Launch Template",
    status: "sent",
    recipients_count: 3850,
    open_rate: 51.2,
    click_rate: 24.1,
    sent_at: "2026-07-20 09:00 AM",
  },
  {
    id: "camp-3",
    name: "August Vendor Stocking Incentive",
    subject: "List Your Medical Supplies & Get Zero Commission for 30 Days",
    segment: "Verified Vendors & Distributors",
    template: "Vendor Onboarding Blast",
    status: "scheduled",
    recipients_count: 480,
    open_rate: 0,
    click_rate: 0,
    scheduled_for: "2026-08-10 08:00 AM",
  },
  {
    id: "camp-4",
    name: "ICU Equipment Restock Digest",
    subject: "New Stock Arrival: Patient Monitors, Defibrillators & Ventilators",
    segment: "Hospitals & ICU Specialists",
    template: "Product Digest Template",
    status: "draft",
    recipients_count: 920,
    open_rate: 0,
    click_rate: 0,
  },
];

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>(INITIAL_CAMPAIGNS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<EmailCampaign | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    segment: "Registered Clinics & Hospitals",
    template: "Promotional Offer HTML",
    content: "Dear Healthcare Provider,\n\nWe are pleased to offer exclusive discounted rates on PPB-certified medical equipment this month...",
    scheduled_for: "",
  });

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSent = campaigns.filter((c) => c.status === "sent").length;
  const avgOpenRate = (
    campaigns.reduce((acc, c) => acc + c.open_rate, 0) / (totalSent || 1)
  ).toFixed(1);
  const avgClickRate = (
    campaigns.reduce((acc, c) => acc + c.click_rate, 0) / (totalSent || 1)
  ).toFixed(1);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject) {
      toast.error("Campaign name and subject are required");
      return;
    }

    const newCamp: EmailCampaign = {
      id: `camp-${Date.now()}`,
      name: formData.name,
      subject: formData.subject,
      segment: formData.segment,
      template: formData.template,
      status: formData.scheduled_for ? "scheduled" : "draft",
      recipients_count: 1250,
      open_rate: 0,
      click_rate: 0,
      scheduled_for: formData.scheduled_for || undefined,
    };

    setCampaigns([newCamp, ...campaigns]);
    setIsModalOpen(false);
    toast.success("Email campaign created successfully!");
    setFormData({
      name: "",
      subject: "",
      segment: "Registered Clinics & Hospitals",
      template: "Promotional Offer HTML",
      content: "",
      scheduled_for: "",
    });
  };

  const handleSendNow = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "sent", sent_at: new Date().toLocaleString() }
          : c
      )
    );
    toast.success("Campaign dispatch initiated!");
  };

  const handleDelete = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    toast.success("Campaign deleted");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Marketing & Blast Campaigns</h1>
            <p className="text-muted-foreground text-sm">
              Design, schedule, and send transactional & promotional email broadcasts to Kenya healthcare providers.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Button>
        </div>

        {/* Analytics Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaigns.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{totalSent} dispatched emails</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Avg Open Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{avgOpenRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Above healthcare benchmark</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Avg Click Rate</CardTitle>
              <MousePointerClick className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{avgClickRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Link engagement rate</p>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Subscribers</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">6,570</div>
              <p className="text-xs text-muted-foreground mt-1">Opted-in medical buyer emails</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaign name or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name & Subject</TableHead>
                    <TableHead>Recipient Segment</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Open / Click Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No email campaigns found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCampaigns.map((camp) => (
                      <TableRow key={camp.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-foreground">{camp.name}</div>
                          <p className="text-xs text-muted-foreground font-mono">{camp.subject}</p>
                          {camp.sent_at && (
                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Dispatched {camp.sent_at}
                            </p>
                          )}
                          {camp.scheduled_for && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Scheduled for {camp.scheduled_for}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {camp.segment}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {camp.recipients_count.toLocaleString()} emails
                        </TableCell>
                        <TableCell className="text-sm">
                          {camp.status === "sent" ? (
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold text-emerald-600">Open: {camp.open_rate}%</div>
                              <div className="text-xs text-blue-600">Click: {camp.click_rate}%</div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pending Dispatch</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {camp.status === "sent" && (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                              Sent
                            </Badge>
                          )}
                          {camp.status === "scheduled" && (
                            <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">
                              Scheduled
                            </Badge>
                          )}
                          {camp.status === "draft" && (
                            <Badge variant="secondary" className="text-muted-foreground">
                              Draft
                            </Badge>
                          )}
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
                              <DropdownMenuItem onClick={() => setPreviewCampaign(camp)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              {camp.status !== "sent" && (
                                <DropdownMenuItem onClick={() => handleSendNow(camp.id)}>
                                  <Send className="mr-2 h-4 w-4 text-emerald-500" /> Send Now
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(camp.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {/* Create Slide-over Sheet */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto p-6">
          <form onSubmit={handleCreateCampaign} className="space-y-6">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" /> Create Email Broadcast Campaign
              </SheetTitle>
              <SheetDescription>
                Compose a marketing or transactional email campaign for registered medical buyers.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="camp_name">Internal Campaign Name *</Label>
                <Input
                  id="camp_name"
                  placeholder="e.g. August ICU Equipment Special"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment">Target Segment</Label>
                <Select
                  value={formData.segment}
                  onValueChange={(val) => setFormData({ ...formData, segment: val })}
                >
                  <SelectTrigger id="segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Registered Clinics & Hospitals">Registered Clinics & Hospitals</SelectItem>
                    <SelectItem value="All Healthcare Procurement Buyers">All Healthcare Procurement Buyers</SelectItem>
                    <SelectItem value="Verified Vendors & Distributors">Verified Vendors & Distributors</SelectItem>
                    <SelectItem value="VIP Hospital Directors">VIP Hospital Directors</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject Line *</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Save 15% on KMPDB Certified Diagnostic Equipment"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={formData.template}
                  onValueChange={(val) => setFormData({ ...formData, template: val })}
                >
                  <SelectTrigger id="template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Promotional Offer HTML">Promotional Offer HTML</SelectItem>
                    <SelectItem value="Feature Launch Template">Feature Launch Template</SelectItem>
                    <SelectItem value="Product Digest Template">Product Digest Template</SelectItem>
                    <SelectItem value="Vendor Onboarding Blast">Vendor Onboarding Blast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_for">Schedule Date (Optional)</Label>
                <Input
                  id="scheduled_for"
                  type="datetime-local"
                  value={formData.scheduled_for}
                  onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Email Content / Body Text</Label>
                <Textarea
                  id="content"
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
            </div>

            <SheetFooter className="flex-row justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                Create & Save Campaign
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Preview Slide-over Sheet */}
      {previewCampaign && (
        <Sheet open={!!previewCampaign} onOpenChange={() => setPreviewCampaign(null)}>
          <SheetContent side="right" className="sm:max-w-md p-6">
            <SheetHeader>
              <SheetTitle>Campaign Details</SheetTitle>
              <SheetDescription>{previewCampaign.name}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4 text-sm">
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <p className="text-xs text-muted-foreground"><strong>Subject:</strong> {previewCampaign.subject}</p>
                <p className="text-xs text-muted-foreground"><strong>Segment:</strong> {previewCampaign.segment}</p>
                <p className="text-xs text-muted-foreground"><strong>Recipients:</strong> {previewCampaign.recipients_count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground"><strong>Status:</strong> {previewCampaign.status.toUpperCase()}</p>
                {previewCampaign.status === "sent" && (
                  <div className="flex gap-4 pt-2 text-xs font-semibold">
                    <span className="text-emerald-600">Open Rate: {previewCampaign.open_rate}%</span>
                    <span className="text-blue-600">Click Rate: {previewCampaign.click_rate}%</span>
                  </div>
                )}
              </div>
              <div className="border rounded-lg p-4 bg-background">
                <p className="font-semibold text-foreground mb-2">{previewCampaign.subject}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Dear Partner,<br /><br />
                  We are notifying you about the latest medical supply arrivals and discounted packages available on the MyMedDevices platform. All items come with full PPB registration and local warranty.
                </p>
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setPreviewCampaign(null)}>
                Close Preview
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </DashboardLayout>
  );
}
