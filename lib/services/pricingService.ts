import { FALLBACK_PRICING_RULES } from '@/config/business';
import { type PricingRules } from '@/types/domain';

/**
 * PricingService abstracts the source of pricing rules.
 * Currently it reads from static config, but it's ready to be
 * swapped for a DB client (Supabase) in the next phase.
 */
export const PricingService = {
    /**
     * Fetches current pricing rules.
     */
    async getCurrentRules(): Promise<PricingRules> {
        // Phase 4: This will call Supabase
        return FALLBACK_PRICING_RULES;
    },

    /**
     * Gets a specific version of pricing rules for historical snapshotting.
     */
    async getRulesByVersion(version: number): Promise<PricingRules | null> {
        if (version === FALLBACK_PRICING_RULES.version) {
            return FALLBACK_PRICING_RULES;
        }
        return null;
    }
};
