// lib/auth/requirePermission.ts

import { createClient } from '@/lib/supabase/server';
import { getUserRole, hasPermission, type Permission, type UserRole } from './rbac';
import { redirect } from 'next/navigation';

export interface AuthSession {
    user: {
        id: string;
        email?: string;
        role: UserRole;
    };
}

/**
 * Standard error response for unauthorized actions.
 */
export const UNAUTHORIZED_RESPONSE = {
    success: false,
    status: 'error',
    message: 'No tienes permisos suficientes para realizar esta acción.',
    error: 'unauthorized_access'
} as const;

/**
 * Validates that the current user is authenticated and has the required permission.
 * Designed for use in Server Actions.
 *
 * @param permission - The permission key to check.
 * @returns An AuthSession object if authorized.
 * @throws Redirects to /login if not authenticated.
 * @throws Returns UNAUTHORIZED_RESPONSE if authenticated but not authorized (caller must handle).
 */
export async function requirePermission(permission: Permission): Promise<AuthSession | typeof UNAUTHORIZED_RESPONSE> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const role = getUserRole(user.user_metadata);

    if (!hasPermission(role, permission)) {
        return UNAUTHORIZED_RESPONSE;
    }

    return {
        user: {
            id: user.id,
            email: user.email,
            role,
        }
    };
}

/**
 * Variant of requirePermission specifically for Page components.
 * Immediately redirects to /dashboard if unauthorized.
 */
export async function guardPage(permission: Permission): Promise<AuthSession> {
    const session = await requirePermission(permission);

    if ('status' in session && session.status === 'error') {
        redirect('/dashboard');
    }

    return session as AuthSession;
}
