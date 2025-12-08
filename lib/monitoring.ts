// lib/monitoring.ts
import { env } from '@/config/env';

/**
 * Reporta errores críticos a un sistema externo sin bloquear el hilo principal.
 * Usa un timeout agresivo (1s) para evitar colgar funciones serverless.
 */
export const reportError = (error: unknown, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    // 1. Log local obligatorio (visible en Vercel Logs)
    console.error('[MONITORING_ERROR]', {
        timestamp,
        error: errorMessage,
        stack,
        context,
    });

    // 2. Webhook externo (Fire-and-forget)
    const webhookUrl = env.MONITORING_WEBHOOK_URL;

    if (webhookUrl) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s Timeout estricto

        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Formato genérico compatible con Slack/Discord
                content: `🚨 **CEJ Critical Error**\n**Env:** ${process.env.NODE_ENV}\n**Time:** ${timestamp}\n**Error:** ${errorMessage}\n**Context:** \`\`\`${JSON.stringify(context || {}, null, 2)}\`\`\``
            }),
            signal: controller.signal,
        })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    // Si falla el monitoreo, solo hacemos warn en consola. No rompemos el flujo.
                    console.warn('[MONITORING_FAIL] Webhook failed:', err);
                }
            })
            .finally(() => {
                clearTimeout(timeoutId);
            });
    }
};

/**
 * Reporta advertencias operativas (ej. DB no configurada, fallos recuperables).
 */
export const reportWarning = (message: string, context?: Record<string, unknown>) => {
    // Siempre logueamos warnings en consola
    console.warn('[MONITORING_WARNING]', { message, context });

    // En producción, también enviamos al webhook para visibilidad proactiva
    if (process.env.NODE_ENV === 'production' && env.MONITORING_WEBHOOK_URL) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);

        fetch(env.MONITORING_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `⚠️ **CEJ Warning**\n**Msg:** ${message}\n**Context:** \`\`\`${JSON.stringify(context || {}, null, 2)}\`\`\``
            }),
            signal: controller.signal,
        }).catch(() => { }).finally(() => clearTimeout(timeoutId));
    }
};
