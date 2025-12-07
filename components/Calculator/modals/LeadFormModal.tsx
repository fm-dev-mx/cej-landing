'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCejStore } from '@/store/useCejStore';
import { useCheckout } from '@/hooks/useCheckOut';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from './LeadFormModal.module.scss';

type LeadFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function LeadFormModal({ isOpen, onClose }: LeadFormModalProps) {
    // Local UI State
    const [view, setView] = useState<'form' | 'confirm'>('form');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [saveMyData, setSaveMyData] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Global State & Hooks
    const user = useCejStore(s => s.user);
    const { processOrder, isProcessing, error } = useCheckout();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Detect User Memory on Open
    useEffect(() => {
        if (isOpen) {
            if (user.name && user.phone) {
                setName(user.name);
                setPhone(user.phone);
                setPrivacyAccepted(true);
                setView('confirm'); // Go to express checkout
            } else {
                setName('');
                setPhone('');
                setPrivacyAccepted(false);
                setView('form');
            }
        }
    }, [isOpen, user.name, user.phone]);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const success = await processOrder(
            { name, phone },
            saveMyData
        );

        if (success) {
            onClose();
        }
    };

    const handleSwitchToEdit = () => {
        setView('form');
    };

    return createPortal(
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>&times;</button>

                {view === 'confirm' ? (
                    // --- VIEW: CONFIRM (Returning User) ---
                    <>
                        <header className={styles.header}>
                            <h3 className={styles.title}>¿Enviar pedido?</h3>
                            <p className={styles.subtitle}>Confirmar mis datos de contacto.</p>
                        </header>

                        <div className={styles.userCard}>
                            <div className={styles.userAvatar}>{name.charAt(0)}</div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{name}</span>
                                <span className={styles.userPhone}>{phone}</span>
                            </div>
                            <button className={styles.editBtn} onClick={handleSwitchToEdit}>
                                Editar
                            </button>
                        </div>

                        <Button
                            fullWidth
                            variant="whatsapp"
                            onClick={handleSubmit}
                            isLoading={isProcessing}
                            loadingText="Enviando..."
                        >
                            Confirmar y Enviar
                        </Button>
                    </>
                ) : (
                    // --- VIEW: FORM (New User / Editing) ---
                    <>
                        <header className={styles.header}>
                            <h3 className={styles.title}>Finalizar Pedido</h3>
                            <p className={styles.subtitle}>Tus datos para generar la orden de compra.</p>
                        </header>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <Input
                                label="Nombre completo"
                                placeholder="Ej. Juan Pérez"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                variant="light"
                                required
                                disabled={isProcessing}
                            />

                            <Input
                                label="Teléfono / WhatsApp"
                                type="tel"
                                placeholder="656 123 4567"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                maxLength={10}
                                variant="light"
                                required
                                disabled={isProcessing}
                            />

                            <div className={styles.checkboxWrapper}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={saveMyData}
                                        onChange={(e) => setSaveMyData(e.target.checked)}
                                        disabled={isProcessing}
                                    />
                                    <span>Guardar mis datos para futuros pedidos.</span>
                                </label>
                            </div>

                            <div className={styles.checkboxWrapper}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={privacyAccepted}
                                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                        required
                                        disabled={isProcessing}
                                    />
                                    <span>Acepto el <a href="#">Aviso de Privacidad</a>.</span>
                                </label>
                            </div>

                            {error && <p className={styles.errorMessage}>{error}</p>}

                            <Button
                                type="submit"
                                variant="whatsapp"
                                fullWidth
                                isLoading={isProcessing}
                                loadingText="Procesando..."
                                disabled={!privacyAccepted || name.length < 3 || phone.length < 10}
                            >
                                Enviar Pedido
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
