
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteSummary } from './QuoteSummary';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';

// Mock dependencies
vi.mock('@/store/useCejStore');
vi.mock('@/hooks/useQuoteCalculator');
vi.mock('@/app/actions/getPriceConfig', () => ({
    getPriceConfig: vi.fn().mockResolvedValue(undefined)
}));

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

// Mock SchedulingModal
vi.mock('./modals/SchedulingModal', () => ({
    SchedulingModal: ({ isOpen, onSuccess }: { isOpen: boolean; onSuccess: (folio: string, name: string) => void }) => (
        isOpen ? (
            <div data-testid="scheduling-modal">
                <button onClick={() => onSuccess('FOLIO-SCH-123', 'Test Scheduler')}>Simular Agendado</button>
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

describe('QuoteSummary Integration - Streamlined Flow', () => {
    const mockScrollIntoView = vi.fn();
    const setupStore = (overrides: Record<string, unknown> = {}) => {
        const baseState = {
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
            submittedQuote: null,
            setSubmittedQuote: vi.fn(),
            clearSubmittedQuote: vi.fn(),
            breakdownViewed: false,
            setBreakdownViewed: vi.fn()
        };

        const state = { ...baseState, ...overrides };
        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (store: unknown) => unknown) => selector(state));
        return state;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock scrollIntoView
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
        // Mock getState on useCejStore
        (useCejStore as unknown as { getState: () => { user: { phone: string } } }).getState = vi.fn().mockReturnValue({
            user: { phone: '5555555555' }
        });

        setupStore();
    });

    it('shows disabled "Ver Total" CTA in preview stage when quote is invalid', async () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 0,
                subtotal: 0,
                vat: 0,
                breakdownLines: []
            },
            isValid: false,
            warning: null
        });

        await act(async () => {
            render(<QuoteSummary />);
        });

        expect(screen.getByRole('button', { name: /Ver Total/i })).toBeDisabled();
        expect(screen.queryByTestId('ticket-display')).not.toBeInTheDocument();
    });

    it('shows enabled "Ver Total" CTA in preview stage when quote is valid', async () => {
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

        await act(async () => {
            render(<QuoteSummary />);
        });
        expect(screen.getByRole('button', { name: /Ver Total/i })).toBeEnabled();
    });

    it('keeps preview stage and hides ticket when breakdownViewed is true but quote is invalid', () => {
        setupStore({ breakdownViewed: true });

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 0,
                subtotal: 0,
                vat: 0,
                breakdownLines: []
            },
            isValid: false,
            warning: null
        });

        render(<QuoteSummary />);

        expect(screen.getByRole('button', { name: /Ver Total/i })).toBeDisabled();
        expect(screen.queryByTestId('ticket-display')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Programar/i })).not.toBeInTheDocument();
    });

    it('does not switch stage when clicking disabled "Ver Total"', () => {
        const setBreakdownViewed = vi.fn();
        setupStore({
            breakdownViewed: false,
            setBreakdownViewed
        });

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 0,
                subtotal: 0,
                vat: 0,
                breakdownLines: []
            },
            isValid: false,
            warning: null
        });

        render(<QuoteSummary />);
        const cta = screen.getByRole('button', { name: /Ver Total/i });
        fireEvent.click(cta);

        expect(setBreakdownViewed).not.toHaveBeenCalled();
        expect(screen.queryByTestId('ticket-display')).not.toBeInTheDocument();
    });

    it('shows "Programar Pedido" and Actions in actions stage (after Ver Total)', () => {
        // Mock breakdownViewed = true (user clicked "Ver Total")
        setupStore({ breakdownViewed: true });

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
        // Expect New Buttons
        expect(screen.getByRole('button', { name: /Programar/i })).toBeDefined();
        // Expect Finalizar to be GONE
        expect(screen.queryByRole('button', { name: /Finalizar Cotización/i })).toBeNull();
    });

    it('opens scheduling modal on "Programar" click', async () => {
        // Mock breakdownViewed = true
        setupStore({ breakdownViewed: true });

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000, subtotal: 4630, vat: 370, breakdownLines: [] },
            isValid: true
        });

        render(<QuoteSummary />);

        const ctaButton = screen.getByRole('button', { name: /Programar/i });
        await act(async () => {
            fireEvent.click(ctaButton);
        });

        expect(screen.getByTestId('scheduling-modal')).toBeDefined();
    });

    it('switches to success view after scheduling success', async () => {
        const mockSetSubmittedQuote = vi.fn();

        setupStore({
            breakdownViewed: true,
            setSubmittedQuote: mockSetSubmittedQuote
        });

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000, subtotal: 4630, vat: 370, breakdownLines: [] },
            isValid: true
        });

        render(<QuoteSummary />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Programar/i }));
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Simular Agendado'));
        });

        // Verify Submitted Quote Set
        expect(mockSetSubmittedQuote).toHaveBeenCalledWith(expect.objectContaining({
            folio: 'FOLIO-SCH-123',
            name: 'Test Scheduler'
        }));
    });

    it('accepts onScrollToTop prop for scroll-after-reset behavior', () => {
        const mockScrollToTop = vi.fn();

        (useCejStore as unknown as { getState: () => unknown }).getState = vi.fn().mockReturnValue({
            user: { phone: '5555555555' }
        });

        setupStore({
            draft: { mode: 'assistM3', workType: 'slab' },
            breakdownViewed: false
        });

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000, subtotal: 4630, vat: 370, breakdownLines: [] },
            isValid: false
        });

        // Test that the component renders without error when onScrollToTop is provided.
        // The actual scroll invocation is tested via integration (CalculatorForm).
        // This test ensures the prop interface is correctly typed and accepted.
        render(<QuoteSummary onScrollToTop={mockScrollToTop} />);
        expect(screen.queryByTestId('ticket-display')).not.toBeInTheDocument();

        // The prop is a callback, not auto-invoked on render
        expect(mockScrollToTop).not.toHaveBeenCalled();
    });
});
