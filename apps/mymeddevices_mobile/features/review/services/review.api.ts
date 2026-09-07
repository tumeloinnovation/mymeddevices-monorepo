/**
 * Review API endpoints connecting to FastAPI backend
 */
import { api } from "@/services/api.client";
import { CreateProductReviewParams, ProductReviewsQueryParams } from "@/types/api";
import { ProductReview } from "@/types/review";

export const reviewApi = {
  /**
   * Get reviews for a product
   */
  getProductReviews: async (params: ProductReviewsQueryParams): Promise<ProductReview[]> => {
    const productKey = params.product || "all";
    try {
      const response = await api.get<{ data: any[] }>(`/storefront/products/${productKey}/reviews`);
      const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      return list.map((r: any, idx: number) => ({
        id: r.id || idx + 1,
        date_created: r.created_at || new Date().toISOString(),
        product_id: params.product as any,
        reviewer: r.reviewer_name || "Verified Customer",
        reviewer_name: r.reviewer_name || "Verified Customer",
        reviewer_email: "",
        title: r.title || "",
        review: r.comment || r.review || "",
        rating: r.rating || 5,
        is_verified_buyer: r.is_verified_buyer ?? true,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Create a new product review
   */
  createReview: async (params: CreateProductReviewParams & { title?: string }): Promise<ProductReview> => {
    const response = await api.post<any>("/customers/me/reviews", {
      product_id: params.product_id,
      rating: params.rating,
      title: params.title || "",
      comment: params.review,
    });
    const r = response.data?.data || response.data;
    return {
      id: r?.id || 1,
      date_created: r?.created_at || new Date().toISOString(),
      product_id: params.product_id,
      reviewer: params.reviewer || "Customer",
      reviewer_name: params.reviewer || "Customer",
      reviewer_email: params.reviewer_email || "",
      title: params.title || "",
      review: params.review,
      rating: params.rating,
      is_verified_buyer: true,
    };
  },

  /**
   * Update an existing review's rating
   */
  updateReview: async (reviewId: number, rating: number, comment?: string): Promise<ProductReview> => {
    const response = await api.patch<any>(`/customers/me/reviews/${reviewId}`, {
      rating,
      comment,
    });
    const r = response.data?.data || response.data;
    return {
      id: reviewId,
      date_created: r?.created_at || new Date().toISOString(),
      product_id: 1,
      reviewer: "Customer",
      reviewer_name: "Customer",
      reviewer_email: "",
      review: r?.comment || "",
      rating,
    };
  },
};
