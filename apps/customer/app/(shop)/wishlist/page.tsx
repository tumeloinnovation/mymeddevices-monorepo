"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingCart, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ProductCard from "@/app/(shop)/products/_components/ProductCard";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import useCartStore from "@/lib/store/useCartStore";

const WishlistPage: React.FC = () => {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clear = useWishlistStore((s) => s.clear);
  const addToCart = useCartStore((s) => s.addItem);
  const isInCart = useCartStore((s) => s.isInCart);

  const handleAddAllToCart = () => {
    items.forEach((p) => addToCart(p, 1));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">

        <h1 className="text-2xl font-semibold">My Wishlist</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => clear()} title="Clear wishlist">
            Clear
          </Button>

        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto w-20 h-20 flex items-center justify-center text-muted-foreground">
            <Heart className="w-10 h-10 text-muted-foreground/80" />
          </div>
          <h2 className="text-lg font-medium mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-muted-foreground mb-4">Save items you love to view or purchase later.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/products" className="inline-flex">
              <Button>Browse products</Button>
            </Link>
            <Link href="/" className="inline-flex">
              <Button variant="ghost">Continue shopping</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.isArray(items) && items.map((product: any) => (
              <ProductCard
                key={product.id ?? product.slug ?? product.sku}
                product={product}
                externalAdded={isInCart(product.id ?? product.slug ?? product.sku)}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">

            </div>
            <div className="text-sm text-muted-foreground">{items.length} item{items.length > 1 ? 's' : ''} in wishlist</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
