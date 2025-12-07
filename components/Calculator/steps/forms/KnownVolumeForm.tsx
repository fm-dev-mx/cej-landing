// components/Calculator/steps/forms/KnownVolumeForm.tsx
'use client';

import { type ChangeEvent, useCallback } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { Input } from '@/components/ui/Input/Input';

interface Props {
    hasError?: boolean;
}

export function KnownVolumeForm({ hasError }: Props) {
    const m3 = useCejStore((s) => s.draft.m3);
    const updateDraft = useCejStore((s) => s.updateDraft);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        // Normalize: allow only numbers and dots
        const raw = e.target.value.replace(/,/g, '.');
        const cleaned = raw.replace(/[^0-9.]/g, '');
        updateDraft({ m3: cleaned });
    }, [updateDraft]);

    return (
        <Input
            id="vol-known"
            label="Volumen Total (m³)"
            type="number"
            min={0}
            step={0.5}
            value={m3}
            onChange={handleChange}
            isVolume={true}
            inputMode="decimal"
            placeholder="0.0"
            error={hasError}
        />
    );
}
