// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
    // Meta Pixel & Analytics
    NEXT_PUBLIC_PIXEL_ID: z.string().optional().default(''),
    NEXT_PUBLIC_GA_ID: z.string().optional().default(''),

    // Contact Information
    NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional().default(''),
    NEXT_PUBLIC_PHONE: z.string().optional().default(''),

    // Site Metadata
    NEXT_PUBLIC_SITE_URL: z
        .string()
        .url()
        .optional()
        .default('https://concretodejuarez.com')
        .transform((url) => (url?.endsWith('/') ? url.slice(0, -1) : url)),
    NEXT_PUBLIC_BRAND_NAME: z.string().optional().default('Concreto y Equipos de Juárez'),
    NEXT_PUBLIC_CURRENCY: z.string().optional().default('MXN'),

    // --- PHASE 1: Data Core (Fail-Open Configuration) ---
    // Hacemos estos campos opcionales. Si faltan, la app inicia pero en modo degradado.
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

    // Monitoring
    MONITORING_WEBHOOK_URL: z.string().url().optional(),
});

const processEnv = {
    NEXT_PUBLIC_PIXEL_ID: process.env.NEXT_PUBLIC_PIXEL_ID,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_PHONE: process.env.NEXT_PUBLIC_PHONE,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
    NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
    // Backend Vars
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    MONITORING_WEBHOOK_URL: process.env.MONITORING_WEBHOOK_URL,
};

// Validación segura (no lanza excepción, devuelve success: false)
const parsed = envSchema.safeParse(processEnv);

if (!parsed.success && process.env.NODE_ENV !== 'test') {
    console.error(
        '❌ Invalid environment variables:',
        JSON.stringify(parsed.error.format(), null, 4)
    );
    // Nota: Podríamos hacer process.exit(1) aquí si fuera un error fatal,
    // pero para Fail-Open preferimos loguear y continuar con valores por defecto/undefined.
}

export const env = parsed.success
    ? parsed.data
    : (processEnv as unknown as z.infer<typeof envSchema>);

// --- Runtime Integrity Check ---
// Verifica configuración crítica en runtime (servidor)
if (process.env.NODE_ENV === 'production') {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn(
            '\x1b[33m%s\x1b[0m', // Color Amarillo
            '⚠️ [CRITICAL] Supabase keys missing. App running in Fail-Open mode (No DB Persistence).'
        );
    }
}
