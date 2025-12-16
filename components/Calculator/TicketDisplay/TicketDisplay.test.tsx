import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TicketDisplay } from '@/components/Calculator/TicketDisplay/TicketDisplay';
import { QuoteBreakdown } from '@/types/domain';

// Mock quote data
const MOCK_QUOTE: QuoteBreakdown = {
    volume: {
        requestedM3: 5,
        roundedM3: 5,
        minM3ForType: 3,
        billedM3: 5,
        isBelowMinimum: false
    },
    strength: '250',
    concreteType: 'direct',
    unitPricePerM3: 2000,
    baseSubtotal: 10000,
    additivesSubtotal: 0,
    subtotal: 10000,
    vat: 1600,
    total: 11600,
    breakdownLines: [
        { label: "Concreto Directo 5 m³", value: 10000, type: 'base' }
    ]
};

describe('TicketDisplay', () => {
    it('renders the correct financial breakdown', () => {
        render(<TicketDisplay quote={MOCK_QUOTE} variant="full" />);

        // Check key values
        expect(screen.getAllByText('$10,000.00').length).toBeGreaterThan(0); // Subtotal
        expect(screen.getByText('$1,600.00')).toBeInTheDocument(); // IVA
        expect(screen.getByText('$11,600.00')).toBeInTheDocument(); // Total
    });

    it('shows volume details', () => {
        render(<TicketDisplay quote={MOCK_QUOTE} variant="full" />);
        // Phase 1: Volume now appears in both volumeInfo section and breakdown label
        expect(screen.getAllByText(/5 m³/).length).toBeGreaterThan(0);
    });

    it('handles null quote (Loading/Empty state)', () => {
        render(<TicketDisplay quote={null} variant="preview" />);
        expect(screen.getByText(/No hay datos de cotización/i)).toBeInTheDocument();
    });

    it('renders compact variant correctly', () => {
        const mockSteps = [
            { id: '1', label: 'Paso 1', isCompleted: true, isActive: false },
            { id: '2', label: 'Paso 2', isCompleted: false, isActive: true },
            { id: '3', label: 'Paso 3', isCompleted: false, isActive: false },
        ];

        render(<TicketDisplay quote={MOCK_QUOTE} variant="compact" steps={mockSteps} isValidQuote={false} />);

        // Should show the active step label when not complete
        // In the mock, Step 2 is active, so it should show "Paso 2" or "Completar" logic?
        // Logic: const currentLabel = steps?.find(s => s.isActive)?.label || "Completar";
        expect(screen.getByText('Paso 2')).toBeInTheDocument();

        // Should NOT show the full breakdown
        expect(screen.queryByText('$10,000.00')).not.toBeInTheDocument();
    });
});
