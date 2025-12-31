'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isConfigured: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    // Memoize the client to avoid recreating on every render
    const supabase = useMemo(() => createClient(), []);
    const isConfigured = supabase !== null;

    // Set initial loading state based on configuration
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(isConfigured);

    useEffect(() => {
        // If Supabase is not configured, nothing to do
        if (!supabase) {
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    return (
        <AuthContext.Provider value={{ user, loading, isConfigured }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
