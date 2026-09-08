import type { Product } from '@mymeddevices/shared-core';

interface ProductJsonLdProps {
    product: any;
    url: string;
}

/**
 * JSON-LD Structured Data for Product pages
 * Helps search engines understand product information and enables rich results
 */
export function ProductJsonLd({ product, url }: ProductJsonLdProps) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': ['Product', 'MedicalDevice'],
        name: product.name,
        description: product.short_description?.replace(/<[^>]*>/g, '') || product.description?.replace(/<[^>]*>/g, '') || '',
        image: product.images?.map((img: { url?: string; src?: string }) => img.url || img.src || '') || [],
        sku: product.sku || undefined,
        brand: {
            '@type': 'Brand',
            name: product.brand || 'MyMedDevices',
        },
        offers: {
            '@type': 'Offer',
            url: url,
            priceCurrency: product.currency || 'KES',
            price: String(product.price ?? product.base_price ?? 0),
            availability: product.stock_status === 'instock'
                ? 'https://schema.org/InStock'
                : product.stock_status === 'outofstock'
                    ? 'https://schema.org/OutOfStock'
                    : 'https://schema.org/PreOrder',
            areaServed: 'Kenya',
            availableAtOrFrom: {
                '@type': 'Place',
                name: 'MyMedDevices Nairobi Warehouse',
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Nairobi',
                    addressCountry: 'KE',
                },
            },
            seller: {
                '@type': 'Organization',
                name: 'MyMedDevices',
            },
        },
        category: product.category_name || 'Medical Devices',
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}

export default ProductJsonLd;
