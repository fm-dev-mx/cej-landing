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
    const { data, error } = await adminSupabase.from('profiles').select('*');
    if (error) {
        console.error('PROFILES ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('PROFILES:', JSON.stringify(data, null, 2));
    }
}
main();
