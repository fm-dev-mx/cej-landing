// components/Calculator/modals/SchedulingModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchedulingModal } from './SchedulingModal';

// Mock store
vi.mock('@/store/useCejStore', () => ({
    useCejStore: vi.fn((selector) => selector({
        user: { name: '', phone: '' }
    }))
}));

// Mock checkout hook
const mockProcessOrder = vi.fn().mockResolvedValue({ success: true, folio: 'TEST-123' });
vi.mock('@/hooks/useCheckOutUI', () => ({
    useCheckoutUI: () => ({
        processOrder: mockProcessOrder,
        isProcessing: false,
        error: null
    })
}));

// Mock ResponsiveDialog
vi.mock('@/components/ui/ResponsiveDialog/ResponsiveDialog', () => ({
    ResponsiveDialog: ({ isOpen, children, title }: { isOpen: boolean; children: React.ReactNode; title: string }) => (
        isOpen ? (
            <div data-testid="scheduling-modal" aria-label={title}>
                <h2>{title}</h2>
                {children}
            </div>
        ) : null
    )
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true });

describe('SchedulingModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders when isOpen is true', () => {
        render(
            <SchedulingModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByTestId('scheduling-modal')).toBeInTheDocument();
        expect(screen.getByText('Programar Pedido')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(
            <SchedulingModal
                isOpen={false}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.queryByTestId('scheduling-modal')).not.toBeInTheDocument();
    });

    it('shows all required form fields', () => {
        render(
            <SchedulingModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByLabelText(/Nombre quien recibe/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Teléfono de contacto/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Dirección de entrega/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Fecha requerida/i)).toBeInTheDocument();
    });

    it('submit button is disabled when required fields are empty', () => {
        render(
            <SchedulingModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const submitButton = screen.getByRole('button', { name: /Generar Pedido en WhatsApp/i });
        expect(submitButton).toBeDisabled();
    });

    it('submit button is enabled when all required fields are filled', async () => {
        render(
            <SchedulingModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Fill form fields
        fireEvent.change(screen.getByLabelText(/Nombre quien recibe/i), { target: { value: 'Juan Test' } });
        fireEvent.change(screen.getByLabelText(/Teléfono de contacto/i), { target: { value: '6561234567' } });
        fireEvent.change(screen.getByLabelText(/Dirección de entrega/i), { target: { value: 'Calle Test 123' } });
        fireEvent.change(screen.getByLabelText(/Fecha requerida/i), { target: { value: '2024-12-20' } });

        // Accept privacy
        const privacyCheckbox = screen.getByRole('checkbox');
        fireEvent.click(privacyCheckbox);

        const submitButton = screen.getByRole('button', { name: /Generar Pedido en WhatsApp/i });
        expect(submitButton).not.toBeDisabled();
    });

    it('calls processOrder and opens WhatsApp on submit', async () => {
        render(
            <SchedulingModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Fill form
        fireEvent.change(screen.getByLabelText(/Nombre quien recibe/i), { target: { value: 'Juan Test' } });
        fireEvent.change(screen.getByLabelText(/Teléfono de contacto/i), { target: { value: '6561234567' } });
        fireEvent.change(screen.getByLabelText(/Dirección de entrega/i), { target: { value: 'Calle Test 123' } });
        fireEvent.change(screen.getByLabelText(/Fecha requerida/i), { target: { value: '2024-12-20' } });

        // Accept privacy
        fireEvent.click(screen.getByRole('checkbox'));

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Generar Pedido en WhatsApp/i }));

        await waitFor(() => {
            expect(mockProcessOrder).toHaveBeenCalledWith(
                { name: 'Juan Test', phone: '6561234567' },
                true,
                undefined // No quote provided in this test (drawer flow)
            );
        });

        await waitFor(() => {
            expect(mockWindowOpen).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalledWith('TEST-123', 'Juan Test');
        });
    });

    it('uses fallback folio when processOrder returns no folio (fail-open)', async () => {
        mockProcessOrder.mockResolvedValueOnce({ success: false, folio: null });

        render(
            <SchedulingModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Fill form
        fireEvent.change(screen.getByLabelText(/Nombre quien recibe/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/Teléfono de contacto/i), { target: { value: '6561234567' } });
        fireEvent.change(screen.getByLabelText(/Dirección de entrega/i), { target: { value: 'Calle Test 123' } });
        fireEvent.change(screen.getByLabelText(/Fecha requerida/i), { target: { value: '2024-12-20' } });
        fireEvent.click(screen.getByRole('checkbox'));

        fireEvent.click(screen.getByRole('button', { name: /Generar Pedido en WhatsApp/i }));

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalledWith(
                expect.stringMatching(/^OFFLINE-[A-Z0-9]+$/),
                'Test User'
            );
        });

        // Should still open WhatsApp even without server folio
        await waitFor(() => {
            expect(mockWindowOpen).toHaveBeenCalled();
        });
    });
});
