// File: components/Calculator/steps/Step5Summary.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Step5Summary } from './Step5Summary';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';

// --- Types for Mocks ---
interface MockModalProps {
    isOpen: boolean;
    onSuccess: (folio: string, name: string) => void;
}

interface MockTicketProps {
    folio?: string;
}

// --- Mocks ---
vi.mock('@/store/useCejStore');
vi.mock('@/hooks/useQuoteCalculator');

// Mock LeadFormModal with proper typing to avoid 'any'
vi.mock('../modals/LeadFormModal', () => ({
    LeadFormModal: ({ isOpen, onSuccess }: MockModalProps) => (
        isOpen ? (
            <div data-testid="lead-modal">
                <button onClick={() => onSuccess('FOLIO-123', 'Juan')}>
                    Simular Envio
                </button>
            </div>
        ) : null
    )
}));

// Mock TicketDisplay to isolate Step5 logic from Ticket rendering logic
vi.mock('../TicketDisplay/TicketDisplay', () => ({
    TicketDisplay: ({ folio }: MockTicketProps) => (
        <div data-testid="ticket-display">
            {folio || 'PREVIEW'}
        </div>
    )
}));

describe('Step5Summary Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // FIX: Mock window.scrollTo to prevent JSDOM "Not implemented" error
        Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

        // Default Store State Mock
        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: unknown) => unknown) => selector({
            draft: {},
            resetDraft: vi.fn()
        }));
    });

    it('shows empty state hint if total is 0', () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 0 }
        });

        render(<Step5Summary />);
        expect(screen.getByText(/Completa los datos/i)).toBeDefined();
    });

    it('shows "Ver Cotización" button when quote is valid', () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000 },
            isValid: true,
            warning: null
        });

        render(<Step5Summary />);
        expect(screen.getByText(/Ver Cotización Formal/i)).toBeDefined();
    });

    it('opens lead modal on click', () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000 },
            isValid: true
        });

        render(<Step5Summary />);

        const ctaButton = screen.getByText(/Ver Cotización Formal/i);
        fireEvent.click(ctaButton);

        expect(screen.getByTestId('lead-modal')).toBeDefined();
    });

    it('switches to success view after lead submission', () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000 },
            isValid: true
        });

        render(<Step5Summary />);

        // 1. Open modal
        fireEvent.click(screen.getByText(/Ver Cotización Formal/i));

        // 2. Simulate success inside modal (trigger onSuccess prop)
        fireEvent.click(screen.getByText('Simular Envio'));

        // 3. Should now show "Confirmar Pedido por WhatsApp"
        expect(screen.getByText(/Confirmar Pedido por WhatsApp/i)).toBeDefined();

        // 4. Ticket should show the generated Folio
        expect(screen.getByTestId('ticket-display')).toHaveTextContent('FOLIO-123');

        // 5. Verify scroll was called (UX Requirement)
        expect(window.scrollTo).toHaveBeenCalled();
    });
});
