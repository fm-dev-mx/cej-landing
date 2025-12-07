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
  // UPDATE: Adjusted to match new store structure (slices)
  useCejStore.setState({
    viewMode: 'wizard',
    isDrawerOpen: false,
    activeTab: 'order',
    draft: { ...DEFAULT_CALCULATOR_STATE }, // Changed from currentDraft to draft
    cart: [],
    history: [],
    user: {
      visitorId: 'test-id',
      hasConsentedPersistence: true
    }
  });
};

describe('Calculator Navigation & Button Logic', () => {
  beforeEach(() => {
    // Limpiar localStorage para evitar persistencia entre tests
    window.localStorage.clear();
    resetStore();
    vi.clearAllMocks();
  });

  it('Step 3 (Known): "Next" is disabled until volume is > 0', () => {
    render(<Calculator />);

    // Step 1 -> Step 3
    fireEvent.click(screen.getByRole('radio', { name: /^S[íi]/i }));

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    const input = screen.getByLabelText(/Volumen \(m³\)/i);

    expect(nextBtn).toBeDisabled();

    // Simulate user typing '0'
    fireEvent.change(input, { target: { value: '0' } });
    expect(nextBtn).toBeDisabled();

    // Simulate user typing '5'
    fireEvent.change(input, { target: { value: '5' } });
    expect(nextBtn).toBeEnabled();
  });

  it('Back button navigates correctly based on flow', () => {
    render(<Calculator />);

    // Flow A: Known Volume (Step 1 -> Step 3)
    const radioKnown = screen.getByRole('radio', { name: /^S[íi]/i });
    fireEvent.click(radioKnown);

    const backBtn = screen.getByRole('button', { name: /Atrás/i });
    fireEvent.click(backBtn);

    // Should be back at Step 1
    expect(screen.getByText(/¿Ya conoces los metros cúbicos/i)).toBeInTheDocument();

    // Flow B: Assist (Step 1 -> Step 2)
    fireEvent.click(screen.getByRole('radio', { name: /No, ay.dame/i }));
    const backBtnStep2 = screen.getByRole('button', { name: /Atrás/i });
    fireEvent.click(backBtnStep2);

    // Should be back at Step 1
    expect(screen.getByText(/¿Ya conoces los metros cúbicos/i)).toBeInTheDocument();
  });

  it('Step 3 (Assist): Validates thickness correctly for Solid vs Coffered', () => {
    render(<Calculator />);

    // Navigation: Step 1 -> Step 2 -> Step 3
    fireEvent.click(screen.getByRole('radio', { name: /No, ay.dame/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Losa/i }));

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).toBeDisabled();

    // Fill Dimensions
    fireEvent.change(screen.getByLabelText('Largo (m)'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Ancho (m)'), { target: { value: '5' } });

    // --- ESCENARIO A: Losa Sólida ---
    // En el nuevo diseño, "Losa" preselecciona "Aligerada" por lógica de negocio si así se definió,
    // pero vamos a forzar "Sólida" para probar la validación de grosor.
    fireEvent.click(screen.getByRole('radio', { name: /Sólida/i }));

    // El input de grosor debe aparecer
    const thicknessInput = screen.getByLabelText(/^Grosor \(cm\)$/);
    expect(thicknessInput).toBeVisible();

    // Vacío -> Deshabilitado
    fireEvent.change(thicknessInput, { target: { value: '' } });
    expect(nextBtn).toBeDisabled();

    // Lleno -> Habilitado
    fireEvent.change(thicknessInput, { target: { value: '10' } });
    expect(nextBtn).toBeEnabled();

    // --- ESCENARIO B: Losa Aligerada ---
    fireEvent.click(screen.getByRole('radio', { name: /Aligerada/i }));

    // El input de grosor manual NO debe estar (se usa selector de casetón)
    expect(screen.queryByLabelText(/^Grosor \(cm\)$/)).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /7 cm/i })).toBeChecked();
    // Debe haber un valor por defecto (7cm) o seleccionarse uno
    const radio7cm = screen.getByRole('radio', { name: /7 cm/i });
    expect(radio7cm).toBeChecked();

    expect(nextBtn).toBeEnabled();
  });

  it('Step 4: Shows loading state and disables buttons during calculation', async () => {
    render(<Calculator />);

    // Fast track to Step 4
    fireEvent.click(screen.getByRole('radio', { name: /^S[íi]/i }));
    fireEvent.change(screen.getByLabelText(/Volumen/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    // Now at Step 4
    const calcBtn = screen.getByRole('button', { name: /Ver Cotización Final/i });
    const backBtn = screen.getByRole('button', { name: /Atrás/i });

    fireEvent.click(calcBtn);

    // Assert Loading State
    expect(calcBtn).toBeDisabled();
    expect(backBtn).toBeDisabled(); // Back button should also be locked
    expect(screen.getByText(/Calculando.../i)).toBeInTheDocument();

    // Wait for transition to Step 5
    await waitFor(() => {
      expect(screen.getByText(/Cotización Lista/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
