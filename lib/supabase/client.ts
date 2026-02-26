import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from '@/config/env';

/**
 * Creates a Supabase client for use in Client Components.
 * This client uses browser cookies for session management.
 * Returns null if Supabase is not configured.
 */
export function createClient() {
    const { url, anonKey, isConfigured } = getSupabaseConfig();

    if (!isConfigured) {
        return null;
    }

    return createBrowserClient(url!, anonKey!);
}
