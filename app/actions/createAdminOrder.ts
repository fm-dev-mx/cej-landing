'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
import { reportError } from '@/lib/monitoring';
import { generateQuoteId } from '@/lib/utils';
import { adminOrderPayloadSchema } from '@/lib/schemas/internal/order';
import type { AdminOrderPayload } from '@/types/internal/order';
import { getAttributionData, extractAttribution } from '@/lib/logic/attribution';
import { getPriceConfig } from './getPriceConfig';
import { calcQuote } from '@/lib/pricing';
import { type Database, type PricingSnapshotJson } from '@/types/database';

export type { AdminOrderPayload };

export type AdminOrderResult =
    | { status: 'success'; id: string }
    | { status: 'error'; message: string };

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    // Support US (+1) numbers naturally (e.g. 1 915 123 4567)
    if (digits.length === 11 && digits.startsWith('1')) return digits;
    // Support MX (+52) numbers (e.g. 52 656 123 4567)
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    // Default to adding 52 for 10-digit local numbers
    if (digits.length === 10) return `52${digits}`;
    return digits;
}

/**
 * createAdminOrder
 * Dedicated server action for admins to manually register orders.
 * - Requires authenticated user with proper RBAC permissions.
 * - Uses the canonical schema defined in docs/schema.sql.
 */
