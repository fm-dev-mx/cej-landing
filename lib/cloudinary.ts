// lib/cloudinary.ts
import { isProd } from "@/config/env";

/**
 * Transforms a Cloudinary URL to a mock/placeholder URL when not in production
 * to minimize bandwidth and credit consumption.
 *
 * @param url The original Cloudinary URL
 * @param type 'image' | 'video'
 * @returns The transformed URL
 */
export function getCloudinaryUrl(url: string, type: 'image' | 'video' = 'image'): string {
    if (isProd) return url;

    if (type === 'video') {
        // Return a very small local fallback or a static placeholder if video isn't needed
        // Use .png format to avoid Next.js SVG security warnings
        return 'https://placehold.co/1920x1080/021a36/ffffff.png?text=Video+Dev+Placeholder';
    }

    // Replace Cloudinary image with placehold.co
    // Original: https://res.cloudinary.com/dwtk0d2dj/image/upload/v1763673428/maquila_culguq.jpg
    // We can extract basic info if needed, but for now a generic placeholder is safer and 0 cost.

    // We try to extract some descriptive text from the URL if possible
    const parts = url.split('/');
    const filename = parts[parts.length - 1]?.split('.')[0] || 'Image';
    const cleanFilename = filename.replace(/_/g, '+');

    // Use .png format to avoid Next.js SVG security warnings with dangerouslyAllowSVG
    return `https://placehold.co/800x600/021a36/ffffff.png?text=${cleanFilename}`;
}
