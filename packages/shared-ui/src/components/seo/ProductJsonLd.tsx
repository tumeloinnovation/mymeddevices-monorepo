import type { Product } from '@/lib/data/types'

interface ProductJsonLdProps {
    product: Product
    url: string
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
        image: product.images?.map((img) => img.src) || [],
        sku: product.sku || undefined,
        brand: {
            '@type': 'Brand',
            name: product.brands?.[0]?.name || 'MyMedDevices',
        },
        offers: {
            '@type': 'Offer',
            url: url,
            priceCurrency: 'KES',
            price: product.price || product.regular_price || '0',
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
        ...(product.average_rating && parseFloat(product.average_rating) > 0 && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.average_rating,
                reviewCount: product.rating_count || 1,
            },
        }),
        category: product.categories?.map((cat) => cat.name).join(', ') || 'Medical Devices',
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    )
}

export default ProductJsonLd
