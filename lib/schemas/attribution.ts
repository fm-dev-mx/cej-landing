import { z } from "zod";

export const AttributionSchema = z.object({
    utm_source: z.string().optional().default("direct"),
    utm_medium: z.string().optional().default("none"),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
    fbclid: z.string().optional(),
    gclid: z.string().optional(),
});

export type AttributionData = z.infer<typeof AttributionSchema>;
