import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { productApi } from "@/features/product/services/product.api";

export const useProductSearch = () => {
  return useMutation({
    mutationKey: ["search-product"],
    mutationFn: (query: string) => productApi.searchProducts(query),
    onError: (error: any) => {
      toast.error("Product search failed", {
        description: error?.message || "Please try again.",
      });
    },
  });
};
