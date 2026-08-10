"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { catalogService, CategoryTree, Brand, useAuthStore, VendorListItem } from "@mymeddevices/shared-core";
import { toast } from "sonner";

import DashboardLayout from "@/components/dashboard-layout";
import { ProductWizardShell } from "@mymeddevices/shared-admin";

export default function NewProductPage() {
  const router = useRouter();
  const { listVendorsAdmin } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesData, brandsData, vendorsResult] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getBrands({ active_only: true }),
          listVendorsAdmin({ page: 1, page_size: 100 })
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

        const vendorsData = Array.isArray(vendorsResult?.vendors) ? vendorsResult.vendors : [];
        const approvedVendors = vendorsData.filter((v: VendorListItem) => v.approval_status === "approved");
        setVendors(approvedVendors);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load required data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [listVendorsAdmin]);

  const handleBack = () => {
    router.push("/dashboard/catalog/products");
  };

  const handleSuccessRedirect = (productId: string) => {
    toast.success("Product created successfully!");
    router.push(`/dashboard/catalog/products/${productId}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading product data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ProductWizardShell
        role="admin"
        categories={categories}
        brands={brands}
        vendors={vendors}
        onSuccessRedirect={handleSuccessRedirect}
        onBack={handleBack}
      />
    </DashboardLayout>
  );
}
