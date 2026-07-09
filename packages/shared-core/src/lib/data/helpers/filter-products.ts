import { Product, ProductFilterParams } from "../types";

export function filterProducts(products: Product[], params: ProductFilterParams): Product[] {
  return products.filter((product) => {
    // Search filter
    if (params.search && !product.name.toLowerCase().includes(params.search.toLowerCase())) {
      return false;
    }

    // Category filter
    if (params.category) {
      const hasCategory = product.categories.some(
        (cat) => cat.slug === params.category || cat.id.toString() === params.category
      );
      if (!hasCategory) return false;
    }

    // Brand filter
    if (params.brand) {
      const brandSlug = params.brand;
      const hasBrand = product.brands?.some(
        (b) => b.slug === brandSlug || b.name.toLowerCase() === brandSlug.toLowerCase()
      );
      if (!hasBrand) return false;
    }

    // Price filter
    const price = parseFloat(product.price);
    if (params.min_price !== undefined && price < params.min_price) {
      return false;
    }
    if (params.max_price !== undefined && price > params.max_price) {
      return false;
    }

    // On sale filter
    if (params.on_sale !== undefined && product.on_sale !== params.on_sale) {
      return false;
    }

    // Featured filter
    if (params.featured !== undefined && product.featured !== params.featured) {
      return false;
    }

    // Stock status filter
    if (params.stock_status && params.stock_status !== 'any' && product.stock_status !== params.stock_status) {
      return false;
    }

    // Rating filter
    if (params.min_rating !== undefined && parseFloat(product.average_rating) < params.min_rating) {
      return false;
    }

    // Vendor ID filter
    if (params.vendor_id !== undefined) {
      const vendorIdMeta = product.meta_data.find(m => m.key === '_vendor_id');
      if (!vendorIdMeta || Number(vendorIdMeta.value) !== params.vendor_id) {
        return false;
      }
    }

    // Status filter
    if (params.status) {
      const normalizedParamStatus = params.status === 'publish' ? 'published' : params.status;
      const normalizedProdStatus = product.status === 'publish' ? 'published' : product.status;
      if (normalizedProdStatus !== normalizedParamStatus) {
        return false;
      }
    }

    // IDs filter
    if (params.ids && !params.ids.includes(product.id)) {
      return false;
    }

    return true;
  });
}
