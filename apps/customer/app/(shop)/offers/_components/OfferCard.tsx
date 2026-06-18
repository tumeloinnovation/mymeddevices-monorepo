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
    <div className="group relative w-full max-w-[250px] sm:max-w-[280px] md:max-w-[300px] flex flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-background via-card to-muted/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-out">
      {/* --- Image --- */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={offer.images?.[0]?.src || "/logos/logo-portrait.png"}
          alt={offer.name}
          fill
          sizes="384px"
          className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
        />

        {/* Overlay gradient + discount */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {discountPercent > 0 && (
          <div className="absolute left-4 top-4 text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow-md">
            {discountPercent}% Off
          </div>
        )}
      </div>

      {/* --- Content --- */}
      <div className="relative p-5 flex flex-col gap-3 flex-1">
        <h3 className="text-lg font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {offer.name}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {offer.short_description
            ?.replace(/(<([^>]+)>)/gi, "")
            .replace(/&nbsp;/g, " ") || "No description available."}
        </p>

        {/* --- Price --- */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-primary">
            Ksh. {formatCurrency(Number(offer.price))}
          </span>
          {isDiscounted && (
            <span className="text-sm line-through text-muted-foreground">
              Ksh. {formatCurrency(Number(offer.regular_price))}
            </span>
          )}
        </div>

        {isDiscounted && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            You save Ksh.{" "}
            {formatCurrency(
              Number(offer.regular_price) - Number(offer.price)
            )}
          </span>
        )}
      </div>

      {/* --- Floating CTA --- */}
      <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
        <div className="bg-primary/90 backdrop-blur-sm py-3 flex items-center justify-center gap-2 text-white font-medium text-sm tracking-wide">
          <ShoppingBag className="h-4 w-4" />
          <Link href={`/products/${offer.slug}`} className="flex items-center gap-1">
            View Offer <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OfferCard;
