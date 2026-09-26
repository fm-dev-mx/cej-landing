import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CALCULATOR_STATE } from '../types';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import ExpertForm from './ExpertForm';

vi.mock('@/lib/pixel', () => ({ trackViewContent: vi.fn() }));

describe('ExpertForm product and service selection', () => {
  beforeEach(() => {
    useCejStore.setState({
      viewMode: 'expert',
      currentDraft: {
        ...DEFAULT_CALCULATOR_STATE,
        mode: 'knownM3',
        m3: '99',
        strength: '200',
        type: 'pumped',
      },
      cart: [],
      history: [],
      user: { visitorId: 'test-id', hasConsentedPersistence: false },
    });
  });

  it('keeps direct-only products out of pump service and offers fiber while pumping', () => {
    render(<ExpertForm />);

    const productSelect = screen.getByRole('combobox', { name: /Producto y especificación/i });
    const serviceSelect = screen.getByRole('combobox', { name: /Tipo de servicio/i });

    fireEvent.change(productSelect, { target: { value: 'MR 42.5' } });
    expect(serviceSelect).toHaveValue('direct');
    expect(within(serviceSelect).getByRole('option', { name: /Servicio de Bomba/i })).toBeDisabled();

    fireEvent.change(productSelect, { target: { value: '200' } });
    const fiberCheckbox = screen.getByRole('checkbox', { name: /Agregar Fibra/i });
    fireEvent.click(fiberCheckbox);
    fireEvent.change(serviceSelect, { target: { value: 'pumped' } });

    expect(serviceSelect).toHaveValue('pumped');
    expect(screen.getByRole('checkbox', { name: /Agregar Fibra/i })).toBeChecked();
  });

  it('prices visible dimensions with pumped fiber and saves the exact quote to the cart', () => {
    render(<ExpertForm />);
    const addButton = screen.getByRole('button', { name: /Agregar al Pedido/i });

    // A valid known volume from the wizard must not make an empty expert form valid.
    expect(addButton).toBeDisabled();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Largo (m)' }), { target: { value: '10' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Ancho (m)' }), { target: { value: '3' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Grosor (cm)' }), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Agregar Fibra/i }));

    expect(screen.getByText('3.0 m³')).toBeInTheDocument();
    expect(screen.getByText('$11,349.00')).toBeInTheDocument();
    expect(addButton).toBeEnabled();
    fireEvent.click(addButton);

    const { cart, history } = useCejStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0].results).toMatchObject({
      strength: '200',
      concreteType: 'pumped',
      hasFiber: true,
      fiberSubtotal: 361.11,
      subtotal: 10508.33,
      vat: 840.67,
      total: 11349,
    });
    expect(cart[0].config.label).toContain('+ Fibra');
    expect(cart[0].config.mode).toBe('expert');
    expect(cart[0].inputs).toMatchObject({
      mode: 'assistM3',
      volumeMode: 'dimensions',
      hasCoffered: 'no',
      cofferedSize: null,
      length: '10',
      width: '3',
      thicknessByDims: '10',
    });
    expect(history[0]).toEqual(cart[0]);

    act(() => useCejStore.getState().loadHistoryItemAsDraft(history[0]));
    const expert = renderHook(() => useQuoteCalculator('expert'));
    const wizard = renderHook(() => useQuoteCalculator());
    expect(expert.result.current.quote).toEqual(cart[0].results);
    expect(wizard.result.current.quote).toEqual(cart[0].results);
  });
});
