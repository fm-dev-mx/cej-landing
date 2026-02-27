import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from '@/config/env';

/**
 * Proxy that refreshes Supabase auth tokens on each request.
 * Route protection is handled by dashboard/layout.tsx (Server Component).
 */
export default async function proxy(request: NextRequest) {
    console.warn(`[Proxy] Request: ${request.nextUrl.pathname}`);
    const { url, anonKey, isConfigured } = getSupabaseConfig();

    // Skip if Supabase is not configured (dev without .env.local)
    if (!isConfigured) {
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({
        request: {
            headers: new Headers(request.headers),
        },
    });


    const supabase = createServerClient(
        url!,
        anonKey!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request: {
                            headers: new Headers(request.headers),
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired - required for Server Components
    const { data: { user } } = await supabase.auth.getUser();

    // AUTH BOUNDARY: Redirect unauthenticated users from /dashboard
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
        return NextResponse.redirect(redirectUrl);
    }

    // Add current URL to request headers for use in Server Components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-url', request.url);

    // Return response with original request state + our new headers
    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Propagate session cookies from Supabase client to the final response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value);
    });

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
