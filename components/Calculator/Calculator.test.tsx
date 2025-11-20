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
});
