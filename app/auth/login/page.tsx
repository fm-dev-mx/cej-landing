import { redirect } from 'next/navigation';

interface LegacyLoginPageProps {
    searchParams: Promise<{ redirect?: string }>;
}

export default async function LegacyLoginPage({ searchParams }: LegacyLoginPageProps) {
    const params = await searchParams;
    const target = new URLSearchParams();

    if (params.redirect) {
        target.set('redirect', params.redirect);
    }

    const suffix = target.toString();
    redirect(suffix ? `/login?${suffix}` : '/login');
}
