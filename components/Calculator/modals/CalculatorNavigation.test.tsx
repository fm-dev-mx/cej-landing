// components/Calculator/modals/CalculatorNavigation.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calculator from '../Calculator';
import { usePublicStore } from '@/store/public/usePublicStore';
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

vi.mock('@/app/actions/getPriceConfig', () => ({
  getPriceConfig: vi.fn(() => new Promise(() => { /* keep pending to avoid async state updates during tests */ })),
}));

// Note: lib/pixel.ts was removed in Phase 3. Tracking is now handled by
// lib/tracking/visitor.ts (browser) and lib/tracking/capi.ts (server).

window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.IntersectionObserver = vi.fn().mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});

// Helper to reset store - Phase 1: Added breakdownViewed reset
const resetStore = () => {
  usePublicStore.setState({
    isDrawerOpen: false,
    activeTab: 'order',
    draft: { ...DEFAULT_CALCULATOR_STATE },
    cart: [],
    history: [],
    user: {
      visitorId: 'test-id',
      hasConsentedPersistence: true
    },
    breakdownViewed: false,
    submittedQuote: null,
    editingItemId: null,
    savedDrafts: {}
  } as unknown as Partial<ReturnType<typeof usePublicStore.getState>>);
};

describe('Calculator Navigation & Button Logic', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
    vi.clearAllMocks();
  });

  it('Step 3 (Known): "Ver Total" button stays disabled until form is complete', () => {
    render(<Calculator />);

    // Select Known Mode
    fireEvent.click(screen.getByRole('button', { name: /Ya sé cuántos m³/i }));

    const input = screen.getByLabelText(/¿Cuánto concreto necesitas?/i);

    // Initially, CTA is NOT present (Phase 3: conditional render)
    expect(screen.queryByRole('button', { name: /Programar Pedido/i })).not.toBeInTheDocument();

    // Check for the prompt text
    expect(screen.getByText(/Ingresa los detalles para ver tu cotización/i)).toBeInTheDocument();

    // Simulate user typing '0'
    fireEvent.change(input, { target: { value: '0' } });
    expect(screen.queryByRole('button', { name: /Programar Pedido/i })).not.toBeInTheDocument();

    // Simulate user typing '5'
    fireEvent.change(input, { target: { value: '5' } });

    // Select Strength & Service to make it valid
    const strengthTrigger = screen.getByLabelText(/Resistencia/i);
    fireEvent.click(strengthTrigger);
    fireEvent.click(screen.getByRole('option', { name: /250 kg\/cm²/i }));

    const serviceTrigger = screen.getByLabelText(/Servicio/i);
    fireEvent.click(serviceTrigger);
    fireEvent.click(screen.getByRole('option', { name: /Tiro directo/i }));

    // Now button should appear and be enabled
    const addBtn = screen.getByRole('button', { name: /Programar Pedido/i });
    expect(addBtn).toBeEnabled();
  });

  it('Mode switching resets/adjusts form correctly', () => {
    // ... existing content ...
    render(<Calculator />);
    const buttonKnown = screen.getByRole('button', { name: /Ya sé cuántos m³/i });
    fireEvent.click(buttonKnown);
    expect(screen.getByLabelText(/¿Cuánto concreto necesitas?/i)).toBeInTheDocument();

    // Switch to assist mode
    const buttonChange = screen.getByRole('button', { name: /Cambiar método/i });
    fireEvent.click(buttonChange);

    const buttonAssist = screen.getByRole('button', { name: /Ayúdame a calcularlo/i });
    fireEvent.click(buttonAssist);
    expect(screen.getByRole('combobox', { name: /¿Para qué usarás el concreto?/i })).toBeInTheDocument();
  });

  it('Step 3 (Assist): Validates thickness correctly for Solid vs Coffered', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole('button', { name: /Ayúdame a calcularlo/i }));

    const workTypeSelect = screen.getByRole('combobox', { name: /¿Para qué usarás el concreto?/i });
    fireEvent.click(workTypeSelect);
    fireEvent.click(screen.getByRole('option', { name: /Losa/i }));

    const lengthInput = screen.getByLabelText('Largo');
    const widthInput = screen.getByLabelText('Ancho');

    // CTA is NOT visible while required fields are incomplete
    expect(screen.queryByRole('button', { name: /Programar Pedido/i })).not.toBeInTheDocument();

    fireEvent.change(lengthInput, { target: { value: '10' } });
    fireEvent.change(widthInput, { target: { value: '5' } });

    // --- SCENARIO A: Solid Slab ---
    fireEvent.click(screen.getByRole('radio', { name: /Sólida/i }));

    const thicknessInput = screen.getByLabelText('Espesor Total de Losa');
    expect(thicknessInput).toBeVisible();

    // Empty -> Button NOT in doc
    fireEvent.change(thicknessInput, { target: { value: '' } });
    expect(screen.queryByRole('button', { name: /Programar Pedido/i })).not.toBeInTheDocument();

    // Filled -> Button appears
    fireEvent.change(thicknessInput, { target: { value: '10' } });
    expect(screen.getByRole('button', { name: /Programar Pedido/i })).toBeEnabled();

    // --- SCENARIO B: Coffered Slab ---
    fireEvent.click(screen.getByRole('radio', { name: /Aligerada/i }));

    expect(screen.queryByLabelText('Grosor (cm)')).not.toBeInTheDocument();

    const radio7cm = screen.getByRole('radio', { name: /7 cm/i });
    fireEvent.click(radio7cm);

    expect(screen.getByRole('button', { name: /Programar Pedido/i })).toBeEnabled();

  });
});
