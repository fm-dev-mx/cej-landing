// components/Calculator/QuoteCTA.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteCTA } from './QuoteCTA';
import type { QuoteBreakdown } from '@/types/domain';

// Mock dependencies
vi.mock('@/config/env', () => ({
    env: {
        NEXT_PUBLIC_PIXEL_ID: '123',
        NEXT_PUBLIC_WHATSAPP_NUMBER: '5216561234567',
    },
}));

vi.mock('@/lib/tracking/visitor', () => ({
    trackContact: vi.fn(),
    trackInitiateCheckout: vi.fn(),
}));

// Spy on window.open
const mockWindowOpen = vi.fn();

// Build a minimal valid QuoteBreakdown for testing
const mockQuote: QuoteBreakdown = {
    volume: {
        requestedM3: 5,
        roundedM3: 5,
        minM3ForType: 3,
        billedM3: 5,
        isBelowMinimum: false,
    },
    strength: '200',
    concreteType: 'direct',
    unitPricePerM3: 2000,
    baseSubtotal: 10000,
    additivesSubtotal: 0,
    subtotal: 10000,
    vat: 1600,
    total: 11600,
    breakdownLines: [],
};

describe('QuoteCTA', () => {
    beforeEach(() => {
        mockWindowOpen.mockClear();
        Object.defineProperty(window, 'open', {
            writable: true,
            configurable: true,
            value: mockWindowOpen,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the WhatsApp primary CTA button', () => {
        render(<QuoteCTA quote={mockQuote} />);
        expect(screen.getByRole('button', { name: /consultar por whatsapp/i })).toBeInTheDocument();
    });

    it('renders the secondary form CTA button when onOpenForm is provided', () => {
        const onOpenForm = vi.fn();
        render(<QuoteCTA quote={mockQuote} onOpenForm={onOpenForm} />);
        expect(screen.getByRole('button', { name: /enviar mis datos/i })).toBeInTheDocument();
    });

    it('opens a WhatsApp URL with folio on primary click', () => {
        render(<QuoteCTA quote={mockQuote} />);
        const primaryBtn = screen.getByRole('button', { name: /consultar por whatsapp/i });
        fireEvent.click(primaryBtn);

        expect(mockWindowOpen).toHaveBeenCalledTimes(1);
        const openedUrl = mockWindowOpen.mock.calls[0][0] as string;
        expect(openedUrl).toContain('wa.me/');
        expect(openedUrl).toContain('Folio');
    });

    it('calls onOpenForm when secondary CTA is clicked', () => {
        const onOpenForm = vi.fn();
        render(<QuoteCTA quote={mockQuote} onOpenForm={onOpenForm} />);
        const secondaryBtn = screen.getByRole('button', { name: /enviar mis datos/i });
        fireEvent.click(secondaryBtn);

        expect(onOpenForm).toHaveBeenCalledTimes(1);
    });

    it('does not call onOpenForm when primary CTA is clicked', () => {
        const onOpenForm = vi.fn();
        render(<QuoteCTA quote={mockQuote} onOpenForm={onOpenForm} />);
        const primaryBtn = screen.getByRole('button', { name: /consultar por whatsapp/i });
        fireEvent.click(primaryBtn);

        expect(onOpenForm).not.toHaveBeenCalled();
    });
});
