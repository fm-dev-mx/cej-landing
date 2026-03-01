import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/AdminShell';

/**
 * Dashboard layout with authentication boundary.
 * All routes under /dashboard require an authenticated user.
 */
interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default async function DashboardLayout({
    children,
}: DashboardLayoutProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
    const userEmail = user.email || 'sin-email@cej.mx';

    return (
        <AdminShell userName={userName} userEmail={userEmail}>
            {children}
        </AdminShell>
    );
}
