import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitLead } from './submitLead';
import { reportError } from '@/lib/monitoring';

// Mocks
vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
    reportWarning: vi.fn(),
}));

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

// Mock Supabase client creator
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            insert: mockInsert.mockReturnValue({
                select: mockSelect.mockReturnValue({
                    single: mockSingle
                })
            })
        })
    })
}));

// Mock Env to ensure supabase client is initialized in logic
vi.mock('@/config/env', () => ({
    env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'mock-key'
    }
}));

describe('Server Action: submitLead (Fail-Open)', () => {
    const validPayload = {
        name: 'Test User',
        phone: '6561234567',
        quote: {
            folio: 'WEB-123',
            items: [],
            financials: { total: 1000, currency: 'MXN' }
        },
        privacy_accepted: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns success on DB insertion', async () => {
        mockSingle.mockResolvedValue({ data: { id: '999' }, error: null });

        const result = await submitLead(validPayload as any);

        expect(result.success).toBe(true);
        expect(result.id).toBe('999');
        expect(result.warning).toBeUndefined();
    });

    it('returns success WITH WARNING if DB fails (Fail-Open)', async () => {
        // Simulate DB Error
        mockSingle.mockResolvedValue({ data: null, error: { message: 'Connection refused' } });

        const result = await submitLead(validPayload as any);

        // Verification: The user flow must not break
        expect(result.success).toBe(true);
        expect(result.warning).toBe('db_insert_failed');

        // Monitoring must be called
        expect(reportError).toHaveBeenCalled();
    });

    it('returns success WITH WARNING on unhandled exception', async () => {
        // Simulate Crash
        mockSingle.mockRejectedValue(new Error('Unexpected Crash'));

        const result = await submitLead(validPayload as any);

        expect(result.success).toBe(true);
        expect(result.warning).toBe('server_exception');
        expect(reportError).toHaveBeenCalled();
    });

    it('fails validation gracefully', async () => {
        const invalidPayload = { name: 'Bo', phone: '123' }; // Too short

        const result = await submitLead(invalidPayload as any);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});
