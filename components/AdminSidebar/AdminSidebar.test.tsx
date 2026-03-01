import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminSidebar from './AdminSidebar';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/dashboard/orders'),
}));

describe('AdminSidebar', () => {
    it('renders grouped navigation sections', () => {
        render(<AdminSidebar isOpen={false} onClose={() => undefined} />);

        expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Operations' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Financials' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    });

    it('marks the active route with aria-current', () => {
        render(<AdminSidebar isOpen={false} onClose={() => undefined} />);
        const activeLink = screen.getByRole('link', { name: 'Pedidos' });

        expect(activeLink).toHaveAttribute('aria-current', 'page');
    });

    it('renders settings as disabled when route is unavailable', () => {
        render(<AdminSidebar isOpen={false} onClose={() => undefined} />);
        const disabled = screen.getByText('Configuración general');

        expect(disabled).toHaveAttribute('aria-disabled', 'true');
    });
});
