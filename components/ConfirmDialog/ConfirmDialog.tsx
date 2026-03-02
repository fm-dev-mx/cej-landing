'use client';

import styles from './ConfirmDialog.module.scss';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className={styles.overlay} role="presentation" onClick={onCancel}>
            <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
                <h3 id="confirm-title" className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
                <div className={styles.actions}>
                    <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={loading}>
                        {cancelLabel}
                    </button>
                    <button type="button" className={styles.confirmButton} onClick={onConfirm} disabled={loading}>
                        {loading ? 'Procesando...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
