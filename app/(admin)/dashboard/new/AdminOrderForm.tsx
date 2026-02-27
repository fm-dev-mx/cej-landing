'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminOrder, type AdminOrderPayload } from '@/app/actions/createAdminOrder';
import styles from './page.module.scss';

export function AdminOrderForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const payload: AdminOrderPayload = {
            name: formData.get('name') as string,
            phone: formData.get('phone') as string,
            volume: parseFloat(formData.get('volume') as string),
            concreteType: formData.get('concreteType') as 'direct' | 'pumped',
            strength: formData.get('strength') as string,
            deliveryAddress: formData.get('deliveryAddress') as string,
            deliveryDate: formData.get('deliveryDate') as string || undefined,
            notes: formData.get('notes') as string || undefined,
        };

        const result = await createAdminOrder(payload);

        if (result.status === 'success') {
            router.push('/dashboard?success=order_created');
            router.refresh();
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
                <div className={styles.field}>
                    <label htmlFor="name">Nombre del Cliente</label>
                    <input type="text" id="name" name="name" required placeholder="Ej. Juan Pérez" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="phone">Teléfono</label>
                    <input type="tel" id="phone" name="phone" required placeholder="656 000 0000" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="volume">Volumen (m³)</label>
                    <input type="number" id="volume" name="volume" step="0.5" min="1" required placeholder="Ej. 5.5" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="concreteType">Tipo de Servicio</label>
                    <select id="concreteType" name="concreteType" required>
                        <option value="direct">Tiro Directo</option>
                        <option value="pumped">Bomba</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="strength">Resistencia (f&apos;c)</label>
                    <select id="strength" name="strength" required>
                        <option value="150">f&apos;c 150</option>
                        <option value="200">f&apos;c 200</option>
                        <option value="250">f&apos;c 250</option>
                        <option value="300">f&apos;c 300</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="deliveryDate">Fecha Estimada</label>
                    <input type="date" id="deliveryDate" name="deliveryDate" />
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label htmlFor="deliveryAddress">Dirección de Entrega</label>
                    <input type="text" id="deliveryAddress" name="deliveryAddress" required placeholder="Calle, Número, Colonia" />
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label htmlFor="notes">Notas Internas</label>
                    <textarea id="notes" name="notes" rows={3} placeholder="Instrucciones adicionales..." />
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.footer}>
                <button type="submit" disabled={loading} className={styles.submitButton}>
                    {loading ? 'Registrando...' : 'Registrar Pedido'}
                </button>
            </div>
        </form>
    );
}
