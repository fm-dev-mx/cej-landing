import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Route handler for Magic Link callback.
 * Exchanges the auth code for a session and redirects appropriately.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Successful authentication - redirect to intended destination
            return NextResponse.redirect(`${origin}${redirectTo}`);
        }
    }

    // Auth error - redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
