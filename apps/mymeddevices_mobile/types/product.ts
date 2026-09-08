export interface BackendProductImage {
  id: string | number;
  url: string;
  alt_text?: string | null;
  sort_order?: number;
  is_primary?: boolean;
}

export interface BackendProductVariant {
  id: string | number;
  product_id: string | number;
  name: string;
  sku?: string | null;
  price?: number | null;
  stock_quantity?: number;
  stock_status?: string;
  is_active?: boolean;
  attributes?: Record<string, string>;
}

export interface BackendProduct {
  id: string | number;
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  short_description?: string | null;
  category_id?: string | number | null;
  category_name?: string | null;
  category_slug?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
  currency?: string;
  is_on_sale?: boolean;
  in_stock?: boolean;
  stock_status?: string | null;
  stock_quantity?: number | null;
  is_featured?: boolean;
  popularity_score?: number;
  brand?: string | null;
  model_number?: string | null;
  specifications?: Record<string, any> | null;
  certifications?: string[] | null;
  warranty_info?: string | null;
  images?: BackendProductImage[];
  variants?: BackendProductVariant[];
  related_products?: {
    id: string | number;
    related_product_id: string | number;
    relation_type: string;
  }[];
  created_at?: string;
  average_rating?: number | string | null;
  review_count?: number;
  image_url?: string | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  status: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from_gmt: string | null;
  date_on_sale_to_gmt: string | null;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  stock_quantity: number;
  stock_status: string;
  average_rating: string;
  rating_count: number;
  categories: ProductCategory[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  quantity: number;
  dimensions: Dimensions;
  related_ids: number[];
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: number | string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  src: string;
  name: string;
  alt: string;
}

export interface ProductAttribute {
  id: number | string;
  name: string;
  position?: number;
  visible?: boolean;
  variation?: boolean;
  options: string[];
}

export interface Dimensions {
  length: string;
  width: string;
  height: string;
}
