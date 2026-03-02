'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import type { DbLeadStatus } from '@/types/database-enums';
import type { Database } from '@/types/database';

export interface LeadsListQuery {
    page?: number;
    pageSize?: number;
    status?: DbLeadStatus | '';
    search?: string;
}

export interface LeadListItem {
    id: number;
    name: string;
    phone: string;
    status: DbLeadStatus;
    customer_id: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
    delivery_date: string | null;
    lost_reason: string | null;
    created_at: string;
}

export interface LeadsListResult {
    success: boolean;
    leads: LeadListItem[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    error?: string;
}

const EMPTY_RESULT: Omit<LeadsListResult, 'success'> = {
    leads: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
};

function normalizePage(value: number | undefined, fallback: number): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(1, Math.trunc(value as number));
}

export async function listLeads(input: LeadsListQuery = {}): Promise<LeadsListResult> {
    const page = normalizePage(input.page, 1);
    const pageSize = Math.max(5, Math.min(100, normalizePage(input.pageSize, 20)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, ...EMPTY_RESULT, error: 'Usuario no autenticado' };

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view') && !hasPermission(role, 'admin:all')) {
            return { success: false, ...EMPTY_RESULT, error: 'No tienes permiso para ver esta sección' };
        }

        const adminSupabase = await createAdminClient();
        let query = adminSupabase
            .from('leads')
            .select('id, name, phone, status, customer_id, utm_source, utm_campaign, delivery_date, lost_reason, created_at', { count: 'exact' })
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (input.status) {
            query = query.eq('status', input.status);
        }

        if (input.search && input.search.trim().length > 0) {
            const term = input.search.trim();
            query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,phone_norm.ilike.%${term}%`);
        }

        const { data, count, error } = await query;
        if (error) {
            reportError(error, { action: 'listLeads', phase: 'db_query' });
            return { success: false, ...EMPTY_RESULT, page, pageSize, error: 'Error al obtener leads' };
        }

        const rows = (data || []) as Array<Database['public']['Tables']['leads']['Row']>;
        const total = count ?? rows.length;

        return {
            success: true,
            leads: rows.map((lead) => ({
                id: lead.id,
                name: lead.name,
                phone: lead.phone,
                status: lead.status,
                customer_id: lead.customer_id,
                utm_source: lead.utm_source,
                utm_campaign: lead.utm_campaign,
                delivery_date: lead.delivery_date,
                lost_reason: lead.lost_reason,
                created_at: lead.created_at,
            })),
            page,
            pageSize,
            total,
            totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        };
    } catch (error) {
        reportError(error, { action: 'listLeads', phase: 'unexpected' });
        return { success: false, ...EMPTY_RESULT, page, pageSize, error: 'Error inesperado' };
    }
}

