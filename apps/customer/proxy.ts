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
    console.log('🔑 [Proxy] validateToken called');

    // Reject known insecure mock tokens immediately
    if (token.startsWith('demo-')) {
        return null;
    }

    // Check cache first
    const cached = tokenCache.get(token);
    if (cached && cached.expires > Date.now()) {
        console.log('💾 [Proxy] Using cached token validation');
        return cached.user;
    }

    try {
        // AbortController for timeout safety
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const backendUrl = getBackendUrl();
        console.log('🌐 [Proxy] Calling FastAPI backend for token validation:', backendUrl);

        const response = await fetch(`${backendUrl}/api/v1/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            cache: 'no-store' // Ensure fresh data from API
        });

        clearTimeout(timeout);

        console.log('📡 [Proxy] FastAPI backend response:', { status: response.status, ok: response.ok });

        if (!response.ok) {
            console.log('❌ [Proxy] FastAPI backend returned non-OK response:', response.status);
            return null;
        }

        const resBody = await response.json();
        const userData = resBody.data;

        if (!userData) {
            console.log('❌ [Proxy] Response body or data object missing');
            return null;
        }

        const user = {
            id: userData.id,
            email: userData.email,
            roles: [userData.role], // FastAPI uses single role
            isVendor: userData.role === 'vendor',
        };

        // Update Cache (5 minutes)
        tokenCache.set(token, {
            user,
            expires: Date.now() + 5 * 60 * 1000
        });

        console.log('✅ [Proxy] Token validation successful:', { email: user.email, roles: user.roles });
        return user;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error('[Proxy] Token validation timed out');
        } else {
            console.error('[Proxy] Token validation failed:', error);
        }
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

    console.log('🔍 [Proxy] Incoming request:', { pathname, method: request.method });

    // 1. Performance: Skip static files and public assets immediately
    if (ROUTES.ASSETS.some(path => pathname.startsWith(path)) || ROUTES.PUBLIC_API.some(path => pathname.startsWith(path))) {
        console.log('⏭️ [Proxy] Skipping static/public asset');
        return NextResponse.next();
    }

    // 2. Determine Route Type
    const isVendorRoute = ROUTES.VENDOR.some(path => pathname.startsWith(path));
    const isCustomerRoute = ROUTES.CUSTOMER.some(path => pathname.startsWith(path));
    const isAuthRoute = ROUTES.AUTH.some(path => pathname.startsWith(path));
    const isProtectedRoute = isVendorRoute || isCustomerRoute;

    console.log('🔍 [Proxy] Route classification:', {
        pathname,
        isVendorRoute,
        isCustomerRoute,
        isAuthRoute,
        isProtectedRoute,
    });

    // 3. Check Authentication
    const token = request.cookies.get('auth_token')?.value;

    console.log('🍪 [Proxy] Cookie check:', {
        hasCookie: !!token,
        cookieLength: token?.length || 0,
        cookiePreview: token ? `${token.substring(0, 20)}...` : 'none',
    });

    // Case: Unauthenticated User
    if (!token) {
        if (isProtectedRoute) {
            console.log('🚫 [Proxy] No token on protected route, redirecting to login');
            // Redirect to login with return URL
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('returnUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
        console.log('✅ [Proxy] No token on public route, allowing access');
        // Allow access to public pages
        return NextResponse.next();
    }

    // Case: Authenticated User (or potentially invalid token)
    // Optimization: Only validate token if necessary (Protected Route or Auth Page)
    // For general public pages, we skip heavy validation to improve TTFB
    if (isProtectedRoute || isAuthRoute) {
        console.log('🔐 [Proxy] Validating token for protected/auth route');
        const user = await validateToken(token);

        console.log('👤 [Proxy] Token validation result:', {
            hasUser: !!user,
            userEmail: user?.email,
            userRoles: user?.roles,
            isVendor: user?.roles?.includes('seller') || user?.roles?.includes('vendor') || user?.isVendor,
        });

        if (!user) {
            console.log('❌ [Proxy] Token validation failed');
            // Token is invalid or expired
            if (isProtectedRoute) {
                console.log('🚫 [Proxy] Invalid token on protected route, redirecting to login');
                const response = NextResponse.redirect(new URL('/login', request.url));
                response.cookies.delete('auth_token'); // Clean up invalid cookie
                return response;
            }
            // If on auth route with invalid token, just let them proceed to login page
            // But clear the cookie so they don't get stuck
            console.log('🧹 [Proxy] Invalid token on auth route, clearing cookie and proceeding');
            const response = NextResponse.next();
            response.cookies.delete('auth_token');
            return response;
        }

        // Token is valid - Check Roles & Redirects
        const isVendor = user.roles?.includes('seller') || user.roles?.includes('vendor') || user.isVendor === true;

        console.log('✅ [Proxy] Token valid, checking role-based redirects');

        // A. Already Logged In -> accessing Login/Register
        if (isAuthRoute) {
            console.log('🔄 [Proxy] Logged in user accessing auth route, redirecting to dashboard');
            // Redirect to appropriate dashboard
            return NextResponse.redirect(new URL(isVendor ? '/vendor/dashboard' : '/dashboard', request.url));
        }

        // B. Vendor accessing Customer areas
        if (isCustomerRoute && isVendor) {
            console.log('🔄 [Proxy] Vendor accessing customer area, redirecting to vendor dashboard');
            return NextResponse.redirect(new URL('/vendor/dashboard', request.url));
        }

        // C. Customer accessing Vendor areas
        if (isVendorRoute && !isVendor) {
            console.log('🔄 [Proxy] Customer accessing vendor area, redirecting to customer dashboard');
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        console.log('✅ [Proxy] All checks passed, allowing access');
    }

    console.log('✅ [Proxy] Allowing access to public route');
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

