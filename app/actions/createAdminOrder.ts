'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { reportError } from '@/lib/monitoring';
import { generateQuoteId } from '@/lib/utils';

export type AdminOrderPayload = {
    name: string;
    phone: string;
    volume: number;
    concreteType: 'direct' | 'pumped';
    strength: string;
    deliveryAddress: string;
    deliveryDate?: string;
    notes?: string;
};

export type AdminOrderResult =
    | { status: 'success'; id: string }
    | { status: 'error'; message: string };

/**
 * createAdminOrder
 * Dedicated server action for admins to manually register orders.
 * - Requires authenticated user.
 * - Does NOT trigger Meta CAPI or Pixel events.
 * - Uses 'admin_dashboard' as utm_source.
 */
export async function createAdminOrder(payload: AdminOrderPayload): Promise<AdminOrderResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Server-side auth guard
        if (!user) {
            redirect('/login');
        }

        const folio = generateQuoteId();

        const { data, error } = await supabase
            .from('leads')
            .insert({
                name: payload.name,
                phone: payload.phone,
                status: 'new',
                utm_source: 'admin_dashboard',
                utm_medium: 'internal',
                privacy_accepted: true,
                privacy_accepted_at: new Date().toISOString(),
                quote_data: {
                    folio,
                    items: [{
                        id: crypto.randomUUID(),
                        label: `Concreto ${payload.concreteType === 'pumped' ? 'Bomba' : 'Directo'} f'c ${payload.strength}`,
                        volume: payload.volume,
                        service: payload.concreteType,
                        subtotal: 0, // Admin orders do not calculate price at registration time
                    }],
                    financials: { subtotal: 0, vat: 0, total: 0, currency: 'MXN' },
                    breakdownLines: [],
                    metadata: {
                        source: 'admin_dashboard',
                        deliveryAddress: payload.deliveryAddress,
                        deliveryDate: payload.deliveryDate,
                        notes: payload.notes,
                    },
                },
            })
            .select('id')
            .single();

        if (error) {
            reportError(new Error(error.message), {
                source: 'createAdminOrder',
                code: error.code,
                customer: payload.name
            });
            return { status: 'error', message: 'No se pudo registrar el pedido. Intente de nuevo.' };
        }

        return { status: 'success', id: String(data.id) };
    } catch (err) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
            throw err; // Allow Next.js redirect to work
        }
        reportError(err, { source: 'createAdminOrder' });
        return { status: 'error', message: 'Error inesperado al registrar el pedido.' };
    }
}
