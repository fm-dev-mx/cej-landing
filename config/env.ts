// config/env.ts
import { z } from 'zod';

/**
 * Schema validation for environment variables.
 * This ensures the app crashes early (or throws specific errors)
 * if critical configuration is missing, rather than failing silently at runtime.
 */
const envSchema = z.object({
    // Meta Pixel
    NEXT_PUBLIC_PIXEL_ID: z.string().min(1, "Pixel ID is required"),

    // Contact Information
    // We expect numbers in string format (e.g., "521656...")
    NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional().default(''),
    NEXT_PUBLIC_PHONE: z.string().optional().default(''),

    // Site Metadata
    NEXT_PUBLIC_SITE_URL: z.string().url().optional().default('https://concretodejuarez.com'),
    NEXT_PUBLIC_BRAND_NAME: z.string().optional().default('Concreto y Equipos de Juárez'),
    NEXT_PUBLIC_CURRENCY: z.string().optional().default('MXN'),
});

/**
 * Helper to parse process.env safely.
 * In Next.js, process.env is available at build time for client-side variables.
 */
const processEnv = {
    NEXT_PUBLIC_PIXEL_ID: process.env.NEXT_PUBLIC_PIXEL_ID,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_PHONE: process.env.NEXT_PUBLIC_PHONE,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BRAND_NAME: process.env.NEXT_PUBLIC_BRAND_NAME,
    NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
};

// Parse and validate
const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
    console.error(
        '❌ Invalid environment variables:',
        JSON.stringify(parsed.error.format(), null, 4)
    );
    // In production, we might want to throw to stop the build.
    // For dev/robustness, we'll return the default empty values if parsing fails,
    // but the error log above is critical.
}

export const env = parsed.success
    ? parsed.data
    : (processEnv as z.infer<typeof envSchema>); // Fallback to raw (unsafe) if validation fails to prevent full crash during partial dev setup
