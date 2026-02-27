import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Global middleware for session management and route protection.
 * - Refreshes Supabase session on every request.
 * - Protects /dashboard routes from unauthenticated access.
 */
export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: new Headers(request.headers),
        },
    });

    const supabase = createMiddlewareClient(request, response);

    // If Supabase is not configured (fail-open for safety),
    // we continue without refreshing the session.
    if (!supabase) return response;

    // IMPORTANT: Refreshing the session is necessary for server-side auth to work correctly
    // It updates the session cookie in the response.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protection logic for /dashboard
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirectTo", request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
