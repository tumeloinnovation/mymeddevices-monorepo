"use client";

import { ReactNode, useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Trash2, SlidersHorizontal, CheckCircle2, TrendingUp, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Field({
  label,
  editing,
  children,
  view,
  hint,
}: {
  label: string;
  editing: boolean;
  children: ReactNode;
  view: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        {hint && <span className="text-[10px] text-muted-foreground/70">{hint}</span>}
      </div>
      {editing ? children : view}
    </div>
  );
}

export function TextView({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm font-semibold text-foreground py-1", className)}>
      {children || <span className="text-muted-foreground italic font-normal">Not specified</span>}
    </p>
  );
}

export function MonoView({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const text = String(children || "");

  const handleCopy = () => {
    if (!text || text === "-" || text === "N/A" || text === "NO-SKU") return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy"
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground bg-muted/60 hover:bg-muted px-2.5 py-1 rounded-lg border border-border/60 transition-colors group cursor-pointer",
        className
      )}
    >
      <span>{children ?? "-"}</span>
      {text && text !== "-" && text !== "N/A" && (
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
        </span>
      )}
    </button>
  );
}

export function BadgeView({
  children,
  variant = "secondary",
  className = "",
}: {
  children: ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}) {
  if (!children) return <TextView>-</TextView>;
  return (
    <Badge variant={variant} className={cn("text-xs font-semibold py-1 px-2.5 rounded-lg", className)}>
      {children}
    </Badge>
  );
}

export function BrandView({ name }: { name?: string | null }) {
  if (!name) return <TextView>-</TextView>;
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
        <Building2 className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-semibold text-foreground">{name}</span>
    </div>
  );
}

export function PriceView({
  value,
  currency = "KES",
}: {
  value?: number | null;
  currency?: string;
}) {
  if (value == null) return <TextView>-</TextView>;
  const fmt = value.toLocaleString("en-KE");
  return (
    <div className="flex items-baseline gap-1.5 py-0.5">
      <span className="text-xs font-bold text-muted-foreground uppercase">{currency}</span>
      <span className="text-xl font-extrabold text-foreground tracking-tight">{fmt}</span>
    </div>
  );
}

export function ComparePriceView({
  value,
  currency = "KES",
}: {
  value?: number | null;
  currency?: string;
}) {
  if (value == null || value <= 0) {
    return <span className="text-xs text-muted-foreground italic">None (No sale slash)</span>;
  }
  const fmt = `${currency} ${value.toLocaleString("en-KE")}`;
  return (
    <span className="text-sm font-semibold text-muted-foreground line-through decoration-rose-500/70 py-1 block">
      {fmt}
    </span>
  );
}

export function StockView({ quantity }: { quantity: number }) {
  const isOut = quantity === 0;
  const isLow = quantity > 0 && quantity <= 5;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span
        className={cn(
          "text-xl font-extrabold tracking-tight",
          isOut ? "text-destructive" : isLow ? "text-amber-600 dark:text-amber-400" : "text-foreground"
        )}
      >
        {quantity.toLocaleString("en-KE")}
      </span>
      <span className="text-xs text-muted-foreground font-medium">Units</span>
    </div>
  );
}

export function TagsView({ tags }: { tags?: string[] | null }) {
  if (!tags || tags.length === 0)
    return <p className="text-xs text-muted-foreground italic py-1">No keywords defined.</p>;
  return (
    <div className="flex flex-wrap gap-1.5 py-1">
      {tags.map((t) => (
        <Badge
          key={t}
          variant="outline"
          className="bg-muted/40 text-foreground font-medium text-xs px-2.5 py-0.5 rounded-lg border-border"
        >
          {t}
        </Badge>
      ))}
    </div>
  );
}

export function DescriptionView({
  text,
  placeholder = "Not provided.",
}: {
  text?: string | null;
  placeholder?: string;
}) {
  if (!text) return <p className="text-xs text-muted-foreground italic py-1">{placeholder}</p>;
  return (
    <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/20 p-4 rounded-xl border border-border/60">
      {text}
    </div>
  );
}

