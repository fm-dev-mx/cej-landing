'use server';

import { createClient } from '@/lib/supabase/server';
import { PricingRulesSchema, type PricingRules } from '@/lib/schemas/pricing';
import { reportError } from '@/lib/monitoring';
import { revalidatePath } from 'next/cache';

export type UpdatePriceConfigResult =
    | { status: 'success'; version: number }
    | { status: 'error'; message: string };

/**
 * Updates the active pricing configuration in Supabase.
 * - Validates the payload against PricingRulesSchema.
 * - Increments the version.
 * - Triggers revalidation for relevant paths.
 */
export async function updatePriceConfig(newRules: PricingRules): Promise<UpdatePriceConfigResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Auth Guard (Admin only)
        if (!user) {
            return { status: 'error', message: 'Debes iniciar sesión para realizar esta acción.' };
        }

        // TODO: Add RBAC check if needed (e.g. user_metadata.role === 'admin')

        // 2. Validate Payload
        const result = PricingRulesSchema.safeParse(newRules);
        if (!result.success) {
            return { status: 'error', message: 'Configuración de precios inválida.' };
        }

        const validatedRules = result.data;
        const newVersion = validatedRules.version + 1;

        // Update version in the JSONB and the column
        validatedRules.version = newVersion;
        validatedRules.lastUpdated = new Date().toISOString();

        // 3. Insert new version (Immutable history pattern)
        const { error } = await supabase
            .from('price_config')
            .insert({
                version: newVersion,
                pricing_rules: validatedRules,
                active: true
            });

        if (error) {
            reportError(error, { action: 'updatePriceConfig', phase: 'db_insert' });
            return { status: 'error', message: 'No se pudo guardar la nueva configuración.' };
        }

        // 4. Cleanup: Mark previous versions as inactive (Optional but helpful for queries)
        await supabase
            .from('price_config')
            .update({ active: false })
            .neq('version', newVersion);

        revalidatePath('/dashboard/settings/pricing');

        return { status: 'success', version: newVersion };
    } catch (error) {
        reportError(error, { action: 'updatePriceConfig', phase: 'unexpected' });
        return { status: 'error', message: 'Error inesperado al actualizar precios.' };
    }
}
