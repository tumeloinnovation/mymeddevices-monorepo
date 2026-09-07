import { reviewApi } from "./review.api";
import { ProductReviewsQueryParams } from "@/types/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys, CACHE_TIMES } from "@/services/queryKeys";

export const useProductReviews = (params: ProductReviewsQueryParams) => {
  return useInfiniteQuery({
    queryKey: queryKeys.reviews.list(params.product!),
    enabled: !!params.product,
    queryFn: ({ pageParam = 1 }) =>
      reviewApi.getProductReviews({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage?.length ? pages.length + 1 : undefined,
    ...CACHE_TIMES.SEMI_STATIC,
  });
};
