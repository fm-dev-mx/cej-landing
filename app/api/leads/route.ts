// path: app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase admin client (service role). No RLS bypass on client, only here.
const supabase: SupabaseClient | null =
    supabaseUrl && supabaseServiceRoleKey
        ? createClient(supabaseUrl, supabaseServiceRoleKey)
        : null;

type LeadRequestBody = {
    name: string;
    phone: string;
    quote: unknown;

    // Visitor identity
    visitor_id?: string;

    // Attribution
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    fbclid?: string;

    // Legal flags
    privacy_accepted?: boolean;

    // Pixel metadata
    fb_event_id?: string;
};

export async function POST(request: Request) {
    if (!supabase) {
        console.error('❌ Missing Supabase env vars for /api/leads');
        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 },
        );
    }

    let body: LeadRequestBody;
    try {
        body = (await request.json()) as LeadRequestBody;
    } catch {
        console.error('❌ Invalid JSON body in /api/leads');
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
        name,
        phone,
        quote,
        visitor_id,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        fbclid,
        privacy_accepted,
        fb_event_id,
    } = body;

    // Basic required field validation
    if (!name || !phone || typeof quote === 'undefined' || quote === null) {
        return NextResponse.json(
            { error: 'Missing required fields: name, phone, or quote.' },
            { status: 400 },
        );
    }

    // Reasonable defaults for missing UTM values
    const safeUtmSource = utm_source || 'direct';
    const safeUtmMedium = utm_medium || 'none';

    const privacyAccepted = Boolean(privacy_accepted);
    const privacyAcceptedAt = privacyAccepted ? new Date().toISOString() : null;

    try {
        const { data, error } = await supabase
            .from('leads')
            .insert([
                {
                    name,
                    phone,
                    quote_data: quote,

                    visitor_id: visitor_id || null,

                    utm_source: safeUtmSource,
                    utm_medium: safeUtmMedium,
                    utm_campaign: utm_campaign || null,
                    utm_term: utm_term || null,
                    utm_content: utm_content || null,
                    fbclid: fbclid || null,

                    privacy_accepted: privacyAccepted,
                    privacy_accepted_at: privacyAcceptedAt,

                    fb_event_id: fb_event_id || null,

                    status: 'new',
                },
            ])
            // IMPORTANT: keep .select() only so existing Supabase mocks still work
            .select();

        if (error || !data) {
            console.error('❌ Error inserting lead into Supabase:', error);
            return NextResponse.json(
                { error: 'Internal Server Error' },
                { status: 500 },
            );
        }

        // Success log without PII (no phone or full quote payload)
        console.log('✅ Lead saved successfully:', data);

        // Keep the original contract expected by tests: 200 + simple payload
        return NextResponse.json(
            {
                success: true,
                message: 'Lead saved successfully',
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('❌ Unexpected error in /api/leads:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        );
    }
}
