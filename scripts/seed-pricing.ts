// scripts/seed-pricing.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { FALLBACK_PRICING_RULES } from '../config/business';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Faltan variables de entorno en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedPricing() {
    console.warn('🚀 Iniciando carga de precios a Supabase...');

    const { data, error } = await supabase
        .from('price_config')
        .upsert([
            {
                version: FALLBACK_PRICING_RULES.version,
                pricing_rules: FALLBACK_PRICING_RULES,
            },
        ], { onConflict: 'version' })
        .select();

    if (error) {
        console.error('❌ Error al cargar precios:', error.message);
        console.error('Detalles:', error.details);
        process.exit(1);
    }

    console.warn('✅ Precios cargados exitosamente:', data);
}

seedPricing();
