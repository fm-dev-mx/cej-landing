'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { reportError } from '@/lib/monitoring';
import type { ProfileOption } from '@/types/internal/order-admin';

export interface ListAssignableProfilesResult {
    success: boolean;
    profiles: ProfileOption[];
    error?: string;
}

export async function listAssignableProfiles(query?: string): Promise<ListAssignableProfilesResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, profiles: [], error: 'No autenticado' };

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view') && !hasPermission(role, 'admin:all')) {
            return { success: false, profiles: [], error: 'Sin permisos' };
        }

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

