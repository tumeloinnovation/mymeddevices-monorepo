"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  Settings,
  Boxes,
  Store,
  BarChart3,
} from "lucide-react";

const quickLinks = [
  { label: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/vendor/products", icon: Package },
  { label: "Orders", href: "/vendor/orders", icon: ShoppingBag },
  { label: "Earnings", href: "/vendor/earnings", icon: Wallet },
  { label: "Inventory", href: "/vendor/inventory", icon: Boxes },
  { label: "Analytics", href: "/vendor/analytics", icon: BarChart3 },
  { label: "Settings", href: "/vendor/settings", icon: Settings },
];

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-8 bg-background">
      <div className="w-full max-w-2xl mx-auto text-center space-y-10">
        {/* Logo */}
        <Link href="/vendor/dashboard" className="inline-block">
          <Image
            src="/logos/logo-portrait.png"
            alt="MyMedDevices"
            width={140}
            height={140}
            className="mx-auto transition-opacity hover:opacity-80"
            priority
          />
        </Link>

        {/* 404 Content */}
        <div className="space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Store className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-8xl sm:text-9xl font-bold tracking-tighter text-foreground">
            404
          </h1>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Page not found
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
              Let&apos;s get you back on track.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <Button
            size="lg"
            className="w-full sm:w-auto shadow-lg shadow-emerald-600/20 h-12 px-8"
            onClick={() => router.push("/vendor/dashboard")}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-12 px-8"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Quick links
          </p>
          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-all duration-200 group hover:shadow-md"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="text-sm text-muted-foreground pt-4">
          &copy; {new Date().getFullYear()} MyMedDevices. All rights reserved.
        </p>
      </div>
    </div>
  );
}
