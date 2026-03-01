'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { reportError } from '@/lib/monitoring';
import type { ServiceSlotOption } from '@/types/internal/order-admin';

export interface ListServiceSlotsResult {
    success: boolean;
    slots: ServiceSlotOption[];
    error?: string;
}

export async function listServiceSlots(): Promise<ListServiceSlotsResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, slots: [], error: 'No autenticado' };

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view') && !hasPermission(role, 'admin:all')) {
            return { success: false, slots: [], error: 'Sin permisos' };
        }

        const adminSupabase = await createAdminClient();
        const { data, error } = await adminSupabase
            .from('service_slots')
            .select('*')
            .order('start_time', { ascending: true });

        if (error) {
            reportError(error, { action: 'listServiceSlots' });
            return { success: false, slots: [], error: 'No se pudieron cargar las franjas de servicio' };
        }

        return { success: true, slots: data || [] };
    } catch (error) {
        reportError(error, { action: 'listServiceSlots', phase: 'unexpected' });
        return { success: false, slots: [], error: 'Error inesperado' };
    }
}

