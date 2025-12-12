// File: components/Calculator/QuoteSummary.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuoteSummary } from './QuoteSummary';
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

// Capture the mock function to assert on it
const { mockProcessOrder } = vi.hoisted(() => ({
    mockProcessOrder: vi.fn().mockResolvedValue(true)
}));

vi.mock('@/hooks/useCheckOutUI', () => ({
    useCheckoutUI: () => ({
        processOrder: mockProcessOrder,
        isProcessing: false
    })
}));

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

// Mock TicketDisplay to isolate QuoteSummary logic from Ticket rendering logic
vi.mock('../TicketDisplay/TicketDisplay', () => ({
    TicketDisplay: ({ folio }: MockTicketProps) => (
        <div data-testid="ticket-display">
            {folio || 'PREVIEW'}
        </div>
    )
}));

describe('QuoteSummary Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProcessOrder.mockClear();

        // FIX: Mock scrollIntoView
        Element.prototype.scrollIntoView = vi.fn();
        // Keep scrollTo mock just in case, but we expect scrollIntoView
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

        render(<QuoteSummary />);
        expect(screen.getByText(/Completa los datos/i)).toBeDefined();
    });

    it('shows "Continuar" button when quote is valid', () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000 },
            isValid: true,
            warning: null
        });

        render(<QuoteSummary />);
        expect(screen.getByText(/Continuar con mi cotización/i)).toBeDefined();
    });

    it('opens lead modal on click', () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000 },
            isValid: true
        });

        render(<QuoteSummary />);

        const ctaButton = screen.getByText(/Continuar con mi cotización/i);
        fireEvent.click(ctaButton);

        expect(screen.getByTestId('lead-modal')).toBeDefined();
    });

    it('switches to success view after lead submission', () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000 },
            isValid: true
        });

        const { container } = render(<QuoteSummary />);

        // 1. Open modal
        fireEvent.click(screen.getByText(/Continuar con mi cotización/i));

        // 2. Simulate success inside modal (trigger onSuccess prop)
        fireEvent.click(screen.getByText('Simular Envio'));

        // 3. Should now show "Enviar por WhatsApp al equipo CEJ"
        expect(screen.getByText(/Enviar por WhatsApp al equipo CEJ/i)).toBeDefined();

        // 4. Ticket should show the generated Folio
        expect(screen.getByTestId('ticket-display')).toHaveTextContent('FOLIO-123');

        // 5. Verify scrollIntoView was called (UX Requirement)
        // We need to wait for the setTimeout
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const ticketContainer = container.querySelector('[data-ticket-container="true"]');
                expect(ticketContainer?.scrollIntoView).toHaveBeenCalledWith({
                    behavior: 'smooth',
                    block: 'center'
                });
                resolve();
            }, 150);
        });
    });

    it('reuses user data if exists (skips modal step by auto-processing)', async () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000 },
            isValid: true
        });

        // Mock store with existing user data
        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: unknown) => unknown) => selector({
            draft: {},
            resetDraft: vi.fn(),
            user: { name: 'Reuse User', phone: '5555555555' }
        }));

        render(<QuoteSummary />);

        // 1. Click Continue
        fireEvent.click(screen.getByText(/Continuar con mi cotización/i));

        // 2. Should call processOrder automatically
        await waitFor(() => {
            expect(mockProcessOrder).toHaveBeenCalledWith(
                { name: 'Reuse User', phone: '5555555555' },
                false
            );
        });

        // 3. Should eventually open modal (as pre-filled confirmation/success step per current logic)
        await screen.findByTestId('lead-modal');
    });
});
