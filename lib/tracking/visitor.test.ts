// lib/tracking/visitor.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackLead, trackContact, trackPageView } from './visitor';

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

    beforeEach(() => {
        // Mock window.fbq
        mockFbq = vi.fn();

        // Configurable: true allows deleting the property later
        Object.defineProperty(window, 'fbq', {
            writable: true,
            configurable: true,
            value: mockFbq
        });
    });

    afterEach(() => {
        // Cleanup
        const win = window as WindowWithFbq;
        delete win.fbq;
    });

    it('does nothing if window.fbq is undefined', () => {
        // Simulate absence of fbq
        const win = window as WindowWithFbq;

        delete win.fbq;

        trackPageView();

        // Since fbq does not exist, it should not throw error nor call anything
    });

    it('tracks PageView correctly', () => {
        trackPageView();
        expect(mockFbq).toHaveBeenCalledWith('track', 'PageView');
    });

    it('tracks Lead with Event ID (Deduplication)', () => {
        const leadData = {
            value: 5000,
            currency: 'MXN',
            content_name: 'Losa',
            event_id: 'dedup-key-123'
        };

        trackLead(leadData);

        expect(mockFbq).toHaveBeenCalledWith(
            'track',
            'Lead',
            expect.objectContaining({
                value: 5000,
                content_name: 'Losa'
            }),
            { eventID: 'dedup-key-123' } // Critical for CAPI match
        );
    });

    it('normalizes contact method strings', () => {
        trackContact('WhatsApp'); // Mixed case

        expect(mockFbq).toHaveBeenCalledWith(
            'track',
            'Contact',
            expect.objectContaining({
                method: 'whatsapp', // Lowercase
                content_name: 'whatsapp'
            })
        );
    });
});
