// app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase: SupabaseClient | null =
    supabaseUrl && supabaseServiceRoleKey
        ? createClient(supabaseUrl, supabaseServiceRoleKey)
        : null;

// Updated Schema to support Cart Payload
const leadSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Phone invalid"),

    // Flexible quote object to handle single quote OR cart
    quote: z.object({
        // Single mode props (optional now)
        summary: z.any().optional(),
        context: z.any().optional(),

        // Cart mode props
        items: z.array(z.any()).optional(),
        total: z.number().optional(),
    }),

    visitor_id: z.string().nullable().optional(),
    session_id: z.string().nullable().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().nullable().optional(),
    utm_term: z.string().nullable().optional(),
    utm_content: z.string().nullable().optional(),
    fbclid: z.string().nullable().optional(),
    fb_event_id: z.string().optional(),
    privacy_accepted: z.literal(true),
});

// Infer the validated type for clean code access
type LeadData = z.infer<typeof leadSchema>;

export async function POST(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    let rawBody;
    try {
        rawBody = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 1. Validate Input
    const parseResult = leadSchema.safeParse(rawBody);
    if (!parseResult.success) {
        return NextResponse.json(
            { error: 'Validation Error', details: parseResult.error.flatten() },
            { status: 400 }
        );
    }

    const data: LeadData = parseResult.data;

    // Prepare JSONB data
    const quoteData = {
        ...data.quote, // Spread items or summary
        meta: {
            calculated_at: new Date().toISOString(),
            version: 'v2.1', // Bumped version for Cart support
            session_id: data.session_id || null
        }
    };

    try {
        const { data: dbData, error } = await supabase
            .from('leads')
            .insert([
                {
                    name: data.name,
                    phone: data.phone,
                    quote_data: quoteData,
                    visitor_id: data.visitor_id || null,
                    utm_source: data.utm_source || 'direct',
                    utm_medium: data.utm_medium || 'none',
                    utm_campaign: data.utm_campaign || null,
                    utm_term: data.utm_term || null,
                    utm_content: data.utm_content || null,
                    fbclid: data.fbclid || null,
                    privacy_accepted: data.privacy_accepted,
                    privacy_accepted_at: new Date().toISOString(),
                    status: 'new',
                    fb_event_id: data.fb_event_id || null,
                },
            ])
            .select()
            .single();

        if (error || !dbData) {
            console.error('Supabase Error:', error);
            return NextResponse.json({ error: 'Database Error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: dbData.id }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
