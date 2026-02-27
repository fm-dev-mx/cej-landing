import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/Auth';
import { createClient } from '@/lib/supabase/server';
import styles from './page.module.scss';

export const metadata: Metadata = {
    title: 'Iniciar Sesión | CEJ Pro',
    description: 'Accede a tu cuenta de CEJ Pro para ver tu historial de cotizaciones y realizar nuevos pedidos.',
    robots: 'noindex, nofollow',
};

interface LoginPageProps {
    searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    // Redirect authenticated users to dashboard
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        redirect('/dashboard');
    }

    const params = await searchParams;
    const redirectTo = params.redirect;
    const error = params.error;

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Bienvenido a CEJ Pro</h1>
                    <p className={styles.subtitle}>
                        Inicia sesión para acceder a tu historial y gestionar tus pedidos.
                    </p>
                </div>

                {error && (
                    <div className={styles.errorBanner}>
                        {error === 'auth_error'
                            ? 'El enlace ha expirado o es inválido. Solicita uno nuevo.'
                            : 'Ocurrió un error. Por favor intenta de nuevo.'}
                    </div>
                )}

                <LoginForm redirectTo={redirectTo} />
            </div>
        </main>
    );
}
