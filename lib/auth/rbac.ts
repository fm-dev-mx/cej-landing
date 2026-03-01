// lib/auth/rbac.ts

/**
 * Valid roles in the CEJ ecosystem.
 * - owner: Full access to everything including sensitive settings.
 * - admin: Management access to orders and general settings.
 * - operator: Daily operation access (viewing and creating orders).
 */
export type UserRole = 'admin' | 'operator' | 'owner';

/**
 * Specific permissions that can be checked against a role.
 */
export type Permission =
    | 'orders:view'
    | 'orders:create'
    | 'orders:edit'
    | 'orders:update'
    | 'settings:view'
    | 'financials:view'
    | 'financials:write'
    | 'admin:all';

/**
 * Permission matrix defining what each role can do.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    owner: ['orders:view', 'orders:create', 'orders:edit', 'orders:update', 'settings:view', 'financials:view', 'financials:write', 'admin:all'],
    admin: ['orders:view', 'orders:create', 'orders:edit', 'orders:update', 'settings:view', 'financials:view', 'financials:write'],
    operator: ['orders:view', 'orders:create', 'orders:update'],
};

/**
 * Checks if a given role has the required permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    return (permissions as string[]).includes(permission);
}

/**
 * Extracts the user role from Supabase user metadata.
 * Defaults to 'operator' for security (least privilege).
 *
 * @param userMetadata - The user_metadata object from Supabase Auth user.
 */
export function getUserRole(userMetadata: { role?: string } | null | undefined): UserRole {
    const role = userMetadata?.role;
    if (role === 'owner' || role === 'admin' || role === 'operator') {
        return role as UserRole;
    }
    return 'operator';
}
