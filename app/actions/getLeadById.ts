'use server';

import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import type { DatabaseRowLeads } from '@/types/db/crm';

export type GetLeadResult =
    | { success: true; data: DatabaseRowLeads }
    | { success: false; error: string };

export async function getLeadById(id: number): Promise<GetLeadResult> {
    const supabase = env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false },
        })
        : null;

    if (!supabase) {
        return { success: false, error: 'Base de datos no configurada' };
    }

    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return { success: false, error: error?.message || 'Lead no encontrado' };
        }

        return { success: true, data: data as DatabaseRowLeads };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Error al consultar el lead',
        };
    }
}
