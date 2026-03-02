import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminOrderForm } from './AdminOrderForm';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const existingCustomerMatch = {
    success: true as const,
    normalizedPhone: '526561234567',
    customer: { id: 'c-1', display_name: 'Cliente Recurrente', primary_phone_norm: '526561234567' },
};

async function fillPhoneAndLookup(phoneValue: string) {
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: phoneValue } });
    fireEvent.blur(screen.getByLabelText('Teléfono'));
    await screen.findByText(/Cliente detectado:/i);
}

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        refresh: refreshMock,
    }),
}));

vi.mock('@/app/actions/createAdminOrder', () => ({
    createAdminOrder: vi.fn(),
}));

vi.mock('@/app/actions/listServiceSlots', () => ({
    listServiceSlots: vi.fn(),
}));

vi.mock('@/app/actions/findCustomerByPhone', () => ({
    findCustomerByPhone: vi.fn(),
}));

describe('AdminOrderForm', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { listServiceSlots } = await import('@/app/actions/listServiceSlots');
        vi.mocked(listServiceSlots).mockResolvedValue({
            success: true,
            slots: [{ slot_code: 'morning', label: 'Matutino', start_time: '08:00:00', end_time: '10:00:00' }],
        });
    });

    it('shows only MVP fields and hides attribution inputs', async () => {
        await act(async () => {
            render(<AdminOrderForm />);
        });

        expect(screen.getByLabelText('Teléfono')).toBeInTheDocument();
        expect(screen.getByLabelText('Nombre del Cliente')).toBeInTheDocument();
        expect(screen.getByLabelText('Volumen (m³)')).toBeInTheDocument();
        expect(screen.getByLabelText('Tipo de Servicio')).toBeInTheDocument();
        expect(screen.getByLabelText("Resistencia (f'c)")).toBeInTheDocument();
        expect(screen.getByLabelText('Calle y número')).toBeInTheDocument();
        expect(screen.getByLabelText('Colonia')).toBeInTheDocument();
        expect(screen.queryByLabelText('UTM Source')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('FBCLID')).not.toBeInTheDocument();
    });

    it('disables Today quick option after 17:00 cutoff', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-01T18:30:00'));

        await act(async () => {
            render(<AdminOrderForm />);
        });

        const todayButton = screen.getByRole('button', { name: 'Hoy' });
        expect(todayButton).toBeDisabled();

        vi.useRealTimers();
    });

    it('autofills name from exact phone lookup and allows override', async () => {
        const { findCustomerByPhone } = await import('@/app/actions/findCustomerByPhone');
        vi.mocked(findCustomerByPhone).mockResolvedValue(existingCustomerMatch);

        await act(async () => {
            render(<AdminOrderForm />);
        });

        await fillPhoneAndLookup('6561234567');

        await waitFor(() => {
            expect(screen.getByDisplayValue('Cliente Recurrente')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Crear cliente nuevo de todas formas' }));
        expect(screen.getByRole('button', { name: 'Usar cliente detectado' })).toBeInTheDocument();
    });

    it('submits composed delivery address and forceNewCustomer flag', async () => {
        const { findCustomerByPhone } = await import('@/app/actions/findCustomerByPhone');
        const { createAdminOrder } = await import('@/app/actions/createAdminOrder');

        vi.mocked(findCustomerByPhone).mockResolvedValue(existingCustomerMatch);
        vi.mocked(createAdminOrder).mockResolvedValue({ status: 'success', id: 'order-1' });

        await act(async () => {
            render(<AdminOrderForm />);
        });

        await fillPhoneAndLookup('6561234567');

        fireEvent.click(screen.getByRole('button', { name: 'Crear cliente nuevo de todas formas' }));
        fireEvent.change(screen.getByLabelText('Nombre del Cliente'), { target: { value: 'Cliente Nuevo' } });
        fireEvent.change(screen.getByLabelText('Calle y número'), { target: { value: 'Av. Tecnologico 123' } });
        fireEvent.change(screen.getByLabelText('Colonia'), { target: { value: 'Partido Senecu' } });
        fireEvent.change(screen.getByLabelText('Volumen (m³)'), { target: { value: '5' } });
        fireEvent.change(screen.getByLabelText('Tipo de Servicio'), { target: { value: 'direct' } });
        fireEvent.change(screen.getByLabelText("Resistencia (f'c)"), { target: { value: '200' } });
        fireEvent.change(screen.getByLabelText('Franja solicitada'), { target: { value: 'morning' } });

        fireEvent.click(screen.getByRole('button', { name: 'Registrar Pedido' }));

        await waitFor(() => {
            expect(createAdminOrder).toHaveBeenCalledWith(expect.objectContaining({
                forceNewCustomer: true,
                deliveryAddress: 'Av. Tecnologico 123, Col. Partido Senecu',
                scheduledSlotCode: 'morning',
            }));
        });
        expect(pushMock).toHaveBeenCalledWith('/dashboard/orders/order-1');
    });
});
