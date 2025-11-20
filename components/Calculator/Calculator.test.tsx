// components/Calculator/Calculator.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calculator from './Calculator';

// 1. Mock environment variables to avoid Zod validation failures and undefined values
vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_PIXEL_ID: 'test-pixel-id',
    NEXT_PUBLIC_WHATSAPP_NUMBER: '5216561234567',
    NEXT_PUBLIC_PHONE: '6561234567',
    NEXT_PUBLIC_SITE_URL: 'http://localhost',
    NEXT_PUBLIC_BRAND_NAME: 'CEJ Test',
    NEXT_PUBLIC_CURRENCY: 'MXN',
  },
}));

// 2. Mock pixel to avoid execution errors
vi.mock('@/lib/pixel', () => ({
  trackViewContent: vi.fn(),
  trackLead: vi.fn(),
  trackContact: vi.fn(),
}));

// Browser API mocks not available in JSDOM
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Calculator UI Integration', () => {

  // 3. CRITICAL: Clear localStorage before each test.
  // Otherwise, the second test starts at Step 4 (where the previous one ended)
  // and fails to find the "Yes" button from Step 1.
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the wizard and allows navigation through the flow', () => {
    render(<Calculator />);

    // 1. Verify initial state (Step 1)
    expect(screen.getByText(/Calcula tu/i)).toBeInTheDocument();

    // Select "I know the m3" mode
    const radioKnown = screen.getByLabelText('Si');
    fireEvent.click(radioKnown);

    // Verify volume input appears (Step 2)
    const volInput = screen.getByLabelText(/Volumen \(m³\)/i);
    expect(volInput).toBeInTheDocument();

    // 2. Input data in Step 2
    fireEvent.change(volInput, { target: { value: '5' } });
    expect(volInput).toHaveValue(5);

    // 3. Navigate to Step 3
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    // 4. Verify Step 3 (Specifications)
    expect(screen.getByText(/Tipo de servicio/i)).toBeInTheDocument();

    // Change strength
    const strengthSelect = screen.getByLabelText(/Resistencia/i);
    fireEvent.change(strengthSelect, { target: { value: '250' } });

    // Go to summary
    const summaryBtn = screen.getByRole('button', { name: /Ver Cotización Final/i });
    fireEvent.click(summaryBtn);

    // 5. Verify Step 4 (Financial Summary)
    expect(screen.getByText(/Tu cotización estimada/i)).toBeInTheDocument();
    expect(screen.getByText('5.00 m³')).toBeInTheDocument();

    // Verify final action buttons
    expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument();
  });

  it('completes the flow using Assist Mode (Dimensions)', () => {
    render(<Calculator />);

    // 1. Step 1: Select Assist Mode
    // This reveals the Work Type options
    fireEvent.click(screen.getByLabelText('No, ayúdame a definirlo'));

    // Select Work Type "Losa" (triggers auto-navigation to Step 2)
    // Use exact match to avoid ambiguity with description text
    fireEvent.click(screen.getByText(/^Losa$/));

    // 2. Step 2: Fill Dimensions
    // Inputs: Length (m), Width (m), Thickness (cm)
    // FIX: Use exact string match for labels to avoid matching radio buttons (e.g., "Largo × Ancho")
    const lengthInput = screen.getByLabelText('Largo (m)');
    const widthInput = screen.getByLabelText('Ancho (m)');
    const thickInput = screen.getByLabelText(/Grosor/i);

    fireEvent.change(lengthInput, { target: { value: '10' } });
    fireEvent.change(widthInput, { target: { value: '5' } });
    fireEvent.change(thickInput, { target: { value: '10' } }); // 10cm = 0.1m

    // Verify calculation feedback appears (10 * 5 * 0.1 = 5m3 approx)
    expect(screen.getByText(/Volumen calculado/i)).toBeInTheDocument();

    // 3. Proceed to Step 3
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    // 4. Verify Step 3 reached
    expect(screen.getByText(/Tipo de servicio/i)).toBeInTheDocument();
  });

  it('completes the flow using Assist Mode (Area)', () => {
    render(<Calculator />);

    // 1. Step 1: Select Assist Mode
    fireEvent.click(screen.getByLabelText('No, ayúdame a definirlo'));

    // Select Work Type "Losa"
    fireEvent.click(screen.getByText(/^Losa$/));

    // 2. Step 2: Switch to "Area" mode
    // We click the radio button to change the input form
    fireEvent.click(screen.getByLabelText('Por Área (m²)'));

    // Inputs: Area (m2) and Thickness (cm)
    const areaInput = screen.getByLabelText(/Área total/i);
    const thickInput = screen.getByLabelText(/Grosor/i);

    // 50m2 * 0.10m = 5m3
    fireEvent.change(areaInput, { target: { value: '50' } });
    fireEvent.change(thickInput, { target: { value: '10' } });

    // Verify calculation feedback appears
    expect(screen.getByText(/Volumen calculado/i)).toBeInTheDocument();

    // 3. Proceed to Step 3
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    // 4. Verify Step 3 reached
    expect(screen.getByText(/Tipo de servicio/i)).toBeInTheDocument();
  });

  it('shows validation errors in UI', () => {
    render(<Calculator />);

    // Go to manual inputs
    fireEvent.click(screen.getByLabelText('Si'));

    // Input 0 (invalid)
    const volInput = screen.getByLabelText(/Volumen \(m³\)/i);
    fireEvent.change(volInput, { target: { value: '0' } });

    // Verify button disabled
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).toBeDisabled();

    // Verify error message on screen
    expect(screen.getByText(/El volumen debe ser mayor a 0/i)).toBeInTheDocument();
  });

  it('navigates to step 2 when clicking "Si" even if already selected (re-click bug)', () => {
    render(<Calculator />);

    // 1. Click "Si" first time -> Should go to Step 2
    const radioKnown = screen.getByLabelText('Si');
    fireEvent.click(radioKnown);
    expect(screen.getByText(/Volumen \(m³\)/i)).toBeInTheDocument(); // Step 2 active

    // 2. Click "Back" -> Returns to Step 1
    const backBtn = screen.getByRole('button', { name: /Atrás/i });
    fireEvent.click(backBtn);
    expect(screen.getByText(/Calcula tu/i)).toBeInTheDocument(); // Step 1 active

    // 3. Verify "Si" is still checked
    const radioKnownAfterBack = screen.getByLabelText('Si');
    expect(radioKnownAfterBack).toBeChecked();

    // 4. Click "Si" AGAIN -> Should go to Step 2 again
    // This is where it currently FAILS
    fireEvent.click(radioKnownAfterBack);

    // Assert we are back in Step 2
    expect(screen.getByText(/Volumen \(m³\)/i)).toBeInTheDocument();
  });
});
