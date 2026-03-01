'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import type { Database } from '@/types/database';
import type { OperationsListQuery, OperationsListResult, OperationsStage, OperationsWorkItem } from '@/types/internal/operations';

const EMPTY_RESULT: Omit<OperationsListResult, 'success'> = {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
};

function stageFromLead(status: Database['public']['Tables']['leads']['Row']['status']): OperationsStage {
    if (status === 'qualified') return 'qualified';
    if (status === 'lost' || status === 'archived') return 'cancelled';
    return 'new_lead';
}

function stageFromOrder(status: Database['public']['Tables']['orders']['Row']['order_status']): OperationsStage {
    if (status === 'draft') return 'draft_order';
    if (status === 'confirmed' || status === 'scheduled' || status === 'in_progress') return 'confirmed';
    if (status === 'completed') return 'completed';
    return 'cancelled';
}

function normalizeNumber(value: number | undefined, fallback: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(value as number)));
}

function includesTerm(candidate: string | null | undefined, term: string): boolean {
    if (!candidate) return false;
    return candidate.toLowerCase().includes(term);
}

export async function listOperationsWorkItems(input: OperationsListQuery = {}): Promise<OperationsListResult> {
    const page = normalizeNumber(input.page, 1, 1, 1_000_000);
    const pageSize = normalizeNumber(input.pageSize, 20, 5, 100);
    const requestedStage = input.stage || '';
    const term = input.search?.trim().toLowerCase() || '';

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, ...EMPTY_RESULT, error: 'Usuario no autenticado' };

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view') && !hasPermission(role, 'admin:all')) {
            return { success: false, ...EMPTY_RESULT, error: 'No tienes permiso para ver esta sección' };
        }

        const adminSupabase = await createAdminClient();
        const [leadRes, orderRes] = await Promise.all([
            adminSupabase
                .from('leads')
                .select('id, name, phone_norm, status, utm_source, created_at, customer_id')
                .order('created_at', { ascending: false })
                .limit(300),
            adminSupabase
                .from('orders')
                .select('id, folio, order_status, payment_status, total_with_vat, ordered_at, lead_id, customer_id, visitor_id, utm_source')
                .order('ordered_at', { ascending: false })
                .limit(300),
        ]);

        if (leadRes.error) {
            reportError(leadRes.error, { action: 'listOperationsWorkItems', phase: 'leads' });
            return { success: false, ...EMPTY_RESULT, page, pageSize, error: 'Error al consultar leads' };
        }
        if (orderRes.error) {
            reportError(orderRes.error, { action: 'listOperationsWorkItems', phase: 'orders' });
            return { success: false, ...EMPTY_RESULT, page, pageSize, error: 'Error al consultar pedidos' };
        }

        const leadItems: OperationsWorkItem[] = ((leadRes.data || []) as Array<Pick<Database['public']['Tables']['leads']['Row'], 'id' | 'name' | 'phone_norm' | 'status' | 'utm_source' | 'created_at' | 'customer_id'>>)
            .map((lead) => ({
                item_type: 'lead',
                item_id: String(lead.id),
                stage: stageFromLead(lead.status),
                created_at: lead.created_at,
                display_name: lead.name,
                phone_norm: lead.phone_norm,
                source: lead.utm_source,
                amount_mxn: null,
                order_status: null,
                payment_status: null,
                lead_status: lead.status,
                order_id: null,
                lead_id: lead.id,
                customer_id: lead.customer_id,
            }));

        const orderItems: OperationsWorkItem[] = ((orderRes.data || []) as Array<Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'folio' | 'order_status' | 'payment_status' | 'total_with_vat' | 'ordered_at' | 'lead_id' | 'customer_id' | 'utm_source'>>)
            .map((order) => ({
                item_type: 'order',
                item_id: order.id,
                stage: stageFromOrder(order.order_status),
                created_at: order.ordered_at,
                display_name: order.folio,
                phone_norm: null,
                source: order.utm_source,
                amount_mxn: Number(order.total_with_vat || 0),
                order_status: order.order_status,
                payment_status: order.payment_status,
                lead_status: null,
                order_id: order.id,
                lead_id: order.lead_id,
                customer_id: order.customer_id,
            }));

        const allItems = [...leadItems, ...orderItems].filter((item) => {
            if (requestedStage && item.stage !== requestedStage) return false;
            if (!term) return true;
            return (
                includesTerm(item.display_name, term) ||
                includesTerm(item.phone_norm, term) ||
                includesTerm(item.source, term) ||
                includesTerm(item.item_id, term)
            );
        }).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

        const total = allItems.length;
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        return {
            success: true,
            items: allItems.slice(from, to),
            page,
            pageSize,
            total,
            totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        };
    } catch (error) {
        reportError(error, { action: 'listOperationsWorkItems', phase: 'unexpected' });
        return { success: false, ...EMPTY_RESULT, page, pageSize, error: 'Error inesperado' };
    }
}

