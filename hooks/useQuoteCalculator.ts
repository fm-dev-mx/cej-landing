import { useMemo } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { calcQuote, calcVolumeFromDimensions, calcVolumeFromArea } from '@/lib/pricing';

export function useQuoteCalculator() {
    const draft = useCejStore((s) => s.currentDraft);

    const result = useMemo(() => {
        let rawRequested = 0;
        const {
            mode, volumeMode, length, width, area,
            thicknessByDims, thicknessByArea,
            hasCoffered, cofferedSize, strength, type
        } = draft;

        if (mode === 'knownM3') {
            rawRequested = parseFloat(draft.m3) || 0;
        } else {
            const hasCofferedSlab = hasCoffered === 'yes';

            const l = parseFloat(length) || 0;
            const w = parseFloat(width) || 0;
            const a = parseFloat(area) || 0;
            // Use dummy 0 if not solid to avoid calculation errors, logic handles coefficient
            const tDims = parseFloat(thicknessByDims) || 0;
            const tArea = parseFloat(thicknessByArea) || 0;

            if (volumeMode === 'dimensions') {
                rawRequested = calcVolumeFromDimensions({
                    lengthM: l,
                    widthM: w,
                    manualThicknessCm: hasCofferedSlab ? 0 : tDims,
                    hasCofferedSlab,
                    cofferedSize
                });
            } else {
                rawRequested = calcVolumeFromArea({
                    areaM2: a,
                    manualThicknessCm: hasCofferedSlab ? 0 : tArea,
                    hasCofferedSlab,
                    cofferedSize
                });
            }
        }

        const quote = calcQuote(rawRequested, strength, type);

        return {
            rawVolume: rawRequested,
            quote,
            isValid: quote.total > 0
        };

    }, [draft]);

    return result;
}
