"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ExternalLink } from "lucide-react";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils/utils";

type WishlistItem = {
  id: string | number;
  name: string;
  price: number | string;
  image?: string;
};

const rowVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const ItemRow: React.FC<{ item: any; onRemove: (id: string | number) => void }> = ({ item, onRemove }) => {
  const id = item?.id ?? item?.sku ?? item?.slug;
  const name = item?.name ?? String(id ?? "");
  const image = item?.image ?? (item?.images ? (Array.isArray(item.images) ? (item.images[0]?.src ?? item.images[0]) : undefined) : undefined);
  const price = Number(item?.price ?? item?.regular_price ?? 0);
  return (
    <motion.div
      layout
      initial="initial"
      animate="animate"
      exit="exit"
      variants={rowVariants}
      className="flex items-center gap-3 p-2 rounded-md"
    >
      <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
        <Image
          src={image || "/logos/logo-portrait.png"}
          alt={name}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">Ksh {formatCurrency(price)}</p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="p-1 rounded hover:bg-muted/20 text-muted-foreground"
        aria-label={`Remove ${item.name} from wishlist`}
        title="Remove"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
};

const WishlistPreview: React.FC = () => {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clear = useWishlistStore((s) => s.clear);

  if (!items.length) {
    return null;
  }

  return (
    <div className="flex flex-col divide-y divide-muted/30">
      <div className="relative">
        <div className="space-y-1 max-h-56 overflow-auto pr-1 styled-scrollbar" style={{ scrollbarGutter: "stable" }}>
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <ItemRow key={item.id} item={item} onRemove={removeItem} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="pt-3 mt-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/wishlist"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink size={14} />
            <span>View wishlist</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => clear()}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/10"
              aria-label="Clear all wishlist items"
            >
              Clear all
            </button>
            <div className="ml-1 text-xs text-muted-foreground" aria-hidden>
              {items.length} item{items.length > 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistPreview;