'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import styles from './ResponsiveDialog.module.scss';

interface ResponsiveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export function ResponsiveDialog({ isOpen, onClose, title, children }: ResponsiveDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    useLockBodyScroll(isOpen);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Portal to document.body to avoid z-index stacking issues
    return createPortal(
        <div
            className={styles.backdrop}
            onClick={onClose}
            role="presentation"
        >
            <div
                className={styles.sheet}
                onClick={(e) => e.stopPropagation()}
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "dialog-title" : undefined}
            >
                <div className={styles.handle} aria-hidden="true" /> {/* Mobile Drag Handle */}

                <header className={styles.header}>
                    {title && <h2 id="dialog-title" className={styles.title}>{title}</h2>}
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </header>

                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
