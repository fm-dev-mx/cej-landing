// components/Calculator/Calculator.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calculator from './Calculator';
import { useCejStore } from '@/store/useCejStore';
import { DEFAULT_CALCULATOR_STATE } from './types';

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
    viewMode: 'wizard',
    isDrawerOpen: false,
    activeTab: 'order',
    currentDraft: { ...DEFAULT_CALCULATOR_STATE },
    cart: [],
    history: [],
    user: { visitorId: 'test-id' }
  });
};

describe('Calculator UI Integration', () => {

  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
    vi.clearAllMocks();
  });

  it('renders the wizard and allows navigation through the flow (Known M3)', async () => {
    render(<Calculator />);

    // 1. Step 1: Mode Selection
    expect(screen.getByText(/(Cotiza|Calcula) tu/i)).toBeInTheDocument();

    const radioKnown = screen.getByRole('radio', { name: /^S[íi]/i });
    fireEvent.click(radioKnown);

    // 2. Step 3: Inputs
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

    // 4. Step 5: Summary
    await waitFor(() => {
      expect(screen.getByText(/Cotización Lista/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('5.00 m³')).toBeInTheDocument();
    expect(screen.getByText(/f’c 250/i)).toBeInTheDocument();

    const waBtn = screen.getByRole('button', { name: /Agendar por WhatsApp/i });
    expect(waBtn).toBeEnabled();
  });

  it('completes the flow using Assist Mode (Dimensions)', () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /No, ay.dame a/i }));

    const slabRadio = screen.getByRole('radio', { name: /Losa/i });
    fireEvent.click(slabRadio);

    const solidRadio = screen.getByRole('radio', { name: /Sólida/i });
    fireEvent.click(solidRadio);

    const lengthInput = screen.getByLabelText(/Largo \(m\)/i);
    const widthInput = screen.getByLabelText(/Ancho \(m\)/i);
    const thickInput = screen.getByLabelText(/Grosor/i);

    fireEvent.change(lengthInput, { target: { value: '10' } });
    fireEvent.change(widthInput, { target: { value: '5' } });
    fireEvent.change(thickInput, { target: { value: '10' } });

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).toBeEnabled();
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Especificaciones del Concreto/i)).toBeInTheDocument();
  });

  it('completes the flow using Assist Mode (Area)', () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /No, ay.dame a/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Losa/i }));

    fireEvent.click(screen.getByLabelText(/Por .rea/i));
    fireEvent.click(screen.getByRole('radio', { name: /Sólida/i }));

    const areaInput = screen.getByLabelText(/Área total/i);
    const thickInput = screen.getByLabelText(/Grosor/i);

    fireEvent.change(areaInput, { target: { value: '50' } });
    fireEvent.change(thickInput, { target: { value: '10' } });

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);
    expect(screen.getByText(/Especificaciones del Concreto/i)).toBeInTheDocument();
  });

  it('shows validation errors in UI', () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /^S[íi]/i }));

    const volInput = screen.getByLabelText(/Volumen \(m³\)/i);
    fireEvent.change(volInput, { target: { value: '0' } });

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    expect(nextBtn).toBeDisabled();

    // UPDATED: The new context logic maps !isValid to this generic message
    expect(screen.getByText(/Revisa los datos/i)).toBeInTheDocument();
  });

  it('persists state to localStorage and rehydrates on reload', () => {
    const { unmount } = render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /^S[íi]/i }));
    const volInput = screen.getByLabelText(/Volumen \(m³\)/i);
    fireEvent.change(volInput, { target: { value: '7.5' } });

    unmount();

    // Re-render: Zustand + LocalStorage should persist this
    render(<Calculator />);

    const volInputRestored = screen.getByLabelText(/Volumen \(m³\)/i);
    expect(volInputRestored).toBeInTheDocument();
    expect(volInputRestored).toHaveValue(7.5);
  });

  it('resets the calculator to initial state when requested', async () => {
    render(<Calculator />);

    fireEvent.click(screen.getByRole('radio', { name: /^S[íi]/i }));
    fireEvent.change(screen.getByLabelText(/Volumen \(m³\)/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    fireEvent.click(screen.getByRole('button', { name: /Ver Cotización Final/i }));

    await waitFor(() => {
      expect(screen.getByText(/Cotización Lista/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const resetBtn = screen.getByRole('button', { name: /Nueva cotización/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText(/(Cotiza|Calcula) tu/i)).toBeInTheDocument();

    const radioKnown = screen.getByRole('radio', { name: /^S[íi]/i }) as HTMLInputElement;
    expect(radioKnown.checked).toBe(false);
  });

  it('navigates correctly when re-clicking an active mode', () => {
    render(<Calculator />);

    const radioKnownInitial = screen.getByRole('radio', { name: /^S[íi]/i });
    fireEvent.click(radioKnownInitial);
    expect(screen.getByText(/Volumen \(m³\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Atrás/i }));
    expect(screen.getByText(/(Cotiza|Calcula) tu/i)).toBeInTheDocument();

    const radioKnownRestored = screen.getByRole('radio', { name: /^S[íi]/i });
    expect(radioKnownRestored).toBeChecked();

    fireEvent.click(radioKnownRestored);
    expect(screen.getByText(/Volumen \(m³\)/i)).toBeInTheDocument();
  });
});
