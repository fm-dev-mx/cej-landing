/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('Fetching users from auth.users...');
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error fetching users:', error.message);
        process.exit(1);
    }

    if (!users.users || users.users.length === 0) {
        console.log('No users found in the database. Please sign up first.');
        process.exit(0);
    }

    for (const user of users.users) {
        console.log(`\nUpserting profile for: ${user.email} (${user.id})`);

        const { error: upsertProfileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                role: 'developer',
                updated_at: new Date().toISOString()
            });

        if (upsertProfileError) {
            console.error('  Failed to upsert profile table:', upsertProfileError.message);
        } else {
            console.log('  Profile table upserted with role "developer".');
        }
    }

    console.log('\n✅ All profiles guaranteed to exist with "developer" role.');
}

main().catch(console.error);
