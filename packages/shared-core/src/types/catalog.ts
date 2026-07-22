export type ProductStatus = 'draft' | 'pending_review' | 'published' | 'archived';
export type PPBClassification = 'Class A' | 'Class B' | 'Class C' | 'Class D' | 'Unclassified';

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductImageCreate {
  url: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id?: string;
  category_name?: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price?: number;
  cost_price?: number;
  base_price?: number;
  markup_price?: number;
  commission_fee?: number;
  currency: string;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  status: ProductStatus;
  is_verified: boolean;
  verified_at?: string;
  rejection_reason?: string;
  is_featured: boolean;
  is_on_sale: boolean;
  popularity_score: number;
  view_count: number;
  weight_kg?: number;
  dimensions?: Record<string, any>;
  brand?: string;
  model_number?: string;
  specifications?: Record<string, any>;
  certifications?: string[];
  ppb_classification?: PPBClassification;
  ce_marking_or_fda_clearance?: string;
  kmpdb_registration_number?: string;
  warranty_info?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  ai_generated_fields?: Record<string, any>;
  completeness_score: number;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}


export interface ProductCreate {
  name: string;
  category_id?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price?: number;
  cost_price?: number;
  base_price?: number;
  currency?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  track_inventory?: boolean;
  weight_kg?: number;
  dimensions?: Record<string, any>;
  brand?: string;
  model_number?: string;
  specifications?: Record<string, any>;
  certifications?: string[];
  ppb_classification?: PPBClassification;
  ce_marking_or_fda_clearance?: string;
  kmpdb_registration_number?: string;
  warranty_info?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
}

export interface ProductUpdate extends Partial<ProductCreate> {}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  parent_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface CategoryUpdate extends Partial<CategoryCreate> {}

export interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  children: CategoryTree[];
}

export interface AIAssistRequest {
  fields_to_generate?: string[];
}

export interface AIDescriptionRequest {
  product_name: string;
  brand: string;
  category?: string;
}

export interface AIAssistResponse {
  suggestions: Record<string, any>;
  confidence: Record<string, number>;
  message: string;
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface AIValidationResponse {
  is_valid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  summary: string;
  recommendations: string[];
}

export interface CompletenessItem {
  field: string;
  label: string;
  weight: number;
  is_complete: boolean;
  is_required: boolean;
}

export interface ProductCompleteness {
  score: number;
  minimum_required: number;
  is_ready_to_verify: boolean;
  items: CompletenessItem[];
  missing_required: string[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  sort_order: number;
  is_active: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface BrandQuickCreate {
  name: string;
}

export interface BrandCreate {
  name: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface BrandUpdate extends Partial<BrandCreate> {}

export interface BrandListResponse {
  brands: Brand[];
  total: number;
  page: number;
  page_size: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface TagCreate {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface TagUpdate extends Partial<TagCreate> {}

export interface TagListResponse {
  tags: Tag[];
  total: number;
  page: number;
  page_size: number;
}
