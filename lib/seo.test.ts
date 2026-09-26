import { describe, it, expect } from 'vitest';
import { generateLocalBusinessSchema } from './seo';
import { BUSINESS_INFO } from '@/config/business';

describe('generateLocalBusinessSchema', () => {
    it('generates schema with updated address, geo coordinates, and hasMap link', () => {
        const schema = generateLocalBusinessSchema();

        expect(schema['@context']).toBe('https://schema.org');
        expect(schema['@type']).toBe('HomeAndConstructionBusiness');
        expect(schema.hasMap).toBe(BUSINESS_INFO.mapsUrl);
        expect(schema.hasMap).toBe('https://maps.app.goo.gl/hUPx87qXPaBWTCt19');

        expect(schema.address).toEqual({
            '@type': 'PostalAddress',
            streetAddress: 'Turbosina 9410, entrada por calle Aeronáutica',
            addressLocality: 'Ciudad Juárez',
            addressRegion: 'CHIH',
            postalCode: '32695',
            addressCountry: 'MX',
        });

        expect(schema.geo).toEqual({
            '@type': 'GeoCoordinates',
            latitude: 31.6230524,
            longitude: -106.4391408,
        });

        expect(schema.areaServed).toEqual({
            '@type': 'City',
            name: 'Ciudad Juárez',
        });
    });
});
