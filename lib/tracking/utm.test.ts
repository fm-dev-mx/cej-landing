// File: lib/tracking/utm.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrInitUtmParams } from './utm';

describe('UTM Parsing Logic', () => {
    const LOCAL_STORAGE_KEY = 'cej_utm_params_v1';

    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('extracts UTMs from URL and saves to localStorage', () => {
        // Mock window.location
        const mockLocation = new URL('http://localhost/?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale');
        vi.stubGlobal('location', mockLocation);

        const params = getOrInitUtmParams();

        expect(params.utm_source).toBe('google');
        expect(params.utm_medium).toBe('cpc');

        // Verify persistence
        const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        expect(stored.utm_campaign).toBe('summer_sale');
    });

    it('returns existing localStorage values if present (first-touch attribution)', () => {
        // Simulate existing session from Facebook
        const existingUTM = {
            utm_source: 'facebook',
            utm_medium: 'cpc'
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingUTM));

        // New URL is direct traffic
        const mockLocation = new URL('http://localhost/');
        vi.stubGlobal('location', mockLocation);

        const params = getOrInitUtmParams();

        // Should keep Facebook attribution
        expect(params.utm_source).toBe('facebook');
    });

    it('defaults to direct/none if no data exists', () => {
        const mockLocation = new URL('http://localhost/');
        vi.stubGlobal('location', mockLocation);

        const params = getOrInitUtmParams();

        expect(params.utm_source).toBe('direct');
        expect(params.utm_medium).toBe('none');
    });
});
