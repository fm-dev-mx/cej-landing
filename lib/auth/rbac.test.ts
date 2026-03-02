import { describe, it, expect } from 'vitest';
import { hasPermission, getUserRole, type UserRole } from './rbac';

describe('RBAC utility', () => {
    describe('hasPermission', () => {
        it('allows owner to do everything', () => {
            expect(hasPermission('owner', 'orders:view')).toBe(true);
            expect(hasPermission('owner', 'orders:create')).toBe(true);
            expect(hasPermission('owner', 'orders:edit')).toBe(true);
            expect(hasPermission('owner', 'settings:view')).toBe(true);
            expect(hasPermission('owner', 'admin:all')).toBe(true);
        });

        it('allows developer to do everything', () => {
            expect(hasPermission('developer', 'orders:view')).toBe(true);
            expect(hasPermission('developer', 'orders:create')).toBe(true);
            expect(hasPermission('developer', 'orders:edit')).toBe(true);
            expect(hasPermission('developer', 'settings:view')).toBe(true);
            expect(hasPermission('developer', 'admin:all')).toBe(true);
        });

        it('restricts operator from editing or admin:all', () => {
            expect(hasPermission('operator', 'orders:view')).toBe(true);
            expect(hasPermission('operator', 'orders:create')).toBe(true);
            expect(hasPermission('operator', 'orders:edit')).toBe(false);
            expect(hasPermission('operator', 'settings:view')).toBe(false);
            expect(hasPermission('operator', 'admin:all')).toBe(false);
        });

        it('allows admin most things except admin:all', () => {
            expect(hasPermission('admin', 'orders:view')).toBe(true);
            expect(hasPermission('admin', 'orders:edit')).toBe(true);
            expect(hasPermission('admin', 'admin:all')).toBe(false);
        });
    });

    describe('getUserRole', () => {
        it('identifies owner role', () => {
            expect(getUserRole({ role: 'owner' })).toBe('owner');
        });

        it('identifies developer role', () => {
            expect(getUserRole({ role: 'developer' })).toBe('developer');
        });

        it('identifies admin role', () => {
            expect(getUserRole({ role: 'admin' })).toBe('admin');
        });

        it('identifies operator role', () => {
            expect(getUserRole({ role: 'operator' })).toBe('operator');
        });

        it('defaults to guest for unknown roles', () => {
            expect(getUserRole({ role: 'hacker' })).toBe('guest');
            expect(getUserRole({})).toBe('guest');
            expect(getUserRole(null)).toBe('guest');
        });
    });
});
