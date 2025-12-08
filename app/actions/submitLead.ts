'use server';

import { createClient } from '@supabase/supabase-js';
import { OrderSubmissionSchema, type OrderSubmission } from '@/lib/schemas';
import { env } from '@/config/env';
import { reportError, reportWarning } from '@/lib/monitoring';
import type { Database, QuoteSnapshot } from '@/types/database';

// 1. Inicialización Condicional (Fail-Open)
const supabase =
    env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient<Database>(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: { persistSession: false }, // No sessions in Server Actions
            }
        )
        : null;

export type SubmitLeadResult = {
    success: boolean;
    id?: string;
    error?: string;
    warning?: 'db_not_configured' | 'db_insert_failed' | 'server_exception';
};

export async function submitLead(payload: OrderSubmission): Promise<SubmitLeadResult> {
    // 2. Validación de Entrada (Zod)
    const parseResult = OrderSubmissionSchema.safeParse(payload);

    if (!parseResult.success) {
        const validationErrors = parseResult.error.flatten();
        // Error de cliente (datos malos), no es necesario reportar al monitoring crítico
        console.error('[Action:submitLead] Validation Error:', validationErrors);
        return { success: false, error: 'Datos de pedido inválidos o incompletos.' };
    }

    const {
        name,
        phone,
        quote,
        visitor_id,
        utm_source,
        utm_medium,
        fb_event_id,
        privacy_accepted
    } = parseResult.data;

    // 3. Verificación de Infraestructura (Fail-Open)
    if (!supabase) {
        // Reportamos como warning, pero permitimos que el usuario avance
        reportWarning('SUPABASE_NOT_CONFIGURED: Lead not saved to DB.', { phone });
        return { success: true, id: 'mock-no-db', warning: 'db_not_configured' };
    }

    try {
        // 4. Preparación de Datos (Type-Safe Mapping)
        const quoteSnapshot: QuoteSnapshot = {
            folio: quote.folio,
            items: quote.items,
            financials: quote.financials,
            metadata: quote.metadata,
            customer: {
                name,
                phone,
                visitorId: visitor_id
            }
        };

        const now = new Date().toISOString();

        // 5. Inserción en Base de Datos
        // Al usar el genérico <Database>, TypeScript valida que este objeto
        // cumpla exactamente con la interfaz Insert de la tabla 'leads'.
        const { data, error } = await supabase
            .from('leads')
            .insert({
                name,
                phone,
                quote_data: quoteSnapshot,
                // Mapeo explícito: Zod devuelve undefined si es opcional,
                // pero Supabase espera null para columnas nullable.
                visitor_id: visitor_id || null,
                fb_event_id: fb_event_id || null,
                utm_source: utm_source || 'direct',
                utm_medium: utm_medium || 'none',
                status: 'new',
                privacy_accepted: privacy_accepted,
                privacy_accepted_at: privacy_accepted ? now : null,
            })
            .select('id')
            .single();

        if (error) {
            // CRÍTICO: Estrategia Fail-Open
            // Si la BD falla (timeout, conexión rechazada, etc.), reportamos
            // pero NO mostramos error al usuario final.
            reportError(new Error(`Supabase Insert Failed: ${error.message}`), {
                code: error.code,
                details: error.details,
                payloadPhone: phone
            });

            return {
                success: true,
                id: 'fallback-db-error',
                warning: 'db_insert_failed'
            };
        }

        // 6. Éxito Real
        return { success: true, id: String(data.id) };

    } catch (err) {
        // 7. Manejo de Excepciones Inesperadas (Crash Prevention)
        reportError(err, { context: 'submitLead unhandled exception', phone });

        return {
            success: true,
            id: 'fallback-exception',
            warning: 'server_exception'
        };
    }
}
