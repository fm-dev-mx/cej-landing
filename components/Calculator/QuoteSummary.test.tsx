
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteSummary } from './QuoteSummary';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { useCheckoutUI } from '@/hooks/useCheckOutUI';

// Mock dependencies
vi.mock('@/store/useCejStore');
vi.mock('@/hooks/useQuoteCalculator');

// Capture the mock function to assert on it
const { mockProcessOrder } = vi.hoisted(() => ({
    mockProcessOrder: vi.fn().mockResolvedValue({ success: true, folio: 'WEB-AUTO-GENERATED' })
}));

vi.mock('@/hooks/useCheckOutUI', () => ({
    useCheckoutUI: vi.fn().mockReturnValue({
        processOrder: mockProcessOrder,
        isProcessing: false,
        error: null
    })
}));

// Mock LeadFormModal
vi.mock('./modals/LeadFormModal', () => ({
    LeadFormModal: ({ isOpen, onSuccess }: { isOpen: boolean; onSuccess: (folio: string, name: string) => void }) => (
        isOpen ? (
            <div data-testid="lead-modal">
                <button onClick={() => onSuccess('FOLIO-123', 'Test User')}>Simular Envio</button>
            </div>
        ) : null
    )
}));

// Mock lib/tracking/visitor
vi.mock('@/lib/tracking/visitor', () => ({
    trackContact: vi.fn(),
    trackLead: vi.fn()
}));

// Mock TicketDisplay
vi.mock('./TicketDisplay/TicketDisplay', () => ({
    TicketDisplay: ({ folio, variant }: { folio?: string; variant: string }) => (
        <div data-testid="ticket-display" data-variant={variant}>
            {folio || 'PREVIEW'}
        </div>
    )
}));

