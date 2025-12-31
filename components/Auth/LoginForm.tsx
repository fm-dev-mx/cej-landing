'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './LoginForm.module.scss';

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface LoginFormProps {
    redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [formState, setFormState] = useState<FormState>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setErrorMessage('Por favor ingresa un correo electrónico válido');
            setFormState('error');
            return;
        }

        setFormState('loading');
        setErrorMessage('');

        const supabase = createClient();

        if (!supabase) {
            setErrorMessage('El sistema de autenticación no está configurado');
            setFormState('error');
            return;
        }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?redirect=${redirectTo}` : ''}`,
            },
        });

        if (error) {
            setErrorMessage(error.message || 'Ocurrió un error al enviar el enlace');
            setFormState('error');
            return;
        }

        setFormState('success');
    };

    if (formState === 'success') {
        return (
            <div className={styles.successContainer}>
                <div className={styles.successIcon}>✉️</div>
                <h2 className={styles.successTitle}>¡Revisa tu correo!</h2>
                <p className={styles.successMessage}>
                    Enviamos un enlace mágico a <strong>{email}</strong>
                </p>
                <p className={styles.successHint}>
                    Haz clic en el enlace del correo para iniciar sesión.
                </p>
                <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() => {
                        setFormState('idle');
                        setEmail('');
                    }}
                >
                    Usar otro correo
                </button>
            </div>
        );
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                    Correo electrónico
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className={styles.input}
                    disabled={formState === 'loading'}
                    autoComplete="email"
                    autoFocus
                />
            </div>

            {formState === 'error' && (
                <p className={styles.errorMessage}>{errorMessage}</p>
            )}

            <button
                type="submit"
                className={styles.submitButton}
                disabled={formState === 'loading'}
            >
                {formState === 'loading' ? 'Enviando...' : 'Enviar enlace mágico'}
            </button>

            <p className={styles.disclaimer}>
                Recibirás un enlace seguro en tu correo para iniciar sesión sin contraseña.
            </p>
        </form>
    );
}
