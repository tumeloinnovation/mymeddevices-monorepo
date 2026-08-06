"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Sparkles, LayoutGrid, Link as LinkIcon, 
  Palette, CheckCircle2, ChevronRight, Eye
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { shoppingService } from "@mymeddevices/shared-core";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Preset Options to minimize manual typing
const TARGET_URL_PRESETS = [
  { label: "Offers & Deals", value: "/offers" },
  { label: "All Products", value: "/products" },
  { label: "Diagnostic Equipment", value: "/categories/diagnostic-equipment" },
  { label: "Best Sellers", value: "/best-sellers" },
  { label: "New Arrivals", value: "/new-arrivals" },
];

const CTA_PRESETS = ["Shop Now", "Claim Offer", "Explore Catalog", "Learn More", "Get Discount"];

const COLOR_PRESETS = [
  { bg: "#0066cc", text: "#ffffff", label: "Medical Blue" },
  { bg: "#059669", text: "#ffffff", label: "Emerald Green" },
  { bg: "#7c3aed", text: "#ffffff", label: "Royal Purple" },
  { bg: "#dc2626", text: "#ffffff", label: "Alert Red" },
  { bg: "#0f172a", text: "#ffffff", label: "Dark Midnight" },
];

const PLACEMENT_OPTIONS = [
  {
    id: "header_bar",
    title: "Top Announcement Bar",
    badge: "Most Popular",
    description: "Full-width alert bar rendered above the website top navigation header.",
    requiresImage: false,
    preset: {
      title: "🎉 Free Express Delivery across Kenya on orders over Ksh 5,000!",
      description: "Use code MED2026 at checkout for instant free delivery.",
      image_url: "",
      target_url: "/offers",
      button_text: "Shop Deals",
      bg_color: "#0066cc",
      text_color: "#ffffff",
    },
  },
  {
    id: "homepage_hero",
    title: "Homepage Hero Slider",
    badge: "High Impact",
    description: "Main banner carousel at the top of the homepage below navigation.",
    requiresImage: true,
    preset: {
      title: "PPB Certified Diagnostic Equipment & Patient Monitors",
      description: "Get up to 25% OFF hospital-grade equipment with 1-year local warranty.",
      image_url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=1200&auto=format&fit=crop",
      target_url: "/categories/diagnostic-equipment",
      button_text: "Explore Catalog",
      bg_color: "#0f172a",
      text_color: "#ffffff",
    },
  },
];

