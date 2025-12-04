import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calculator from './Calculator';

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

describe('Calculator UI Integration', () => {

  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the wizard and allows navigation through the flow (Known M3)', async () => {
    render(<Calculator />);

    // 1. Step 1: Mode Selection
    // Usamos regex flexible para coincidir con "Cotiza tu..." o "Calcula tu..."
    expect(screen.getByText(/(Cotiza|Calcula) tu/i)).toBeInTheDocument();

    // Select "Sí" (Known Volume)
    // FIX: Usamos getByRole('radio', { name: ... }) que es más robusto para etiquetas compuestas.
    // La regex busca "Sí" o "Si" al inicio del nombre accesible.
    const radioKnown = screen.getByRole('radio', { name: /^S[íi]/i });
    fireEvent.click(radioKnown);

    // 2. Step 3: Inputs (Known Mode skips Step 2)
    const volInput = screen.getByLabelText(/Volumen \(m³\)/i);
    expect(volInput).toBeInTheDocument();

    fireEvent.change(volInput, { target: { value: '5' } });
    expect(volInput).toHaveValue(5);

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    // 3. Step 4: Specs
    expect(screen.getByText(/Especificaciones del Concreto/i)).toBeInTheDocument();

    const strengthSelect = screen.getByLabelText(/Resistencia/i);
    fireEvent.change(strengthSelect, { target: { value: '250' } });

    // Simulate Calculation (Async simulation)
    const summaryBtn = screen.getByRole('button', { name: /Ver Cotización Final/i });
    fireEvent.click(summaryBtn);

    // 4. Step 5: Summary (Wait for calculation delay)
    await waitFor(() => {
      expect(screen.getByText(/Cotización Lista/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify Ticket Details
    expect(screen.getByText('5.00 m³')).toBeInTheDocument();
    expect(screen.getByText(/f’c 250/i)).toBeInTheDocument();

    // Verify WhatsApp Button is enabled
    const waBtn = screen.getByRole('button', { name: /Agendar por WhatsApp/i });
    expect(waBtn).toBeEnabled();
  });

  it('completes the flow using Assist Mode (Dimensions)', () => {
    render(<Calculator />);

    // 1. Step 1: Select Assist Mode
    // Busca "No, ayúdame..." siendo flexible con acentos y texto posterior.
    fireEvent.click(screen.getByRole('radio', { name: /No, ay.dame a/i }));

    // 2. Step 2: Work Type
    // Select "Losa" - Usamos radio role también para consistencia si es un SelectionCard,
    // o text match si es solo visual. En WorkTypeSelector son radios.
    const slabRadio = screen.getByRole('radio', { name: /Losa/i });
    fireEvent.click(slabRadio);

    // 3. Step 3: Dimensions Form
    // FIX: Usamos "Largo (m)" exacto o regex más específico para evitar conflicto con radio "Largo × Ancho"
    const lengthInput = screen.getByLabelText(/Largo \(m\)/i);
    const widthInput = screen.getByLabelText(/Ancho \(m\)/i);
    const thickInput = screen.getByLabelText(/Grosor/i);

    fireEvent.change(lengthInput, { target: { value: '10' } });
    fireEvent.change(widthInput, { target: { value: '5' } });
    fireEvent.change(thickInput, { target: { value: '10' } });

    // Verify calculation feedback (10*5*0.1 = 5m3 approx)
    expect(screen.getByText(/Volumen calculado/i)).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    fireEvent.click(nextBtn);

    // 4. Step 4 reached
    expect(screen.getByText(/Especificaciones del Concreto/i)).toBeInTheDocument();
  });

  it('completes the flow using Assist Mode (Area)', () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /No, ay.dame a/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Losa/i }));

    // Switch to Area Mode
    fireEvent.click(screen.getByLabelText(/Por .rea/i));

    const areaInput = screen.getByLabelText(/Área total/i);
    const thickInput = screen.getByLabelText(/Grosor/i);

    fireEvent.change(areaInput, { target: { value: '50' } });
    fireEvent.change(thickInput, { target: { value: '10' } });

    expect(screen.getByText(/Volumen calculado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
    expect(screen.getByText(/Especificaciones del Concreto/i)).toBeInTheDocument();
  });

  it('shows validation errors in UI', () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /^S[íi]/i }));

    const volInput = screen.getByLabelText(/Volumen \(m³\)/i);
    fireEvent.change(volInput, { target: { value: '0' } });

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).toBeDisabled();

    expect(screen.getByText(/El volumen debe ser mayor a 0/i)).toBeInTheDocument();
  });

  it('persists state to localStorage and rehydrates on reload', () => {
    const { unmount } = render(<Calculator />);

    // 1. Enter some data
    fireEvent.click(screen.getByRole('radio', { name: /^S[íi]/i }));
    const volInput = screen.getByLabelText(/Volumen \(m³\)/i);
    fireEvent.change(volInput, { target: { value: '7.5' } });

    // 2. Unmount (simulating refresh/close)
    unmount();

    // 3. Render again
    render(<Calculator />);

    // 4. Verify we are still on Step 3 (Inputs) and value is preserved
    const volInputRestored = screen.getByLabelText(/Volumen \(m³\)/i);
    expect(volInputRestored).toBeInTheDocument();
    expect(volInputRestored).toHaveValue(7.5);
  });

  it('resets the calculator to initial state when requested', async () => {
    render(<Calculator />);

    // 1. Advance deep into the flow
    fireEvent.click(screen.getByRole('radio', { name: /^S[íi]/i }));
    fireEvent.change(screen.getByLabelText(/Volumen \(m³\)/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    // Calculate to get to Summary
    fireEvent.click(screen.getByRole('button', { name: /Ver Cotización Final/i }));

    await waitFor(() => {
      expect(screen.getByText(/Cotización Lista/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // 2. Click "Nueva cotización" (Reset)
    const resetBtn = screen.getByRole('button', { name: /Nueva cotización/i });
    fireEvent.click(resetBtn);

    // 3. Verify we are back at Step 1
    expect(screen.getByText(/(Cotiza|Calcula) tu/i)).toBeInTheDocument();

    // "Sí" radio should not be checked (state reset)
    // FIX: Re-query element because DOM has been reset
    const radioKnown = screen.getByRole('radio', { name: /^S[íi]/i }) as HTMLInputElement;
    expect(radioKnown.checked).toBe(false);
  });

  it('navigates correctly when re-clicking an active mode', () => {
    render(<Calculator />);

    // Click "Sí" -> Go to Step 3 (Known Input)
    const radioKnownInitial = screen.getByRole('radio', { name: /^S[íi]/i });
    fireEvent.click(radioKnownInitial);
    expect(screen.getByText(/Volumen \(m³\)/i)).toBeInTheDocument();

    // Click "Back" -> Go to Step 1
    fireEvent.click(screen.getByRole('button', { name: /Atrás/i }));
    expect(screen.getByText(/(Cotiza|Calcula) tu/i)).toBeInTheDocument();

    // FIX: Re-query the radio button. The previous 'radioKnown' reference is stale
    // because the component Step1Mode was unmounted and remounted.
    const radioKnownRestored = screen.getByRole('radio', { name: /^S[íi]/i });

    // Verify "Sí" is still checked (state persistence)
    expect(radioKnownRestored).toBeChecked();

    // Click "Sí" AGAIN -> Should force navigation to Step 3
    fireEvent.click(radioKnownRestored);
    expect(screen.getByText(/Volumen \(m³\)/i)).toBeInTheDocument();
  });
});
