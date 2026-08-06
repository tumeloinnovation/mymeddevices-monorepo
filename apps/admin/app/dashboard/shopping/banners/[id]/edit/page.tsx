"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Upload, Eye } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { shoppingService, Banner, BannerPlacement, BannerStatus } from "@mymeddevices/shared-core";
import Link from "next/link";

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [coupons, setCoupons] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    image_alt_text: "",
    background_color: "#ffffff",
    text_color: "#000000",
    cta_text: "",
    cta_link: "",
    cta_target: "_self",
    placement: BannerPlacement.HOMEPAGE_HERO,
    priority: 0,
    status: BannerStatus.DRAFT,
    scheduled_start: "",
    scheduled_end: "",
    is_dismissible: false,
    show_close_button: true,
    mobile_hidden: false,
    desktop_hidden: false,
    coupon_id: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true);
      try {
        const [bannerData, couponsData] = await Promise.all([
          shoppingService.getBanner(bannerId),
          shoppingService.getCoupons(true),
        ]);

        setCoupons(Array.isArray(couponsData) ? couponsData : []);

        // Format dates for datetime-local input
        const formattedBanner: any = { ...bannerData };
        if (formattedBanner.scheduled_start) {
          formattedBanner.scheduled_start = new Date(formattedBanner.scheduled_start)
            .toISOString()
            .slice(0, 16);
        }
        if (formattedBanner.scheduled_end) {
          formattedBanner.scheduled_end = new Date(formattedBanner.scheduled_end)
            .toISOString()
            .slice(0, 16);
        }

        setFormData({
          title: formattedBanner.title || "",
          description: formattedBanner.description || "",
          image_url: formattedBanner.image_url || "",
          image_alt_text: formattedBanner.image_alt_text || "",
          background_color: formattedBanner.background_color || "#ffffff",
          text_color: formattedBanner.text_color || "#000000",
          cta_text: formattedBanner.cta_text || "",
          cta_link: formattedBanner.cta_link || "",
          cta_target: formattedBanner.cta_target || "_self",
          placement: formattedBanner.placement || BannerPlacement.HOMEPAGE_HERO,
          priority: formattedBanner.priority || 0,
          status: formattedBanner.status || BannerStatus.DRAFT,
          scheduled_start: formattedBanner.scheduled_start || "",
          scheduled_end: formattedBanner.scheduled_end || "",
          is_dismissible: formattedBanner.is_dismissible || false,
          show_close_button: formattedBanner.show_close_button !== false,
          mobile_hidden: formattedBanner.mobile_hidden || false,
          desktop_hidden: formattedBanner.desktop_hidden || false,
          coupon_id: formattedBanner.coupon_id || "",
        });

        if (formattedBanner.image_url) {
          setImagePreview(formattedBanner.image_url);
        }
      } catch (error) {
        console.error("Failed to load banner", error);
        toast.error("Failed to load banner");
        router.push("/dashboard/shopping/banners");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [bannerId, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setFormData(prev => ({ ...prev, image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await shoppingService.updateBanner(bannerId, {
        ...formData,
        scheduled_start: formData.scheduled_start ? new Date(formData.scheduled_start).toISOString() : undefined,
        scheduled_end: formData.scheduled_end ? new Date(formData.scheduled_end).toISOString() : undefined,
        coupon_id: formData.coupon_id || undefined,
        priority: Number(formData.priority),
      });

      toast.success("Banner updated successfully");
      router.push("/dashboard/shopping/banners");
    } catch (error) {
      console.error("Failed to update banner", error);
      toast.error("Failed to update banner. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (fetchLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Link href="/dashboard/shopping/banners">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Edit Banner</h1>
            <p className="text-xs text-muted-foreground">
              Update banner configuration and content.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card className="md:col-span-2 border-border bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Basic Information</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Set up the banner content and visuals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Summer Sale 2026"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional context for the promotion..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Visual Assets */}
            <Card className="md:col-span-2 border-border bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Visual Assets</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Upload banner image and set colors.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="image" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Banner Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-48 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30">
                      {imagePreview || formData.image_url ? (
                        <img src={imagePreview || formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Upload className="h-6 w-6 mx-auto mb-1" />
                          <p className="text-xs">No image selected</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="max-w-xs"
                      />
                      <Input
                        placeholder="Or paste image URL..."
                        value={formData.image_url}
                        onChange={(e) => {
                          handleChange("image_url", e.target.value);
                          setImagePreview(e.target.value);
                        }}
                        className="max-w-xs"
                      />
                      <Input
                        placeholder="Alt text for accessibility"
                        value={formData.image_alt_text}
                        onChange={(e) => handleChange("image_alt_text", e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="background_color" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="background_color"
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => handleChange("background_color", e.target.value)}
                        className="h-10 w-16 p-0 border-0"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => handleChange("background_color", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="text_color" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Text Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="text_color"
                        type="color"
                        value={formData.text_color}
                        onChange={(e) => handleChange("text_color", e.target.value)}
                        className="h-10 w-16 p-0 border-0"
                      />
                      <Input
                        value={formData.text_color}
                        onChange={(e) => handleChange("text_color", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Call to Action</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Configure the button and link.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="cta_text" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Button Text</Label>
                  <Input
                    id="cta_text"
                    placeholder="Shop Now"
                    value={formData.cta_text}
                    onChange={(e) => handleChange("cta_text", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cta_link" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link URL</Label>
                  <Input
                    id="cta_link"
                    placeholder="/products/summer-sale"
                    value={formData.cta_link}
                    onChange={(e) => handleChange("cta_link", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cta_target" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link Target</Label>
                  <Select value={formData.cta_target} onValueChange={(v) => handleChange("cta_target", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_self">Same Tab (_self)</SelectItem>
                      <SelectItem value="_blank">New Tab (_blank)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Placement and Scheduling */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Placement & Schedule</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Define where and when the banner appears.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="placement" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Placement *</Label>
                  <Select value={formData.placement} onValueChange={(v) => handleChange("placement", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BannerPlacement.HOMEPAGE_HERO}>Homepage Hero (Full-width)</SelectItem>
                      <SelectItem value={BannerPlacement.HOMEPAGE_SIDEBAR}>Homepage Sidebar</SelectItem>
                      <SelectItem value={BannerPlacement.CATEGORY_PAGE}>Category Page</SelectItem>
                      <SelectItem value={BannerPlacement.PRODUCT_PAGE}>Product Page</SelectItem>
                      <SelectItem value={BannerPlacement.CHECKOUT_PAGE}>Checkout Page</SelectItem>
                      <SelectItem value={BannerPlacement.HEADER_BAR}>Header Bar</SelectItem>
                      <SelectItem value={BannerPlacement.FOOTER}>Footer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min={0}
                    value={formData.priority}
                    onChange={(e) => handleChange("priority", e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Higher priority banners are shown first.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="scheduled_start" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                    <Input
                      id="scheduled_start"
                      type="datetime-local"
                      value={formData.scheduled_start}
                      onChange={(e) => handleChange("scheduled_start", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="scheduled_end" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</Label>
                    <Input
                      id="scheduled_end"
                      type="datetime-local"
                      value={formData.scheduled_end}
                      onChange={(e) => handleChange("scheduled_end", e.target.value)}
                      min={formData.scheduled_start}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={BannerStatus.DRAFT}>Draft</SelectItem>
                      <SelectItem value={BannerStatus.SCHEDULED}>Scheduled</SelectItem>
                      <SelectItem value={BannerStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={BannerStatus.PAUSED}>Paused</SelectItem>
                      <SelectItem value={BannerStatus.EXPIRED}>Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Display Options */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Display Options</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Control how the banner behaves.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show_close_button">Show Close Button</Label>
                    <p className="text-xs text-muted-foreground">Allow users to manually dismiss the banner</p>
                  </div>
                  <Switch
                    id="show_close_button"
                    checked={formData.show_close_button}
                    onCheckedChange={(v) => handleChange("show_close_button", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_dismissible">Remember Dismissal</Label>
                    <p className="text-xs text-muted-foreground">Don't show again to users who dismissed it</p>
                  </div>
                  <Switch
                    id="is_dismissible"
                    checked={formData.is_dismissible}
                    onCheckedChange={(v) => handleChange("is_dismissible", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mobile_hidden">Hide on Mobile</Label>
                    <p className="text-xs text-muted-foreground">Don't display on mobile devices</p>
                  </div>
                  <Switch
                    id="mobile_hidden"
                    checked={formData.mobile_hidden}
                    onCheckedChange={(v) => handleChange("mobile_hidden", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="desktop_hidden">Hide on Desktop</Label>
                    <p className="text-xs text-muted-foreground">Don't display on desktop devices</p>
                  </div>
                  <Switch
                    id="desktop_hidden"
                    checked={formData.desktop_hidden}
                    onCheckedChange={(v) => handleChange("desktop_hidden", v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Associated Coupon */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Associated Coupon (Optional)</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Link this banner to a specific coupon.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="coupon_id" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coupon</Label>
                  <Select value={formData.coupon_id} onValueChange={(v) => handleChange("coupon_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a coupon (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Coupon</SelectItem>
                      {coupons.map((coupon) => (
                        <SelectItem key={coupon.id} value={coupon.id}>
                          {coupon.code} - {coupon.description || coupon.coupon_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 border-t border-border/40 pt-4">
            <Button
              variant="outline"
              type="button"
              asChild
              className="bg-background border-border hover:bg-secondary text-foreground rounded-lg h-9 font-medium"
            >
              <Link href="/dashboard/shopping/banners">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground border-none rounded-lg h-9 font-medium shadow-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
