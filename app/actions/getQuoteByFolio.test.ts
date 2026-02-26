// app/actions/getQuoteByFolio.test.ts
// Unit tests for the getQuoteByFolio server action.
// Tests input validation, PII sanitization, and error handling.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportError } from '@/lib/monitoring';

// --- Mocks ---
vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

const mockMaybeSingle = vi.fn();
const mockLimit = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();

// Mock Supabase - follow same pattern as submitLead.test.ts
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            select: mockSelect.mockReturnValue({
                eq: mockEq.mockReturnValue({
                    limit: mockLimit.mockReturnValue({
                        maybeSingle: mockMaybeSingle
                    })
                })
            })
        })
    })
}));

vi.mock('@/config/env', () => ({
    env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
    },
    isProd: false,
}));

// Dynamic import to ensure mocks are applied first
const { getQuoteByFolio } = await import('./getQuoteByFolio');

describe('Server Action: getQuoteByFolio', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null for invalid folio format', async () => {
        const result = await getQuoteByFolio('INVALID-FOLIO');

        expect(result).toBeNull();
        // Should not reach DB query for invalid format
        expect(mockSelect).not.toHaveBeenCalled();
    });

    it('returns null for folio with wrong suffix format (letters instead of digits)', async () => {
        // Has letters in suffix instead of digits
        const result = await getQuoteByFolio('WEB-20251218-ABCD');

        expect(result).toBeNull();
        expect(mockSelect).not.toHaveBeenCalled();
    });

    it('returns null when quote not found in DB', async () => {
        mockMaybeSingle.mockResolvedValue({ data: null, error: null });

        const result = await getQuoteByFolio('WEB-20251218-1234');

        expect(result).toBeNull();
        expect(mockSelect).toHaveBeenCalled();
    });

    it('returns sanitized snapshot on success (phone masked, visitorId stripped)', async () => {
        const mockQuoteData = {
            folio: 'WEB-20251218-1234',
            customer: {
                name: 'Test User',
                phone: '6561234567',
                visitorId: 'visitor-secret-123',
            },
            items: [
                { id: 'item-1', label: 'Concreto 250', volume: 5, service: 'pumped', subtotal: 10000 }
            ],
            financials: {
                total: 10800,
                currency: 'MXN'
            }
        };

        mockMaybeSingle.mockResolvedValue({ data: { quote_data: mockQuoteData }, error: null });

        const result = await getQuoteByFolio('WEB-20251218-1234');

        expect(result).not.toBeNull();
        expect(result!.folio).toBe('WEB-20251218-1234');
        expect(result!.customer?.name).toBe('Test User');
        // Phone should be masked (last 4 digits visible)
        expect(result!.customer?.phone).toBe('******4567');
        // visitorId should be stripped for privacy
        expect(result!.customer?.visitorId).toBeUndefined();
    });

    it('returns null and reports error on DB query failure', async () => {
        mockMaybeSingle.mockResolvedValue({
            data: null,
            error: { message: 'Connection timeout', code: 'PGRST301' }
        });

        const result = await getQuoteByFolio('WEB-20251218-1234');

        expect(result).toBeNull();
        expect(reportError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                context: 'getQuoteByFolio',
                folio: 'WEB-20251218-1234'
            })
        );
    });

    it('handles exception in query gracefully and returns null', async () => {
        mockMaybeSingle.mockRejectedValue(new Error('Network error'));

        const result = await getQuoteByFolio('WEB-20251218-1234');

        expect(result).toBeNull();
        expect(reportError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ context: 'getQuoteByFolio catch-all' })
        );
    });

    it('masks short phone numbers correctly', async () => {
        const mockQuoteData = {
            folio: 'WEB-20251218-1234',
            customer: {
                name: 'Test User',
                phone: '123', // Very short phone
            },
            items: [],
            financials: { total: 0, currency: 'MXN' }
        };

        mockMaybeSingle.mockResolvedValue({ data: { quote_data: mockQuoteData }, error: null });

        const result = await getQuoteByFolio('WEB-20251218-1234');

        // Short phones should be fully masked
        expect(result!.customer?.phone).toBe('****');
    });
});
