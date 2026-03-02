import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderDetailClient from './OrderDetailClient';
import type { OrderDetail } from '@/types/internal/order-admin';

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: vi.fn(),
    }),
}));

vi.mock('@/app/actions/updateAdminOrder', () => ({
    updateAdminOrder: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/app/actions/updateOrderStatus', () => ({
    updateOrderStatus: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/app/actions/createOrderPayment', () => ({
    createOrderPayment: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/app/actions/cancelAdminOrder', () => ({
    cancelAdminOrder: vi.fn().mockResolvedValue({ success: true }),
}));

const mockInitialData: OrderDetail = {
    order: {
        id: 'd0fc878d-ea81-424a-9da8-e9f02377b63f',
        order_status: 'draft',
        payment_status: 'pending',
        fiscal_status: 'not_requested',
        total_with_vat: 1000,
        balance_amount: 1000,
        quantity_m3: 10,
        user_id: 'user1',
        ordered_at: new Date().toISOString(),
        pricing_snapshot_json: { version: 1, computed_at: '', inputs: { volume: 10, concreteType: 'direct', strength: '200' }, breakdown: {} },
        payments_summary_json: { total: 0, net_paid: 0, last_paid_at: null, recomputed_at: '', paid_in: 0, paid_out: 0, balance: 1000 },
        created_at: '',
        updated_at: '',
        folio: 'ORD-123',
        seller_id: null,
        created_by: null,
        service_type: 'tirado',
        product_id: null,
        unit_price_before_vat: null,
        vat_rate: null,
        total_before_vat: null,
        delivery_address_text: 'Test Address',
        delivery_address_id: null,
        scheduled_date: '2026-05-01',
        scheduled_slot_code: null,
        scheduled_time_label: null,
        scheduled_window_start: null,
        scheduled_window_end: null,
        lead_id: null,
        customer_id: null,
        visitor_id: null,
        fb_event_id: null,
        attribution_extra_json: {},
        import_source: null,
        import_batch_id: null,
        import_row_hash: null,
        legacy_folio_raw: null,
        external_ref: null,
        notes: null,
        deleted_at: null,
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        utm_term: null,
        utm_content: null,
        fbclid: null,
        gclid: null
    },
    payments: [],
    statusHistory: [],
    fiscalData: null,
    profiles: {},
    serviceSlot: null,
    customer: null,
};

describe('OrderDetailClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders initial data correctly', () => {
        render(<OrderDetailClient initialData={mockInitialData} />);
        expect(screen.getByText('draft')).toBeDefined();
        expect(screen.getAllByText('$1,000').length).toBe(2);
    });

    it('submits operational data update correctly', async () => {
        render(<OrderDetailClient initialData={mockInitialData} />);

        const saveButton = screen.getByText('Guardar cambios');
        fireEvent.click(saveButton);

        const { updateAdminOrder } = await import('@/app/actions/updateAdminOrder');
        await waitFor(() => {
            expect(updateAdminOrder).toHaveBeenCalledWith(expect.objectContaining({
                orderId: 'd0fc878d-ea81-424a-9da8-e9f02377b63f',
                delivery_address_text: 'Test Address',
                scheduled_date: '2026-05-01'
            }));
        });
    });

    it('registers payment successfully', async () => {
        render(<OrderDetailClient initialData={mockInitialData} />);

        const amountInput = screen.getByLabelText('Monto', { selector: 'input' });
        fireEvent.change(amountInput, { target: { value: '500' } });

        const submitPaymentBtn = screen.getByRole('button', { name: 'Registrar pago' });
        fireEvent.click(submitPaymentBtn);

        const { createOrderPayment } = await import('@/app/actions/createOrderPayment');
        await waitFor(() => {
            expect(createOrderPayment).toHaveBeenCalledWith(expect.objectContaining({
                orderId: 'd0fc878d-ea81-424a-9da8-e9f02377b63f',
                amount: 500,
                direction: 'in',
                kind: 'abono',
                method: 'transferencia'
            }));
        });

        expect(screen.getByText('Pago registrado.')).toBeDefined();
    });

    it('cancels order successfully', async () => {
        render(<OrderDetailClient initialData={mockInitialData} />);

        const reasonInput = screen.getByLabelText('Motivo de cancelación', { selector: 'textarea' });
        fireEvent.change(reasonInput, { target: { value: 'Requested by customer' } });

        const cancelBtn = screen.getByText('Confirmar cancelación');
        fireEvent.click(cancelBtn);

        const { cancelAdminOrder } = await import('@/app/actions/cancelAdminOrder');
        await waitFor(() => {
            expect(cancelAdminOrder).toHaveBeenCalledWith(expect.objectContaining({
                orderId: 'd0fc878d-ea81-424a-9da8-e9f02377b63f',
                reason: 'Requested by customer'
            }));
        });

        expect(screen.getByText('Pedido cancelado con éxito.')).toBeDefined();
    });
});
