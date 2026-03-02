import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLeadById } from '@/app/actions/getLeadById';
import LeadDetailClient from './LeadDetailClient';
import styles from '../../admin-common.module.scss';

interface LeadDetailPageProps {
    params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: 'Detalle de Lead | CEJ Pro', robots: 'noindex' };

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
    const { id } = await params;
    const leadId = parseInt(id, 10);

    if (isNaN(leadId)) {
        notFound();
    }

    const result = await getLeadById(leadId);

    if (!result.success || !result.data) {
        notFound();
    }

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>Lead: {result.data.name}</h1>
                <Link href="/dashboard/leads" className={styles.backLink}>
                    Volver al listado
                </Link>
            </header>

            <LeadDetailClient initialData={result.data} />
        </main>
    );
}
