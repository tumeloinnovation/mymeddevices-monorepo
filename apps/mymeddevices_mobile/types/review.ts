export interface ProductReview {
  id: number | string;
  product_id: number | string;
  reviewer: string;
  reviewer_name: string;
  reviewer_email?: string;
  title?: string;
  review: string;
  rating: number;
  date_created: string;
  is_verified_buyer?: boolean;
}