describe('QuoteSummary Integration - Phase 1 Progressive Disclosure', () => {
    const mockScrollIntoView = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock scrollIntoView
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
        // Mock getState on useCejStore
        (useCejStore as unknown as { getState: () => { user: { phone: string } } }).getState = vi.fn().mockReturnValue({
            user: { phone: '5555555555' }
        });

        // Default Store State Mock - Phase 1: Added breakdownViewed
        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: unknown) => unknown) => selector({
            draft: {},
            resetDraft: vi.fn(),
            user: {},
            cart: [],
            addToCart: vi.fn(() => 'mock-item-id'),
            updateCartItemCustomer: vi.fn(),
            updateCartItemFolio: vi.fn(),
            moveToHistory: vi.fn(),
            setDrawerOpen: vi.fn(),
            setActiveTab: vi.fn(),
            // Phase 0: Submission slice
            submittedQuote: null,
            setSubmittedQuote: vi.fn(),
            clearSubmittedQuote: vi.fn(),
            // Phase 1: Progressive disclosure
            breakdownViewed: false,
            setBreakdownViewed: vi.fn()
        }));
    });

    it('shows empty state hint if total is 0', () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 0,
                subtotal: 0,
                vat: 0,
                breakdownLines: []
            }
        });

        render(<QuoteSummary />);
        expect(screen.getByText(/Completa los datos/i)).toBeDefined();
    });

    it('shows "Ver Desglose" CTA button in preview stage when quote is valid', () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 5000,
                subtotal: 4630,
                vat: 370,
                breakdownLines: [{ label: 'Concreto', value: 4630, type: 'base' }]
            },
            isValid: true,
            warning: null
        });

        render(<QuoteSummary />);
        expect(screen.getByRole('button', { name: /Verificar datos/i })).toBeDefined();
    });

    it('shows "Confirmar y Generar Ticket" CTA in breakdown stage', () => {
        // Mock breakdownViewed = true (user clicked "Ver Desglose")
        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: unknown) => unknown) => selector({
            draft: {},
            resetDraft: vi.fn(),
            user: {},
            cart: [],
            addToCart: vi.fn(() => 'mock-item-id'),
            updateCartItemCustomer: vi.fn(),
            moveToHistory: vi.fn(),
            setDrawerOpen: vi.fn(),
            setActiveTab: vi.fn(),
            submittedQuote: null,
            setSubmittedQuote: vi.fn(),
            clearSubmittedQuote: vi.fn(),
            breakdownViewed: true, // User has viewed breakdown
            setBreakdownViewed: vi.fn()
        }));

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 5000,
                subtotal: 4630,
                vat: 370,
                breakdownLines: [{ label: 'Concreto', value: 4630, type: 'base' }]
            },
            isValid: true
        });

        render(<QuoteSummary />);
        expect(screen.getByRole('button', { name: /Finalizar Cotización/i })).toBeDefined();
    });

    it('opens lead modal on "Confirmar y Generar Ticket" click when no user data', () => {
        // Mock breakdownViewed = true
        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: unknown) => unknown) => selector({
            draft: {},
            resetDraft: vi.fn(),
            user: {}, // No user data
            cart: [],
            addToCart: vi.fn(() => 'mock-item-id'),
            updateCartItemCustomer: vi.fn(),
            moveToHistory: vi.fn(),
            setDrawerOpen: vi.fn(),
            setActiveTab: vi.fn(),
            submittedQuote: null,
            setSubmittedQuote: vi.fn(),
            clearSubmittedQuote: vi.fn(),
            breakdownViewed: true,
            setBreakdownViewed: vi.fn()
        }));

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 5000,
                subtotal: 4630,
                vat: 370,
                breakdownLines: [{ label: 'Concreto', value: 4630, type: 'base' }]
            },
            isValid: true
        });

        render(<QuoteSummary />);

        const ctaButton = screen.getByRole('button', { name: /Finalizar Cotización/i });
        fireEvent.click(ctaButton);

        expect(screen.getByTestId('lead-modal')).toBeDefined();
    });

    it('switches to success view after lead submission', () => {
        // Track state changes via a local variable that the mock uses
        let currentSubmittedQuote: { folio: string; name: string } | null = null;
        const mockSetSubmittedQuote = vi.fn((data) => {
            currentSubmittedQuote = data;
        });

        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: unknown) => unknown) => selector({
            draft: {},
            resetDraft: vi.fn(),
            user: {},
            cart: [],
            addToCart: vi.fn(() => 'mock-item-id'),
            updateCartItemCustomer: vi.fn(),
            moveToHistory: vi.fn(),
            setDrawerOpen: vi.fn(),
            setActiveTab: vi.fn(),
            get submittedQuote() { return currentSubmittedQuote; },
            setSubmittedQuote: mockSetSubmittedQuote,
            clearSubmittedQuote: vi.fn(),
            breakdownViewed: true, // Already viewed breakdown
            setBreakdownViewed: vi.fn()
        }));

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 5000,
                subtotal: 4630,
                vat: 370,
                breakdownLines: [{ label: 'Concreto', value: 4630, type: 'base' }]
            },
            isValid: true
        });

        const { rerender } = render(<QuoteSummary />);

        // 1. Click Confirmar
        fireEvent.click(screen.getByRole('button', { name: /Finalizar Cotización/i }));

        // 2. Simulate success inside modal (this calls setSubmittedQuote)
        fireEvent.click(screen.getByText('Simular Envio'));

        // Verify setSubmittedQuote was called
        // Verify setSubmittedQuote was called with correct structure including results
        expect(mockSetSubmittedQuote).toHaveBeenCalledWith(expect.objectContaining({
            folio: 'FOLIO-123',
            name: 'Test User',
            results: expect.anything()
        }));

        // 3. Rerender to pick up the changed state
        rerender(<QuoteSummary />);

        // 4. Should now show "Finalizar orden en WhatsApp"
        expect(screen.getByText(/Finalizar orden en WhatsApp/i)).toBeDefined();

        // 5. Ticket should show the generated Folio from the mock LeadFormModal
        expect(screen.getByTestId('ticket-display')).toHaveTextContent('FOLIO-123');
    });

    it('reuses user data if exists (skips modal step by auto-processing)', async () => {
        // Track state changes via a local variable that the mock uses
        let currentSubmittedQuote: { folio: string; name: string } | null = null;
        const mockSetSubmittedQuote = vi.fn((data) => {
            currentSubmittedQuote = data;
        });

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 5000,
                subtotal: 4630,
                vat: 370,
                breakdownLines: [{ label: 'Concreto', value: 4630, type: 'base' }]
            },
            isValid: true
        });

        // Mock user data existing + breakdownViewed = true
        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: unknown) => unknown) => selector({
            draft: {},
            resetDraft: vi.fn(),
            user: { name: 'Reuse User', phone: '5555555555' },
            cart: [],
            addToCart: vi.fn(() => 'mock-item-id'),
            updateCartItemCustomer: vi.fn(),
            updateCartItemFolio: vi.fn(),
            moveToHistory: vi.fn(),
            setDrawerOpen: vi.fn(),
            setActiveTab: vi.fn(),
            get submittedQuote() { return currentSubmittedQuote; },
            setSubmittedQuote: mockSetSubmittedQuote,
            clearSubmittedQuote: vi.fn(),
            breakdownViewed: true, // Already viewed
            setBreakdownViewed: vi.fn()
        }));

        const { rerender } = render(<QuoteSummary />);

        // 1. Click "Confirmar y Generar Ticket"
        fireEvent.click(screen.getByRole('button', { name: /Finalizar Cotización/i }));

        // 2. Should call processOrder automatically
        await waitFor(() => {
            expect(mockProcessOrder).toHaveBeenCalledWith(
                { name: 'Reuse User', phone: '5555555555' },
                false
            );
        });

        // 3. Wait for setSubmittedQuote to be called
        await waitFor(() => {
            expect(mockSetSubmittedQuote).toHaveBeenCalled();
        });

        // 4. Rerender to pick up the changed state
        rerender(<QuoteSummary />);

        // 5. Should skip modal and show success view
        expect(screen.getByText(/Finalizar orden en WhatsApp/i)).toBeDefined();
    });

    it('does NOT show empty state while isProcessing is true', () => {
        // Setup: State resembles "Processing":
        // - quote total is 0 (was reset)
        // - isProcessing is TRUE
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 0, subtotal: 0, vat: 0, breakdownLines: [] },
            isValid: false
        });

        (useCheckoutUI as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            processOrder: mockProcessOrder,
            isProcessing: true,
            error: null
        });

        render(<QuoteSummary />);

        // Expectation: The "Completa los datos" overlay should NOT be present.
        expect(screen.queryByText(/Completa los datos/i)).toBeNull();

        // Button should be disabled
        const btn = screen.getByRole('button', { name: /Verificar datos/i });
        expect(btn).toBeDisabled();
    });
});
