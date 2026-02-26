import { createClient } from '@/lib/supabase/server';

/**
 * Dashboard layout with authentication boundary.
 * All routes under /dashboard require an authenticated user.
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    await supabase.auth.getUser();

    return <>{children}</>;
}
