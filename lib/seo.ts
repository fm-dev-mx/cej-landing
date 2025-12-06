import { env } from '@/config/env';
import { BUSINESS_INFO } from '@/config/business';

export function generateLocalBusinessSchema() {
    const { address, geo, openingHours, email } = BUSINESS_INFO;

    return {
        '@context': 'https://schema.org',
        '@type': 'HomeAndConstructionBusiness',
        '@id': `${env.NEXT_PUBLIC_SITE_URL}/#org`,
        name: env.NEXT_PUBLIC_BRAND_NAME,
        url: env.NEXT_PUBLIC_SITE_URL,
        logo: `${env.NEXT_PUBLIC_SITE_URL}/logo.svg`,
        image: `${env.NEXT_PUBLIC_SITE_URL}/og-image.jpg`,
        description: 'Suministro de concreto premezclado, servicio de bombeo y asesoría técnica en Ciudad Juárez. Calidad certificada y entregas puntuales.',
        telephone: env.NEXT_PUBLIC_PHONE,
        email: email,
        address: {
            '@type': 'PostalAddress',
            streetAddress: address.street,
            addressLocality: address.city,
            addressRegion: address.region,
            postalCode: address.postalCode,
            addressCountry: address.country,
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: geo.lat,
            longitude: geo.lng,
        },
        openingHoursSpecification: openingHours.map((schedule) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: schedule.dayOfWeek,
            opens: schedule.opens,
            closes: schedule.closes,
        })),
        priceRange: '$$',
        areaServed: {
            '@type': 'City',
            name: address.city,
        },
    };
}
