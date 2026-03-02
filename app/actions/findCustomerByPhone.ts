'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { reportError } from '@/lib/monitoring';

export interface PhoneCustomerMatch {
    id: string;
    display_name: string;
    primary_phone_norm: string | null;
}

export interface FindCustomerByPhoneResult {
    success: boolean;
    normalizedPhone: string;
    customer?: PhoneCustomerMatch;
    error?: string;
}

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    if (digits.length === 10) return `52${digits}`;
    return digits;
}

export async function findCustomerByPhone(phone: string): Promise<FindCustomerByPhoneResult> {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
        return { success: true, normalizedPhone };
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, normalizedPhone, error: 'No autenticado' };
        }

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view') && !hasPermission(role, 'admin:all')) {
            return { success: false, normalizedPhone, error: 'Sin permisos' };
        }

        const adminSupabase = await createAdminClient();
        const { data, error } = await adminSupabase
            .from('customers')
            .select('id, display_name, primary_phone_norm')
            .eq('primary_phone_norm', normalizedPhone)
            .is('merged_into_customer_id', null)
            .maybeSingle();

        if (error) {
            reportError(error, { action: 'findCustomerByPhone', normalizedPhone });
            return { success: false, normalizedPhone, error: 'No se pudo validar el cliente' };
        }

        return {
            success: true,
            normalizedPhone,
            customer: data || undefined,
        };
    } catch (error) {
        reportError(error, { action: 'findCustomerByPhone', phase: 'unexpected' });
        return { success: false, normalizedPhone, error: 'Error inesperado' };
    }
}
