import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TicketDisplay } from './TicketDisplay';
import { EMPTY_QUOTE } from '@/lib/pricing';

describe('TicketDisplay Component', () => {
    const mockQuote = {
        ...EMPTY_QUOTE,
        total: 1500.00,
        subtotal: 1388.89,
        vat: 111.11,
        breakdownLines: [
            { label: "Concreto f'c 200", value: 1388.89, type: 'base' as const }
        ]
    };

    it('renders PREVIEW variant blurring details', () => {
        render(<TicketDisplay variant="preview" quote={mockQuote} />);

        // Should show total roughly (or hidden by blur visuals, but present in DOM)
        expect(screen.getByText(/COTIZACIÓN PRELIMINAR/i)).toBeInTheDocument();

        // The overlay text must be present
        expect(screen.getByText(/Desglose completo disponible/i)).toBeInTheDocument();

        // Customer name should NOT be visible even if passed
        expect(screen.queryByText(/Cliente:/i)).not.toBeInTheDocument();
    });

    it('renders FULL variant with detailed info', () => {
        render(
            <TicketDisplay
                variant="full"
                quote={mockQuote}
                folio="WEB-123"
                customerName="Test User"
            />
        );

        // Header info
        expect(screen.getByText("Folio: WEB-123")).toBeInTheDocument();
        expect(screen.getByText("Test User")).toBeInTheDocument();

        // Footer disclaimer
        expect(screen.getByText(/Precios sujetos a cambio/i)).toBeInTheDocument();

        // No blur overlay
        expect(screen.queryByText(/Desglose completo disponible/i)).not.toBeInTheDocument();
    });
});
