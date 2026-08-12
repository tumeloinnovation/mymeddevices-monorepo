"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { catalogService, CategoryTree, Brand, useAuthStore } from "@mymeddevices/shared-core";
import { toast } from "sonner";

import { ProductWizardShell } from "@mymeddevices/shared-admin";

export default function VendorNewProductPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getBrands({ active_only: true }),
        ]);

        const flatCategories: CategoryTree[] = [];
        const flatten = (catList: CategoryTree[]) => {
          catList.forEach((cat) => {
            flatCategories.push(cat);
            if (cat.children?.length > 0) flatten(cat.children);
          });
        };
        flatten(categoriesData);
        setCategories(flatCategories);
        setBrands(brandsData.brands || []);
      } catch (error) {
        console.error("Failed to load vendor product wizard data:", error);
        toast.error("Failed to load required data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleBack = () => {
    router.push("/vendor/products");
  };

  const handleSuccessRedirect = (productId: string) => {
    toast.success("Product submitted for review!");
    router.push(`/vendor/products`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading vendor catalog wizard...</p>
        </div>
      </div>
    );
  }

  const vendorId = (user as any)?.vendor_id || (user as any)?.vendor_profile?.id || "";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <ProductWizardShell
        role="vendor"
        initialVendorId={vendorId}
        categories={categories}
        brands={brands}
        onSuccessRedirect={handleSuccessRedirect}
        onBack={handleBack}
      />
    </div>
  );
}
