// hooks/useIdentity.ts
import { useEffect, useState } from 'react';
import { getIdentityParams, type IdentityData } from '@/lib/tracking/identity';

export function useIdentity() {
    const [identity, setIdentity] = useState<IdentityData | null>(null);

    useEffect(() => {
        // Initialize identity on client mount
        setIdentity(getIdentityParams());
    }, []);

    return identity;
}
