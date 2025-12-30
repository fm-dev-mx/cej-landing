'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './UserProfileMenu.module.scss';

interface UserProfileMenuProps {
    userName: string;
    userEmail: string;
}

export function UserProfileMenu({ userName, userEmail }: UserProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Get initials from name
    const initials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        if (supabase) {
            await supabase.auth.signOut();
        }
        router.push('/');
        router.refresh();
    };

    return (
        <div className={styles.container} ref={menuRef}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <span className={styles.avatar}>{initials}</span>
                <span className={styles.greeting}>Hola, {userName.split(' ')[0]}</span>
                <svg
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className={styles.dropdown} role="menu">
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{userName}</span>
                        <span className={styles.userEmail}>{userEmail}</span>
                    </div>

                    <div className={styles.divider} />

                    <Link
                        href="/dashboard"
                        className={styles.menuItem}
                        role="menuitem"
                        onClick={() => setIsOpen(false)}
                    >
                        <span className={styles.menuIcon}>📋</span>
                        Mis Pedidos
                    </Link>

                    <div className={styles.divider} />

                    <button
                        className={styles.logoutButton}
                        onClick={handleLogout}
                        role="menuitem"
                    >
                        <span className={styles.menuIcon}>🚪</span>
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
    );
}
