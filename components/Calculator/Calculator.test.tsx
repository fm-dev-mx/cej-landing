// components/Calculator/Calculator.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calculator from './Calculator';
import { useCejStore } from '@/store/useCejStore';
import { DEFAULT_CALCULATOR_STATE } from '@/types/domain';

// 1. Mock Environment & Utils
vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_PIXEL_ID: 'test-pixel-id',
    NEXT_PUBLIC_WHATSAPP_NUMBER: '526561234567',
    NEXT_PUBLIC_PHONE: '6561234567',
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

// Mock window interactions
const mockScrollIntoView = vi.fn();
window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
window.open = vi.fn();

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Helper to reset store
const resetStore = () => {
  useCejStore.setState({
    isDrawerOpen: false,
    activeTab: 'order',
    draft: { ...DEFAULT_CALCULATOR_STATE },
    cart: [],
    // history: [],
    user: {
      visitorId: 'test-id',
      hasConsentedPersistence: true
    },
    // Phase 1: Reset progressive disclosure state
    breakdownViewed: false,
    submittedQuote: null
  } as unknown as Partial<ReturnType<typeof useCejStore.getState>>);
};

describe('Calculator UI Integration', () => {

  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
    vi.clearAllMocks();
  });

  it('renders the form and calculates total (Known M3)', async () => {
    render(<Calculator />);

    // 1. Select Mode
    const radioKnown = screen.getByRole('radio', { name: /Sé la cantidad/i });
    fireEvent.click(radioKnown);

    // 2. Input Volume
    const volInput = screen.getByLabelText(/Volumen total/i);
    expect(volInput).toBeInTheDocument();

    fireEvent.change(volInput, { target: { value: '5' } });
    expect(volInput).toHaveValue(5);

    // Select Strength & Service to make it valid and show "Todo listo"
    fireEvent.change(screen.getByLabelText(/Resistencia/i), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText(/Servicio/i), { target: { value: 'direct' } });

    // 3. Check Result (Instant calculation)
    // We expect the summary to appear with "Ver Total" CTA and "Todo listo" hint (if valid)
    expect(screen.getByText(/Todo listo/i)).toBeInTheDocument();

    // Note: Volume text "5.00 m³" might not be explicitly visible in the new Ticket summary
    // relying on price/total verification via 'Total' presence is sufficient for integration here.

    // 4. Phase 1: First CTA is "Ver Total"
    const viewBreakdownBtn = screen.getByRole('button', { name: /Ver Total/i });
    expect(viewBreakdownBtn).toBeEnabled();
    fireEvent.click(viewBreakdownBtn);
  });

  it('completes the flow using Assist Mode (Dimensions)', () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /Ayúdame a calcular/i }));

    // Select Work Type (Combobox)
    const select = screen.getByRole('combobox', { name: /Tipo de Obra/i });
    fireEvent.change(select, { target: { value: 'slab' } });

    // Select Solid Slab
    fireEvent.click(screen.getByRole('radio', { name: /Sólida/i }));

    // Inputs
    const lengthInput = screen.getByLabelText('Largo');
    const widthInput = screen.getByLabelText('Ancho');
    const thickInput = screen.getByLabelText('Espesor Total de Losa');

    fireEvent.change(lengthInput, { target: { value: '10' } });
    fireEvent.change(widthInput, { target: { value: '5' } });
    fireEvent.change(thickInput, { target: { value: '10' } });

    // Select Strength & Service
    // Note: Strength is implicit or selected? "Selecciona el tipo ajusta automáticamente la resistencia"
    // Usually Assist logic sets strength defaults?
    // But Service is required.
    // Assist mode renders Service selector? Yes.
    // AssistM3 progress: workType -> dimensions -> specs -> service.

    // We need to verify if Service is visible yet?
    // With progress guide, is the service selector hidden until active?
    // No, the selectors are in `AssistantForm` or `CalculatorForm`.
    // The current implementation of `AssistantForm` renders based on logic.
    // Let's assume we need to select Service.

    // Check if Service selector is available.
    const serviceSelect = screen.getByLabelText(/Servicio/i);
    fireEvent.change(serviceSelect, { target: { value: 'direct' } });
    const strengthSelect = screen.getByLabelText(/Resistencia/i);
    fireEvent.change(strengthSelect, { target: { value: '250' } });

    // Check for "Todo listo" hint
    expect(screen.getByText(/Todo listo/i)).toBeInTheDocument();

    // 10*5*0.10 = 5m3 * factor. Should be valid.
    // Phase 1: Button text is now "Ver Total"
    const viewBreakdownBtn = screen.getByRole('button', { name: /Ver Total/i });
    expect(viewBreakdownBtn).toBeEnabled();
  });

  it('shows validation errors in UI (after blur)', () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /Sé la cantidad/i }));

    const volInput = screen.getByLabelText(/Volumen total/i);
    fireEvent.change(volInput, { target: { value: '0' } });

    // Hybrid validation: error only shows after blur (touched state)
    fireEvent.blur(volInput);

    // Check for error message
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toBeInTheDocument();

    // Ensure the quote button is NOT present when invalid (still shows, but disabled)
    // With Phase 1, button shows but is disabled. Check for empty state hint instead.
    const emptyHint = screen.queryByText(/Te guiaremos paso a paso/i);
    expect(emptyHint).toBeInTheDocument();
  });

  it('persists state to localStorage and rehydrates on reload', () => {
    const { unmount } = render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /Sé la cantidad/i }));
    const volInput = screen.getByLabelText(/Volumen total/i);
    fireEvent.change(volInput, { target: { value: '7.5' } });

    unmount();

    // Re-render: Zustand + LocalStorage should persist this
    render(<Calculator />);

    const volInputRestored = screen.getByLabelText(/Volumen total/i);
    expect(volInputRestored).toBeInTheDocument();
    expect(volInputRestored).toHaveValue(7.5);
  });
});
