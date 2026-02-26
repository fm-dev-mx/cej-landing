// lib/data-sanitizers.ts

/**
 * Converts empty strings to null and ensures numbers are numbers.
 * Useful for fields like dimensions that might come as "" from inputs.
 */
export const sanitizeNumericInput = (val: string | number | undefined | null): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
};

/**
 * Recursively cleans an object removing null/undefined/empty string values
 * or converting them based on rules.
 */
export const cleanQuoteContext = (context: Record<string, unknown>) => {
    const clean: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
        // Skip internal UI keys if necessary
        if (key === 'step' || key === 'isCalculating') continue;

        // Sanitize dimensions specific keys (assuming metric units)
        if (['width', 'length', 'thickness', 'area', 'm3', 'cofferedSize'].includes(key)) {
            // Type assertion to string | number because sanitizeNumericInput expects it,
            // though Number() works on unknown, TS might be strict.
            const cleanedValue = sanitizeNumericInput(value as string | number | null | undefined);
            // We save the cleaned value, which will be null if it was invalid or empty
            if (cleanedValue !== null) {
                clean[key] = cleanedValue;
            }
        } else {
            // Keep other values if they have content
            if (value !== '' && value !== null && value !== undefined) {
                clean[key] = value;
            }
        }
    }
    return clean;
};
