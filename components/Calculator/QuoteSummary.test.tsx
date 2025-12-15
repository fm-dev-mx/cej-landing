
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

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock scrollIntoView
        window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
        // Mock getState on useCejStore
        (useCejStore as unknown as { getState: () => { user: { phone: string } } }).getState = vi.fn().mockReturnValue({
            user: { phone: '5555555555' }
        });

        // Default Store State Mock
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
            submittedQuote: null,
            setSubmittedQuote: vi.fn(),
            clearSubmittedQuote: vi.fn(),
            breakdownViewed: false,
            setBreakdownViewed: vi.fn()
        }));
    });

    it('shows "Ver Total" CTA button in preview stage when quote is valid', () => {
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
        expect(screen.getByRole('button', { name: /Ver Total/i })).toBeDefined();
    });

    it('shows "Programar Pedido" and Actions in actions stage (after Ver Total)', () => {
        // Mock breakdownViewed = true (user clicked "Ver Total")
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
            breakdownViewed: true, // User has viewed Breakdown
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
        // Expect New Buttons
        expect(screen.getByRole('button', { name: /Programar/i })).toBeDefined();
        // Expect Finalizar to be GONE
        expect(screen.queryByRole('button', { name: /Finalizar Cotización/i })).toBeNull();
    });

    it('opens scheduling modal on "Programar" click', () => {
        // Mock breakdownViewed = true
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
            breakdownViewed: true,
            setBreakdownViewed: vi.fn()
        }));

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000, subtotal: 4630, vat: 370, breakdownLines: [] },
            isValid: true
        });

        render(<QuoteSummary />);

        const ctaButton = screen.getByRole('button', { name: /Programar/i });
        fireEvent.click(ctaButton);

        expect(screen.getByTestId('scheduling-modal')).toBeDefined();
    });

    it('switches to success view after scheduling success', () => {
        const mockSetSubmittedQuote = vi.fn();

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
            setSubmittedQuote: mockSetSubmittedQuote,
            clearSubmittedQuote: vi.fn(),
            breakdownViewed: true,
            setBreakdownViewed: vi.fn()
        }));

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000, subtotal: 4630, vat: 370, breakdownLines: [] },
            isValid: true
        });

        render(<QuoteSummary />);

        // Open Modal
        fireEvent.click(screen.getByRole('button', { name: /Programar/i }));

        // Simulate Success
        fireEvent.click(screen.getByText('Simular Agendado'));

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

        (useCejStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: unknown) => unknown) => selector({
            draft: { mode: 'assistM3', workType: 'slab' },
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
            breakdownViewed: false,
            setBreakdownViewed: vi.fn()
        }));

        (useQuoteCalculator as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            quote: { total: 5000, subtotal: 4630, vat: 370, breakdownLines: [] },
            isValid: false
        });

        // Test that the component renders without error when onScrollToTop is provided.
        // The actual scroll invocation is tested via integration (CalculatorForm).
        // This test ensures the prop interface is correctly typed and accepted.
        const { container } = render(<QuoteSummary onScrollToTop={mockScrollToTop} />);

        // Verify component renders successfully with the prop
        expect(container.querySelector('[data-testid="ticket-display"]')).toBeDefined();

        // The prop is a callback, not auto-invoked on render
        expect(mockScrollToTop).not.toHaveBeenCalled();
    });
});
