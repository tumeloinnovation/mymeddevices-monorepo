"use client";

import React from "react";
import { Minus, Plus, X } from "lucide-react";
import useCartStore from "@/lib/store/useCartStore";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { formatCurrency } from "@/lib/utils/utils";
import { getValidImageUrl } from "@/lib/utils/image";

type CartItemProps = {
  item: {
    id: number;
    name: string;
    price: string;
    images?: { src: string }[];
    image_url?: string;
    quantity: number;
  };
};

export default function CartItemRow({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const imageSrc = getValidImageUrl(item.images?.[0]?.src || item.image_url, '/logos/logo-portrait.png');

  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0">
      <Image src={imageSrc} alt={item.name} width={80} height={80} className="object-cover rounded" />
      <div className="flex-1">
        <div className="font-semibold">{item.name}</div>
        <div className="text-sm text-muted-foreground">Ksh. {formatCurrency(Number(item.price))}</div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease">
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-10 text-center font-medium">{item.quantity}</div>

        <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-32 text-right font-semibold">Ksh. {formatCurrency(Number(item.price) * item.quantity)}</div>

      <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} aria-label="Remove">
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
