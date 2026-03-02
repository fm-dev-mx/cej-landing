import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/AdminShell';
import { getUserRole } from '@/lib/auth/rbac';

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
    const userRole = getUserRole(user.user_metadata);

    return (
        <AdminShell userName={userName} userEmail={userEmail} userRole={userRole}>
            {children}
        </AdminShell>
    );
}
