"use client";

import { ReactNode, useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Trash2 } from "lucide-react";

export function Field({
  label,
  editing,
  children,
  view,
}: {
  label: string;
  editing: boolean;
  children: ReactNode;
  view: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        {label}
      </Label>
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
    <p className={`text-sm font-medium text-foreground ${className}`}>
      {children ?? "\u2014"}
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
  return (
    <span className={`text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded ${className}`}>
      {children ?? "\u2014"}
    </span>
  );
}

export function BadgeView({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={`h-7 px-2.5 rounded-lg text-xs font-semibold border-primary/20 text-primary bg-primary/5 ${className}`}
    >
      {children ?? "Uncategorized"}
    </Badge>
  );
}

export function BrandView({ name }: { name?: string | null }) {
  if (!name) return <TextView>—</TextView>;
  return (
    <p className="text-sm font-semibold flex items-center gap-1.5">
      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
      {name}
    </p>
  );
}

export function PriceView({
  value,
  currency = "KES",
}: {
  value?: number | null;
  currency?: string;
}) {
  if (value == null) return <TextView>\u2014</TextView>;
  const fmt = `${currency} ${value.toLocaleString("en-KE")}`;
  return <p className="text-xl font-bold text-primary">{fmt}</p>;
}

export function ComparePriceView({
  value,
  currency = "KES",
}: {
  value?: number | null;
  currency?: string;
}) {
  if (value == null) return <TextView>\u2014</TextView>;
  const fmt = `${currency} ${value.toLocaleString("en-KE")}`;
  return (
    <p className="text-sm font-semibold text-muted-foreground line-through">
      {fmt}
    </p>
  );
}

export function StockView({ quantity }: { quantity: number }) {
  return (
    <p
      className={`text-xl font-bold ${quantity <= 5 ? "text-amber-500" : "text-foreground"}`}
    >
      {quantity}
    </p>
  );
}

export function CertificationsView({
  certs,
}: {
  certs?: string[] | null;
}) {
  if (!certs || certs.length === 0)
    return <p className="text-xs text-muted-foreground italic">None</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {certs.map((c) => (
        <Badge
          key={c}
          className="bg-indigo-50 text-indigo-700 border-indigo-100 font-medium h-6 px-2 text-[10px] rounded-md"
        >
          {c}
        </Badge>
      ))}
    </div>
  );
}

export function TagsView({ tags }: { tags?: string[] | null }) {
  if (!tags || tags.length === 0)
    return <p className="text-xs text-muted-foreground italic">None</p>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <Badge
          key={t}
          className="bg-muted text-foreground font-medium h-6 px-2 text-[10px] rounded-md border"
        >
          {t}
        </Badge>
      ))}
    </div>
  );
}

export function JsonView({ data }: { data: unknown }) {
  const formatted = JSON.stringify(data, null, 2);
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 overflow-x-auto">
      <pre className="text-[11px] font-mono text-indigo-300 leading-relaxed whitespace-pre-wrap">
        {formatted}
      </pre>
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
  if (!text) return <p className="text-xs text-muted-foreground italic">{placeholder}</p>;
  return (
    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/10 p-4 rounded-xl border border-muted-foreground/5">
      {text}
    </div>
  );
}

export function SlugView({ slug }: { slug: string }) {
  return <p className="text-xs font-mono text-primary font-semibold">/{slug}</p>;
}

export function TimestampView({ date }: { date?: string | null }) {
  if (!date) return <TextView>\u2014</TextView>;
  return (
    <TextView className="text-xs text-muted-foreground">
      {new Date(date).toLocaleDateString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}
    </TextView>
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
      <div className="text-center py-6 px-4 rounded-xl bg-muted/10 border border-dashed border-muted/20 text-xs text-muted-foreground font-medium">
        No technical specifications defined.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="flex flex-col gap-1 p-3 rounded-xl bg-muted/20 border border-muted/10 hover:border-muted/30 transition-all duration-200"
        >
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {key}
          </span>
          <span className="text-sm font-semibold text-foreground leading-relaxed">
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

  const handleSpecAdd = () => {
    const updated = { ...specs };
    let newKey = "New Specification";
    let counter = 1;
    while (newKey in updated) {
      newKey = `New Specification ${counter}`;
      counter++;
    }
    updated[newKey] = "";
    updateSpecs(updated);
  };

  const entries = Object.entries(specs);

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Define technical details as clinical/physical key-value pairs.
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSpecAdd}
          className="rounded-xl h-8 text-xs font-semibold gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all active:scale-[0.97] duration-150"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Specification
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center p-8 rounded-xl bg-muted/10 border border-dashed border-muted/20 text-xs text-muted-foreground font-medium">
          No specifications yet. Click "Add Specification" to define one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entries.map(([key, val], idx) => (
            <div
              key={idx}
              className="flex gap-2 items-center bg-muted/5 p-2 rounded-xl border border-muted-foreground/10 hover:border-muted-foreground/20 transition-all duration-200"
            >
              <Input
                value={key}
                onChange={(e) => handleSpecChange(key, e.target.value, val as string)}
                placeholder="Specification Name"
                className="h-9 rounded-lg font-semibold text-xs bg-background flex-1"
              />
              <Input
                value={val as string}
                onChange={(e) => handleSpecChange(key, key, e.target.value)}
                placeholder="Value"
                className="h-9 rounded-lg text-xs bg-background flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleSpecDelete(key)}
                className="rounded-lg h-9 w-9 text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-all flex-shrink-0 active:scale-[0.95] duration-150"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DimensionsView({
  dimensions,
}: {
  dimensions?: { length?: string | number; width?: string | number; height?: string | number; unit?: string } | null;
}) {
  if (!dimensions || (!dimensions.length && !dimensions.width && !dimensions.height)) {
    return <TextView>—</TextView>;
  }
  const { length = 0, width = 0, height = 0, unit = "cm" } = dimensions;
  return (
    <p className="text-sm font-medium text-foreground">
      {length} × {width} × {height} {unit}
    </p>
  );
}

