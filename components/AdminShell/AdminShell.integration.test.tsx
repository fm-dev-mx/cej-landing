import { fireEvent, render, screen } from '@testing-library/react';
import type { MouseEvent, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import AdminShell from './AdminShell';

let mockPathname = '/dashboard';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => mockPathname),
}));

vi.mock('next/link', () => ({
    default: ({
        children,
        onClick,
        href,
        ...rest
    }: {
        children: ReactNode;
        onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
        href: string;
        [key: string]: unknown;
    }) => (
        <a
            href={href}
            {...rest}
            onClick={(event) => {
                event.preventDefault();
                onClick?.(event);
            }}
        >
            {children}
        </a>
    ),
}));

vi.mock('@/components/Auth', () => ({
    UserProfileMenu: () => <div data-testid="user-profile-menu">perfil</div>,
}));

describe('AdminShell integration', () => {
    it('opens drawer, closes on nav click and tracks active item after route update', () => {
        const { rerender } = render(
            <AdminShell userName="Admin User" userEmail="admin@cej.mx" userRole="admin">
                <div>vista actual</div>
            </AdminShell>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Abrir navegación lateral' }));
        expect(screen.getByLabelText('Cerrar menú lateral')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('link', { name: 'Configuración general' }));
        expect(screen.queryByLabelText('Cerrar menú lateral')).toBeNull();

        mockPathname = '/dashboard/settings/pricing';
        rerender(
            <AdminShell userName="Admin User" userEmail="admin@cej.mx" userRole="admin">
                <div>vista actual</div>
            </AdminShell>
        );

        expect(screen.getByRole('link', { name: 'Editor de precios' })).toHaveAttribute('aria-current', 'page');
    });
});
