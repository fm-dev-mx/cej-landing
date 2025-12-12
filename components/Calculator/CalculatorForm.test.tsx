// components/Calculator/CalculatorForm.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalculatorForm } from '@/components/Calculator/CalculatorForm';
import { useCejStore } from '@/store/useCejStore';

// We mock child components to focus on the Form Orchestration logic
vi.mock('@/components/Calculator/ModeSelector', () => ({
    ModeSelector: ({ currentMode }: { currentMode: string }) => (
        <div data-testid="mode-selector">Mode: {currentMode}</div>
    )
}));

vi.mock('@/components/Calculator/Forms/KnownVolumeForm', () => ({
    KnownVolumeForm: () => <input data-testid="known-input" placeholder="m3" />
}));

vi.mock('@/components/Calculator/Forms/WorkTypeSelector', () => ({
    WorkTypeSelector: () => <div data-testid="work-type-selector">WorkType</div>
}));

vi.mock('@/components/Calculator/QuoteSummary', () => ({
    QuoteSummary: () => <div data-testid="summary-ticket">Summary</div>
}));

describe('CalculatorForm (Integration)', () => {

    beforeEach(() => {
        const { resetDraft, setMode } = useCejStore.getState();
        resetDraft();
        setMode('knownM3');
    });

    it('renders the initial state (Known Volume Mode)', () => {
        render(<CalculatorForm />);

        expect(screen.getByText(/¿Cómo quieres cotizar?/i)).toBeInTheDocument();
        expect(screen.getByTestId('mode-selector')).toHaveTextContent('Mode: knownM3');
        expect(screen.getByTestId('known-input')).toBeInTheDocument();
        // Expert options hidden by default
        expect(screen.queryByText(/Aditivos/i)).not.toBeInTheDocument();
    });

    it('switches layout when mode changes', () => {
        // Simulate mode change directly in the store
        useCejStore.getState().setMode('assistM3');

        render(<CalculatorForm />);

        expect(screen.getByTestId('mode-selector')).toHaveTextContent('Mode: assistM3');
        expect(screen.queryByTestId('known-input')).not.toBeInTheDocument();
        expect(screen.getByTestId('work-type-selector')).toBeInTheDocument();
    });
});
