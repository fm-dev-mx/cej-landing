// components/Calculator/steps/forms/KnownVolumeForm.tsx
'use client';

import { type ChangeEvent, useCallback } from 'react';
import { useCalculatorContext } from '../../context/CalculatorContext';
import { Input } from '@/components/ui/Input/Input';

export function KnownVolumeForm() {
    const { m3, setM3, volumeError } = useCalculatorContext();

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        // Normalize commas to dots and remove non-numeric characters
        const raw = e.target.value.replace(/,/g, '.');
        const cleaned = raw.replace(/[^0-9.]/g, '');
        setM3(cleaned);
    }, [setM3]);

    return (
        <Input
            id="vol-known"
            label="Volumen (m³)"
            type="number"
            min={0}
            step={0.5}
            value={m3}
            onChange={handleChange}
            isVolume={true}
            inputMode="decimal"
            placeholder="0.0"
            // Pass error state as boolean to trigger border style without inline message
            error={!!volumeError}
        />
    );
}
