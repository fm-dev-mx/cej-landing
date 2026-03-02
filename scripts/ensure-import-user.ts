import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const email = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1] ?? 'legacy-import@cej.local';
const password = process.argv.find((a) => a.startsWith('--password='))?.split('=')[1] ?? 'LegacyImport!2026';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) {
    console.error('Could not list users:', list.error.message);
    process.exit(1);
  }

  let user = list.data.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase()) ?? null;

  if (!user) {
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'owner', full_name: 'Legacy Import User' }
    });

    if (created.error || !created.data.user) {
      console.error('Could not create user:', created.error?.message);
      process.exit(1);
    }

    user = created.data.user;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: 'Legacy Import User',
      role: 'owner'
    });

    if (profileErr) {
      console.error('Could not upsert profile:', profileErr.message);
      process.exit(1);
    }
  }

  console.log(JSON.stringify({ userId: user.id, email: user.email }, null, 2));
}

main().catch((err) => {
  console.error('Fatal ensure-import-user error:', err);
  process.exit(1);
});
