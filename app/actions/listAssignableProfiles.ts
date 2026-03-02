'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
import { reportError } from '@/lib/monitoring';
import type { ProfileOption } from '@/types/internal/order-admin';

export interface ListAssignableProfilesResult {
    success: boolean;
    profiles: ProfileOption[];
    error?: string;
}

export async function listAssignableProfiles(query?: string): Promise<ListAssignableProfilesResult> {
    try {
        const session = await requirePermission('orders:view');
        if ('status' in session) return { success: false, profiles: [], error: session.message };

        const adminSupabase = await createAdminClient();
        let req = adminSupabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .order('full_name', { ascending: true })
            .limit(25);

        const normalizedQuery = query?.trim();
        if (normalizedQuery) {
            req = req.or(`full_name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`);
        }

        const { data, error } = await req;
        if (error) {
            reportError(error, { action: 'listAssignableProfiles' });
            return { success: false, profiles: [], error: 'No se pudieron cargar perfiles' };
        }

        return { success: true, profiles: data || [] };
    } catch (error) {
        reportError(error, { action: 'listAssignableProfiles', phase: 'unexpected' });
        return { success: false, profiles: [], error: 'Error inesperado' };
    }
}

