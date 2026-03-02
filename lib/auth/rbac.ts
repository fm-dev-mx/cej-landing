// lib/auth/rbac.ts

/**
 * Valid roles in the CEJ ecosystem.
 * - owner: Full access to everything including sensitive settings and user management.
 * - admin: Management access to orders, customers, and general settings.
 * - operator: Daily operation access (viewing and creating orders/customers).
 * - guest: Read-only or no access.
 * - developer: Full bypass of all systems for QA/Dev.
 */
export type UserRole = 'admin' | 'operator' | 'owner' | 'guest' | 'developer';

/**
 * Specific permissions that can be checked against a role.
 */
export type Permission =
    | 'orders:view'
    | 'orders:create'
    | 'orders:edit'
    | 'orders:update'
    | 'customers:view'
    | 'customers:create'
    | 'customers:edit'
    | 'settings:view'
    | 'admin:users'      // Can manage user roles
    | 'financials:view'
    | 'financials:write'
    | 'admin:all';

const FULL_ACCESS: Permission[] = [
    'orders:view', 'orders:create', 'orders:edit', 'orders:update',
    'customers:view', 'customers:create', 'customers:edit',
    'settings:view', 'admin:users',
    'financials:view', 'financials:write',
    'admin:all'
];

/**
 * Permission matrix defining what each role can do.
 * This is the source of truth for the frontend and server guards.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    owner: FULL_ACCESS,
    developer: FULL_ACCESS,
    admin: [
        'orders:view', 'orders:create', 'orders:edit', 'orders:update',
        'customers:view', 'customers:create', 'customers:edit',
        'settings:view', 'admin:users',
        'financials:view', 'financials:write'
    ],
    operator: [
        'orders:view', 'orders:create', 'orders:update',
        'customers:view', 'customers:create'
    ],
    guest: ['orders:view'], // Minimal view access
};

/**
 * Checks if a given role has the required permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    // Admin:all bypass
    if ((permissions as string[]).includes('admin:all')) return true;

    return (permissions as string[]).includes(permission);
}

/**
 * Extracts the user role from Supabase user metadata or profile.
 * Defaults to 'guest' for security.
 *
 * @param userMetadata - The user_metadata object from Supabase Auth user.
 */
export function getUserRole(userMetadata: { role?: string } | null | undefined): UserRole {
    const role = userMetadata?.role;
    if (role === 'owner' || role === 'admin' || role === 'operator' || role === 'guest' || role === 'developer') {
        return role as UserRole;
    }
    return 'guest';
}
