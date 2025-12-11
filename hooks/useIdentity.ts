// hooks/useIdentity.ts
import { useEffect, useState } from 'react';
import { getIdentityParams, type IdentityData } from '@/lib/tracking/identity';
import { getOrInitUtmParams, type UTMParams } from '@/lib/tracking/utm';

export type FullIdentityData = IdentityData & UTMParams;

export function useIdentity() {
    const [identity, setIdentity] = useState<FullIdentityData | null>(null);

    useEffect(() => {
        // This runs only on the client side
        const trackingIds = getIdentityParams();
        const utmParams = getOrInitUtmParams();

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIdentity({
            ...trackingIds,
            ...utmParams
        });
    }, []);

    return identity;
}
