// scripts/seed-leads.ts
/**
 * DB Seeding Utility for CEJ Landing.
 * Usage: pnpm dlx tsx scripts/seed-leads.ts
 *
 * This script inserts a set of sample leads into the Supabase database
 * for local development and E2E testing validation.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 1. Load Environment Variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Missing Supabase environment variables. Check .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
});

// 2. Define Sample Data
const SAMPLE_LEADS = [
    {
        name: "Juan Perez",
        phone: "6561234567",
        status: "new",
        utm_source: "e2e_seed",
        utm_medium: "cpc",
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
        quote_data: {
            folio: "WEB-20251218-1234",
            customer: { name: "Juan Perez", phone: "6561234567" },
            financials: { total: 15400, subtotal: 13275.86, vat: 2124.14, currency: "MXN" },
            items: [
                { id: "item-1", label: "Concreto f'c 200 - Tiro Directo", volume: 6, service: "direct", subtotal: 13275.86 }
            ],
            breakdownLines: [
                { label: "Subtotal", value: 13275.86, type: "base" },
                { label: "IVA (16%)", value: 2124.14, type: "additive" }
            ],
            metadata: { source: "web_calculator", pricing_version: 1 }
        }
    },
    {
        name: "Maria Rodriguez",
        phone: "6569876543",
        status: "new",
        utm_source: "e2e_seed",
        utm_medium: "social",
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
        quote_data: {
            folio: "WEB-20251218-5678",
            customer: { name: "Maria Rodriguez", phone: "6569876543" },
            financials: { total: 28500, subtotal: 24568.97, vat: 3931.03, currency: "MXN" },
            items: [
                { id: "item-2", label: "Concreto f'c 250 - Bomba", volume: 12, service: "pumped", subtotal: 24568.97 }
            ],
            breakdownLines: [
                { label: "Subtotal", value: 24568.97, type: "base" },
                { label: "IVA (16%)", value: 3931.03, type: "additive" }
            ],
            metadata: { source: "web_calculator", pricing_version: 1 }
        }
    }
];

async function seed() {
    console.log("🌱 Starting DB Seeding...");

    try {
        // 3. Clear existing test data to ensure idempotency
        // We identify test data by utm_source='e2e_seed'
        console.log("🧹 Cleaning up old test leads...");
        await supabase.from("leads").delete().eq("utm_source", "e2e_seed");

        // 4. Insert New Data
        const { data, error } = await supabase
            .from("leads")
            .insert(SAMPLE_LEADS)
            .select("id");

        if (error) {
            throw error;
        }

        console.log(`✅ Successfully seeded ${data?.length} sample leads.`);
        console.log("IDs inserted:", data?.map(d => d.id).join(", "));

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
