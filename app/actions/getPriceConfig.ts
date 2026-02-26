'use server';

import { createClient } from '@/lib/supabase/server';
import { PricingRulesSchema, type PricingRules } from '@/lib/schemas/pricing';
import { FALLBACK_PRICING_RULES } from '@/config/business';
import { reportError } from '@/lib/monitoring';

/**
 * Fetches the active pricing configuration from Supabase.
 * Returns FALLBACK_PRICING_RULES if the database is unavailable,
 * unconfigured, or the data is invalid.
 */
export async function getPriceConfig(): Promise<PricingRules> {
    try {
        const supabase = await createClient();

        // Fetch the most recent price config
        // Assuming we want the latest one, or there's only one 'active' record.
        // For now, we fetch the first one found.
        const { data, error } = await supabase
            .from('price_config')
            .select('pricing_rules')
            .limit(1)
            .single();

        if (error) {
            // Log error but don't crash, use fallback
            if (error.code !== 'PGRST116') { // PGRST116 is 'no rows' which might be expected initially
                reportError(error, { action: 'getPriceConfig', phase: 'db_query' });
            }
            return FALLBACK_PRICING_RULES;
        }

        if (!data?.pricing_rules) {
            return FALLBACK_PRICING_RULES;
        }

        // Validate the JSONB data against our schema
        const result = PricingRulesSchema.safeParse(data.pricing_rules);

        if (!result.success) {
            reportError(result.error, { action: 'getPriceConfig', phase: 'validation' });
            return FALLBACK_PRICING_RULES;
        }

        return result.data;
    } catch (error) {
        // Unexpected errors (e.g. network failure)
        reportError(error, { action: 'getPriceConfig', phase: 'unexpected' });
        return FALLBACK_PRICING_RULES;
    }
}
