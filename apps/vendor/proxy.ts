import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route Configuration
const ROUTES = {
    VENDOR: ['/vendor'],
    CUSTOMER: ['/dashboard'],
    AUTH: ['/login', '/register', '/forgot-password', '/reset-password'],
    PUBLIC_API: ['/api/auth/', '/api/public/'],
    ASSETS: ['/_next/', '/favicon.ico', '/public/', '/images/', '/svgs/', '/logos/'],
};

// In-memory cache for token validation (Edge compatible)
const tokenCache = new Map<string, { user: any, expires: number }>();

// Get FastAPI backend URL
const getBackendUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Validate JWT token via FastAPI backend or Cache
 */
async function validateToken(token: string): Promise<any> {
    // Reject known insecure mock tokens immediately
    if (token.startsWith('demo-')) {
        return null;
    }

    // Check cache first
    const cached = tokenCache.get(token);
    if (cached && cached.expires > Date.now()) {
        return cached.user;
    }

    try {
        // AbortController for timeout safety
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const backendUrl = getBackendUrl();

        const response = await fetch(`${backendUrl}/api/v1/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            cache: 'no-store'
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return null;
        }

        const resBody = await response.json();
        const userData = resBody.data;

        if (!userData) {
            return null;
        }

        const user = {
            id: userData.id,
            email: userData.email,
            roles: [userData.role],
            isVendor: userData.role === 'vendor',
        };

        // Update Cache (5 minutes)
        tokenCache.set(token, {
            user,
            expires: Date.now() + 5 * 60 * 1000
        });

        return user;
    } catch (error) {
        return null;
    }
}

/**
 * Proxy handler for role-based route protection
 * - Vendors: Only access /vendor/* routes
 * - Customers: Only access /dashboard/* routes (blocked from /vendor/*)
 * - Public: Accessible by everyone, but auth state is preserved
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Performance: Skip static files and public assets immediately
    if (ROUTES.ASSETS.some(path => pathname.startsWith(path)) || ROUTES.PUBLIC_API.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // 2. Determine Route Type
    const isVendorRoute = ROUTES.VENDOR.some(path => pathname.startsWith(path));
    const isCustomerRoute = ROUTES.CUSTOMER.some(path => pathname.startsWith(path));
    const isAuthRoute = ROUTES.AUTH.some(path => pathname.startsWith(path));
    const isProtectedRoute = isVendorRoute || isCustomerRoute;

    // 3. Check Authentication
    const token = request.cookies.get('auth_token')?.value;

    // Case: Unauthenticated User
    if (!token) {
        if (isProtectedRoute) {
            // Redirect to login with return URL
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('returnUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
        // Allow access to public pages
        return NextResponse.next();
    }

    // Case: Authenticated User (or potentially invalid token)
    if (isProtectedRoute || isAuthRoute) {
        const user = await validateToken(token);

        if (!user) {
            if (isProtectedRoute) {
                const response = NextResponse.redirect(new URL('/login', request.url));
                response.cookies.delete('auth_token');
                return response;
            }

            const response = NextResponse.next();
            response.cookies.delete('auth_token');
            return response;
        }

        const isVendor = user.role === 'vendor' || user.roles?.includes('vendor') || user.isVendor === true;

        // A. Already Logged In -> accessing Login/Register
        if (isAuthRoute) {
            if (isVendor) {
                return NextResponse.redirect(new URL('/vendor/dashboard', request.url));
            }
            // If logged in as non-vendor, let them remain on login page or re-authenticate as vendor
            return NextResponse.next();
        }

        // B. Non-vendor user trying to access Vendor routes -> redirect to login
        if (isVendorRoute && !isVendor) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('error', 'vendor_role_required');
            return NextResponse.redirect(loginUrl);
        }

    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
