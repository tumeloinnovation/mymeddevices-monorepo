import type { MetadataRoute } from 'next'
import { SEED_PRODUCTS } from '@/lib/data/seed/products'
import { SEED_CATEGORIES } from '@/lib/data/seed/categories'

const SITE_URL = 'https://mymeddevices.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${SITE_URL}/about-us`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${SITE_URL}/contact-us`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${SITE_URL}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/return-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/shipping-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/terms-and-conditions`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        // Shop collection pages
        {
            url: `${SITE_URL}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/categories`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/new-arrivals`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/best-sellers`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/featured`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/offers`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
    ]

    // Product pages
    const productPages: MetadataRoute.Sitemap = SEED_PRODUCTS.map((product) => ({
        url: `${SITE_URL}/products/${product.slug}`,
        lastModified: new Date(product.date_created),
        changeFrequency: 'weekly',
        priority: 0.6,
    }))

    // Category pages
    const categoryPages: MetadataRoute.Sitemap = SEED_CATEGORIES.map((category) => ({
        url: `${SITE_URL}/categories/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
    }))

    return [...staticPages, ...productPages, ...categoryPages]
}
