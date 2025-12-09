// app/actions/submitLead.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitLead } from './submitLead';
import { reportError } from '@/lib/monitoring';
import { sendToMetaCAPI } from '@/lib/tracking/capi';

// --- Mocks ---
vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
    reportWarning: vi.fn(),
}));

// Mock tracking to verify payload
vi.mock('@/lib/tracking/capi', () => ({
    sendToMetaCAPI: vi.fn(),
}));

// Mock Next.js headers/cookies
vi.mock('next/headers', () => ({
    headers: () => ({
        get: (key: string) => {
            if (key === 'x-forwarded-for') return '127.0.0.1';
            if (key === 'user-agent') return 'Mozilla/5.0 Test';
            if (key === 'referer') return 'http://localhost';
            return null;
        }
    }),
    cookies: () => ({
        get: (key: string) => {
            if (key === '_fbp') return { value: 'fb.1.123456789' };
            return null;
        }
    })
}));

// Mock Next.js after() - Execute callback immediately for testing
vi.mock('next/server', () => ({
    after: (fn: () => Promise<void>) => fn(),
}));

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

// Mock Supabase
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

// Mock Env
vi.mock('@/config/env', () => ({
    env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'mock-key',
        FB_ACCESS_TOKEN: 'mock-token' // Ensure CAPI logic triggers
    }
}));

describe('Server Action: submitLead', () => {
    const validPayload = {
        name: 'Test User',
        phone: '6561234567',
        visitor_id: 'visitor-123',
        fb_event_id: 'evt-uuid-5678', // Critical for CAPI
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

        // Updated assertion for discriminated union
        expect(result.status).toBe('success');
        if (result.status === 'success') {
            expect(result.id).toBe('999');
        }
    });

    it('triggers Meta CAPI with correct payload (Hashing & EventID)', async () => {
        mockSingle.mockResolvedValue({ data: { id: '999' }, error: null });

        await submitLead(validPayload as any);

        expect(sendToMetaCAPI).toHaveBeenCalledTimes(1);

        const callArgs = (sendToMetaCAPI as any).mock.calls[0][0];

        // 1. Verify Event ID matches (Deduplication key)
        expect(callArgs.event_id).toBe(validPayload.fb_event_id);

        // 2. Verify PII is hashed
        expect(callArgs.user_data.ph).not.toBe(validPayload.phone);
        // SHA-256 of '6561234567'
        expect(callArgs.user_data.ph).toMatch(/^[a-f0-9]{64}$/);

        // 3. Verify Context
        expect(callArgs.user_data.client_ip_address).toBe('127.0.0.1');
        expect(callArgs.user_data.fbp).toBe('fb.1.123456789');
    });

    it('Fail-Open: returns success WITH WARNING if DB fails', async () => {
        mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Down' } });

        const result = await submitLead(validPayload as any);

        // Fail-open means status is technically success, but with a warning
        expect(result.status).toBe('success');
        if (result.status === 'success') {
            expect(result.warning).toBe('db_insert_failed');
        }
        expect(reportError).toHaveBeenCalled();
    });
});
