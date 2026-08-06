"use client";

import { Button } from "@/components/ui/button";
import { StatusConfig } from "../types";

interface StatusTabsProps {
  currentValue: string;
  onChange: (value: string) => void;
  config?: StatusConfig[];
}

const DEFAULT_STATUS_CONFIG: StatusConfig[] = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export function StatusTabs({
  currentValue,
  onChange,
  config = DEFAULT_STATUS_CONFIG,
}: StatusTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {config.map((tab) => (
        <Button
          key={tab.value}
          variant={currentValue === tab.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(tab.value)}
          className="text-xs"
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
