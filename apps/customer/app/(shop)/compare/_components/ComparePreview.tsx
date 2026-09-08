"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ExternalLink } from "lucide-react";
import { useCompareStore } from "@/lib/store/useCompareStore";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils/utils";
import { getValidImageUrl } from "@/lib/utils/image";

type CompareItem = {
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
  const rawImage = item?.image ?? (item?.images ? (Array.isArray(item.images) ? (item.images[0]?.src ?? item.images[0]?.url ?? item.images[0]) : item?.image_url) : item?.image_url);
  const image = getValidImageUrl(rawImage, "/logos/logo-portrait.png");
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
      <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-muted">
        <Image
              src={image}
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
        aria-label={`Remove ${item.name} from compare`}
        title="Remove"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
};

const ComparePreview: React.FC = () => {
  const items = useCompareStore((s) => s.items);
  const removeItem = useCompareStore((s) => s.removeItem);
  const clear = useCompareStore((s) => s.clear);

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
            href="/compare"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink size={14} />
            <span>View compare</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => clear()}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/10"
              aria-label="Clear all compared items"
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

export default ComparePreview;
