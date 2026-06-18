/**
 * Environment Configuration
 * Centralized access to environment variables with validation
 */
// Server-side only variables (NEVER exposed to browser)
export const serverEnv = {
    wordpress: {
        apiUrl: process.env.WORDPRESS_API_URL || '',
        baseUrl: process.env.WORDPRESS_API_URL || '',
    },
    woocommerce: {
        apiUrl: process.env.WOOCOMMERCE_API_URL || '',
        consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
        consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
    },
    dokan: {
        apiUrl: process.env.DOKAN_API_URL || '',
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET || '',
        cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
    },
    email: {
        apiUrl: process.env.MMD_EMAIL_API_URL || '',
        apiSecret: process.env.MMD_EMAIL_API_SECRET || '',
    },
} as const;
// Public variables (safe to expose to browser)
export const publicEnv = {
    site: {
        name: process.env.NEXT_PUBLIC_SITE_NAME || 'MyMedDevices',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
    wordpress: {
        baseUrl: process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL || '',
    },
    maps: {
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || '',
    },
} as const;
// Validation helper (run at startup)
export function validateEnv() {
    const missing: string[] = [];
    // Check required server variables
    if (!serverEnv.woocommerce.consumerKey) missing.push('WOOCOMMERCE_CONSUMER_KEY');
    if (!serverEnv.woocommerce.consumerSecret) missing.push('WOOCOMMERCE_CONSUMER_SECRET');
    if (!serverEnv.auth.jwtSecret) missing.push('JWT_SECRET');
    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.map(m => `  - ${m}`).join('\n')}\n\n` +
            'Please copy .env.example to .env.local and fill in the required values.'
        );
    }
}
// Type helper to ensure we only use serverEnv on server
export function assertServer(): void {
    if (typeof window !== 'undefined') {
        throw new Error('serverEnv can only be accessed on the server side');
    }
}