import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/config/env";

const SECURE_HEADERS: Record<string, string> = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const PUBLIC_ROUTES = new Set([
    "/",
    "/login",
    "/aviso-de-privacidad",
    "/terminos",
]);

function isSharedQuoteRoute(pathname: string): boolean {
    return /^\/cotizacion\/[^/]+$/.test(pathname);
}

function isDashboardRoute(pathname: string): boolean {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function isAllowedRoute(pathname: string): boolean {
    if (PUBLIC_ROUTES.has(pathname)) return true;
    if (isSharedQuoteRoute(pathname)) return true;
    if (isDashboardRoute(pathname)) return true;
    if (pathname.startsWith("/auth/callback")) return true;
    if (pathname.startsWith("/auth/login")) return true;
    if (pathname.startsWith("/api/")) return true;
    return false;
}

function withSecurityHeaders(response: NextResponse): NextResponse {
    Object.entries(SECURE_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

export default async function proxy(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    if (!isAllowedRoute(pathname)) {
        return withSecurityHeaders(new NextResponse("Not Found", { status: 404 }));
    }

    const response = NextResponse.next({
        request: {
            headers: new Headers(request.headers),
        },
    });

    const fbclid = searchParams.get("fbclid");
    if (fbclid && !request.cookies.get("_fbc")) {
        const fbc = `fb.1.${Date.now()}.${fbclid}`;
        response.cookies.set("_fbc", fbc, {
            maxAge: 90 * 24 * 60 * 60,
            sameSite: "lax",
            path: "/",
            httpOnly: false,
        });
    }

    if (!isDashboardRoute(pathname)) {
        return withSecurityHeaders(response);
    }

    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    const supabase = createServerClient(url!, anonKey!, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options);
                });
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    return withSecurityHeaders(response);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
    ],
};
