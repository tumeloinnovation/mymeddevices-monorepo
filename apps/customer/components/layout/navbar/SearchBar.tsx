"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import type { Product } from "@/lib/data/types";
import { formatCurrency } from "@/lib/utils/utils";

interface SearchBarProps {
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ placeholder }) => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Use the search hook
  const { data: products = [], isLoading, debouncedQuery, isSearching } = useProductSearch(query);

  // Close results when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Show results when we have data or are loading
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [debouncedQuery]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
  };

  // Handle product click - navigate to product detail
  const handleProductClick = (product: Product) => {
    router.push(`/products/${product.slug}`);
    setShowResults(false);
    setQuery("");
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults) return;

    // Allow escape to work even with no products
    if (e.key === "Escape") {
      setShowResults(false);
      return;
    }

    // Only allow navigation if we have products
    if (products.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < products.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0) {
          handleProductClick(products[selectedIndex]);
        }
        break;
    }
  };

  return (
    <div
      ref={searchRef}
      className="relative w-full max-w-2xl mx-auto hidden md:block"
    >
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={placeholder || "Search for products..."}
          value={query}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          className="w-full h-10 rounded-full border border-primary/30 px-4 pr-10 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
        <div className="absolute right-2 flex items-center justify-center">
          {isSearching ? (
            <Loader2 size={18} className="animate-spin text-primary" />
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Search size={16} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Animated Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background border border-primary/10 rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {isSearching ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 size={20} className="animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            ) : Array.isArray(products) && products.length > 0 ? (
              products.map((item: Product, index: number) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleProductClick(item)}
                  className={`flex items-center w-full p-2 text-left hover:bg-primary/5 transition-colors ${
                    index === selectedIndex ? "bg-primary/10" : ""
                  }`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={item.images[0]?.src || "/placeholder-product.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.categories[0]?.name || "Uncategorized"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-primary">
                    Ksh {formatCurrency(parseFloat(item.price))}
                  </p>
                </motion.button>
              ))
            ) : query.length > 0 && query.length < 2 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              </div>
            ) : debouncedQuery.length >= 2 ? (
              <div className="p-6 text-center">
                <div className="text-muted-foreground mb-2">
                  <Search size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No products found</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  We couldn't find any products matching "{debouncedQuery}". Try adjusting your search terms.
                </p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
