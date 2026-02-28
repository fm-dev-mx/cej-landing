// components/Calculator/modals/SchedulingModal.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchedulingModal } from './SchedulingModal';

// Mock store
vi.mock('@/store/public/usePublicStore', () => ({
    usePublicStore: vi.fn((selector) => selector({
        user: { name: '', phone: '' }
    }))
}));

// Mock checkout hook
const mockProcessOrder = vi.fn().mockResolvedValue({ success: true, folio: 'TEST-123', warning: null });
const mockUseCheckoutUI = vi.fn().mockReturnValue({
    processOrder: mockProcessOrder,
    isProcessing: false,
    error: null,
    warning: null
});

vi.mock('@/hooks/useCheckOutUI', () => ({
    useCheckoutUI: () => mockUseCheckoutUI()
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

    const fillForm = (values = { name: 'Juan Test', phone: '656 123 4567', address: 'Calle Test 123', date: '2024-12-20' }) => {
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
                { name: 'Juan Test', phone: '656 123 4567' },
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

    it('shows fallback UI and allows manual WhatsApp redirect when processOrder returns a warning', async () => {
        // Mock a failure that returns an offline folio and a warning
        mockProcessOrder.mockResolvedValueOnce({
            success: true,
            folio: 'OFFLINE-12345',
            warning: 'server_exception'
        });

        // We also need the hook to actually reflect this warning in its state if we want to test the UI reactive to it.
        // But since we are mocking the hook AT the module level, we might need to be more clever if we want to test the reactive UI.
        // For simplicity in this mock-heavy test, let's just adjust the hook mock to return the warning state IF called.

        // Let's re-mock the hook for this specific test case
        mockUseCheckoutUI.mockReturnValue({
            processOrder: mockProcessOrder,
            isProcessing: false,
            error: null,
            warning: 'server_exception'
        });

        setup();

        // Fill form
        fillForm({ name: 'Test User', phone: '656 123 4567', address: 'Calle Test 123', date: '2024-12-20' });
        fireEvent.click(screen.getByRole('checkbox'));

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Generar Pedido en WhatsApp/i }));

        await waitFor(() => {
            expect(mockProcessOrder).toHaveBeenCalled();
        });

        // Verify fallback UI is visible
        expect(screen.getByText(/No pudimos sincronizar tu pedido/i)).toBeInTheDocument();
        expect(screen.getByText('OFFLINE-12345')).toBeInTheDocument();

        // Click fallback button
        const fallbackButton = screen.getByRole('button', { name: /Enviar por WhatsApp/i });
        fireEvent.click(fallbackButton);

        await waitFor(() => {
            expect(mockWindowOpen).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalledWith('OFFLINE-12345', 'Test User');
        });
    });
});
