import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPriceConfig } from './getPriceConfig';
import { createClient } from '@/lib/supabase/server';
import { FALLBACK_PRICING_RULES } from '@/config/business';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('getPriceConfig', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return live rules when DB query is successful', async () => {
        const mockRules = {
            ...FALLBACK_PRICING_RULES,
            version: 99,
        };

        const mockSingle = vi.fn().mockResolvedValue({
            data: { pricing_rules: mockRules },
            error: null,
        });

        const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

        vi.mocked(createClient).mockResolvedValue({
            from: mockFrom,
        } as unknown as Awaited<ReturnType<typeof createClient>>);

        const result = await getPriceConfig();

        expect(result.version).toBe(99);
        expect(mockFrom).toHaveBeenCalledWith('price_config');
    });

    it('should return fallback rules when DB query fails', async () => {
        const mockSingle = vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'some-error', message: 'Fail' },
        });

        const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

        vi.mocked(createClient).mockResolvedValue({
            from: mockFrom,
        } as unknown as Awaited<ReturnType<typeof createClient>>);

        const result = await getPriceConfig();

        expect(result.version).toBe(FALLBACK_PRICING_RULES.version);
    });

    it('should return fallback rules when data is invalid', async () => {
        const mockSingle = vi.fn().mockResolvedValue({
            data: { pricing_rules: { invalid: 'data' } },
            error: null,
        });

        const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ limit: mockLimit });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

        vi.mocked(createClient).mockResolvedValue({
            from: mockFrom,
        } as unknown as Awaited<ReturnType<typeof createClient>>);

        const result = await getPriceConfig();

        expect(result.version).toBe(FALLBACK_PRICING_RULES.version);
    });
});
