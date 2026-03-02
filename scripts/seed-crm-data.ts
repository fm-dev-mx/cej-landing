// scripts/seed-crm-data.ts
/**
 * DB Seeding Utility for entire CRM Flow.
 * Usage: pnpm dlx tsx scripts/seed-crm-data.ts
 *
 * Populates leads, customers, and orders for testing.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

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

const TEST_SOURCE = "test_seed";
const TEST_CUSTOMER_PREFIX = "[TEST SEED]";

async function seed() {
    console.warn("🌱 Starting CRM DB Seeding...");

    try {
        // 1. Cleanup
        console.warn("🧹 Cleaning up old test data...");
        // Delete orders
        await supabase.from("orders").delete().eq("utm_source", TEST_SOURCE);
        // Delete leads
        await supabase.from("leads").delete().eq("utm_source", TEST_SOURCE);
        // Delete customers (identified by prefix)
        await supabase.from("customers").delete().like("display_name", `${TEST_CUSTOMER_PREFIX}%`);

        // Get a system user to attach orders to
        const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
        const sysUserId = profiles?.[0]?.id || null;

        if (!sysUserId) {
            console.warn("⚠️ No user profile found to attach orders. Some foreign key constraints might fail if 'user_id' is strictly required.");
        }

        // 2. Insert Leads
        console.warn("📥 Inserting test leads...");
        const leadRes = await supabase.from("leads").insert([
            {
                name: "Test Lead One",
                phone: "5551111111",
                status: "new",
                utm_source: TEST_SOURCE,
                privacy_accepted: true,
                quote_data: { total: 100 } // Dummy quote
            },
            {
                name: "Test Lead Two",
                phone: "5552222222",
                status: "qualified",
                utm_source: TEST_SOURCE,
                privacy_accepted: true,
                quote_data: {}
            }
        ]).select("id");

        if (leadRes.error) throw leadRes.error;

        // 3. Insert Customers
        console.warn("📥 Inserting test customers...");
        const customer1Id = uuidv4();
        const customer2Id = uuidv4();

        const customerRes = await supabase.from("customers").insert([
            {
                id: customer1Id,
                display_name: `${TEST_CUSTOMER_PREFIX} Alice Smith`,
                primary_phone_norm: "5553333333",
                identity_status: "verified"
            },
            {
                id: customer2Id,
                display_name: `${TEST_CUSTOMER_PREFIX} Bob Jones`,
                primary_phone_norm: "5554444444",
                identity_status: "verified"
            }
        ]).select("id");

        if (customerRes.error) throw customerRes.error;

        // 4. Insert Orders
        if (sysUserId) {
            console.warn("📥 Inserting test orders...");
            const orderRes = await supabase.from("orders").insert([
                {
                    id: uuidv4(),
                    folio: `TEST-ORD-${Date.now()}-1`,
                    user_id: sysUserId,
                    customer_id: customer1Id,
                    order_status: "pending_review",
                    payment_status: "unpaid",
                    fiscal_status: "none",
                    scheduled_date: new Date().toISOString().split("T")[0],
                    utm_source: TEST_SOURCE,
                    balance_amount: 5000,
                    payments_summary_json: { total: 5000, net_paid: 0, paid_in: 0, paid_out: 0, balance: 5000, last_paid_at: null, recomputed_at: new Date().toISOString() },
                    pricing_snapshot_json: { version: 1, computed_at: new Date().toISOString(), inputs: { volume: 5, concreteType: 'direct', strength: '200' }, breakdown: {} }
                },
                {
                    id: uuidv4(),
                    folio: `TEST-ORD-${Date.now()}-2`,
                    user_id: sysUserId,
                    customer_id: customer2Id,
                    order_status: "confirmed",
                    payment_status: "paid",
                    fiscal_status: "invoiced",
                    scheduled_date: new Date().toISOString().split("T")[0],
                    utm_source: TEST_SOURCE,
                    balance_amount: 0,
                    payments_summary_json: { total: 10000, net_paid: 10000, paid_in: 10000, paid_out: 0, balance: 0, last_paid_at: new Date().toISOString(), recomputed_at: new Date().toISOString() },
                    pricing_snapshot_json: { version: 1, computed_at: new Date().toISOString(), inputs: { volume: 10, concreteType: 'pumped', strength: '250' }, breakdown: {} }
                }
            ]).select("id");

            if (orderRes.error) throw orderRes.error;
        }

        console.warn("✅ Seeding completed successfully.");

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
