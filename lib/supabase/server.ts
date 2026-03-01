import { createServerClient } from '@supabase/ssr';
import { createClient as createBaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { getSupabaseConfig, env } from '@/config/env';

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Uses cookies for session management with proper Next.js App Router integration.
 * Throws an error if Supabase is not configured (env vars missing).
 */
export async function createClient() {
    const { url, anonKey, isConfigured } = getSupabaseConfig();

    if (!isConfigured) {
        throw new Error(
            'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        );
    }

    const cookieStore = await cookies();

    return createServerClient<Database>(
        url!,
        anonKey!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method is called from a Server Component.
                        // This can be ignored if you have proxy refreshing sessions.
                    }
                },
            },
        }
    );
}

/**
 * Creates a Supabase client using the SERVICE_ROLE_KEY.
 * This client BYPASSES Row Level Security (RLS).
 * Use ONLY in Server Actions or Route Handlers that require administrative privileges
 * after proper RBAC validation.
 */
export async function createAdminClient() {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error(
            'Supabase Admin client missing configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
        );
    }

    return createBaseClient<Database>(
        url,
        serviceKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        }
    );
}
