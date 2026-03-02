import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSlots() {
    const slots = [
        { slot_code: 'M1', label: 'Mañana', start_time: '07:00:00', end_time: '10:00:00' },
        { slot_code: 'MD', label: 'Mediodía', start_time: '10:00:00', end_time: '13:00:00' },
        { slot_code: 'T1', label: 'Tarde', start_time: '13:00:00', end_time: '17:00:00' },
        { slot_code: 'legacy_unknown_slot', label: 'Horario Legado', start_time: '00:00:00', end_time: '23:59:59' }
    ];

    console.log("Seeding service slots...");
    const { error } = await supabase
        .from('service_slots')
        .upsert(slots, { onConflict: 'slot_code' });

    if (error) {
        console.error("Error seeding slots:", error);
    } else {
        console.log("Service slots seeded successfully.");
    }
}

seedSlots();
