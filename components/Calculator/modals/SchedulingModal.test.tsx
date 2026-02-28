// components/Calculator/modals/SchedulingModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchedulingModal } from './SchedulingModal';

// Mock store
vi.mock('@/store/public/usePublicStore', () => ({
    usePublicStore: vi.fn((selector) => selector({
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

    const setup = (isOpen = true) => {
        return render(
            <SchedulingModal
                isOpen={isOpen}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );
    };

    const fillForm = (values = { name: 'Juan Test', phone: '6561234567', address: 'Calle Test 123', date: '2024-12-20' }) => {
        fireEvent.change(screen.getByLabelText(/Nombre quien recibe/i), { target: { value: values.name } });
        fireEvent.change(screen.getByLabelText(/Teléfono de contacto/i), { target: { value: values.phone } });
        fireEvent.change(screen.getByLabelText(/Dirección de entrega/i), { target: { value: values.address } });
        fireEvent.change(screen.getByLabelText(/Fecha requerida/i), { target: { value: values.date } });
    };

    it('renders when isOpen is true', () => {
        setup(true);

        expect(screen.getByTestId('scheduling-modal')).toBeInTheDocument();
        expect(screen.getByText('Programar Pedido')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        setup(false);

        expect(screen.queryByTestId('scheduling-modal')).not.toBeInTheDocument();
    });

    it('shows all required form fields', () => {
        setup();

        expect(screen.getByLabelText(/Nombre quien recibe/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Teléfono de contacto/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Dirección de entrega/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Fecha requerida/i)).toBeInTheDocument();
    });

    it('submit button is disabled when required fields are empty', () => {
        setup();

        const submitButton = screen.getByRole('button', { name: /Generar Pedido en WhatsApp/i });
        expect(submitButton).toBeDisabled();
    });

    it('does not show validation errors before fields are touched', () => {
        setup();

        expect(screen.queryByText(/Ingresa un nombre válido/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Ingresa un teléfono válido/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Ingresa una dirección más completa/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Selecciona una fecha de entrega/i)).not.toBeInTheDocument();
    });

    const checkNameRequired = () => {
        const nameInput = screen.getByLabelText(/Nombre quien recibe/i);
        fireEvent.blur(nameInput);
        expect(screen.getByText(/Ingresa un nombre válido/i)).toBeInTheDocument();
        return nameInput;
    };

    it('shows validation error on blur for invalid required fields', () => {
        setup();
        const nameInput = checkNameRequired();
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('clears validation error when field becomes valid after blur', () => {
        setup();
        const nameInput = checkNameRequired();

        fireEvent.change(nameInput, { target: { value: 'Juan Test' } });
        fireEvent.blur(nameInput);

        expect(screen.queryByText(/Ingresa un nombre válido/i)).not.toBeInTheDocument();
    });

    it('submit button is enabled when all required fields are filled', async () => {
        setup();

        // Fill form fields
        fillForm();

        // Accept privacy
        const privacyCheckbox = screen.getByRole('checkbox');
        fireEvent.click(privacyCheckbox);

        const submitButton = screen.getByRole('button', { name: /Generar Pedido en WhatsApp/i });
        expect(submitButton).not.toBeDisabled();
    });

    it('calls processOrder and opens WhatsApp on submit', async () => {
        setup();

        // Fill form
        fillForm();

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

        setup();

        // Fill form
        fillForm({ name: 'Test User', phone: '6561234567', address: 'Calle Test 123', date: '2024-12-20' });
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
