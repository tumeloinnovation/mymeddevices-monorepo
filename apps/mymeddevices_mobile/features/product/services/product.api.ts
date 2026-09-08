/**
 * Product API endpoints connecting to FastAPI backend
 */
import { api } from "@/services/api.client";
import { CategoryQueryParams, ProductQueryParams } from "@/types/api";
import { Category } from "@/types/category";
import { BackendProduct, Product } from "@/types/product";

export function mapProduct(p: BackendProduct | any): Product {
  const images = (p.images || []).map((img: any, idx: number) => ({
    id: img.id || idx + 1,
    src: img.url || img.src || "",
    alt: img.alt_text || img.alt || p.name || "",
    date_created: img.created_at || "",
    date_created_gmt: img.created_at || "",
    date_modified: img.updated_at || "",
    date_modified_gmt: img.updated_at || "",
    name: p.name || "",
  }));

  if (images.length === 0 && p.image_url) {
    images.push({
      id: 1,
      src: p.image_url,
      alt: p.name || "",
      date_created: "",
      date_created_gmt: "",
      date_modified: "",
      date_modified_gmt: "",
      name: p.name || "",
    });
  }

  const categoryName = p.category_name || (p.category ? p.category.name : "Medical Device");
  const categorySlug = p.category_slug || (p.category ? p.category.slug : "medical-devices");
  const categoryId = p.category_id || 1;

  const categories = [
    {
      id: categoryId,
      name: categoryName,
      slug: categorySlug,
    },
  ];

  const priceVal = p.price !== undefined && p.price !== null ? String(p.price) : "0";
  const regularPriceVal = p.compare_at_price ? String(p.compare_at_price) : priceVal;
  const salePriceVal = p.is_on_sale ? priceVal : "";

  return {
    id: p.id,
    name: p.name || "Medical Device",
    slug: p.slug || String(p.id),
    permalink: p.permalink || `/products/${p.slug || p.id}`,
    status: p.status || "publish",
    description: p.description || "",
    short_description: p.short_description || "",
    sku: p.sku || "",
    price: priceVal,
    regular_price: regularPriceVal,
    sale_price: salePriceVal,
    date_on_sale_from_gmt: p.date_on_sale_from_gmt ? String(p.date_on_sale_from_gmt) : null,
    date_on_sale_to_gmt: p.date_on_sale_to_gmt ? String(p.date_on_sale_to_gmt) : null,
    on_sale: Boolean(p.is_on_sale),
    purchasable: p.stock_status !== "outofstock",
    total_sales: p.popularity_score || 0,
    stock_quantity: p.stock_quantity ?? (p.in_stock ? 1 : 0),
    stock_status: p.stock_status || (p.in_stock ? "instock" : "outofstock"),
    average_rating:
      p.average_rating !== undefined && p.average_rating !== null
        ? String(p.average_rating)
        : "0",
    rating_count: p.review_count || 0,
    categories,
    images,
    attributes: [
      ...(p.brand ? [{ id: 1, name: "Brand", options: [p.brand] }] : []),
      ...(p.model_number ? [{ id: 2, name: "Model", options: [p.model_number] }] : []),
      ...(Array.isArray(p.attributes) ? p.attributes : []),
    ],
    quantity: 1,
    dimensions: {
      length: p.dimensions?.length ? String(p.dimensions.length) : "0",
      width: p.dimensions?.width ? String(p.dimensions.width) : "0",
      height: p.dimensions?.height ? String(p.dimensions.height) : "0",
    },
    related_ids: (p.related_products || []).map((rp: any) => rp.related_product_id || rp.id),
  };
}

function mapCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    parent: c.parent_id || 0,
    parent_id: c.parent_id || null,
    icon_url: c.icon_url || null,
    description: c.description || "",
    display: "default",
    image: {
      id: 1,
      src: c.image_url || "",
      name: c.name,
      alt: c.name,
      date_created: "",
      date_created_gmt: "",
      date_modified: "",
      date_modified_gmt: "",
    },
    menu_order: c.sort_order || 0,
    count: c.product_count || 0,
    children: Array.isArray(c.children) ? c.children.map(mapCategory) : [],
  };
}

