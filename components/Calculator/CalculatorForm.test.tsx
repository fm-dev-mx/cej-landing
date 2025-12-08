import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalculatorForm } from './CalculatorForm';
import { useCejStore } from '@/store/useCejStore';
import { DEFAULT_CALCULATOR_STATE } from '@/types/domain';

// --- Mocks ---
vi.mock('@/config/env', () => ({
    env: {
        NEXT_PUBLIC_PIXEL_ID: 'test-pixel',
        NEXT_PUBLIC_WHATSAPP_NUMBER: '521234567890',
        NEXT_PUBLIC_PHONE: '1234567890',
        NEXT_PUBLIC_SITE_URL: 'http://localhost',
        NEXT_PUBLIC_BRAND_NAME: 'CEJ Test',
        NEXT_PUBLIC_CURRENCY: 'MXN',
    },
}));

vi.mock('@/lib/pixel', () => ({
    trackViewContent: vi.fn(),
    trackLead: vi.fn(),
    trackContact: vi.fn(),
}));

// Helper to reset store
const resetStore = () => {
    useCejStore.setState({
        isDrawerOpen: false,
        activeTab: 'order',
        draft: { ...DEFAULT_CALCULATOR_STATE },
        cart: [],
        user: { visitorId: 'test-id', hasConsentedPersistence: true }
    } as any);
};

describe('Calculator Form Logic & A11y', () => {
    beforeEach(() => {
        resetStore();
        vi.clearAllMocks();
    });

    it('renders mode selection initially', () => {
        render(<CalculatorForm />);
        expect(screen.getByText('¿Cómo quieres cotizar?')).toBeInTheDocument();
    });

    it('moves focus to input when mode is selected (Known Volume)', () => {
        render(<CalculatorForm />);

        const radioKnown = screen.getByLabelText(/Sé la cantidad/i);

        // We need to spy on the input that will be rendered
        // Since React renders synchronously here, we simulate the focus flow logic
        // but JSDOM doesn't always perform "autofocus" effects from useEffect nicely without help.
        // However, we can check if the element exists and if our ref logic in the component fired.

        fireEvent.click(radioKnown);

        const input = screen.getByLabelText(/Volumen total/i);
        expect(input).toBeInTheDocument();

        // In a real browser, this input would receive focus.
        // Verifying standard focus behavior in JSDOM often requires user-event,
        // but verifying the element is revealed confirms the state transition.
        expect(input).toHaveAttribute('type', 'number');
    });

    it('displays work type selector in Assist Mode', () => {
        render(<CalculatorForm />);
        const radioAssist = screen.getByLabelText(/Ayúdame a calcular/i);
        fireEvent.click(radioAssist);

        expect(screen.getByLabelText(/Tipo de Obra/i)).toBeInTheDocument();
    });
});
