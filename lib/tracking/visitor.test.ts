// File: lib/tracking/visitor.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackLead, trackContact, trackPageView } from './visitor';

// Mock env
vi.mock('@/config/env', () => ({
    env: { NEXT_PUBLIC_PIXEL_ID: '123' }
}));

describe('Visitor/Pixel Tracking', () => {
    let mockFbq: any;

    beforeEach(() => {
        // Mock window.fbq
        mockFbq = vi.fn();

        // CORRECCIÓN CRÍTICA: 'configurable: true' permite borrar la propiedad después
        Object.defineProperty(window, 'fbq', {
            writable: true,
            configurable: true,
            value: mockFbq
        });
    });

    afterEach(() => {
        // Cleanup ahora funcionará porque la propiedad es configurable
        // @ts-ignore
        delete window.fbq;
    });

    it('does nothing if window.fbq is undefined', () => {
        // Simular ausencia de fbq
        // @ts-ignore
        delete window.fbq;

        trackPageView();

        // Como fbq no existe, no debería lanzar error ni intentar llamar a nada
        // (Nota: si el mock se borró bien, esto prueba el "safety check" del código)
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
