import { describe, it, expect } from 'vitest';
import { generateLocalBusinessSchema } from './seo';
import { BUSINESS_INFO } from '@/config/business';

describe('generateLocalBusinessSchema', () => {
    it('uses the customer office without borrowing the plant coordinates', () => {
        const schema = generateLocalBusinessSchema();

        expect(schema['@context']).toBe('https://schema.org');
        expect(schema['@type']).toBe('HomeAndConstructionBusiness');
        expect(schema.hasMap).toBe(BUSINESS_INFO.mapsUrl);
        expect(schema.hasMap).toBe('https://maps.app.goo.gl/u2BujWzBWw62vsibA');

        expect(schema.address).toEqual({
            '@type': 'PostalAddress',
            streetAddress: 'Plaza Micaela, Gómez Morín 9321, local 6',
            addressLocality: 'Ciudad Juárez',
            addressRegion: 'CHIH',
            addressCountry: 'MX',
        });

        expect(schema).not.toHaveProperty('geo');

        expect(schema.areaServed).toEqual({
            '@type': 'City',
            name: 'Ciudad Juárez',
        });
    });
});
