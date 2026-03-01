import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminTopbar from './AdminTopbar';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/dashboard/settings/pricing'),
}));

vi.mock('@/components/Auth', () => ({
    UserProfileMenu: ({ userName }: { userName: string }) => (
        <div data-testid="user-menu">{userName}</div>
    ),
}));

describe('AdminTopbar', () => {
    beforeEach(() => {
        render(
            <AdminTopbar
                userName="Admin User"
                userEmail="admin@cej.mx"
                onMenuToggle={() => undefined}
            />
        );
    });

    it('renders contextual title and breadcrumbs from pathname', () => {
        expect(screen.getAllByText('Editor de precios')).toHaveLength(2);
        expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByText('Configuración')).toBeInTheDocument();
        expect(screen.getByText('Editor de precios', { selector: 'span[aria-current="page"]' })).toBeInTheDocument();
    });

    it('renders user profile actions', () => {
        expect(screen.getByTestId('user-menu')).toHaveTextContent('Admin User');
    });
});
