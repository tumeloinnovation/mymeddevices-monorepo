"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/data/types";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/utils";

interface OfferCardProps {
  offer: Product;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer }) => {
  const discountPercent = offer.sale_price
    ? Math.round(
      ((Number(offer.regular_price) - Number(offer.sale_price)) /
        Number(offer.regular_price)) *
      100
    )
    : 0;

  const isDiscounted =
    offer.regular_price && offer.regular_price !== offer.price;

  return (
    <div className="group relative w-full flex flex-col overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* --- Image Section --- */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20 p-4">
        <Image
          src={offer.images?.[0]?.src || "/logos/logo-portrait.png"}
          alt={offer.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-contain transition-transform duration-500 group-hover:scale-105"
        />

        {discountPercent > 0 && (
          <div className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow-sm">
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* --- Content Section --- */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-2 text-left">
        <div>
          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {offer.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {offer.short_description
              ?.replace(/(<([^>]+)>)/gi, "")
              .replace(/&nbsp;/g, " ") || "No description available."}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-border/60 flex items-end justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-primary">
                Ksh {formatCurrency(Number(offer.price))}
              </span>
              {isDiscounted && (
                <span className="text-xs line-through text-muted-foreground">
                  {formatCurrency(Number(offer.regular_price))}
                </span>
              )}
            </div>
            {isDiscounted && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                Save Ksh {formatCurrency(Number(offer.regular_price) - Number(offer.price))}
              </span>
            )}
          </div>

          <Link
            href={`/products/${offer.slug}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg font-semibold text-xs transition-colors shrink-0"
          >
            <span>View</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OfferCard;