export async function createAdminOrder(payload: AdminOrderPayload): Promise<AdminOrderResult> {
    try {
        const session = await requirePermission('orders:create');
        if ('status' in session) return session;

        const { user } = session;

        // 1. Validation
        const parsedPayload = adminOrderPayloadSchema.safeParse(payload);
        if (!parsedPayload.success) {
            return { status: 'error', message: 'Revisa los datos del formulario e intenta de nuevo.' };
        }

        const normalizedPayload = parsedPayload.data;
        const folio = generateQuoteId();
        const orderedAt = normalizedPayload.orderedAt
            ? new Date(normalizedPayload.orderedAt).toISOString()
            : new Date().toISOString();
        const scheduledDate = normalizedPayload.deliveryDate
            ? new Date(normalizedPayload.deliveryDate).toISOString().split('T')[0]
            : null;
        const scheduledWindowStart = normalizedPayload.scheduledWindowStart
            ? new Date(normalizedPayload.scheduledWindowStart).toISOString()
            : null;
        const scheduledWindowEnd = normalizedPayload.scheduledWindowEnd
            ? new Date(normalizedPayload.scheduledWindowEnd).toISOString()
            : null;

        // 3. Pricing Calculation
        const pricingRules = await getPriceConfig();
        const quoteBreakdown = calcQuote(normalizedPayload.volume, {
            strength: normalizedPayload.strength as '100' | '150' | '200' | '250' | '300',
            type: normalizedPayload.concreteType,
            additives: [],
        }, pricingRules);

        const attribution = await getAttributionData(extractAttribution(normalizedPayload));

        // Default for admin-created orders if no specific marketing UTMs are present
        if (attribution.utm_source === 'direct') {
            attribution.utm_source = 'admin_dashboard';
        }

        const pricingSnapshotJson: PricingSnapshotJson = {
            version: pricingRules.version,
            computed_at: new Date().toISOString(),
            inputs: {
                volume: normalizedPayload.volume,
                concreteType: normalizedPayload.concreteType,
                strength: normalizedPayload.strength,
            },
            breakdown: quoteBreakdown.pricingSnapshot
                ? JSON.parse(JSON.stringify(quoteBreakdown.pricingSnapshot))
                : {},
        };

        const serviceType: Database['public']['Tables']['orders']['Row']['service_type'] =
            normalizedPayload.concreteType === 'pumped' ? 'bombeado' : 'tirado';

        const adminSupabase = await createAdminClient();
        const phoneNorm = normalizePhone(normalizedPayload.phone);
        let customerId: string | null = null;

        if (phoneNorm) {
            try {
                if (!normalizedPayload.forceNewCustomer) {
                    const { data: existingCustomer, error: customerLookupError } = await adminSupabase
                        .from('customers')
                        .select('id')
                        .eq('primary_phone_norm', phoneNorm)
                        .is('merged_into_customer_id', null)
                        .maybeSingle();

                    if (customerLookupError) {
                        reportError(customerLookupError, { source: 'createAdminOrder', phase: 'customer_lookup' });
                    } else if (existingCustomer?.id) {
                        customerId = existingCustomer.id;
                    }
                }

                if (!customerId) {
                    const { data: newCustomer, error: customerCreateError } = await adminSupabase
                        .from('customers')
                        .insert({
                            display_name: normalizedPayload.name,
                            primary_phone_norm: phoneNorm,
                            identity_status: 'verified',
                        })
                        .select('id')
                        .single();

                    if (customerCreateError) {
                        reportError(customerCreateError, { source: 'createAdminOrder', phase: 'customer_create' });
                    } else {
                        customerId = newCustomer.id;
                        await adminSupabase
                            .from('customer_identities')
                            .insert({
                                customer_id: customerId,
                                type: 'phone',
                                value_norm: phoneNorm,
                                is_primary: true,
                            });
                    }
                }
            } catch (customerError) {
                // Customer linkage is best-effort and must not block order creation.
                reportError(customerError, { source: 'createAdminOrder', phase: 'customer_resolution_fallback' });
            }
        }

        const canonicalPayload = {
            folio,
            user_id: user.id, // Using current user as tenant for now, but should be clarified later
            seller_id: normalizedPayload.sellerId ?? user.id,
            created_by: user.id, // Current user is the creator

            order_status: 'draft' as const,
            payment_status: 'pending' as const,
            fiscal_status: 'not_requested' as const,
            ordered_at: orderedAt,

            service_type: serviceType,
            product_id: `concreto-f'c-${normalizedPayload.strength}`,
            quantity_m3: normalizedPayload.volume,
            unit_price_before_vat: quoteBreakdown.baseSubtotal / normalizedPayload.volume,
            vat_rate: 0.16,
            total_before_vat: quoteBreakdown.baseSubtotal,
            total_with_vat: quoteBreakdown.total,
            pricing_snapshot_json: pricingSnapshotJson,

            delivery_address_text: normalizedPayload.deliveryAddress,
            scheduled_date: scheduledDate,
            scheduled_slot_code: normalizedPayload.scheduledSlotCode ?? null,
            scheduled_time_label: normalizedPayload.scheduledTimeLabel ?? null,
            scheduled_window_start: scheduledWindowStart,
            scheduled_window_end: scheduledWindowEnd,
            customer_id: customerId,

            utm_source: attribution.utm_source,
            utm_medium: attribution.utm_medium,
            utm_campaign: attribution.utm_campaign,
            utm_term: attribution.utm_term,
            utm_content: attribution.utm_content,
            fbclid: attribution.fbclid,
            gclid: attribution.gclid,

            notes: normalizedPayload.notes ?? null,
            external_ref: normalizedPayload.externalRef ?? null,
            legacy_folio_raw: normalizedPayload.legacyFolioRaw ?? null,
        };

        const canonicalInsert: Database['public']['Tables']['orders']['Insert'] = canonicalPayload;
        const { data, error } = await adminSupabase
            .from('orders')
            .insert(canonicalInsert)
            .select('id')
            .single();

        if (error) {
            reportError(new Error(error.message), {
                source: 'createAdminOrder',
                code: error.code,
                customer: normalizedPayload.name
            });
            return { status: 'error', message: 'No se pudo registrar el pedido. Intente de nuevo.' };
        }

        if (!data?.id) {
            return { status: 'error', message: 'No se obtuvo el identificador del pedido.' };
        }

        return { status: 'success', id: String(data.id) };
    } catch (err) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
            throw err;
        }
        reportError(err, { source: 'createAdminOrder' });
        return { status: 'error', message: 'Error inesperado al registrar el pedido.' };
    }
}
