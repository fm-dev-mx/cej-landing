// app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with admin permissions (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type LeadRequestBody = {
    name: string;
    phone: string;
    quote: {
        total: number;
        volume: number;
        product: string;
    };
};

export async function POST(request: Request) {
    try {
        // Check critical configuration
        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Critical Error: Missing Supabase environment variables.');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const body = (await request.json()) as LeadRequestBody;
        const { name, phone, quote } = body;

        // Basic Server-side Validation
        if (!name || !phone || !quote) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: name, phone o quote.' },
                { status: 400 }
            );
        }

        // --- REAL PERSISTENCE (Supabase) ---
        const { data, error } = await supabase
            .from('leads')
            .insert([
                {
                    name,
                    phone,
                    quote_data: quote, // Save the full JSON object
                    status: 'new'
                }
            ])
            .select();

        if (error) {
            console.error('❌ Error inserting into Supabase:', error);
            throw new Error(error.message);
        }

        console.log('✅ Lead saved successfully:', data);
        return NextResponse.json({ success: true, message: 'Lead saved successfully' });

    } catch (error) {
        console.error('Error processing lead:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
