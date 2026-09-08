"use client";

import React from "react";
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ScrollText,
  Users,
  FileClock,
} from "lucide-react";

export function SecurityPolicyTab() {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Card 1: Healthcare Regulatory Standards */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-foreground">Medical Device Compliance</h3>
            <p className="text-[11px] text-muted-foreground">PPB, KMPDB, and CE/FDA clearance safeguards</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Healthcare device listings require verification by compliance officers holding{" "}
          <code className="text-[10px] bg-muted px-1 py-0.5 rounded">catalog:kmpdb_verify</code> or{" "}
          <code className="text-[10px] bg-muted px-1 py-0.5 rounded">catalog:ppb_classify</code> permissions
          before publication.
        </p>
        <div className="p-3 bg-muted/30 rounded-xl text-xs space-y-1.5 border">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> PPB Verified Products
          </p>
          <p className="text-muted-foreground text-[11px]">
            Automatic audit trail logged for all approval and rejection decisions.
          </p>
        </div>
      </div>

      {/* Card 2: Financial Disbursements Governance */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-foreground">Financial & Payout Dual-Control</h3>
            <p className="text-[11px] text-muted-foreground">M-Pesa B2C and Bank Transfer settlements</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Vendor payout authorization requires{" "}
          <code className="text-[10px] bg-muted px-1 py-0.5 rounded">finance:vendor_payouts</code> capability.
          Payout events generate immutable transactional records in the financial ledger.
        </p>
        <div className="p-3 bg-muted/30 rounded-xl text-xs space-y-1.5 border">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> High-Risk Financial Action
          </p>
          <p className="text-muted-foreground text-[11px]">
            Critical permissions trigger automatic real-time outbox notifications.
          </p>
        </div>
      </div>

      {/* Card 3: Least-Privilege Enforcement */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-foreground">Least-Privilege Defaults</h3>
            <p className="text-[11px] text-muted-foreground">Scoped grants and revocation overrides</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Every staff member inherits only the capabilities of their assigned role. Fine-grained
          overrides are tracked individually via{" "}
          <code className="text-[10px] bg-muted px-1 py-0.5 rounded">staff_permission_overrides</code>,
          letting administrators grant or revoke single capabilities without altering the base role.
        </p>
        <div className="p-3 bg-muted/30 rounded-xl text-xs space-y-1.5 border">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-500" /> Granular Staff Overrides
          </p>
          <p className="text-muted-foreground text-[11px]">
            One-click &quot;Clear Overrides&quot; restores a member to their role&apos;s default capability set.
          </p>
        </div>
      </div>

      {/* Card 4: Audit Trails */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold">
            <ScrollText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-foreground">Immutable Audit Trails</h3>
            <p className="text-[11px] text-muted-foreground">Outbox-backed governance events</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Permission matrix saves, role creations, and staff override changes are persisted through the
          transactional outbox with retry resilience, guaranteeing no governance event is silently lost.
        </p>
        <div className="p-3 bg-muted/30 rounded-xl text-xs space-y-1.5 border">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <FileClock className="h-3.5 w-3.5 text-violet-500" /> Event Logging
          </p>
          <p className="text-muted-foreground text-[11px]">
            Full change history available via the <code className="text-[10px] bg-muted px-1 py-0.5 rounded">audit:view</code> capability.
          </p>
        </div>
      </div>
    </div>
  );
}