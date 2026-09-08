import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Product } from '@/lib/data/types'
import ProductDetailClient from './_components/ProductDetailClient'

const SITE_URL = 'https://mymeddevices.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Props = {
  params: Promise<{ slug: string }>
}

async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/storefront/products/${slug}`, {
        next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    // Map StorefrontProductResponse to Product type
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      short_description: data.short_description || '',
      sku: data.sku || 'N/A',
      price: data.price?.toString() || '0',
      regular_price: data.price?.toString() || '0',
      sale_price: data.compare_at_price?.toString() || '0',
      on_sale: data.is_on_sale,
      featured: data.is_featured,
      status: 'publish',
      stock_status: (data.in_stock === false || data.stock_status === 'outofstock') ? 'outofstock' : 'instock',
      manage_stock: Boolean(data.stock_quantity !== null && data.stock_quantity !== undefined),
      stock_quantity: data.stock_quantity ?? (data.in_stock !== false ? 999 : 0),
      total_sales: 0,
      average_rating: '0',
      rating_count: 0,
      images: data.images.map((img: any) => ({
        src: img.url,
        alt: img.alt_text,
        position: img.sort_order
      })),
      categories: data.category_name ? [{ id: data.category_id, name: data.category_name, slug: '' }] : [],
      tags: (data.tags || []).map((t: string) => ({ id: 0, name: t, slug: t, description: '', count: 0 })),
      attributes: [],
      related_ids: [],
      brands: data.brand ? [{ id: 0, name: data.brand, slug: data.brand.toLowerCase().replace(/ /g, '-') }] : [],
      weight: data.weight_kg?.toString() || '0',
      dimensions: data.dimensions || { length: '0', width: '0', height: '0' },
      meta_data: [],
      date_created: data.created_at,
      permalink: '',
      type: data.product_type || 'simple',
      product_type: data.product_type || 'simple',
      purchasable: true,
      catalog_visibility: 'visible',
      model_number: data.model_number || '',
      specifications: data.specifications || {},
      bundle_items: data.bundle_items?.map((item: any) => ({
        id: item.id,
        component_product_id: item.component_product_id,
        component_product: item.component_product,
        quantity: item.quantity,
        sort_order: item.sort_order,
        is_optional: item.is_optional,
      })) || [],
      variants: data.variants?.map((v: any) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.calculated_price || v.override_price || v.price_adjustment,
        price_adjustment: v.price_adjustment,
        override_price: v.override_price,
        calculated_price: v.calculated_price,
        stock_quantity: v.stock_quantity,
        attributes: v.attributes || {},
        is_active: v.is_active,
        is_default: v.is_default,
        image_url: v.image_url,
      })) || [],
    } as Product;
  } catch (e) {
    console.error('Failed to fetch product:', e);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    }
  }

  const cleanDescription = product.short_description?.replace(/<[^>]*>/g, '')
    || product.description?.replace(/<[^>]*>/g, '')?.slice(0, 160)
    || `Shop ${product.name} at MyMedDevices - Kenya's trusted medical devices store.`

  const productImage = product.images?.[0]?.src || '/logos/logo-portrait.png'
  const productUrl = `${SITE_URL}/products/${slug}`
  const brandName = product.brands?.[0]?.name || 'MyMedDevices'
  const formattedPrice = product.price
    ? new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(product.price))
    : ''

  const seoTitle = `${product.name} Price in Kenya - ${brandName} Authorized Distributor`
  const seoDescription = `Buy ${product.name} in Kenya. PPB Registered, Available in Nairobi & Nationwide. Warranty & After-sales support. Best price: ${formattedPrice}. ${cleanDescription}`.slice(0, 320)

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: productUrl },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: productUrl,
      siteName: 'MyMedDevices',
      images: [{ url: productImage, width: 800, height: 600, alt: `${product.name} - Available in Kenya` }],
      type: 'website',
      locale: 'en_KE',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [productImage],
    },
  }
}

async function fetchRelatedProducts(slug: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/storefront/products/${slug}/related`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: any) => ({
      id: item.related_product?.id || item.id,
      name: item.related_product?.name || 'Product',
      slug: item.related_product?.slug || '',
      sku: item.related_product?.sku || 'N/A',
      price: item.related_product?.price?.toString() || '0',
      regular_price: item.related_product?.price?.toString() || '0',
      images: item.related_product?.image_url ? [{ src: item.related_product.image_url }] : [],
      stock_status: item.related_product?.stock_status || 'instock',
      relation_type: item.relation_type,
    }));
  } catch (e) {
    console.error('Failed to fetch related products:', e);
    return [];
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) notFound();

  const relatedProducts = await fetchRelatedProducts(slug);
  const reviews: any[] = [];

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      reviews={reviews}
    />
  );
}