export const productApi = {
  /**
   * Get a list of products with optional filters
   */
  getProducts: async (params: ProductQueryParams): Promise<Product[]> => {
    const queryParams: any = {
      page: params.page || 1,
      page_size: params.per_page || 20,
    };
    if (params.search) queryParams.search = params.search;
    if (params.category) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(params.category));
      if (isUUID) {
        queryParams.category_id = params.category;
      } else {
        queryParams.category_slug = params.category;
      }
      queryParams.category = params.category;
    }
    if (params.on_sale) queryParams.is_on_sale = true;
    if (params.min_price) queryParams.price_min = parseFloat(params.min_price);
    if (params.max_price) queryParams.price_max = parseFloat(params.max_price);
    if (params.orderby === "price") {
      queryParams.sort_by = params.order === "asc" ? "price_asc" : "price_desc";
    } else if (params.orderby === "popularity") {
      queryParams.sort_by = "popular";
    }

    const response = await api.get<{ products: any[]; total: number }>("/storefront/products", {
      params: queryParams,
    });
    const data = response.data?.products || (Array.isArray(response.data) ? response.data : []);
    return data.map(mapProduct);
  },

  /**
   * Get a single product by ID or slug
   */
  getProduct: async (productId: string | number | undefined): Promise<Product> => {
    const response = await api.get<any>(`/storefront/products/${productId}`);
    const data = response.data?.data || response.data;
    return mapProduct(data);
  },

  /**
   * Search products by query string
   */
  searchProducts: async (query: string): Promise<Product[]> => {
    return productApi.getProducts({ search: query });
  },

  /**
   * Get products currently on sale
   */
  getOnSaleProducts: async (): Promise<Product[]> => {
    return productApi.getProducts({ on_sale: true, per_page: 15 });
  },

  /**
   * Get newest products
   */
  getNewestProducts: async (): Promise<Product[]> => {
    return productApi.getProducts({ orderby: "date", order: "desc", per_page: 15 });
  },

  /**
   * Get all product categories (tree structure preserved)
   */
  getCategories: async (_params?: CategoryQueryParams): Promise<Category[]> => {
    const response = await api.get<any>("/storefront/categories");
    const rawCategories: any[] = Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
    
    return rawCategories.map(mapCategory);
  },

  /**
   * Get products by category
   */
  getProductsByCategory: async (params: ProductQueryParams): Promise<Product[]> => {
    return productApi.getProducts(params);
  },

  /**
   * Get product buy-box options and winning offers
   */
  getProductBuyBox: async (slugOrId: string | number): Promise<any> => {
    const response = await api.get<any>(`/storefront/products/${slugOrId}/buy-box`);
    return response.data?.data || response.data;
  },

  /**
   * Get related products (cross-sell, up-sell, accessories)
   */
  getRelatedProducts: async (slugOrId: string | number): Promise<Product[]> => {
    try {
      const response = await api.get<any>(`/storefront/products/${slugOrId}/related`);
      const list = response.data?.data || response.data?.products || (Array.isArray(response.data) ? response.data : []);
      return list.map(mapProduct);
    } catch {
      return [];
    }
  },

  /**
   * Get single category by slug
   */
  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    try {
      const response = await api.get<any>(`/storefront/categories/${slug}`);
      const data = response.data?.data || response.data;
      return data ? mapCategory(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * List promotional bundles
   */
  getBundles: async (): Promise<any[]> => {
    try {
      const response = await api.get<any>("/storefront/bundles");
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch {
      return [];
    }
  },

  /**
   * Get specific bundle detail
   */
  getBundle: async (slug: string): Promise<any> => {
    const response = await api.get<any>(`/storefront/bundles/${slug}`);
    return response.data?.data || response.data;
  },

  /**
   * Get approved medical equipment brands
   */
  getBrands: async (): Promise<any[]> => {
    try {
      const response = await api.get<any>("/catalog/brands");
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch {
      return [];
    }
  },

  /**
   * Get clinical and promotional product tags
   */
  getTags: async (): Promise<any[]> => {
    try {
      const response = await api.get<any>("/catalog/tags");
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch {
      return [];
    }
  },

  /**
   * Get AI-powered and trending product recommendations
   */
  getRecommendations: async (params?: { category_id?: string; limit?: number }): Promise<Product[]> => {
    try {
      const response = await api.get<any>("/recommendations/products", { params });
      const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      return list.map(mapProduct);
    } catch {
      return [];
    }
  },

  /**
   * Get active homepage and campaign banners
   */
  getBanners: async (placement?: string): Promise<any[]> => {
    try {
      const response = await api.get<any>("/shopping/banners", {
        params: placement ? { placement } : undefined,
      });
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch {
      try {
        const fallback = await api.get<any>("/banners/public", {
          params: placement ? { placement } : undefined,
        });
        return fallback.data?.data || (Array.isArray(fallback.data) ? fallback.data : []);
      } catch {
        return [];
      }
    }
  },
};

