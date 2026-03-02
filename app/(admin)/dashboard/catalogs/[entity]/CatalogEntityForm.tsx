'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import { softDeleteEntity } from '@/app/actions/softDeleteEntity';
import {
    createAsset,
    createEmployee,
    createProduct,
    createVendor,
    updateAsset,
    updateEmployee,
    updateProduct,
    updateVendor,
} from '@/app/actions/catalogCrud';
import type { CatalogEntity } from '@/types/internal/catalogs';
import styles from '../../admin-common.module.scss';

interface CatalogEntityFormProps {
    entity: CatalogEntity;
    initialData?: Record<string, unknown>;
    recordId?: string;
}

export default function CatalogEntityForm({ entity, initialData, recordId }: CatalogEntityFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showDelete, setShowDelete] = useState(false);

    const isEdit = Boolean(initialData && recordId);

    const entityTitle = useMemo(() => {
        if (entity === 'products') return 'Producto';
        if (entity === 'vendors') return 'Proveedor';
        if (entity === 'assets') return 'Activo';
        return 'Empleado';
    }, [entity]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData(event.currentTarget);

        if (entity === 'products') {
            const payload = {
                sku: String(formData.get('sku') || ''),
                name: String(formData.get('name') || ''),
                category: String(formData.get('category') || ''),
                provider_name: String(formData.get('provider_name') || '') || null,
                mixer_mode: String(formData.get('mixer_mode') || '') || null,
                pump_mode: String(formData.get('pump_mode') || '') || null,
                base_price_mxn: String(formData.get('base_price_mxn') || '') ? Number(formData.get('base_price_mxn')) : null,
                client_price_mxn: String(formData.get('client_price_mxn') || '') ? Number(formData.get('client_price_mxn')) : null,
                utility_mxn: String(formData.get('utility_mxn') || '') ? Number(formData.get('utility_mxn')) : null,
                status: (formData.get('status') as 'active' | 'inactive') || 'active',
                legacy_external_id: String(formData.get('legacy_external_id') || '') || null,
            };

            const result = isEdit
                ? await updateProduct(recordId!, payload)
                : await createProduct(payload);

            if (!result.success || !result.id) {
                setError(result.error || 'No se pudo guardar el producto');
                setLoading(false);
                return;
            }

            setSuccess('Producto guardado correctamente.');
            router.push(`/dashboard/catalogs/products/${result.id}`);
            router.refresh();
            return;
        }

        if (entity === 'vendors') {
            const payload = {
                name: String(formData.get('name') || ''),
                tax_id: String(formData.get('tax_id') || '') || null,
                notes: String(formData.get('notes') || '') || null,
            };

            const result = isEdit
                ? await updateVendor(recordId!, payload)
                : await createVendor(payload);

            if (!result.success || !result.id) {
                setError(result.error || 'No se pudo guardar el proveedor');
                setLoading(false);
                return;
            }

            setSuccess('Proveedor guardado correctamente.');
            router.push(`/dashboard/catalogs/vendors/${result.id}`);
            router.refresh();
            return;
        }

        if (entity === 'assets') {
            const payload = {
                code: String(formData.get('code') || ''),
                label: String(formData.get('label') || '') || null,
                asset_type: (formData.get('asset_type') as 'truck' | 'pump' | 'other') || 'other',
                active: formData.get('active') === 'on',
            };

            const result = isEdit
                ? await updateAsset(recordId!, payload)
                : await createAsset(payload);

            if (!result.success || !result.id) {
                setError(result.error || 'No se pudo guardar el activo');
                setLoading(false);
                return;
            }

            setSuccess('Activo guardado correctamente.');
            router.push(`/dashboard/catalogs/assets/${result.id}`);
            router.refresh();
            return;
        }

        const payload = {
            full_name: String(formData.get('full_name') || ''),
            status: (formData.get('status') as 'active' | 'inactive') || 'active',
            hired_at: String(formData.get('hired_at') || '') || null,
            left_at: String(formData.get('left_at') || '') || null,
            notes: String(formData.get('notes') || '') || null,
        };

        const result = isEdit
            ? await updateEmployee(recordId!, payload)
            : await createEmployee(payload);

        if (!result.success || !result.id) {
            setError(result.error || 'No se pudo guardar el empleado');
            setLoading(false);
            return;
        }

        setSuccess('Empleado guardado correctamente.');
        router.push(`/dashboard/catalogs/employees/${result.id}`);
        router.refresh();
    }

    async function handleDelete() {
        if (!recordId) return;
        setLoading(true);
        const result = await softDeleteEntity(entity, recordId);
        if (!result.success) {
            setError(result.error || `No se pudo eliminar ${entityTitle.toLowerCase()}`);
            setLoading(false);
            return;
        }

        router.push(`/dashboard/catalogs/${entity}`);
        router.refresh();
    }

    return (
        <section className={styles.section}>
            {(error || success) && (
                <p className={error ? styles.errorText : styles.successText} role={error ? 'alert' : 'status'}>
                    {error || success}
                </p>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                {entity === 'products' && (
                    <>
                        <div className={styles.formGrid}>
                            <label className={styles.formGroup}>SKU
                                <input className={styles.input} name="sku" defaultValue={String(initialData?.sku || '')} required disabled={isEdit} />
                            </label>
                            <label className={styles.formGroup}>Nombre
                                <input className={styles.input} name="name" defaultValue={String(initialData?.name || '')} required />
                            </label>
                            <label className={styles.formGroup}>Categoría
                                <input className={styles.input} name="category" defaultValue={String(initialData?.category || '')} required />
                            </label>
                            <label className={styles.formGroup}>Proveedor
                                <input className={styles.input} name="provider_name" defaultValue={String(initialData?.provider_name || '')} />
                            </label>
                            <label className={styles.formGroup}>Estatus
                                <select className={styles.input} name="status" defaultValue={String(initialData?.status || 'active')}>
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                            </label>
                            <label className={styles.formGroup}>Precio cliente (MXN)
                                <input className={styles.input} type="number" step="0.01" name="client_price_mxn" defaultValue={String(initialData?.client_price_mxn || '')} />
                            </label>
                        </div>
                        <details>
                            <summary>Avanzado</summary>
                            <div className={styles.formGrid}>
                                <label className={styles.formGroup}>Precio base (MXN)
                                    <input className={styles.input} type="number" step="0.01" name="base_price_mxn" defaultValue={String(initialData?.base_price_mxn || '')} />
                                </label>
                                <label className={styles.formGroup}>Utilidad (MXN)
                                    <input className={styles.input} type="number" step="0.01" name="utility_mxn" defaultValue={String(initialData?.utility_mxn || '')} />
                                </label>
                                <label className={styles.formGroup}>Modo mixer
                                    <input className={styles.input} name="mixer_mode" defaultValue={String(initialData?.mixer_mode || '')} />
                                </label>
                                <label className={styles.formGroup}>Modo bomba
                                    <input className={styles.input} name="pump_mode" defaultValue={String(initialData?.pump_mode || '')} />
                                </label>
                                <label className={styles.formGroup}>ID legado
                                    <input className={styles.input} name="legacy_external_id" defaultValue={String(initialData?.legacy_external_id || '')} />
                                </label>
                            </div>
                        </details>
                    </>
                )}

                {entity === 'vendors' && (
                    <div className={styles.formGrid}>
                        <label className={styles.formGroup}>Nombre
                            <input className={styles.input} name="name" defaultValue={String(initialData?.name || '')} required />
                        </label>
                        <label className={styles.formGroup}>RFC / Tax ID
                            <input className={styles.input} name="tax_id" defaultValue={String(initialData?.tax_id || '')} />
                        </label>
                        <label className={`${styles.formGroup} ${styles.gridFullWidth}`}>Notas
                            <textarea className={styles.input} name="notes" rows={4} defaultValue={String(initialData?.notes || '')} />
                        </label>
                    </div>
                )}

                {entity === 'assets' && (
                    <div className={styles.formGrid}>
                        <label className={styles.formGroup}>Código
                            <input className={styles.input} name="code" defaultValue={String(initialData?.code || '')} required />
                        </label>
                        <label className={styles.formGroup}>Etiqueta
                            <input className={styles.input} name="label" defaultValue={String(initialData?.label || '')} />
                        </label>
                        <label className={styles.formGroup}>Tipo
                            <select className={styles.input} name="asset_type" defaultValue={String(initialData?.asset_type || 'other')}>
                                <option value="truck">Camión</option>
                                <option value="pump">Bomba</option>
                                <option value="other">Otro</option>
                            </select>
                        </label>
                        <label className={`${styles.formGroup} ${styles.alignCenter} ${styles.gap2}`}>
                            <input type="checkbox" name="active" defaultChecked={Boolean(initialData ? initialData.active : true)} />
                            Activo
                        </label>
                    </div>
                )}

                {entity === 'employees' && (
                    <div className={styles.formGrid}>
                        <label className={styles.formGroup}>Nombre completo
                            <input className={styles.input} name="full_name" defaultValue={String(initialData?.full_name || '')} required />
                        </label>
                        <label className={styles.formGroup}>Estatus
                            <select className={styles.input} name="status" defaultValue={String(initialData?.status || 'active')}>
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </select>
                        </label>
                        <label className={styles.formGroup}>Fecha de alta
                            <input className={styles.input} type="date" name="hired_at" defaultValue={String(initialData?.hired_at || '')} />
                        </label>
                        <label className={styles.formGroup}>Fecha de baja
                            <input className={styles.input} type="date" name="left_at" defaultValue={String(initialData?.left_at || '')} />
                        </label>
                        <label className={`${styles.formGroup} ${styles.gridFullWidth}`}>Notas
                            <textarea className={styles.input} name="notes" rows={4} defaultValue={String(initialData?.notes || '')} />
                        </label>
                    </div>
                )}

                <div className={styles.formActions}>
                    {isEdit && (
                        <button type="button" className={styles.backLink} onClick={() => setShowDelete(true)}>
                            Eliminar {entityTitle.toLowerCase()}
                        </button>
                    )}
                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>

            <ConfirmDialog
                open={showDelete}
                title={`Eliminar ${entityTitle.toLowerCase()}`}
                description={`Esta acción aplicará borrado lógico para ${entityTitle.toLowerCase()} y podrá afectar relaciones activas.`}
                confirmLabel="Sí, eliminar"
                onCancel={() => setShowDelete(false)}
                onConfirm={handleDelete}
                loading={loading}
            />
        </section>
    );
}
