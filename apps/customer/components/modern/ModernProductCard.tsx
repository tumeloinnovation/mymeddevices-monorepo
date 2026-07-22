import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Product } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, GitCompare } from "lucide-react";
import useCartStore from "@/lib/store/useCartStore";
import { cn } from "@/lib/utils";

interface ModernProductCardProps {
  product: Product;
}

export const ModernProductCard: React.FC<ModernProductCardProps> = ({ product }) => {
  const [imgSrc, setImgSrc] = useState(product?.images?.[0]?.src || (product?.images?.[0] as any)?.url || '/logos/logo-portrait.png');
  const price = product ? parseFloat(product.on_sale ? product.sale_price : product.price) : 0;
  
  const addToCart = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) => product ? state.isInCart(product.id) : false);

  return (
    <motion.div 
      className="group relative flex flex-col bg-white border border-slate-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:border-slate-200 h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-slate-50 rounded-xl overflow-hidden mb-4">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          onError={() => setImgSrc('/logos/logo-portrait.png')}
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        
        {/* Overlay Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button variant="secondary" size="icon" className="rounded-full shadow-sm">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full shadow-sm">
            <GitCompare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 mb-14">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          {product.categories?.[0]?.name || 'Medical Device'}
        </p>
        <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-slate-900">
          Ksh. {formatCurrency(price)}
        </p>
      </div>

      {/* Action Area */}
      <div className={cn(
          "absolute bottom-4 left-4 right-4 transition-opacity duration-300",
          isInCart ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <Button className="w-full rounded-xl" size="lg" onClick={() => addToCart(product as any)}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isInCart ? 'Added to Cart' : 'Add to Cart'}
        </Button>
      </div>
    </motion.div>
  );
};
