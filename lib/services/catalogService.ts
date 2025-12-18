import { WORK_TYPES, CONCRETE_TYPES, STRENGTHS, FALLBACK_PRICING_RULES } from '@/config/business';
import { type Product, type WorkTypeConfig } from '@/types/domain';

/**
 * CatalogService abstracts the product definitions.
 */
export const CatalogService = {
    /**
     * Returns the list of available concrete strengths.
     */
    getStrengths(): string[] {
        return STRENGTHS;
    },

    /**
     * Returns the list of available concrete service types (direct/pumped).
     */
    getConcreteTypes(): { value: string; label: string }[] {
        return CONCRETE_TYPES;
    },

    /**
     * Returns the list of work type configurations.
     */
    getWorkTypes(): WorkTypeConfig[] {
        return WORK_TYPES;
    },

    /**
     * Returns all additives as abstract Product entities.
     */
    async getAdditives(): Promise<Product[]> {
        return FALLBACK_PRICING_RULES.additives.map(a => ({
            id: a.id,
            type: 'additive',
            label: a.label,
            description: a.description,
            active: a.active
        }));
    }
};
