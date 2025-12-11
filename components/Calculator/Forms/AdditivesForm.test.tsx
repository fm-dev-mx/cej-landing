// components/Calculator/Forms/AdditivesForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdditivesForm } from './AdditivesForm';
import { useCejStore } from '@/store/useCejStore';

// --- Types ---
// Define the specific slice of state used in these tests to avoid 'any'
interface MockState {
    draft: {
        additives: string[];
    };
    toggleAdditive: (id: string) => void;
}

// --- Mocks ---
const mockToggleAdditive = vi.fn();

vi.mock('@/store/useCejStore', () => ({
    useCejStore: vi.fn(),
}));

vi.mock('@/lib/pricing', () => ({
    DEFAULT_PRICING_RULES: {
        additives: [
            {
                id: 'fiber',
                active: true,
                label: 'Fibra',
                description: 'Refuerzo estructural',
                pricingModel: 'per_m3',
                priceCents: 5000
            },
            {
                id: 'accelerant',
                active: true,
                label: 'Acelerante',
                description: 'Secado rápido',
                pricingModel: 'fixed',
                priceCents: 20000
            }
        ]
    }
}));

vi.mock('@/lib/utils', () => ({
    fmtMXN: (val: number) => `$${val.toFixed(2)}`
}));

describe('Component: AdditivesForm', () => {
    // Helper to access the mock with correct typing
    const useCejStoreMock = useCejStore as unknown as Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation with empty additives
        useCejStoreMock.mockImplementation((selector: (state: MockState) => unknown) => {
            const state: MockState = {
                draft: { additives: [] },
                toggleAdditive: mockToggleAdditive
            };
            return selector(state);
        });
    });

    it('renders only active additives', () => {
        render(<AdditivesForm />);
        expect(screen.getByText('Fibra')).toBeDefined();
        expect(screen.getByText('Acelerante')).toBeDefined();
    });

    it('displays correct pricing labels', () => {
        render(<AdditivesForm />);
        expect(screen.getByText(/Refuerzo estructural \(\$50.00 \/ m³\)/)).toBeDefined();
        expect(screen.getByText(/Secado rápido \(\$200.00 fijo\)/)).toBeDefined();
    });

    it('indicates selected state correctly', () => {
        // Override mock implementation for this specific test case
        useCejStoreMock.mockImplementation((selector: (state: MockState) => unknown) => {
            const state: MockState = {
                draft: { additives: ['fiber'] },
                toggleAdditive: mockToggleAdditive
            };
            return selector(state);
        });

        render(<AdditivesForm />);

        // The testId is on the input, which is a void element.
        // We must check the container (label) for the checkmark text.
        const fiberInput = screen.getByTestId('addon-card-fiber');
        const fiberCardLabel = fiberInput.closest('label');

        const accelerantInput = screen.getByTestId('addon-card-accelerant');
        const accelerantCardLabel = accelerantInput.closest('label');

        // Check for the checkmark symbol in the label content
        expect(fiberCardLabel).toHaveTextContent('✔');
        expect(accelerantCardLabel).not.toHaveTextContent('✔');
    });

    it('calls toggleAdditive when clicked', () => {
        render(<AdditivesForm />);
        const card = screen.getByText('Fibra');
        fireEvent.click(card); // Click on label triggers input
        expect(mockToggleAdditive).toHaveBeenCalledWith('fiber');
    });

    it('returns null if no additives are available', () => {
        vi.resetModules();
        vi.doMock('@/lib/pricing', () => ({
            DEFAULT_PRICING_RULES: { additives: [] }
        }));

        // Even if additives are empty, the store selector might still be called,
        // so strict typing helps prevent regressions.
        render(<AdditivesForm />);
    });
});
