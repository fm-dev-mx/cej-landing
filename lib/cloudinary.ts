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
    if (!url) return "";

    if (isProd) return url;

    // Keep the same Cloudinary origin in non-prod to avoid placeholder-domain leakage.
    if (type === "video") {
        return url.replace("/video/upload/", "/video/upload/f_auto,q_auto:eco/");
    }
    return url.replace("/image/upload/", "/image/upload/f_auto,q_auto:eco/");
}
