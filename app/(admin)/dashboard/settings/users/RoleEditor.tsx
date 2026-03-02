// app/(admin)/dashboard/settings/users/RoleEditor.tsx

'use client';

import { useState } from 'react';
import { updateUserRole } from '@/app/actions/updateUserRole';
import type { UserRole } from '@/lib/auth/rbac';
import styles from './page.module.scss';

interface RoleEditorProps {
    userId: string;
    initialRole: UserRole;
    currentUserId: string;
}

export function RoleEditor({ userId, initialRole, currentUserId }: RoleEditorProps) {
    const [role, setRole] = useState<UserRole>(initialRole);
    const [isUpdating, setIsUpdating] = useState(false);

    const isSelf = userId === currentUserId;

    async function handleRoleChange(newRole: UserRole) {
        if (newRole === role) return;

        const confirmChange = window.confirm(
            `¿Estás seguro de que deseas cambiar el rol de este usuario a ${newRole}?`
        );

        if (!confirmChange) return;

        setIsUpdating(true);
        try {
            const result = await updateUserRole(userId, newRole);
            if (result.success) {
                setRole(newRole);
            } else {
                alert(result.message);
                // Revert UI state if failed
                setRole(initialRole);
            }
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('Error inesperado al actualizar el rol.');
            setRole(initialRole);
        } finally {
            setIsUpdating(false);
        }
    }

    return (
        <select
            value={role}
            disabled={isUpdating || isSelf}
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            className={`${styles.roleSelect} ${styles[role]}`}
            title={isSelf ? "No puedes cambiar tu propio rol" : "Cambiar rol de usuario"}
        >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="guest">Guest</option>
        </select>
    );
}
