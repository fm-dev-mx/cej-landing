// scripts/seed-pricing.ts
import { DEFAULT_PRICING_RULES } from '../lib/pricing';
import { PricingRulesSchema } from '../lib/schemas/pricing';

function generateSeed() {
    try {
        // Validate against the strict schema first
        const validConfig = PricingRulesSchema.parse(DEFAULT_PRICING_RULES);

        console.log('✅ Configuration Validated Successfully.');
        console.log('---------------------------------------------------');
        console.log('COPY THE JSON BELOW INTO Supabase "price_config" table:');
        console.log('KEY: "default_v1"');
        console.log('---------------------------------------------------');
        console.log(JSON.stringify(validConfig, null, 2));
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('❌ Schema Validation Failed:', error);
        process.exit(1);
    }
}

generateSeed();
