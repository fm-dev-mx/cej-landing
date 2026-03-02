// app/actions/updateUserRole.ts

'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
import { reportError } from '@/lib/monitoring';
import type { UserRole } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';

export interface UpdateUserRoleResult {
    success: boolean;
    message: string;
}

/**
 * Updates a user's role.
 * This changes the role in the 'profiles' table AND in the auth.users metadata.
 * Restricted to users with 'admin:users' or 'admin:all' permissions.
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<UpdateUserRoleResult> {
    try {
        const session = await requirePermission('admin:users');
        if ('status' in session) {
            return {
                success: false,
                message: session.message
            };
        }

        const supabase = await createAdminClient();

        // 1. Update Profile (for RLS and DB queries)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (profileError) {
            reportError(profileError, { action: 'updateUserRole', phase: 'profile_update', userId });
            return {
                success: false,
                message: 'No se pudo actualizar el rol en el perfil.'
            };
        }

        // 2. Update Auth Metadata (so getUserRole works correctly on next session/token refresh)
        const { error: authError } = await supabase.auth.admin.updateUserById(
            userId,
            { user_metadata: { role: newRole } }
        );

        if (authError) {
            reportError(authError, { action: 'updateUserRole', phase: 'auth_update', userId });
            // We don't necessarily roll back the profile update, but we warn the user.
            return {
                success: false,
                message: 'Rol de perfil actualizado, pero hubo un error al actualizar los metadatos de autenticación.'
            };
        }

        revalidatePath('/dashboard/settings/users');

        return {
            success: true,
            message: `Rol actualizado a ${newRole} correctamente.`
        };
    } catch (error) {
        reportError(error, { action: 'updateUserRole', phase: 'unexpected', userId });
        return {
            success: false,
            message: 'Ocurrió un error inesperado al actualizar el rol.'
        };
    }
}
