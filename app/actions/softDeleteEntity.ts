'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
import { reportError } from '@/lib/monitoring';

export type SoftDeleteTarget =
    | 'orders'
    | 'leads'
    | 'customers'
    | 'profiles'
    | 'products'
    | 'vendors'
    | 'assets'
    | 'employees';

export interface SoftDeleteResult {
    success: boolean;
    error?: string;
}

/**
 * Perform a soft delete setting deleted_at = 'now()' for a specific entity.
 */
export async function softDeleteEntity(table: SoftDeleteTarget, id: string | number): Promise<SoftDeleteResult> {
    try {
        // Enforce strong permission requirements
        const session = await requirePermission('admin:all');
        if ('status' in session) return { success: false, error: session.message };

        const adminSupabase = await createAdminClient();

        const request = adminSupabase
            .from(table)
            .update({ deleted_at: new Date().toISOString() });

        const query = table === 'products'
            ? request.eq('sku', String(id))
            : request.eq('id', id);

        const { error } = await query;

        if (error) {
            reportError(new Error(error.message), { action: 'softDeleteEntity', table, id });
            return { success: false, error: 'No se pudo eliminar el registro.' };
        }

        return { success: true };
    } catch (err) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
            throw err;
        }
        reportError(err, { action: 'softDeleteEntity', table, id });
        return { success: false, error: 'Error inesperado al intentar eliminar.' };
    }
}
