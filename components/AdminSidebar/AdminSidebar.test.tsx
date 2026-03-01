import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminSidebar from './AdminSidebar';

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/dashboard/orders'),
}));

describe('AdminSidebar', () => {
    it('renders grouped navigation sections', () => {
        render(<AdminSidebar isOpen={false} onClose={() => undefined} />);

        expect(screen.getByRole('heading', { name: 'Resumen' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Operaciones' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Finanzas' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Configuración' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Reportes' })).toBeInTheDocument();
    });

    it('marks the active route with aria-current', () => {
        render(<AdminSidebar isOpen={false} onClose={() => undefined} />);
        const activeLink = screen.getByRole('link', { name: 'Pedidos' });

        expect(activeLink).toHaveAttribute('aria-current', 'page');
    });

    it('renders unavailable modules as non-clickable with coming soon label', () => {
        render(<AdminSidebar isOpen={false} onClose={() => undefined} />);
        const disabled = screen.getByText('Usuarios y permisos');

        expect(disabled).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByText('Próximamente')).toBeInTheDocument();
    });
});
