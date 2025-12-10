// File: hooks/useCheckOutUI.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckoutUI, WHATSAPP_DELAY_MS } from './useCheckOutUI';
import { submitLead } from '@/app/actions/submitLead';
import { trackLead } from '@/lib/tracking/visitor';

// --- Mocks ---
vi.mock('@/app/actions/submitLead');

vi.mock('@/lib/tracking/visitor', () => ({
    trackLead: vi.fn(),
    trackContact: vi.fn()
}));

vi.mock('@/store/useCejStore', () => ({
    useCejStore: (selector: any) => selector({
        cart: [{
            id: '1',
            results: { total: 1000, volume: { billedM3: 1 }, concreteType: 'direct' },
            config: { label: 'Test Item' },
            inputs: {}
        }],
        updateUserContact: vi.fn(),
        moveToHistory: vi.fn()
    })
}));

vi.mock('@/hooks/useIdentity', () => ({
    useIdentity: () => ({ visitorId: 'vis-1', utm_source: 'google' })
}));

// FIX: Mock utils to ensure consistent returns regardless of Env Vars
vi.mock('@/lib/utils', () => ({
    generateQuoteId: () => 'FOLIO-MOCK',
    generateCartMessage: () => 'Hola, quiero pedir...',
    // Critical: Always return a URL so the hook enters the window.open block
    getWhatsAppUrl: () => 'https://wa.me/mock'
}));

describe('useCheckoutUI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers(); // Enable fake timers to control setTimeout
        vi.stubGlobal('open', vi.fn());
        vi.stubGlobal('crypto', { randomUUID: () => 'uuid-123' });
    });

    afterEach(() => {
        vi.useRealTimers(); // Restore timers
    });

    it('processes order successfully', async () => {
        (submitLead as any).mockResolvedValue({ status: 'success', id: '100' });

        const { result } = renderHook(() => useCheckoutUI());

        let success;
        await act(async () => {
            success = await result.current.processOrder(
                { name: 'Test', phone: '1234567890' },
                true
            );
        });

        // FIX: Advance time exactly by the constant used in implementation
        vi.advanceTimersByTime(WHATSAPP_DELAY_MS);

        expect(success).toBe(true);
        expect(result.current.error).toBeNull();

        // Should pass now that getWhatsAppUrl is mocked
        expect(window.open).toHaveBeenCalledWith('https://wa.me/mock', '_blank');

        expect(trackLead).toHaveBeenCalledWith(expect.objectContaining({
            event_id: 'uuid-123'
        }));
    });

    it('handles server validation errors', async () => {
        (submitLead as any).mockResolvedValue({
            status: 'error',
            message: 'Datos inválidos',
            errors: { phone: ['Error'] }
        });

        const { result } = renderHook(() => useCheckoutUI());

        await act(async () => {
            await result.current.processOrder(
                { name: 'Test', phone: 'bad' },
                false
            );
        });

        expect(result.current.error).toContain('Datos inválidos');
        expect(result.current.error).toContain('phone');
    });
});
