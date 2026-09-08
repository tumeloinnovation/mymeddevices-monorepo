export type SortDirection = "asc" | "desc";

export type OrderByProduct =
  | "date"
  | "id"
  | "include"
  | "title"
  | "slug"
  | "modified"
  | "menu_order"
  | "price"
  | "popularity"
  | "rating";

export type StockStatus = "instock" | "outofstock" | "onbackorder";

export interface ProductQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  order?: SortDirection;
  category?: string;
  orderby?: OrderByProduct;
  on_sale?: boolean;
  min_price?: string;
  max_price?: string;
  stock_status?: StockStatus;
  status?: string;
}

export type ProductReviewStatus = "all" | "hold" | "approved" | "spam";

export interface ProductReviewsQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  order?: SortDirection;
  orderby?: "date" | "id" | "product";
  reviewer?: string | number;
  reviewer_email?: string;
  product?: string | number;
  status?: ProductReviewStatus;
}

export interface CreateProductReviewParams {
  product_id: number;
  review: string;
  reviewer?: string;
  reviewer_email?: string;
  rating: number;
}

export interface SubmitReviewRequest {
  product_id: number;
  review: string;
  rating: number;
  reviewer_name: string;
  reviewer_email: string;
}

export type OrderByCategory =
  | "id"
  | "include"
  | "name"
  | "slug"
  | "term_group"
  | "description"
  | "count";

export interface CategoryQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  order?: SortDirection;
  orderby?: OrderByCategory;
  hide_empty?: boolean;
  category?: string | number;
}

export interface OrderQueryParams {
  key?: string;
  status?: string;
  customer?: string | number;
  order?: SortDirection;
  orderby?: string;
  per_page?: number;
  page?: number;
  search?: string;
  after?: string;
  before?: string;
}
