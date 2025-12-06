import { MetadataRoute } from 'next';
import { env } from '@/config/env';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = env.NEXT_PUBLIC_SITE_URL;

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/_next/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
