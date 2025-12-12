// hooks/useCheckOutUI.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckoutUI, WHATSAPP_DELAY_MS } from './useCheckOutUI';
import { submitLead } from '@/app/actions/submitLead';
import { trackLead } from '@/lib/tracking/visitor';

// --- Mocks ---
vi.mock('@/app/actions/submitLead');
vi.mock('uuid', () => ({
    v4: () => 'uuid-123'
}));

vi.mock('@/lib/tracking/visitor', () => ({
    trackLead: vi.fn(),
    trackContact: vi.fn()
}));

vi.mock('@/store/useCejStore', () => ({
    useCejStore: (selector: (state: unknown) => unknown) => selector({
        cart: [{
            id: '1',
            results: { total: 1000, volume: { billedM3: 1 }, concreteType: 'direct' },
            config: { label: 'Test Item' },
            inputs: { additives: [] } // Ensure inputs match strictly
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
        // Silence console.error to keep test output clean from expected error logs
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.useRealTimers(); // Restore timers
        vi.restoreAllMocks();
    });

    it('processes order successfully', async () => {
        // Use Type-safe mock
        vi.mocked(submitLead).mockResolvedValue({ status: 'success', id: '100' });

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

        // Should NOT call window.open automatically anymore
        expect(window.open).not.toHaveBeenCalled();

        // Verify tracking called with uuid from mock
        expect(trackLead).toHaveBeenCalledWith(expect.objectContaining({
            event_id: 'uuid-123'
        }));
    });

    it('handles server validation errors', async () => {
        vi.mocked(submitLead).mockResolvedValue({
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

        // The hook catches the error and sets state.error
        expect(result.current.error).toContain('Datos inválidos');
        expect(result.current.error).toContain('phone');

        // Ensure console.error was indeed called (proving we silenced a real log)
        expect(console.error).toHaveBeenCalled();
    });
});
