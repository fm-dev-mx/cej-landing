import { MetadataRoute } from 'next';
import { env } from '@/config/env';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = env.NEXT_PUBLIC_SITE_URL;
    const lastModified = new Date();

    return [
        {
            url: baseUrl,
            lastModified,
            changeFrequency: 'weekly',
            priority: 1,
        },
        // Future proofing: If you add legal pages effectively as routes later
        // {
        //   url: `${baseUrl}/aviso-de-privacidad`,
        //   lastModified,
        //   changeFrequency: 'yearly',
        //   priority: 0.3,
        // },
    ];
}
