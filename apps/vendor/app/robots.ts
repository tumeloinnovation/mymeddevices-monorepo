import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/checkout/',
                    '/dashboard/',
                    '/vendor/',
                    '/pending-vendor/',
                    '/reset-password/',
                ],
            },
        ],
        sitemap: 'https://mymeddevices.com/sitemap.xml',
    }
}