export default function NewMarketingBannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"desktop" | "mobile">("desktop");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    mobile_image_url: "",
    target_url: "/offers",
    button_text: "Shop Now",
    placement: "header_bar",
    bg_color: "#0066cc",
    text_color: "#ffffff",
    text_alignment: "center" as "left" | "center" | "right",
    priority: "1",
    status: "active",
    start_time: new Date().toISOString().split('T')[0],
    end_time: "",
  });

  const selectedPlacement = PLACEMENT_OPTIONS.find(p => p.id === formData.placement) || PLACEMENT_OPTIONS[0];
  const isHeaderBar = formData.placement === "header_bar";
  const isHomepageHero = formData.placement === "homepage_hero";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = formData.title.trim() || (isHomepageHero ? "Homepage Hero Banner" : "");
    if (!finalTitle) {
      toast.error("Headline / Title is required");
      return;
    }
    if (selectedPlacement.requiresImage && !formData.image_url.trim()) {
      toast.error("Desktop Banner Image URL is required for this placement zone");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: finalTitle,
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        mobile_image_url: formData.mobile_image_url.trim() || null,
        target_url: formData.target_url.trim() || null,
        cta_link: formData.target_url.trim() || null,
        button_text: formData.button_text.trim() || "Shop Now",
        cta_text: formData.button_text.trim() || "Shop Now",
        placement: formData.placement,
        background_color: formData.bg_color,
        text_color: formData.text_color,
        text_alignment: formData.text_alignment,
        priority: parseInt(formData.priority) || 1,
        status: formData.status,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : new Date().toISOString(),
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      };

      await shoppingService.createBanner(payload);
      toast.success("Marketing Banner created successfully!");
      router.push("/dashboard/marketing/banners");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" asChild>
              <Link href="/dashboard/marketing/banners">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">Create Marketing Campaign Banner</h1>
                <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full border border-primary/20">
                  Interactive Studio
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure announcement bars or visual banners with real-time customer site preview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/marketing/banners">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-2 shadow-sm font-medium">
              <Save className="h-4 w-4" />
              {loading ? "Publishing..." : "Publish Banner"}
            </Button>
          </div>
        </div>

        {/* Studio Layout: 7 Cols Setup / 5 Cols Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Setup Controls */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Visual Placement Selector */}
            <Card className="border shadow-xs overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-primary" /> Step 1: Select Placement Zone
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">Where will this appear?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLACEMENT_OPTIONS.map((item) => {
                  const isSelected = formData.placement === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          placement: item.id,
                          title: item.preset.title,
                          description: item.preset.description,
                          image_url: item.preset.image_url,
                          target_url: item.preset.target_url,
                          button_text: item.preset.button_text,
                          bg_color: item.preset.bg_color,
                          text_color: item.preset.text_color,
                        });
                        toast.info(`Loaded prefilled test data for ${item.title}`);
                      }}
                      className={cn(
                        "text-left p-3.5 rounded-xl border transition-all duration-200 relative flex flex-col justify-between gap-2 group",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-bold", isSelected ? "text-primary" : "text-foreground")}>
                          {item.title}
                        </span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                        {item.description}
                      </p>
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground group-hover:bg-background">
                          {item.badge}
                        </span>
                        {!item.requiresImage && (
                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                            Text Only Allowed
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Step 2: Content & Copywriting (Only for Non-Hero Placement Zones) */}
            {!isHomepageHero && (
              <Card className="border shadow-xs">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Step 2: Message & Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-xs font-medium">
                      Headline / Primary Message <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder={
                        isHeaderBar
                          ? "e.g. 🎉 Free Express Delivery across Nairobi on orders over Ksh 5,000!"
                          : "e.g. PPB Certified Oxygen Concentrators — 15% OFF This Week"
                      }
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-medium">
                      Supporting Subtitle {isHeaderBar && "(Optional short text)"}
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="e.g. Use code MED2026 at checkout for instant discount on diagnostic devices."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>

                  {/* Color Palette Presets */}
                  <div className="space-y-2 pt-1 border-t border-border">
                    <Label className="text-xs font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5 text-primary" /> Accent Color Theme
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">{formData.bg_color}</span>
                    </Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.bg}
                          type="button"
                          onClick={() => setFormData({ ...formData, bg_color: color.bg, text_color: color.text })}
                          className={cn(
                            "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all",
                            formData.bg_color === color.bg
                              ? "border-primary ring-2 ring-primary/30 shadow-xs"
                              : "border-border hover:opacity-80"
                          )}
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-white/40 bg-current"></span>
                          {color.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Link & CTA Quick Selectors */}
            <Card className="border shadow-xs">
              <CardHeader className="bg-muted/30 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" /> {isHomepageHero ? "Step 2: Target Link & Image Asset" : "Step 3: Target Action & Link"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Searchable Target Redirect URL Selector */}
                <div className="space-y-2">
                  <Label htmlFor="target_url" className="text-xs font-medium">Target Page / Category Redirect</Label>
                  <Select
                    value={formData.target_url}
                    onValueChange={(val) => setFormData({ ...formData, target_url: val })}
                  >
                    <SelectTrigger id="target_url" className="h-10 text-xs">
                      <SelectValue placeholder="Select destination page..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/offers">🔥 Offers & Promotions Page (/offers)</SelectItem>
                      <SelectItem value="/products">📦 All Products Catalog (/products)</SelectItem>
                      <SelectItem value="/best-sellers">⭐ Best Sellers (/best-sellers)</SelectItem>
                      <SelectItem value="/new-arrivals">✨ New Arrivals (/new-arrivals)</SelectItem>
                      <SelectItem value="/categories/diagnostic-equipment">🩺 Diagnostic Equipment (/categories/diagnostic-equipment)</SelectItem>
                      <SelectItem value="/categories/mobility-aids">♿ Mobility & Recovery Aids (/categories/mobility-aids)</SelectItem>
                      <SelectItem value="/categories/respiratory-care">🫁 Respiratory Care (/categories/respiratory-care)</SelectItem>
                      <SelectItem value="/categories/patient-monitors">📊 Patient Monitors (/categories/patient-monitors)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Or Custom Path:</span>
                    <Input
                      id="target_url_custom"
                      placeholder="e.g. /products/walking-stick"
                      value={formData.target_url}
                      onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Call to Action Button Text (Hidden for Homepage Hero Image Banners) */}
                {!isHomepageHero && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label htmlFor="button_text" className="text-xs font-medium">Button / CTA Text</Label>
                    <Input
                      id="button_text"
                      placeholder="e.g. Shop Now"
                      value={formData.button_text}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      className="h-9 text-sm"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">Presets:</span>
                      {CTA_PRESETS.map((cta) => (
                        <button
                          key={cta}
                          type="button"
                          onClick={() => setFormData({ ...formData, button_text: cta })}
                          className={cn(
                            "text-[11px] px-2 py-0.5 rounded-md border transition-all",
                            formData.button_text === cta
                              ? "bg-primary text-primary-foreground border-primary font-medium"
                              : "bg-muted/50 hover:bg-muted border-border text-muted-foreground"
                          )}
                        >
                          {cta}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Banner Image Input */}
                {selectedPlacement.requiresImage && (
                  <div className="space-y-2 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="image_url" className="text-xs font-medium">
                        Desktop Banner Image URL <span className="text-red-500">*</span>
                      </Label>
                      {isHomepageHero && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                          📐 Recommended: 1920 × 600 px (16:9 ratio)
                        </span>
                      )}
                    </div>
                    <Input
                      id="image_url"
                      placeholder="https://images.unsplash.com/... or /static/uploads/banners/hero1.jpg"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT: Live Customer Store Prototype Preview */}
          <div className="lg:col-span-5 sticky top-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" /> Customer Website Live Preview
              </span>
              <div className="flex items-center bg-muted p-0.5 rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("desktop")}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded font-medium transition-all",
                    activeTab === "desktop" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  )}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("mobile")}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded font-medium transition-all",
                    activeTab === "mobile" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  )}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Browser Frame Simulation */}
            <div className={cn(
              "mx-auto transition-all duration-300 rounded-xl border border-slate-700/60 shadow-xl overflow-hidden bg-slate-950 text-slate-100",
              activeTab === "mobile" ? "max-w-[340px]" : "w-full"
            )}>
              {/* Browser Header Bar */}
              <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <div className="bg-slate-800/80 px-3 py-0.5 rounded-md text-[10px] font-mono text-slate-300 border border-slate-700/50 truncate max-w-[200px]">
                  mymeddevices.com{formData.target_url}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">100%</span>
              </div>

              {/* Exact MyMedDevices Customer Website Replica */}
              <div className="bg-background text-foreground font-sans text-xs">
                
                {/* 1. TOP ANNOUNCEMENT BAR PREVIEW (Appears above top navigation header) */}
                {/* Real-time Top Announcement Bar Preview */}
                  {isHeaderBar ? (
                    <div
                      style={{ backgroundColor: formData.bg_color, color: formData.text_color }}
                      className="py-2.5 px-3 text-center text-xs font-medium flex items-center justify-center gap-2 shadow-inner transition-all duration-200"
                    >
                      <div className="flex items-center justify-center gap-2 max-w-full flex-wrap">
                        <span className="font-semibold">{formData.title || "Your Announcement Headline Here"}</span>
                        {formData.description && (
                          <span className="hidden sm:inline text-[11px] opacity-90 border-l border-white/20 pl-2">
                            {formData.description}
                          </span>
                        )}
                        {formData.button_text && (
                          <span className="inline-flex items-center gap-0.5 font-bold text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-900 shadow-xs ml-1">
                            {formData.button_text} →
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}

                {/* 2. TOP SOCIAL BAR (Matches TopBar.tsx) */}
                <div className="border-b border-border bg-card px-4 py-1.5 hidden sm:flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>About Us</span>
                    <span>Offers</span>
                    <span>Returns & Refunds</span>
                    <span>Contact Us</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]">🇰🇪 KES</span>
                  </div>
                </div>

                {/* 3. MAIN STORE HEADER BAR (Matches MainBar.tsx) */}
                <div className="px-4 py-2.5 flex items-center justify-between gap-2 bg-background border-b border-border">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-primary">
                    <img src="/logos/logo-landscape.png" alt="Logo" className="h-6 w-auto object-contain" />
                  </div>
                  
                  <div className="hidden sm:flex flex-1 max-w-[180px] bg-muted/60 rounded-lg px-2.5 py-1 text-[10px] text-muted-foreground border border-border">
                    Search medicines & equipment...
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Wishlist (0)</span>
                    <span className="font-bold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded">Cart (KES 0)</span>
                  </div>
                </div>

                {/* 4. MAIN PAGE BODY PREVIEW */}
                <div className="p-4 bg-muted/20 min-h-[220px] flex flex-col justify-start gap-3">
                  
                  {/* Hero Slider Placement Preview (Canva-style Image Banner) */}
                  {formData.placement === "homepage_hero" && (
                    <div
                      style={{ backgroundColor: formData.bg_color || "#0f172a" }}
                      className="relative overflow-hidden rounded-xl border border-border shadow-md min-h-[180px] flex items-center justify-center transition-all group"
                    >
                      {formData.image_url ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                          style={{ backgroundImage: `url(${formData.image_url})` }}
                        />
                      ) : (
                        <div className="p-6 text-center text-slate-400 font-medium text-xs space-y-1">
                          <p className="font-bold text-slate-300">🖼️ Image-First Canva Hero Banner</p>
                          <p className="text-[10px] opacity-75">Upload your Canva/Photoshop banner image URL above</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sidebar Placement Preview */}
                  {formData.placement === "homepage_sidebar" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 bg-card p-4 rounded-xl border border-border shadow-xs">
                        <p className="text-xs font-semibold text-muted-foreground">Main Content Stream</p>
                        <div className="h-20 bg-muted/40 rounded mt-2 flex items-center justify-center text-[10px] text-muted-foreground">
                          Featured Products Grid
                        </div>
                      </div>
                      <div
                        style={{ backgroundColor: formData.bg_color, color: formData.text_color }}
                        className="p-3.5 rounded-xl border border-border shadow-xs flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold">{formData.title || "Sidebar Banner"}</h4>
                          <p className="text-[10px] opacity-80">{formData.description || "Sidebar promotion content"}</p>
                        </div>
                        <button type="button" className="text-[10px] font-bold underline mt-2 text-left">
                          {formData.button_text || "Shop"} →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category Page Banner Preview */}
                  {formData.placement === "category_page" && (
                    <div
                      style={{ backgroundColor: formData.bg_color, color: formData.text_color }}
                      className="p-4 rounded-xl border border-border shadow-xs text-center space-y-1"
                    >
                      <h3 className="text-sm font-bold">{formData.title || "Category Top Banner"}</h3>
                      <p className="text-xs opacity-80">{formData.description}</p>
                    </div>
                  )}

                  {/* Context Banner Note when Top Bar is active */}
                  {isHeaderBar && (
                    <div className="text-center p-6 border border-dashed border-primary/30 rounded-xl bg-primary/5">
                      <p className="text-xs text-foreground font-medium">
                        ✨ <strong>Top Announcement Bar Active</strong>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Notice how the top announcement bar sits prominently at the highest level of the website layout above all navigation header bars.
                      </p>
                    </div>
                  )}

                  {/* Mock Product Grid below */}
                  <div className="pt-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shop Trending Categories</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-card border border-border rounded p-2 text-center text-[10px] font-medium">Diagnostic</div>
                      <div className="bg-card border border-border rounded p-2 text-center text-[10px] font-medium">Mobility Aids</div>
                      <div className="bg-card border border-border rounded p-2 text-center text-[10px] font-medium">Patient Monitors</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
