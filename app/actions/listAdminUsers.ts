// app/actions/listAdminUsers.ts

'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
import { reportError } from '@/lib/monitoring';
import type { UserRole } from '@/lib/auth/rbac';

export interface AdminUser {
    id: string;
    email: string | null;
    full_name: string | null;
    role: UserRole;
    created_at: string;
}

export interface ListAdminUsersResult {
    success: boolean;
    users: AdminUser[];
    error?: string;
}

/**
 * Lists all users with their current roles for the management UI.
 * Restricted to users with 'admin:users' or 'admin:all' permissions.
 */
export async function listAdminUsers(): Promise<ListAdminUsersResult> {
    try {
        const session = await requirePermission('admin:users');
        if ('status' in session) {
            return {
                success: false,
                users: [],
                error: session.message
            };
        }

        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            reportError(error, { action: 'listAdminUsers' });
            return {
                success: false,
                users: [],
                error: 'No se pudieron cargar los usuarios.'
            };
        }

        return {
            success: true,
            users: (data || []) as AdminUser[]
        };
    } catch (error) {
        reportError(error, { action: 'listAdminUsers', phase: 'unexpected' });
        return {
            success: false,
            users: [],
            error: 'Ocurrió un error inesperado al listar usuarios.'
        };
    }
}
