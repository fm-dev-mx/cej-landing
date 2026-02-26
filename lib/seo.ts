import { env } from '@/config/env';
import { BUSINESS_INFO, STRENGTHS } from '@/config/business';

export function generateLocalBusinessSchema() {
    const { address, geo, openingHours, email } = BUSINESS_INFO;

    // Create semantic offers from our configuration
    const concreteOffers = STRENGTHS.map(strength => ({
        "@type": "Offer",
        "itemOffered": {
            "@type": "Product",
            "name": `Concreto Premezclado f'c ${strength} kg/cm²`,
            "description": `Concreto estructural de resistencia ${strength}, ideal para losas, firmes y cimentaciones. Disponible en tiro directo o bomba.`,
            "brand": {
                "@type": "Brand",
                "name": env.NEXT_PUBLIC_BRAND_NAME
            },
            "sku": `concrete_fc${strength}`
        },
        "priceCurrency": env.NEXT_PUBLIC_CURRENCY,
        "availability": "https://schema.org/InStock",
        "areaServed": {
            "@type": "City",
            "name": "Ciudad Juárez"
        }
    }));

    // Service offers
    const serviceOffers = [
        {
            "@type": "Offer",
            "itemOffered": {
                "@type": "Service",
                "name": "Servicio de Bombeo de Concreto",
                "description": "Bomba pluma telescópica para colados en altura o difícil acceso.",
            }
        }
    ];

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
        // Enhanced Catalog
        hasOfferCatalog: {
            "@type": "OfferCatalog",
            "name": "Catálogo de Concreto y Servicios",
            "itemListElement": [
                ...concreteOffers,
                ...serviceOffers
            ]
        }
    };
}
