
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteSummary } from './QuoteSummary';
import { usePublicStore } from '@/store/public/usePublicStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';

// Mock dependencies
vi.mock('@/store/public/usePublicStore');
vi.mock('@/hooks/useQuoteCalculator');
vi.mock('@/app/actions/getPriceConfig', () => ({
    getPriceConfig: vi.fn().mockResolvedValue(undefined)
}));

// Capture the mock function to assert on it
const { mockProcessOrder } = vi.hoisted(() => ({
    mockProcessOrder: vi.fn().mockResolvedValue({ success: true, folio: 'WEB-AUTO-GENERATED' })
}));

const createMockQuote = (overrides = {}) => ({
    quote: { total: 5000, subtotal: 4630, vat: 370, breakdownLines: [], volume: { billedM3: 1 }, strength: '250', concreteType: 'pumped', ...overrides },
    isValid: true,
    warning: null
});

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
    trackLead: vi.fn(),
    trackViewContent: vi.fn(),
    trackAddToCart: vi.fn(),
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
        (usePublicStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (store: unknown) => unknown) => selector(state));
        return state;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock scrollIntoView
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
        // Mock getState on usePublicStore
        (usePublicStore as unknown as { getState: () => { user: { phone: string } } }).getState = vi.fn().mockReturnValue({
            user: { phone: '5555555555' }
        });

        setupStore();
    });

    it('shows incomplete prompt when quote is invalid', async () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 0,
                subtotal: 0,
                vat: 0,
                breakdownLines: [],
                volume: { billedM3: 0 },
                strength: '250',
                concreteType: 'standard'
            },
            isValid: false,
            warning: null
        });

        await act(async () => {
            render(<QuoteSummary />);
        });

        expect(screen.getByText(/Ingresa los detalles para ver tu cotización/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Programar Pedido/i })).not.toBeInTheDocument();
    });

    it('shows enabled "Programar Pedido" CTA when quote is valid', async () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: {
                total: 5000,
                subtotal: 4630,
                vat: 370,
                breakdownLines: [{ label: 'Concreto', value: 4630, type: 'base' }],
                volume: { billedM3: 1 },
                strength: '250',
                concreteType: 'pumped'
            },
            isValid: true,
            warning: null
        });

        await act(async () => {
            render(<QuoteSummary />);
        });
        expect(screen.getByRole('button', { name: /Programar Pedido/i })).toBeEnabled();
    });

    it('opens scheduling modal on "Programar Pedido" click', async () => {
        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue(createMockQuote({ breakdownLines: [] }));

        render(<QuoteSummary />);

        const ctaButton = screen.getByRole('button', { name: /Programar Pedido/i });
        await act(async () => {
            fireEvent.click(ctaButton);
        });

        expect(screen.getByTestId('scheduling-modal')).toBeInTheDocument();
    });

    it('switches to success view after scheduling success', async () => {
        const mockSetSubmittedQuote = vi.fn();

        setupStore({
            setSubmittedQuote: mockSetSubmittedQuote
        });

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue(createMockQuote({ breakdownLines: [] }));

        render(<QuoteSummary />);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Programar Pedido/i }));
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

    it('accepts onScrollToTop prop for reset behavior', () => {
        const mockScrollToTop = vi.fn();

        (usePublicStore as unknown as { getState: () => unknown }).getState = vi.fn().mockReturnValue({
            user: { phone: '5555555555' }
        });

        setupStore({
            draft: { mode: 'assistM3', workType: 'slab' }
        });

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000, subtotal: 4630, vat: 370, breakdownLines: [], volume: { billedM3: 1 }, strength: '250', concreteType: 'pumped' },
            isValid: false
        });

        // Test that the component renders without error when onScrollToTop is provided.
        // The actual scroll invocation is tested via integration (CalculatorForm).
        // This test ensures the prop interface is correctly typed and accepted.
        render(<QuoteSummary onScrollToTop={mockScrollToTop} />);
        expect(screen.getByTestId('ticket-display')).toBeInTheDocument();

        // The prop is a callback, not auto-invoked on render
        expect(mockScrollToTop).not.toHaveBeenCalled();
    });
});
