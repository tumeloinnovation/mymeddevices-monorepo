import { reviewApi } from "./review.api";
import { CreateProductReviewParams } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { toast } from "sonner-native";

export const usePostReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["review-product"],
    mutationFn: (params: CreateProductReviewParams) =>
      reviewApi.createReview(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.all,
      });
      toast.success("Review posted", {
        description: "Thanks for sharing your thoughts with the community.",
      });
    },
    onError: (error) => {
      toast.error("Review post failed", {
        description: error?.message || "Please try again in a moment.",
      });
    },

  });
};
