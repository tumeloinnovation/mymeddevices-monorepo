"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCategoryBySlug, useCategoryProducts } from "@/lib/hooks/useCategories";
import ShopPage from "../../../_components/ShopPage";

interface CategoryDetailPageProps {
  slug: string;
}

const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({ slug }) => {
  const router = useRouter();
  const { data: category, isLoading: categoryLoading, isError: categoryError } = useCategoryBySlug(slug);
  const { data: products, isLoading: productsLoading, isError: productsError } = useCategoryProducts(slug);

  // Redirect to 404 if category doesn't exist (client-side handling)
  useEffect(() => {
    if (!categoryLoading && !category && !categoryError) {
      router.replace("/404");
    }
  }, [category, categoryLoading, categoryError, router]);

  if (categoryLoading || productsLoading) {
    return (
      <ShopPage
        products={[]}
        categories={[]}
        initialSelectedCategory={slug}
        isLoading={true}
      />
    );
  }

  if (categoryError || productsError) {
    return (
      <ShopPage
        products={products}
        categories={[]}
        initialSelectedCategory={slug}
      />
    );
  }

  return (
    <ShopPage
      products={products}
      categories={[]}
      initialSelectedCategory={slug}
    />
  );
};

export default CategoryDetailPage;
