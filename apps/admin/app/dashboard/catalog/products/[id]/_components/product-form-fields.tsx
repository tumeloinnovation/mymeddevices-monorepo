"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

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

export function MonoView({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
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
      variant="secondary"
      className={`h-7 px-2.5 rounded-lg text-xs font-medium bg-muted ${className}`}
    >
      {children ?? "Uncategorized"}
    </Badge>
  );
}

export function BrandView({ name }: { name?: string | null }) {
  if (!name) return <TextView>\u2014</TextView>;
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
