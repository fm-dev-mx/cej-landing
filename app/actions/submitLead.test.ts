// Full, final content of app/actions/submitLead.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitLead, type SubmitLeadPayload } from './submitLead';
import { reportError } from '@/lib/monitoring';
import { sendToMetaCAPI } from '@/lib/tracking/capi';

// --- Mocks ---
vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
    reportWarning: vi.fn(),
}));

vi.mock('@/lib/tracking/capi', () => ({
    sendToMetaCAPI: vi.fn(),
}));

// Mock Next.js headers/cookies
vi.mock('next/headers', () => ({
    headers: () => Promise.resolve({
        get: (key: string) => {
            if (key === 'x-forwarded-for') return '127.0.0.1';
            if (key === 'user-agent') return 'Mozilla/5.0 Test';
            if (key === 'referer') return 'http://localhost';
            return null;
        }
    }),
    cookies: () => Promise.resolve({
        get: (key: string) => {
            if (key === '_fbp') return { value: 'fb.1.123456789' };
            return null;
        }
    })
}));

// Mock Next.js after() to execute immediately
vi.mock('next/server', () => ({
    after: (fn: () => Promise<void>) => fn(),
}));

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

// Mock Supabase with strict chaining structure
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
        NEXT_PUBLIC_SITE_URL: 'http://localhost'
    }
}));

describe('Server Action: submitLead', () => {
    // Typed payload conforming to OrderSubmissionSchema
    const validPayload: SubmitLeadPayload = {
        name: 'Test User',
        phone: '6561234567',
        visitor_id: 'visitor-123',
        fb_event_id: 'evt-uuid-5678',
        utm_source: 'google',
        utm_medium: 'cpc',
        quote: {
            folio: 'WEB-123',
            items: [
                {
                    id: 'item-1',
                    label: 'Concreto 250',
                    volume: 5,
                    service: 'concrete_delivery',
                    subtotal: 10000,
                }
            ],
            financials: {
                subtotal: 10741,
                vat: 859,
                total: 11600,
                currency: 'MXN'
            },
            metadata: {
                source: 'web_calculator'
            },
            customer: {
                name: 'Test User',
                phone: '6561234567',
                email: 'test@test.com'
            }
        },
        privacy_accepted: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Default success response for DB
        mockSingle.mockResolvedValue({ data: { id: '999' }, error: null });
    });

    it('returns success on DB insertion', async () => {
        const result = await submitLead(validPayload);

        if (result.status === 'error') {
            console.error('Validation Errors in Test:', result.errors);
        }

        expect(result.status).toBe('success');
        if (result.status === 'success') {
            expect(result.id).toBe('999');
            expect(result.warning).toBeUndefined();
        }
    });

    it('returns error when validation fails (Zod)', async () => {
        // Create an invalid payload casting strictly for the test setup
        const invalidPayload = { ...validPayload, phone: 'short' } as SubmitLeadPayload;

        const result = await submitLead(invalidPayload);

        expect(result.status).toBe('error');
        if (result.status === 'error') {
            expect(result.message).toContain('inválidos');
            expect(result.errors).toHaveProperty('phone');
        }
    });

    it('fail-open: returns success with warning if DB insert fails', async () => {
        // Simulate DB error
        mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Constraint', code: '23505' } });

        const result = await submitLead(validPayload);

        expect(result.status).toBe('success');
        if (result.status === 'success') {
            expect(result.id).toBe('fallback-db-error');
            expect(result.warning).toBe('db_insert_failed');
        }
        // Verify error reporting was called
        expect(reportError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ code: '23505' }));
    });

    it('fail-open: catches unexpected exceptions', async () => {
        // Force an exception inside the try block
        mockInsert.mockImplementationOnce(() => { throw new Error('Catastrophic failure'); });

        const result = await submitLead(validPayload);

        expect(result.status).toBe('success');
        if (result.status === 'success') {
            expect(result.id).toBe('fallback-exception');
            expect(result.warning).toBe('server_exception');
        }
        expect(reportError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ context: 'submitLead unhandled exception' }));
    });

    it('correctly hashes PII before sending to CAPI', async () => {
        await submitLead(validPayload);

        expect(sendToMetaCAPI).toHaveBeenCalled();
        const sendToMetaCAPIMock = vi.mocked(sendToMetaCAPI);
        const args = sendToMetaCAPIMock.mock.calls[0][0];

        // Check phone hashing (SHA256 of 6561234567)
        expect(args.user_data.ph).toMatch(/^[a-f0-9]{64}$/);
        expect(args.user_data.ph).not.toBe('6561234567');

        // Check email hashing
        expect(args.user_data.em).toMatch(/^[a-f0-9]{64}$/);
    });
});
