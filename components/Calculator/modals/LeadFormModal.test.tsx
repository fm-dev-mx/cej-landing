import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LeadFormModal } from './LeadFormModal';

// Mock portal so it renders in the normal test DOM
vi.mock('react-dom', async () => {
    const actual = await vi.importActual('react-dom');
    return {
        ...actual,
        createPortal: (node: React.ReactNode) => node,
    };
});

describe('LeadFormModal Component', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockQuoteDetails = {
        summary: { total: 5000, volume: 5, product: 'Concreto 200' },
        context: { work_type: 'Losa' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Global fetch mock
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not render when isOpen is false', () => {
        render(
            <LeadFormModal
                isOpen={false}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />
        );
        expect(screen.queryByText(/Casi listo/i)).not.toBeInTheDocument();
    });

    it('renders correctly when open', () => {
        render(
            <LeadFormModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />
        );
        expect(screen.getByText(/Casi listo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument();
    });

    it('shows validation errors for empty or invalid inputs', async () => {
        render(
            <LeadFormModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />
        );

        const submitBtn = screen.getByRole('button', { name: /Continuar a WhatsApp/i });

        // 1. Attempt to submit empty
        // Since inputs are 'required', the onSubmit handler shouldn't fire in a spec-compliant env
        fireEvent.click(submitBtn);
        expect(global.fetch).not.toHaveBeenCalled();

        // 2. Test Custom Name Validation
        // We MUST fill the Phone field first to satisfy its HTML5 'required' attribute.
        // Otherwise, the browser stops before reaching our custom onSubmit logic.
        const phoneInput = screen.getByLabelText(/Teléfono/i);
        fireEvent.change(phoneInput, { target: { value: '6561234567' } });

        // Fill Name with invalid data (too short)
        const nameInput = screen.getByLabelText(/Nombre completo/i);
        fireEvent.change(nameInput, { target: { value: 'Jo' } }); // Length < 3

        fireEvent.click(submitBtn);

        // Wait for manual validation error message (async update)
        // Using findByText handles the React re-render wait
        expect(await screen.findByText(/ingresa tu nombre completo/i)).toBeInTheDocument();
    });

    it('submits data to API and triggers onSuccess callback', async () => {
        // Mock successful API response
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(
            <LeadFormModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />
        );

        // Fill form
        fireEvent.change(screen.getByLabelText(/Nombre completo/i), { target: { value: 'Juan Pérez' } });
        fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '6561234567' } });

        // Submit
        const submitBtn = screen.getByRole('button', { name: /Continuar a WhatsApp/i });
        fireEvent.click(submitBtn);

        // Verify loading state
        expect(submitBtn).toBeDisabled();
        expect(screen.getByText(/Procesando.../i)).toBeInTheDocument();

        await waitFor(() => {
            // Verify fetch call
            expect(global.fetch).toHaveBeenCalledWith('/api/leads', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    name: 'Juan Pérez',
                    phone: '6561234567',
                    quote: mockQuoteDetails
                })
            }));

            // Verify success callback
            expect(mockOnSuccess).toHaveBeenCalledWith('Juan Pérez');
        });
    });

    it('handles API errors gracefully (fallback logic)', async () => {
        // Simulate server 500 error
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 500,
        });

        // Spy on console.error to silence it in the test output
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <LeadFormModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                quoteDetails={mockQuoteDetails}
            />
        );

        fireEvent.change(screen.getByLabelText(/Nombre completo/i), { target: { value: 'Juan Error' } });
        fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '6561112233' } });

        fireEvent.click(screen.getByRole('button', { name: /Continuar a WhatsApp/i }));

        await waitFor(() => {
            // Component must call onSuccess even if API fails (Fail-safe feature)
            expect(mockOnSuccess).toHaveBeenCalledWith('Juan Error');
        });

        consoleSpy.mockRestore();
    });
});
