"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  catalogService,
  CategoryTree,
  Product,
  ProductCompleteness,
  AIValidationResponse,
} from "@mymeddevices/shared-core";
import { usersService } from "@mymeddevices/shared-core";
import { toast } from "sonner";

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => catalogService.getProduct(id),
    enabled: !!id,
  });
}

export function useProductCompleteness(id: string) {
  return useQuery({
    queryKey: ["admin", "product", id, "completeness"],
    queryFn: () => catalogService.getCompleteness(id),
    enabled: !!id,
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const cats = await catalogService.getCategories();
      const flat: CategoryTree[] = [];
      const flatten = (list: CategoryTree[]) => {
        list.forEach((cat) => {
          flat.push(cat);
          if (cat.children?.length > 0) flatten(cat.children);
        });
      };
      flatten(cats);
      return flat;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function findVendorName(
  vendorId: string,
  vendors: { id: string; name: string; company_name?: string; store_name?: string }[]
) {
  const v = vendors.find((x) => x.id === vendorId);
  return v?.company_name || v?.name || v?.store_name;
}

export function useVendorsOverview() {
  return useQuery({
    queryKey: ["admin", "vendors", "overview"],
    queryFn: async () => {
      const data = await usersService.getVendorsOverview({
        page: 1,
        page_size: 1000,
      });
      return data.vendors;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useProductMutations(id: string) {
  const queryClient = useQueryClient();

  const invalidateProduct = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "product", id] });
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "product", id, "completeness"] });
  };

  const update = useMutation({
    mutationFn: (data: Partial<Product>) => catalogService.updateProduct(id, data),
    onSuccess: () => {
      invalidateProduct();
      toast.success("Product updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update product"),
  });

  const verify = useMutation({
    mutationFn: () => catalogService.verifyProduct(id),
    onSuccess: () => {
      invalidateProduct();
      toast.success("Product submitted for review");
    },
    onError: (err: any) => toast.error(err.message || "Failed to submit for review"),
  });

  const publish = useMutation({
    mutationFn: () => catalogService.publishProduct(id),
    onSuccess: () => {
      invalidateProduct();
      toast.success("Product published");
    },
    onError: (err: any) => toast.error(err.message || "Failed to publish"),
  });

  const archive = useMutation({
    mutationFn: () => catalogService.archiveProduct(id),
    onSuccess: () => {
      invalidateProduct();
      toast.success("Product archived");
    },
    onError: (err: any) => toast.error(err.message || "Failed to archive"),
  });

  const deleteProduct = useMutation({
    mutationFn: () => catalogService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.removeQueries({ queryKey: ["admin", "product", id] });
      toast.success("Product deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete product"),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      catalogService.rejectProduct(id, reason),
    onSuccess: () => {
      invalidateProduct();
      toast.success("Product rejected with feedback");
    },
    onError: (err: any) => toast.error(err.message || "Failed to reject product"),
  });

  return { update, verify, publish, archive, delete: deleteProduct, reject };
}

export function useImageMutations(productId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "product", productId] });
    queryClient.invalidateQueries({ queryKey: ["admin", "product", productId, "completeness"] });
  };

  const upload = useMutation({
    mutationFn: ({ file, isPrimary }: { file: File; isPrimary: boolean }) =>
      catalogService.uploadImage(productId, file, { is_primary: isPrimary }),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err.message || "Failed to upload image"),
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => catalogService.removeImage(productId, imageId),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err.message || "Failed to remove image"),
  });

  const reorder = useMutation({
    mutationFn: (imageIds: string[]) => catalogService.reorderImages(productId, imageIds),
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err.message || "Failed to update image order"),
  });

  return { upload, remove, reorder };
}

export function useAIGenerate(id: string) {
  return useMutation({
    mutationFn: () =>
      catalogService.getAiSuggestions(id, {
        fields_to_generate: [
          "description",
          "short_description",
          "meta_title",
          "meta_description",
        ],
      }),
    onError: (err: any) => toast.error(err.message || "AI generation failed"),
  });
}

export function useAIValidate(id: string) {
  return useMutation({
    mutationFn: () => catalogService.aiValidateProduct(id),
    onSuccess: (result: AIValidationResponse) => {
      if (result.is_valid) {
        toast.success(result.summary || "AI validation passed successfully");
      } else {
        toast.error(result.summary || "AI validation found critical issues");
      }
      // Show recommendations if any
      if (result.recommendations && result.recommendations.length > 0) {
        result.recommendations.forEach((rec) => {
          toast.info(rec);
        });
      }
    },
    onError: (err: any) => toast.error(err.message || "AI validation failed"),
  });
}
