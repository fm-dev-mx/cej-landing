import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/config/env";

/**
 * Creates a Supabase client for use in Next.js Middleware.
 * This client handles cookie synchronization between the request and response.
 */
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
    const { url, anonKey, isConfigured } = getSupabaseConfig();

    if (!isConfigured) return null;

    return createServerClient(url!, anonKey!, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                );
            },
        },
    });
}
