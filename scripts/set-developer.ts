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
    console.log('Fetching users...');
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
        console.log(`\nPromoting user: ${user.email} (${user.id})`);

        const { error: updateAuthError } = await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: { role: 'developer' }
        });

        if (updateAuthError) {
            console.error('  Failed to update auth metadata:', updateAuthError.message);
        } else {
            console.log('  Auth metadata updated to "developer".');
        }

        const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ role: 'developer', updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (updateProfileError) {
            console.error('  Failed to update profile table:', updateProfileError.message);
        } else {
            console.log('  Profile table updated to "developer".');
        }
    }

    console.log('\n✅ All users have been promoted to "developer".');
    console.log('⚠️ IMPORTANT: You MUST log out and log back in to refresh your local session cookie!');
}

main().catch(console.error);
