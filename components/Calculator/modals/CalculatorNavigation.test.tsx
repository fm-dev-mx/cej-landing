// components/Calculator/modals/CalculatorNavigation.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calculator from '../Calculator';
import { useCejStore } from '@/store/useCejStore';
import { DEFAULT_CALCULATOR_STATE } from '../types';

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

window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.IntersectionObserver = vi.fn().mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});

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
  } as any); // Cast as any to bypass strict type check if store shape changed partially
};

describe('Calculator Navigation & Button Logic', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
    vi.clearAllMocks();
  });

  it('Step 3 (Known): "Add" button is hidden until volume is > 0', () => {
    render(<Calculator />);

    // Select Known Mode
    fireEvent.click(screen.getByRole('radio', { name: /Sé la cantidad/i }));

    const input = screen.getByLabelText(/Volumen total/i);

    // Initially, button should NOT be there (hint is shown instead)
    const addBtnInitial = screen.queryByRole('button', { name: /Agregar al Pedido/i });
    expect(addBtnInitial).not.toBeInTheDocument();
    expect(screen.getByText(/Completa los datos/i)).toBeInTheDocument();

    // Simulate user typing '0'
    fireEvent.change(input, { target: { value: '0' } });
    expect(screen.queryByRole('button', { name: /Agregar al Pedido/i })).not.toBeInTheDocument();

    // Simulate user typing '5'
    fireEvent.change(input, { target: { value: '5' } });

    // Now button should appear and be enabled
    const addBtn = screen.getByRole('button', { name: /Agregar al Pedido/i });
    expect(addBtn).toBeEnabled();
  });

  it('Mode switching resets/adjusts form correctly', () => {
    render(<Calculator />);

    // Flow A: Known Volume
    const radioKnown = screen.getByRole('radio', { name: /Sé la cantidad/i });
    fireEvent.click(radioKnown);

    expect(screen.getByLabelText(/Volumen total/i)).toBeInTheDocument();

    // Flow B: Assist
    const radioAssist = screen.getByRole('radio', { name: /Ayúdame a calcular/i });
    fireEvent.click(radioAssist);

    // Should show Work Type selector
    expect(screen.getByText(/Tipo de Obra/i)).toBeInTheDocument();
  });

  it('Step 3 (Assist): Validates thickness correctly for Solid vs Coffered', () => {
    render(<Calculator />);

    // Select Assist Mode
    fireEvent.click(screen.getByRole('radio', { name: /Ayúdame a calcular/i }));

    // Select Slab (Losa) to trigger thickness logic
    // Using combobox for Work Type now (Accessible thanks to htmlFor/id fix in CalculatorForm)
    const workTypeSelect = screen.getByRole('combobox', { name: /Tipo de Obra/i });
    fireEvent.change(workTypeSelect, { target: { value: 'slab' } });

    // Inputs
    const lengthInput = screen.getByLabelText(/^Largo/i);
    const widthInput = screen.getByLabelText(/^Ancho/i);

    // Initially button hidden
    expect(screen.queryByRole('button', { name: /Agregar al Pedido/i })).not.toBeInTheDocument();

    fireEvent.change(lengthInput, { target: { value: '10' } });
    fireEvent.change(widthInput, { target: { value: '5' } });

    // --- ESCENARIO A: Losa Sólida ---
    fireEvent.click(screen.getByRole('radio', { name: /Sólida/i }));

    // El input de grosor debe aparecer
    const thicknessInput = screen.getByLabelText(/^Grosor \(cm\)$/);
    expect(thicknessInput).toBeVisible();

    // Vacío -> Button hidden
    fireEvent.change(thicknessInput, { target: { value: '' } });
    expect(screen.queryByRole('button', { name: /Agregar al Pedido/i })).not.toBeInTheDocument();

    // Lleno -> Button appears
    fireEvent.change(thicknessInput, { target: { value: '10' } });
    expect(screen.getByRole('button', { name: /Agregar al Pedido/i })).toBeEnabled();

    // --- ESCENARIO B: Losa Aligerada ---
    fireEvent.click(screen.getByRole('radio', { name: /Aligerada/i }));

    // El input de grosor manual NO debe estar
    expect(screen.queryByLabelText(/^Grosor \(cm\)$/)).not.toBeInTheDocument();

    // Select a size (e.g., 7 cm default or clicked)
    const radio7cm = screen.getByRole('radio', { name: /7 cm/i });
    fireEvent.click(radio7cm);

    // Should be valid now (measures + coffered selection)
    expect(screen.getByRole('button', { name: /Agregar al Pedido/i })).toBeEnabled();
  });
});
