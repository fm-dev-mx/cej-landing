import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminShell from './AdminShell';

vi.mock('@/components/AdminSidebar', () => ({
    default: ({
        isOpen,
        onClose,
    }: {
        isOpen: boolean;
        onClose: () => void;
    }) => (
        <aside data-testid="admin-sidebar" data-open={isOpen ? 'true' : 'false'}>
            <button onClick={onClose}>close</button>
        </aside>
    ),
}));

vi.mock('@/components/AdminTopbar', () => ({
    default: ({ onMenuToggle }: { onMenuToggle: () => void }) => (
        <button onClick={onMenuToggle}>toggle</button>
    ),
}));

describe('AdminShell', () => {
    it('renders topbar, sidebar and children', () => {
        render(
            <AdminShell userName="Admin User" userEmail="admin@cej.mx">
                <div>contenido dashboard</div>
            </AdminShell>
        );

        expect(screen.getByText('toggle')).toBeInTheDocument();
        expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
        expect(screen.getByText('contenido dashboard')).toBeInTheDocument();
    });

    it('opens and closes sidebar from topbar toggle and overlay', () => {
        render(
            <AdminShell userName="Admin User" userEmail="admin@cej.mx">
                <div>contenido dashboard</div>
            </AdminShell>
        );

        fireEvent.click(screen.getByText('toggle'));
        expect(screen.getByLabelText('Cerrar menú lateral')).toBeInTheDocument();
        expect(screen.getByTestId('admin-sidebar')).toHaveAttribute('data-open', 'true');

        fireEvent.click(screen.getByLabelText('Cerrar menú lateral'));
        expect(screen.queryByLabelText('Cerrar menú lateral')).toBeNull();
        expect(screen.getByTestId('admin-sidebar')).toHaveAttribute('data-open', 'false');
    });
});
