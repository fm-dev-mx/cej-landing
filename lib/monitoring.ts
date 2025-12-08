/**
 * Simple abstraction for error reporting.
 * In Phase 0, this logs to console.
 * In future phases, this will hook into Sentry/Datadog.
 */
export const reportError = (error: unknown, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'test') return;

    console.error('[MONITORING_ALERT]', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : error,
        context,
    });
};

export const reportWarning = (message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'test') return;

    console.warn('[MONITORING_WARNING]', {
        message,
        context
    });
};
