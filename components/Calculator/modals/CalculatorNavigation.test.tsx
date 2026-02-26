// components/Calculator/modals/CalculatorNavigation.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calculator from '../Calculator';
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
    breakdownViewed: false,
    submittedQuote: null
  } as unknown as Partial<ReturnType<typeof useCejStore.getState>>);
};

describe('Calculator Navigation & Button Logic', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
    vi.clearAllMocks();
  });

  it('Step 3 (Known): "Ver Desglose" button is hidden until volume is > 0', () => {
    render(<Calculator />);

    // Select Known Mode
    fireEvent.click(screen.getByRole('radio', { name: /Sé la cantidad/i }));

    const input = screen.getByLabelText(/¿Cuánto concreto necesitas?/i);

    // Initially, button should NOT be there (hint is shown instead)
    const addBtnInitial = screen.queryByRole('button', { name: /Calcular y Verificar/i });
    expect(addBtnInitial).not.toBeInTheDocument();

    // Check for the hint text
    // Simulate user typing '0'
    fireEvent.change(input, { target: { value: '0' } });
    expect(screen.queryByRole('button', { name: /Calcular y Verificar/i })).not.toBeInTheDocument();

    // Simulate user typing '5'
    fireEvent.change(input, { target: { value: '5' } });

    // Select Strength & Service to make it valid
    const strengthTrigger = screen.getByLabelText(/Resistencia/i);
    fireEvent.click(strengthTrigger);
    fireEvent.click(screen.getByRole('option', { name: /250 kg\/cm²/i }));

    const serviceTrigger = screen.getByLabelText(/Servicio/i);
    fireEvent.click(serviceTrigger);
    fireEvent.click(screen.getByRole('option', { name: /Tiro directo/i }));

    // Now button should appear and be enabled (Phase 1: "Ver Total" instead of "Solicitar")
    const addBtn = screen.getByRole('button', { name: /Ver Total/i });
    expect(addBtn).toBeEnabled();
  });

  it('Mode switching resets/adjusts form correctly', () => {
    // ... existing content ...
    render(<Calculator />);
    const radioKnown = screen.getByRole('radio', { name: /Sé la cantidad/i });
    fireEvent.click(radioKnown);
    expect(screen.getByLabelText(/¿Cuánto concreto necesitas?/i)).toBeInTheDocument();

    // ... existing content ...
    const radioAssist = screen.getByRole('radio', { name: /Ayúdame a calcular/i });
    fireEvent.click(radioAssist);
    expect(screen.getByRole('combobox', { name: /¿Para qué usarás el concreto?/i })).toBeInTheDocument();
  });

  it('Step 3 (Assist): Validates thickness correctly for Solid vs Coffered', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole('radio', { name: /Ayúdame a calcular/i }));

    const workTypeSelect = screen.getByRole('combobox', { name: /¿Para qué usarás el concreto?/i });
    fireEvent.click(workTypeSelect);
    fireEvent.click(screen.getByRole('option', { name: /Losa/i }));

    const lengthInput = screen.getByLabelText('Largo');
    const widthInput = screen.getByLabelText('Ancho');

    // Initially button hidden (Phase 1: use "Verificar datos" text)
    expect(screen.queryByRole('button', { name: /Calcular y Verificar/i })).not.toBeInTheDocument();

    fireEvent.change(lengthInput, { target: { value: '10' } });
    fireEvent.change(widthInput, { target: { value: '5' } });

    // --- SCENARIO A: Solid Slab ---
    fireEvent.click(screen.getByRole('radio', { name: /Sólida/i }));

    const thicknessInput = screen.getByLabelText('Espesor Total de Losa');
    expect(thicknessInput).toBeVisible();

    // Empty -> Button hidden
    fireEvent.change(thicknessInput, { target: { value: '' } });
    expect(screen.queryByRole('button', { name: /Calcular y Verificar/i })).not.toBeInTheDocument();

    // Filled -> Button appears
    fireEvent.change(thicknessInput, { target: { value: '10' } });
    expect(screen.getByRole('button', { name: /Ver Total/i })).toBeEnabled();

    // --- SCENARIO B: Coffered Slab ---
    fireEvent.click(screen.getByRole('radio', { name: /Aligerada/i }));

    expect(screen.queryByLabelText('Grosor (cm)')).not.toBeInTheDocument();

    const radio7cm = screen.getByRole('radio', { name: /7 cm/i });
    fireEvent.click(radio7cm);

    expect(screen.getByRole('button', { name: /Ver Total/i })).toBeEnabled();

  });
});
