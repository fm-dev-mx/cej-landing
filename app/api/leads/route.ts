// app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { cleanQuoteContext } from '@/lib/data-sanitizers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase admin client (service role). No RLS bypass on client, only here.
const supabase: SupabaseClient | null =
    supabaseUrl && supabaseServiceRoleKey
        ? createClient(supabaseUrl, supabaseServiceRoleKey)
        : null;

// Validation Schema
const leadSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Phone invalid"),
    quote: z.object({
        summary: z.any(),
        // Enforce object structure for context to ensure sanitizer safety
        context: z.record(z.string(), z.any()),
    }),

    // Identity & Tracking IDs
    visitor_id: z.string().nullable().optional(),
    session_id: z.string().nullable().optional(),

    // UTMs (optional strings, null if missing)
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().nullable().optional(),
    utm_term: z.string().nullable().optional(),
    utm_content: z.string().nullable().optional(),
    fbclid: z.string().nullable().optional(),
    fb_event_id: z.string().optional(),

    // Legal
    privacy_accepted: z.literal(true, {
        errorMap: () => ({ message: "Privacy must be accepted to process data" })
    }),
});

// Infer the validated type for clean code access
type LeadData = z.infer<typeof leadSchema>;

export async function POST(request: Request) {
    if (!supabase) {
        console.error('❌ Missing Supabase env vars');
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

    // 2. Data Transformation & Cleaning

    // Normalize Quote Data: Avoid stringified JSON inside JSON.
    const cleanQuoteData = {
        summary: data.quote.summary,
        // Recursively clean empty strings from the context (dimensions, etc)
        context: cleanQuoteContext(data.quote.context),
        meta: {
            calculated_at: new Date().toISOString(),
            version: 'v2.0',
            // Persist session_id in meta if no dedicated column exists
            session_id: data.session_id || null
        }
    };

    // Attribution Defaults
    const safeUtmSource = data.utm_source || 'direct';
    const safeUtmMedium = data.utm_medium || 'none';

    try {
        const { data: dbData, error } = await supabase
            .from('leads')
            .insert([
                {
                    name: data.name,
                    phone: data.phone,
                    // Save as actual JSON object, Supabase handles stringifying for JSONB columns
                    quote_data: cleanQuoteData,

                    // Identity
                    visitor_id: data.visitor_id || null,

                    // Attribution
                    utm_source: safeUtmSource,
                    utm_medium: safeUtmMedium,
                    utm_campaign: data.utm_campaign || null,
                    utm_term: data.utm_term || null,
                    utm_content: data.utm_content || null,
                    fbclid: data.fbclid || null,

                    // Legal & Status
                    privacy_accepted: data.privacy_accepted,
                    privacy_accepted_at: new Date().toISOString(),
                    status: 'new',

                    // Tracking
                    fb_event_id: data.fb_event_id || null,
                },
            ])
            .select()
            .single();

        if (error || !dbData) {
            console.error('❌ Supabase Insert Error:', error || 'No data returned.');
            return NextResponse.json({ error: 'Database Error' }, { status: 500 });
        }

        console.log('✅ Lead saved:', { id: dbData.id, source: safeUtmSource });

        return NextResponse.json({ success: true, id: dbData.id }, { status: 200 });
    } catch (error) {
        console.error('❌ Unexpected Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
