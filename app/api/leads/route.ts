// app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with admin permissions (Service Role)
// We use the non-null assertion (!) because we validate them immediately inside the handler
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create client outside the handler to take advantage of connection reuse in serverless
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

type LeadRequestBody = {
    name: string;
    phone: string;
    quote: Record<string, any>;
};

export async function POST(request: Request) {
    try {
        // 1. Critical Configuration Check
        if (!supabase) {
            console.error('❌ Critical Error: Missing Supabase environment variables.');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const body = (await request.json()) as LeadRequestBody;
        const { name, phone, quote } = body;

        // 2. Input Validation
        if (!name || !phone || !quote) {
            return NextResponse.json(
                { error: 'Missing required fields: name, phone, or quote data.' },
                { status: 400 }
            );
        }

        // 3. Persistence (Supabase)
        // We store the full quote object as JSONB in 'quote_data'
        const { data, error } = await supabase
            .from('leads')
            .insert([
                {
                    name,
                    phone,
                    quote_data: quote,
                    status: 'new'
                }
            ])
            .select();

        if (error) {
            console.error('❌ Error inserting into Supabase:', error);
            throw new Error(error.message);
        }

        // Success Log
        console.log('✅ Lead saved successfully:', data);

        return NextResponse.json({
            success: true,
            message: 'Lead saved successfully'
        });

    } catch (error) {
        console.error('Error processing lead:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
