"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCategoryBySlug, useCategoryProducts, useCategories } from "@/lib/hooks/useCategories";
import ShopPage from "../../../_components/ShopPage";

interface CategoryDetailPageProps {
  slug: string;
}

const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({ slug }) => {
  const router = useRouter();
  const { data: category, isLoading: categoryLoading, isError: categoryError } = useCategoryBySlug(slug);
  const { data: products, isLoading: productsLoading, isError: productsError } = useCategoryProducts(slug);
  const { data: categories = [] } = useCategories();

  // Handle fallback if category slug is intent-based or custom
  useEffect(() => {
    // Only redirect if both loading finished, category is missing, AND error is present
    if (!categoryLoading && !category && categoryError) {
      router.replace("/404");
    }
  }, [category, categoryLoading, categoryError, router]);

  if (categoryLoading || productsLoading) {
    return (
      <ShopPage
        products={[]}
        categories={categories}
        initialSelectedCategory={slug}
        isLoading={true}
      />
    );
  }

  if (categoryError || productsError) {
    return (
      <ShopPage
        products={products}
        categories={categories}
        initialSelectedCategory={slug}
      />
    );
  }

  return (
    <ShopPage
      products={products}
      categories={categories}
      initialSelectedCategory={slug}
    />
  );
};

export default CategoryDetailPage;
