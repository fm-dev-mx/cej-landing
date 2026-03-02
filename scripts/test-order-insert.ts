/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl!, supabaseKey!, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const canonicalPayload = {
        folio: 'TEST-123',
        user_id: '9d571f48-f267-4665-8f5f-21841df194b9',
        seller_id: '9d571f48-f267-4665-8f5f-21841df194b9',
        created_by: '9d571f48-f267-4665-8f5f-21841df194b9',
        order_status: 'draft',
        payment_status: 'pending',
        fiscal_status: 'not_requested',
        ordered_at: new Date().toISOString(),
        service_type: 'tirado',
        product_id: `concreto-f'c-200`,
        quantity_m3: 5.5,
        unit_price_before_vat: 1000,
        vat_rate: 0.16,
        total_before_vat: 5500,
        total_with_vat: 6380,
        pricing_snapshot_json: {},
        delivery_address_text: 'Test Address',
        scheduled_date: '2026-03-02',
        scheduled_slot_code: null,
        customer_id: null,
        utm_source: 'admin_dashboard',
        utm_medium: null,
        utm_campaign: null,
        attribution_extra_json: {},
        notes: null,
        external_ref: null,
        legacy_folio_raw: null,
        import_source: null,
    };

    const { data, error } = await adminSupabase
        .from('orders')
        .insert(canonicalPayload)
        .select('id')
        .single();

    if (error) {
        console.error('INSERT ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('SUCCESS:', data);
    }
}
main();
