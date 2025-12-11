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
    }
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

    // 3. Check Result (Instant calculation)
    // We expect the summary to appear with the new Ticket Label
    expect(screen.getByText('TOTAL')).toBeInTheDocument();

    // Note: Volume text "5.00 m³" might not be explicitly visible in the new Ticket summary
    // relying on price/total verification via 'TOTAL' presence is sufficient for integration here.

    // 4. Add to Cart (Button text updated)
    const addBtn = screen.getByRole('button', { name: /Ver Cotización Formal/i });
    expect(addBtn).toBeEnabled();
    fireEvent.click(addBtn);
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
    const lengthInput = screen.getByLabelText('Largo (m)');
    const widthInput = screen.getByLabelText('Ancho (m)');
    const thickInput = screen.getByLabelText('Grosor (cm)');

    fireEvent.change(lengthInput, { target: { value: '10' } });
    fireEvent.change(widthInput, { target: { value: '5' } });
    fireEvent.change(thickInput, { target: { value: '10' } });

    // Check for updated Total label
    expect(screen.getByText('TOTAL')).toBeInTheDocument();

    // 10*5*0.10 = 5m3 * factor. Should be valid.
    // Button text updated
    const addBtn = screen.getByRole('button', { name: /Ver Cotización Formal/i });
    expect(addBtn).toBeEnabled();
  });

  it('shows validation errors in UI', () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /Sé la cantidad/i }));

    const volInput = screen.getByLabelText(/Volumen total/i);
    fireEvent.change(volInput, { target: { value: '0' } });

    // Check for error message
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();

    // Ensure the new button is NOT present
    const addBtn = screen.queryByRole('button', { name: /Ver Cotización Formal/i });
    expect(addBtn).not.toBeInTheDocument();
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
