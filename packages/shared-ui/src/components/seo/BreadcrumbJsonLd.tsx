interface BreadcrumbItem {
    name: string
    url: string
}

interface BreadcrumbJsonLdProps {
    items: BreadcrumbItem[]
}

/**
 * Breadcrumb JSON-LD Structured Data
 * Helps search engines understand site hierarchy and enables breadcrumb rich results
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    )
}

export default BreadcrumbJsonLd
