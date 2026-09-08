"use client";

import React from "react";
import {
  Crown,
  Wrench,
  CreditCard,
  ShieldCheck,
  Headphones,
  Package,
  Truck,
  Store,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Crown,
  worker: Wrench,
  finance: CreditCard,
  compliance: ShieldCheck,
  support: Headphones,
  logistics: Package,
  driver: Truck,
  vendor: Store,
  customer: Users,
  viewer: Eye,
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  worker: "Operations Worker",
  finance: "Finance & Billing",
  compliance: "Compliance & Quality",
  support: "Customer Support",
  logistics: "Logistics & Dispatch",
  driver: "Delivery Driver",
  vendor: "Vendor Partner",
  customer: "Procurement Client",
  viewer: "Auditor / Viewer",
};

export const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
  worker: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  finance: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  compliance: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
  support: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300",
  logistics: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
  driver: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  vendor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  customer: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
  viewer: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
};

export function RoleIcon({ role, className = "h-3 w-3" }: { role: string; className?: string }) {
  switch (role) {
    case "admin":
      return <Crown className={className} />;
    case "worker":
      return <Wrench className={className} />;
    case "finance":
      return <CreditCard className={className} />;
    case "compliance":
      return <ShieldCheck className={className} />;
    case "support":
      return <Headphones className={className} />;
    case "logistics":
      return <Package className={className} />;
    case "driver":
      return <Truck className={className} />;
    case "vendor":
      return <Store className={className} />;
    case "customer":
      return <Users className={className} />;
    default:
      return <Eye className={className} />;
  }
}

export function RoleBadge({ role, label }: { role?: string; label?: string }) {
  const color = ROLE_BADGE_COLORS[role || "viewer"] || ROLE_BADGE_COLORS.viewer;
  const text = label || ROLE_LABELS[role || ""] || role || "Viewer";
  return (
    <Badge className={`${color} gap-1 font-medium`}>
      <RoleIcon role={role || "viewer"} /> {text}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 gap-1 font-medium">
          <CheckCircle className="h-3 w-3" /> Active
        </Badge>
      );
    case "inactive":
      return (
        <Badge variant="secondary" className="gap-1 font-medium">
          <XCircle className="h-3 w-3" /> Inactive
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="gap-1 font-medium">
          <Calendar className="h-3 w-3" /> Pending
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function RiskBadge({ risk }: { risk: string }) {
  switch (risk) {
    case "critical":
      return (
        <Badge variant="destructive" className="bg-rose-600 text-white text-[10px] uppercase font-bold tracking-wider py-0 px-1.5">
          Critical
        </Badge>
      );
    case "high":
      return (
        <Badge className="bg-amber-500 text-white text-[10px] uppercase font-bold tracking-wider py-0 px-1.5">
          High Risk
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="secondary" className="text-[10px] uppercase font-medium tracking-wider py-0 px-1.5">
          Moderate
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] uppercase font-normal tracking-wider py-0 px-1.5 text-muted-foreground">
          Standard
        </Badge>
      );
  }
}

export function formatDate(dateString?: string, withTime = false) {
  if (!dateString) return "Never";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString("en-KE", opts);
}
