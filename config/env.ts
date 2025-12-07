// config/env.ts
import { z } from 'zod';

/**
 * Schema validation for environment variables.
 * This ensures the app crashes early (or throws specific errors)
 * if critical configuration is missing, rather than failing silently at runtime.
 */
const envSchema = z.object({
    // Meta Pixel
    // Optional for development / test. We will warn in production if missing.
    NEXT_PUBLIC_PIXEL_ID: z.string().optional().default(''),

    // NEW: Google Analytics 4
    NEXT_PUBLIC_GA_ID: z.string().optional().default(''),

    // Contact Information
    // We expect numbers in string format (e.g., "521656...")
    NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional().default(''),
    NEXT_PUBLIC_PHONE: z.string().optional().default(''),

    // Site Metadata
    // Transform URL to remove trailing '/' if user accidentally adds it
    NEXT_PUBLIC_SITE_URL: z
        .string()
        .url()
        .optional()
        .default('https://concretodejuarez.com')
        .transform((url) => (url?.endsWith('/') ? url.slice(0, -1) : url)),
    NEXT_PUBLIC_BRAND_NAME: z.string().optional().default('Concreto y Equipos de Juárez'),
    NEXT_PUBLIC_CURRENCY: z.string().optional().default('MXN'),

    // --- PHASE 2: Supabase Config ---
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

/**
 * Helper to parse process.env safely.
 * In Next.js, process.env is available at build time for client-side variables.
 */
const processEnv = {
    NEXT_PUBLIC_PIXEL_ID: process.env.NEXT_PUBLIC_PIXEL_ID,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_PHONE: process.env.NEXT_PUBLIC_PHONE,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
    NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
    // Phase 2 vars
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Parse and validate
const parsed = envSchema.safeParse(processEnv);

if (!parsed.success && process.env.NODE_ENV !== 'test') {
    console.error(
        '❌ Invalid environment variables:',
        JSON.stringify(parsed.error.format(), null, 4)
    );
}

export const env = parsed.success
    ? parsed.data
    : (processEnv as unknown as z.infer<typeof envSchema>); // Fallback to raw (unsafe) if validation fails

// Extra safety: warnings in production
if (process.env.NODE_ENV === 'production') {
    if (!env.NEXT_PUBLIC_PIXEL_ID) {
        console.warn('⚠️ NEXT_PUBLIC_PIXEL_ID is empty.');
    }
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️ Supabase credentials missing. Leads will NOT be saved to DB.');
    }
}
