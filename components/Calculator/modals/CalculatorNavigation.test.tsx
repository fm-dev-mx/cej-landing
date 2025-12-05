// components/Calculator/modals/CalculatorNavigation.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calculator from '../Calculator';

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

describe('Calculator Navigation & Button Logic', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('Step 3 (Known): "Next" is disabled until volume is > 0', () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole('radio', { name: /^S[íi]/i }));

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    const input = screen.getByLabelText(/Volumen \(m³\)/i);

    expect(nextBtn).toBeDisabled();
    fireEvent.change(input, { target: { value: '0' } });
    expect(nextBtn).toBeDisabled();
    fireEvent.change(input, { target: { value: '5' } });
    expect(nextBtn).toBeEnabled();
  });

  it('Back button navigates correctly based on flow', () => {
    render(<Calculator />);
    const radioKnown = screen.getByRole('radio', { name: /^S[íi]/i });
    fireEvent.click(radioKnown);

    const backBtn = screen.getByRole('button', { name: /Atrás/i });
    fireEvent.click(backBtn);
    expect(screen.getByText(/¿Ya conoces los metros cúbicos/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /No, ay.dame/i }));
    const backBtnStep2 = screen.getByRole('button', { name: /Atrás/i });
    fireEvent.click(backBtnStep2);
    expect(screen.getByText(/¿Ya conoces los metros cúbicos/i)).toBeInTheDocument();
  });

  it('Step 3 (Assist): Validates thickness correctly for Solid vs Coffered', () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /No, ay.dame/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Losa/i }));

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).toBeDisabled();

    // Use specific exact match to avoid matching radio labels
    fireEvent.change(screen.getByLabelText('Largo (m)'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Ancho (m)'), { target: { value: '5' } });

    // --- ESCENARIO A: Losa Sólida ---
    fireEvent.click(screen.getByRole('radio', { name: /Sólida/i }));

    // Check Thickness Input
    // Use regex with start/end anchor or exact string to be safe
    const thicknessInput = screen.getByLabelText(/^Grosor \(cm\)$/);
    expect(thicknessInput).toBeVisible();

    fireEvent.change(thicknessInput, { target: { value: '' } });
    expect(nextBtn).toBeDisabled();

    fireEvent.change(thicknessInput, { target: { value: '10' } });
    expect(nextBtn).toBeEnabled();

    // --- ESCENARIO B: Losa Aligerada ---
    fireEvent.click(screen.getByRole('radio', { name: /Aligerada/i }));

    expect(screen.queryByLabelText(/^Grosor \(cm\)$/)).not.toBeInTheDocument();

    // Casetón 7cm is default now (from useCalculatorState fix)
    const radio7cm = screen.getByRole('radio', { name: /7 cm/i });
    expect(radio7cm).toBeChecked();

    expect(nextBtn).toBeEnabled();
  });

  it('Step 4: Shows loading state and disables buttons during calculation', async () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /^S[íi]/i }));
    fireEvent.change(screen.getByLabelText(/Volumen/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    const calcBtn = screen.getByRole('button', { name: /Ver Cotización Final/i });
    const backBtn = screen.getByRole('button', { name: /Atrás/i });

    fireEvent.click(calcBtn);

    expect(calcBtn).toBeDisabled();
    expect(backBtn).toBeDisabled();
    expect(screen.getByText(/Calculando.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Cotización Lista/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
