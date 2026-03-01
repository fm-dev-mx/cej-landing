import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminTopbar from './AdminTopbar';

let mockPathname = '/dashboard/settings/pricing';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => mockPathname),
}));

vi.mock('@/components/Auth', () => ({
    UserProfileMenu: ({ userName }: { userName: string }) => (
        <div data-testid="user-menu">{userName}</div>
    ),
}));

describe('AdminTopbar', () => {
    beforeEach(() => {
        mockPathname = '/dashboard/settings/pricing';
    });

    const createAdminTopbar = (pathname?: string) => {
        if (pathname) mockPathname = pathname;
        return (
            <AdminTopbar
                userName="Admin User"
                userEmail="admin@cej.mx"
                onMenuToggle={() => undefined}
            />
        );
    };

    it('renders contextual title and breadcrumbs from pathname', () => {
        render(createAdminTopbar());
        expect(screen.getAllByText('Editor de precios')).toHaveLength(2);
        expect(screen.getByRole('link', { name: 'Resumen' })).toBeInTheDocument();
        expect(screen.getByText('Configuración')).toBeInTheDocument();
        expect(screen.getByText('Editor de precios', { selector: 'span[aria-current="page"]' })).toBeInTheDocument();
    });

    it('renders user profile actions', () => {
        render(createAdminTopbar());

        expect(screen.getByTestId('user-menu')).toHaveTextContent('Admin User');
    });

    it('resolves breadcrumb and title for root and intermediate routes', () => {
        const { rerender } = render(createAdminTopbar('/dashboard'));
        expect(screen.getByText('Resumen', { selector: 'span[aria-current="page"]' })).toBeInTheDocument();

        rerender(createAdminTopbar('/dashboard/orders'));
        expect(screen.getByText('Pedidos', { selector: 'span[aria-current="page"]' })).toBeInTheDocument();

        rerender(createAdminTopbar('/dashboard/settings'));
        expect(screen.getByText('Configuración', { selector: 'span[aria-current="page"]' })).toBeInTheDocument();
    });
});
