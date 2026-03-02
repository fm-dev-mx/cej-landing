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
    const { error } = await adminSupabase
        .from('orders')
        .delete()
        .eq('folio', 'TEST-123');

    if (error) {
        console.error('DELETE ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('DELETED TEST ORDER');
    }
}
main();
