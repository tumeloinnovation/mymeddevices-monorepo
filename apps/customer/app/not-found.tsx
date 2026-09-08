"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Home,
  ShoppingBag,
  Heart,
  PhoneCall,
  Activity,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  FileQuestion,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/products`);
    }
  }

  const quickLinks = [
    {
      title: "Medical Catalog",
      description: "Explore diagnostic, surgical, and clinical equipment",
      href: "/products",
      icon: ShoppingBag,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Promotions & Offers",
      description: "Discounted medical devices and seasonal hospital bundles",
      href: "/offers",
      icon: Sparkles,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    {
      title: "Customer Dashboard",
      description: "Manage your recent orders, loyalty points, and shipments",
      href: "/dashboard",
      icon: Activity,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      title: "Wishlist & Saved",
      description: "Check your saved healthcare equipment and favorites",
      href: "/dashboard/wishlist",
      icon: Heart,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-10 text-center">
        
        {/* Animated Medical Graphic & 404 Headline */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative"
            >
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-gradient-to-tr from-primary/20 via-emerald-500/10 to-amber-500/20 border-2 border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10 mx-auto">
                <Stethoscope className="h-14 w-14 sm:h-16 sm:w-16 text-primary animate-pulse" />
              </div>

              {/* Status Indicator Tag */}
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full border-2 border-background shadow-md flex items-center gap-1">
                <Activity className="h-3 w-3 animate-spin" />
                <span>ERR_404</span>
              </div>
            </motion.div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
              Equipment Not Located
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              The page or clinical resource you were looking for doesn't exist, has been relocated, or is temporarily unavailable.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="border border-border/80 shadow-md bg-card rounded-2xl max-w-2xl mx-auto overflow-hidden">
          <CardContent className="p-2 sm:p-3">
            <form onSubmit={onSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search catalog (e.g., patient monitors, gloves, autoclaves)..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-muted/40 hover:bg-muted/60 focus:bg-background rounded-xl border border-transparent focus:border-primary/40 focus:outline-none transition-all placeholder:text-muted-foreground/70"
                />
              </div>
              <Button type="submit" className="rounded-xl px-5 font-semibold shrink-0 gap-1.5 shadow-xs">
                <span>Search</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Navigation Cards Grid */}
        <div className="space-y-4 max-w-3xl mx-auto text-left">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Suggested Destinations
            </h3>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Verified Kenya Healthcare Portal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="group block">
                  <Card className="h-full border border-border/70 hover:border-primary/50 shadow-xs hover:shadow-md transition-all rounded-2xl bg-card">
                    <CardContent className="p-4 flex items-center gap-3.5">
                      <div className={`p-3 rounded-xl border shrink-0 group-hover:scale-105 transition-transform ${link.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {link.title}
                          </h4>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {link.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Action Buttons & Support Callout */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="default" variant="default" className="rounded-xl px-6 font-semibold gap-2 shadow-xs w-full sm:w-auto">
            <Link href="/">
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </Button>

          <Button asChild size="default" variant="outline" className="rounded-xl px-6 font-semibold gap-2 border-border bg-card hover:bg-muted w-full sm:w-auto">
            <Link href="/contact-us">
              <PhoneCall className="h-4 w-4 text-primary" />
              <span>Contact Support Desk</span>
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
