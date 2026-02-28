// proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/config/env";

const PUBLIC_ROUTES = new Set(["/", "/login", "/aviso-de-privacidad", "/terminos"]);

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
    return false;
}

/**
 * Applies a minimal set of security headers to proxy-generated responses
 * (redirects and 404s) that may not pass through the centralized
 * next.config.ts headers() logic.
 */
function applyProxySecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
}

function buildLoginRedirectUrl(request: NextRequest): URL {
    const loginUrl = new URL("/login", request.url);
    // Preserve query string (e.g. /dashboard?tab=x) so post-login routing is faithful.
    loginUrl.searchParams.set(
        "redirect",
        request.nextUrl.pathname + request.nextUrl.search
    );
    return loginUrl;
}

export default async function proxy(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    // Strict allowlist. Anything else is a 404 from the proxy layer.
    if (!isAllowedRoute(pathname)) {
        return applyProxySecurityHeaders(new NextResponse("Not Found", { status: 404 }));
    }

    // Pass-through response for allowed routes.
    // Note: security headers for normal responses are centralized in next.config.ts (headers()).
    const response = NextResponse.next({
        request: { headers: new Headers(request.headers) },
    });

    // Seed _fbc from fbclid if present (public and dashboard routes).
    const fbclid = searchParams.get("fbclid");
    if (fbclid && !request.cookies.get("_fbc")) {
        const fbc = `fb.1.${Date.now()}.${fbclid}`;
        response.cookies.set("_fbc", fbc, {
            maxAge: 90 * 24 * 60 * 60,
            sameSite: "lax",
            path: "/",
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
        });
    }

    // Capture UTM parameters for attribution.
    const utmSource = searchParams.get("utm_source");
    if (utmSource) {
        const utmData = {
            source: utmSource,
            medium: searchParams.get("utm_medium") || "none",
            campaign: searchParams.get("utm_campaign") || undefined,
            term: searchParams.get("utm_term") || undefined,
            content: searchParams.get("utm_content") || undefined,
            timestamp: new Date().toISOString(),
        };
        response.cookies.set("cej_utm", JSON.stringify(utmData), {
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60,
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
        });
    }

    // Only gate dashboard routes.
    if (!isDashboardRoute(pathname)) {
        return response;
    }

    const { url, anonKey, isConfigured } = getSupabaseConfig();
    if (!isConfigured) {
        return response;
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
        return applyProxySecurityHeaders(NextResponse.redirect(buildLoginRedirectUrl(request)));
    }

    return response;
}

export const config = {
    matcher: [
        // Exclude Next internals, common static assets, and ALL /api routes (proxy should not touch APIs).
        "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
    ],
};

