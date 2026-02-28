import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitLead, type SubmitLeadPayload } from './submitLead';
import { sendToMetaCAPI } from '@/lib/tracking/capi';

const { mockInsert, mockSelect, mockSingle, mockOr, mockGte } = vi.hoisted(() => ({
    mockInsert: vi.fn(), mockSelect: vi.fn(), mockSingle: vi.fn(), mockOr: vi.fn(), mockGte: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({ reportError: vi.fn(), reportWarning: vi.fn() }));
vi.mock('@/lib/tracking/capi', () => ({ sendToMetaCAPI: vi.fn() }));
vi.mock('next/server', () => ({ after: (fn: () => Promise<void>) => fn() }));

vi.mock('next/headers', () => ({
    headers: () => Promise.resolve({
        get: (k: string) => k === 'x-forwarded-for' ? '127.0.0.1' : (k === 'user-agent' ? 'Mozilla/5.0' : null)
    }),
    cookies: () => Promise.resolve({ get: (k: string) => k === '_fbp' ? { value: 'fb.1.1' } : null })
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({ from: () => ({ insert: mockInsert, select: mockSelect }) })
}));

vi.mock('@/config/env', () => ({
    env: {
        NEXT_PUBLIC_SITE_URL: 'http://localhost',
        FB_ACCESS_TOKEN: 'mock-token',
        NEXT_PUBLIC_SUPABASE_URL: 'http://mock.co',
        SUPABASE_SERVICE_ROLE_KEY: 'mock-key'
    }
}));

const VALID_LEAD_PAYLOAD: SubmitLeadPayload = {
    name: 'Juan Pérez',
    phone: '6561234567',
    utm_source: 'google',
    utm_medium: 'cpc',
    privacy_accepted: true,
    quote: {
        folio: 'WEB-12345678-1234',
        customer: { name: 'Juan Pérez', phone: '6561234567' },
        items: [{ id: '1', label: 'Item', volume: 5, service: 'S', subtotal: 100 }],
        financials: { subtotal: 100, vat: 16, total: 116, currency: 'MXN' },
        metadata: { source: 'web_calculator' }
    },
    fb_event_id: 'evt-123',
    visitor_id: 'vis-123'
};

describe('Server Action: submitLead', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSelect.mockReturnValue({ or: mockOr.mockReturnThis(), gte: mockGte.mockResolvedValue({ count: 0 }), single: mockSingle });
        mockInsert.mockReturnValue({ select: () => ({ single: mockSingle.mockResolvedValue({ data: { id: '99' } }) }) });
    });

    it('persists lead and tracks (success)', async () => {
        const res = await submitLead(VALID_LEAD_PAYLOAD);
        expect(res.status).toBe('success');

        const dbExpectation = {
            name: 'Juan Pérez', phone: '6561234567',
            quote_data: expect.objectContaining({ folio: 'WEB-12345678-1234' })
        };
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining(dbExpectation));
        expect(sendToMetaCAPI).toHaveBeenCalled();
    });

    it('returns error on Zod failure', async () => {
        const res = await submitLead({ ...VALID_LEAD_PAYLOAD, phone: '123' } as SubmitLeadPayload);
        expect(res.status).toBe('error');
    });

    it('blocks on rate limit', async () => {
        mockGte.mockResolvedValueOnce({ count: 10 });
        const res = await submitLead(VALID_LEAD_PAYLOAD);
        expect(res.status).toBe('error');
        if (res.status === 'error') {
            expect(res.message).toContain('demasiadas');
        }
    });

    it('normalizes names for hashing', async () => {
        await submitLead({ ...VALID_LEAD_PAYLOAD, name: '  JUAN Jose ' });
        const capi = vi.mocked(sendToMetaCAPI).mock.calls[0][0];
        expect(capi.user_data.fn).toBe('ed08c290d7e22f7bb324b15cbadce35b0b348564fd2d5f95752388d86d71bcca');
    });

    it('fail-open: db error', async () => {
        mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } });
        const res = await submitLead(VALID_LEAD_PAYLOAD);
        expect(res.status).toBe('success');
        if (res.status === 'success') {
            expect(res.warning).toBe('db_insert_failed');
        }
    });

    it('fail-open: exceptions', async () => {
        mockInsert.mockImplementationOnce(() => { throw new Error('Crash'); });
        const res = await submitLead(VALID_LEAD_PAYLOAD);
        expect(res.status).toBe('success');
        if (res.status === 'success') {
            expect(res.warning).toBe('server_exception');
        }
    });
});
