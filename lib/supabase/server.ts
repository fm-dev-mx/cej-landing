import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/config/env';

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

    return createServerClient(
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
