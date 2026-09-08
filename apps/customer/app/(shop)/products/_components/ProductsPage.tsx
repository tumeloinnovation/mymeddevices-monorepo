"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/lib/hooks/useProducts";
import { useCategories } from "@/lib/hooks/useCategories";
import ShopPage from "../../_components/ShopPage";

const ProductsPage = () => {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || undefined;

  // Fetch published products (high limit for full catalog client filtering)
  const { products, isLoading, isError, error } = useProducts({ status: "publish", per_page: 200 });
  const { data: categories = [] } = useCategories();

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-destructive mb-2">Failed to load products</h2>
          <p className="text-muted-foreground mb-4">{String(error ?? "Unknown error")}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ShopPage
      products={products}
      categories={categories}
      initialSelectedCategory={categoryParam}
      title="All Products"
      isLoading={isLoading}
    />
  );
};

export default ProductsPage;
