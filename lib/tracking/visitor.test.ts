// lib/tracking/visitor.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    trackLead,
    trackContact,
    trackPageView,
    trackInitiateCheckout,
    trackViewContent,
} from './visitor';

// Define the shape of window with fbq for testing purposes
interface WindowWithFbq extends Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] };
}

// Mock env
vi.mock('@/config/env', () => ({
    env: { NEXT_PUBLIC_PIXEL_ID: '123' }
}));

describe('Visitor/Pixel Tracking', () => {
    let mockFbq: ReturnType<typeof vi.fn>;

    /** Asserts that fbq was called with the given event name and params. */
    const expectFbqEvent = (
        event: string,
        params?: Record<string, unknown>,
        options?: Record<string, unknown>,
    ) => {
        const args: unknown[] = ['track', event];
        if (params) args.push(expect.objectContaining(params));
        if (options) args.push(expect.objectContaining(options));
        expect(mockFbq).toHaveBeenCalledWith(...args);
    };

    beforeEach(() => {
        mockFbq = vi.fn();
        Object.defineProperty(window, 'fbq', {
            writable: true,
            configurable: true,
            value: mockFbq,
        });
    });

    afterEach(() => {
        const win = window as WindowWithFbq;
        delete win.fbq;
    });

    it('does nothing if window.fbq is undefined', () => {
        const win = window as WindowWithFbq;
        delete win.fbq;
        trackPageView();
        // Should not throw and fbq should not be called
    });

    it('tracks PageView correctly', () => {
        trackPageView();
        expectFbqEvent('PageView');
    });

    it('tracks Lead with Event ID (Deduplication)', () => {
        trackLead({
            value: 5000,
            currency: 'MXN',
            content_name: 'Losa',
            event_id: 'dedup-key-123',
        });
        expectFbqEvent(
            'Lead',
            { value: 5000, content_name: 'Losa' },
            { eventID: 'dedup-key-123' },
        );
    });

    it('tracks Lead without event_id (3-arg call, no options)', () => {
        trackLead({ value: 5000, currency: 'MXN', content_name: 'Test' });
        expectFbqEvent('Lead', { value: 5000, content_name: 'Test' });
        expect(mockFbq.mock.calls[0]).toHaveLength(3);
    });

    it('normalizes contact method strings', () => {
        trackContact('WhatsApp');
        expectFbqEvent(
            'Contact',
            { method: 'whatsapp', content_name: 'whatsapp' },
            { eventID: expect.any(String) },
        );
    });

    it('tracks InitiateCheckout with default MXN currency', () => {
        trackInitiateCheckout({ value: 5000 });
        expectFbqEvent('InitiateCheckout', { value: 5000, currency: 'MXN' });
    });

    it('tracks InitiateCheckout with custom currency', () => {
        trackInitiateCheckout({ value: 1000, currency: 'USD' });
        expectFbqEvent('InitiateCheckout', { value: 1000, currency: 'USD' });
    });

    it('tracks ViewContent with dynamic content_name', () => {
        trackViewContent(11600, 'MXN', "Concreto Directo f'c 200");
        expectFbqEvent('ViewContent', {
            value: 11600,
            currency: 'MXN',
            content_name: "Concreto Directo f'c 200",
        });
    });

    it('skips InitiateCheckout when fbq is absent', () => {
        const win = window as WindowWithFbq;
        delete win.fbq;
        trackInitiateCheckout({ value: 5000 });
        // Should not throw
    });
});
