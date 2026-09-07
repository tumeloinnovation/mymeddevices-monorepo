import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import Image from 'next/image';
import { getValidImageUrl } from "@/lib/utils/image";
import { Product } from "@/lib/data/types";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/utils";



interface ProductDropdownMenuProps {
  title: string;
  linkHref: string;
  linkDescription: string;
  products: Product[];
}

export const ProductDropdownMenu: React.FC<ProductDropdownMenuProps> = ({
  title,
  linkHref,
  linkDescription,
  products,
}) => {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{title}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-full gap-3 p-4 md:w-[700px] md:grid-cols-3 lg:w-[900px]">
          {/* Left panel link */}
          <div className="col-span-1">
            <NavigationMenuLink asChild>
              <Link
                href={linkHref}
                className="from-blue-50 to-blue-100 flex h-full select-none flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none focus:shadow-md"
              >
                <div className="mb-2 mt-4 text-lg font-medium">{title}</div>
                <p className="text-sm leading-tight text-muted-foreground">
                  {linkDescription}
                </p>
              </Link>
            </NavigationMenuLink>
          </div>

          {/* Right panel: Scrollable product cards */}
          <div className="col-span-2 w-full md:col-span-2 relative">
            {/* Left chevron */}
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollBy(-240)}
              className="hidden md:flex items-center justify-center absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-1 shadow-sm hover:bg-gray-100"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Right chevron */}
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollBy(240)}
              className="hidden md:flex items-center justify-center absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white p-1 shadow-sm hover:bg-gray-100"
            >
              <ChevronRight size={18} />
            </button>

            {/* Scrollable area */}
            <div ref={scrollRef} className="overflow-x-auto hide-scrollbar">
              <div className="flex space-x-6 pb-4">
                {Array.isArray(products) && products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => router.push(`/products/${product.slug}`)}
                    className="flex-shrink-0 w-48 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transform transition-transform duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer"
                  >
                    <div className="flex h-full flex-col">
                      <div className="relative p-4 flex items-center justify-center h-28 bg-gray-50">
                        <Image
                          fill
                          src={getValidImageUrl(product.images?.[0]?.src || (product as any)?.image_url, "/logos/logo-portrait.png")}
                          alt={product.name}
                          className="object-contain"
                        />
                      </div>
                      <div className="p-3 border-t border-gray-200 bg-white flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {product.categories?.[0]?.name || "Category"}
                          </div>
                          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.5rem]">
                            {product.name}
                          </h3>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <div className="flex items-baseline space-x-2">
                            <p className="text-lg font-bold text-green-600">
                              Ksh {formatCurrency(Number(product.price))}
                            </p>
                            {product.regular_price && product.regular_price !== product.price && (
                              <p className="text-sm text-gray-400 line-through">
                                Ksh {formatCurrency(Number(product.regular_price))}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fades */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 md:block hidden">
                <div className="h-full w-full bg-gradient-to-r from-white/80 to-transparent dark:from-black/60"></div>
              </div>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 md:block hidden">
                <div className="h-full w-full bg-gradient-to-l from-white/80 to-transparent dark:from-black/60"></div>
              </div>
            </div>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};
