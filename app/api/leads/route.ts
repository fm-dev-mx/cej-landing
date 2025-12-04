// app/api/leads/route.ts
import { NextResponse } from 'next/server';

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
        const body = (await request.json()) as LeadRequestBody;
        const { name, phone, quote } = body;

        // Basic Server-side Validation
        if (!name || !phone || !quote) {
            return NextResponse.json(
                { error: 'Missing required fields: name, phone, or quote data.' },
                { status: 400 }
            );
        }

        // --- DATA PERSISTENCE LAYER ---
        // In a production environment, save to DB or CRM (HubSpot, Salesforce, etc.)
        // For MVP, logging to server console to verify capture.

        console.log('📝 [LEAD CAPTURED]', {
            timestamp: new Date().toISOString(),
            contact: { name, phone },
            quoteSummary: {
                total: quote.total,
                volume: quote.volume,
                product: quote.product
            }
        });

        // Simulate network delay for realism (optional)
        // await new Promise(resolve => setTimeout(resolve, 500));

        return NextResponse.json({ success: true, message: 'Lead saved successfully' });

    } catch (error) {
        console.error('Error processing lead:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
