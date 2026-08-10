"use client";

import { Button } from "@/components/ui/button";
import { Truck, Clock, ShieldCheck, CreditCard, Search } from "lucide-react";
import Image from "next/image";
import { useState, useRef } from "react";
import ProductCommandSearch from "@/components/common/ProductCommandSearch";

const Badge = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-start gap-3 rounded-lg bg-card/95 px-3 py-2 shadow-sm border">
    <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-sm font-medium text-card-foreground">{title}</span>
      {subtitle ? (
        <span className="text-[11px] text-muted-foreground">{subtitle}</span>
      ) : null}
    </div>
  </div>
);

export const WhyUs = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="w-full bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="container mx-auto grid grid-cols-1 items-center gap-6 rounded-xl p-6 md:p-10 lg:grid-cols-2">
        {/* Left: primary message, chips, search mock, badges, CTA */}

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            Medical devices for care teams and home patients.
          </h1>

          <p className="text-sm text-muted-foreground max-w-xl">
            Browse certified devices, compare specs, and get same-day shipping
            on select items. Trusted by clinics and caregivers across the
            region.
          </p>

          <div className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor="hero-search" className="sr-only">
              Search devices
            </label>

            <div className="relative flex-1 group">
              <div
                className={`
                  relative flex items-center gap-2 rounded-xl border-2 bg-card px-4 py-3 
                  shadow-lg transition-all duration-300 ease-out
                  ${isFocused
                    ? 'border-primary shadow-primary/20 shadow-xl ring-4 ring-primary/10'
                    : 'border-border hover:border-primary/50 hover:shadow-xl'
                  }
                `}
              >
                <Search className={`h-4 w-4 flex-shrink-0 transition-colors duration-300 ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} />
                <input
                  id="hero-search"
                  aria-label="Search devices"
                  placeholder="Search devices, e.g. blood pressure monitor"
                  className="w-full bg-transparent text-sm outline-none text-card-foreground placeholder:text-muted-foreground"
                  ref={inputRef}
                  onFocus={() => {
                    setOpen(true);
                    setIsFocused(true);
                  }}
                  onBlur={() => setIsFocused(false)}
                  onClick={() => setOpen(true)}
                  onChange={(e) => setQuery(e.target.value)}
                  value={query}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Shop Now
              </Button>
            </div>
          </div>

          <ProductCommandSearch
            open={open}
            onOpenChange={setOpen}
            query={query}
            onQueryChange={setQuery}
            onSelect={(p) => setOpen(false)}
          />

          <div className="mt-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:max-w-xl">
            <Badge
              icon={<Truck className="h-5 w-5" />}
              title="Express delivery"
              subtitle="Same day if ordered by 7pm"
            />

            <Badge
              icon={<Clock className="h-5 w-5" />}
              title="Customer Support"
              subtitle="7 days a week"
            />

            <Badge
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Genuine Products"
              subtitle="100% certified"
            />

            <Badge
              icon={<CreditCard className="h-5 w-5" />}
              title="Easy Payments"
              subtitle="M-Pesa, Visa, MasterCard"
            />
          </div>
        </div>

        {/* Right: rotated image collage with subtle shadow */}

        <div className="relative flex items-center justify-center">
          <div className="relative h-72 w-full max-w-md overflow-hidden rounded-2xl shadow-xl ring-1 ring-border/20 md:h-96 lg:h-[420px]">
            <Image
              src="/images/hero-care-devices.jpg"
              alt="Kenyan healthcare professional helping an elderly patient test a digital blood pressure monitor at home"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 420px"
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};
// <div className="relative h-72 w-full max-w-md overflow-hidden rounded-2xl shadow-xl ring-1 ring-gray-900/10 md:h-96 lg:h-[420px]">

// </div>