export function SlugView({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/${slug || ""}`;

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(path);
    setCopied(true);
    toast.success("Copied slug to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-lg border border-primary/20 transition-colors group cursor-pointer"
    >
      <span>{path}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-primary" />}
      </span>
    </button>
  );
}

export function SpecificationsView({ data }: { data: unknown }) {
  const specs = useMemo(() => {
    if (!data) return {};
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    }
    if (typeof data === "object") {
      return data as Record<string, unknown>;
    }
    return {};
  }, [data]);

  const entries = Object.entries(specs);

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-2xl bg-muted/10 border border-dashed border-border/80 text-xs text-muted-foreground font-medium flex flex-col items-center gap-2">
        <SlidersHorizontal className="h-6 w-6 text-muted-foreground/40 stroke-[1.5]" />
        <span>No technical attributes or parameters defined.</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="flex flex-col gap-1 p-3.5 rounded-xl bg-card border border-border/70 shadow-2xs hover:border-primary/40 transition-all duration-150"
        >
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{key}</span>
          </span>
          <span className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
            {typeof val === "object" ? JSON.stringify(val) : String(val)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SpecificationsEditor({ form }: { form: any }) {
  const specsValue = form.watch("specifications") || "{}";

  const specs = useMemo(() => {
    if (!specsValue) return {};
    if (typeof specsValue === "string") {
      try {
        return JSON.parse(specsValue);
      } catch {
        return {};
      }
    }
    return specsValue;
  }, [specsValue]);

  const updateSpecs = (updated: Record<string, string>) => {
    form.setValue("specifications", JSON.stringify(updated, null, 2), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleSpecChange = (oldKey: string, newKey: string, newValue: string) => {
    const updated = { ...specs };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    updated[newKey] = newValue;
    updateSpecs(updated);
  };

  const handleSpecDelete = (keyToDelete: string) => {
    const updated = { ...specs };
    delete updated[keyToDelete];
    updateSpecs(updated);
  };

  const handleSpecAdd = (defaultKey?: string, defaultValue?: string) => {
    const updated = { ...specs };
    let newKey = defaultKey || "New Attribute";
    let counter = 1;
    while (newKey in updated) {
      newKey = `${defaultKey || "New Attribute"} ${counter}`;
      counter++;
    }
    updated[newKey] = defaultValue || "";
    updateSpecs(updated);
  };

  const entries = Object.entries(specs);

  const presetSpecs = [
    { label: "Power Source", val: "100-240V AC, 50/60Hz" },
    { label: "Accuracy", val: "Clinically Validated (±2%)" },
    { label: "Operating Temp", val: "10°C - 40°C" },
    { label: "Dimensions", val: "Compact Desktop" },
    { label: "Warranty", val: "1 Year Manufacturer" },
  ];

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20 p-3 rounded-xl border border-border/70">
        <span className="text-xs font-medium text-muted-foreground">
          Define technical metrics as key-value pairs for buyer specifications and comparison.
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleSpecAdd()}
          className="rounded-xl h-8.5 text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 transition-all shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Attribute
        </Button>
      </div>

      {/* Preset Quick Add Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold text-muted-foreground mr-1">Quick Presets:</span>
        {presetSpecs.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handleSpecAdd(preset.label, preset.val)}
            className="text-[11px] font-semibold bg-card border border-border px-2.5 py-1 rounded-lg hover:bg-primary/10 hover:border-primary/40 text-foreground transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5 text-primary" />
            {preset.label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="text-center p-8 rounded-2xl bg-muted/10 border border-dashed border-border/80 text-xs text-muted-foreground font-medium flex flex-col items-center gap-2">
          <SlidersHorizontal className="h-6 w-6 text-muted-foreground/40" />
          <span>No specifications defined. Use quick presets or click &quot;Add Attribute&quot;.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entries.map(([key, val], idx) => (
            <div
              key={idx}
              className="flex gap-2 items-center bg-card p-3 rounded-xl border border-border shadow-xs hover:border-primary/40 transition-all duration-150"
            >
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider px-1">Attribute Name</span>
                <Input
                  value={key}
                  onChange={(e) => handleSpecChange(key, e.target.value, val as string)}
                  placeholder="e.g. Accuracy"
                  className="h-8.5 rounded-lg font-bold text-xs bg-muted/20 focus-visible:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider px-1">Value</span>
                <Input
                  value={val as string}
                  onChange={(e) => handleSpecChange(key, key, e.target.value)}
                  placeholder="e.g. ±2%"
                  className="h-8.5 rounded-lg text-xs bg-muted/20 focus-visible:ring-primary"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleSpecDelete(key)}
                className="rounded-lg h-8.5 w-8.5 text-destructive hover:bg-destructive/10 transition-all shrink-0 self-end mb-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface MarkupTier {
  min: number;
  max: number;
  rate: number;
  label: string;
}

export const MARKUP_TIERS: MarkupTier[] = [
  { min: 0, max: 1000, rate: 5, label: "0 – 1,000 (5%)" },
  { min: 1001, max: 10000, rate: 8, label: "1,001 – 10,000 (8%)" },
  { min: 10001, max: 50000, rate: 10, label: "10,001 – 50,000 (10%)" },
  { min: 50001, max: 200000, rate: 12, label: "50,001 – 200,000 (12%)" },
  { min: 200001, max: Infinity, rate: 15, label: "200,001+ (15%)" },
];

export function getRecommendedMarkupRate(vendorPayout: number): number {
  if (!vendorPayout || vendorPayout <= 0) return 10;
  const match = MARKUP_TIERS.find((t) => vendorPayout >= t.min && vendorPayout <= t.max);
  return match ? match.rate : 10;
}

export function MarkupTierVisualizer({
  vendorPayout = 0,
  retailPrice = 0,
  isEditing = false,
  onApplyRate,
}: {
  vendorPayout: number;
  retailPrice: number;
  isEditing?: boolean;
  onApplyRate?: (rate: number) => void;
}) {
  const recommendedRate = getRecommendedMarkupRate(vendorPayout);
  const markupAmount = retailPrice > vendorPayout ? retailPrice - vendorPayout : 0;
  const effectiveMarkupPercent =
    vendorPayout > 0 ? (markupAmount / vendorPayout) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="bg-muted/10 px-4 py-3 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Tiered Markup Engine
          </span>
          <Badge variant="outline" className="bg-muted text-foreground border-border text-[10px] font-bold">
            Rec: {recommendedRate}% Tier
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">Range-Based Pricing</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Realtime 3-Card Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-muted/20 p-3 rounded-xl border border-border/60">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Vendor Base Payout
            </span>
            <span className="text-base font-extrabold text-foreground mt-1 block">
              KES {vendorPayout.toLocaleString("en-KE")}
            </span>
          </div>

          <div className="bg-muted/20 p-3 rounded-xl border border-border/60">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Platform Markup
            </span>
            <span className="text-base font-extrabold text-foreground mt-1 block">
              +KES {markupAmount.toLocaleString("en-KE")} ({effectiveMarkupPercent.toFixed(1)}%)
            </span>
          </div>

          <div className="bg-muted/20 p-3 rounded-xl border border-border/60">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Customer Retail Price
            </span>
            <span className="text-base font-extrabold text-foreground mt-1 block">
              KES {retailPrice.toLocaleString("en-KE")}
            </span>
          </div>
        </div>

        {/* Tier Range Pill Presets in Edit Mode */}
        {isEditing && onApplyRate && (
          <div className="pt-2 space-y-2.5 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground">
                Apply Markup Tier Preset:
              </span>
              {vendorPayout > 0 && (
                <button
                  type="button"
                  onClick={() => onApplyRate(recommendedRate)}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  ⚡ Apply Recommended ({recommendedRate}%)
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {MARKUP_TIERS.map((tier) => {
                const isRecommended = tier.rate === recommendedRate && vendorPayout > 0;
                return (
                  <button
                    key={tier.rate}
                    type="button"
                    onClick={() => onApplyRate(tier.rate)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer",
                      isRecommended
                        ? "bg-muted text-foreground border-foreground/40 font-bold shadow-xs hover:bg-muted/80"
                        : "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                    )}
                  >
                    <span>+{tier.rate}%</span>
                    <span className="text-[10px] opacity-70">({tier.label.split(" ")[0]})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
