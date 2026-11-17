// app/actions/submitLead.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { LeadSchema, type LeadData } from "@/lib/schemas";
import { normalizePhone } from "@/lib/phone";
import { env } from "@/config/env";

// Initialize Supabase client for Server Environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export type SubmitLeadResult = {
  success: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function submitLead(payload: LeadData): Promise<SubmitLeadResult> {
  // 1. Server-side Validation
  const parseResult = LeadSchema.safeParse(payload);

  if (!parseResult.success) {
    return {
      success: false,
      error: "Datos inválidos",
      fieldErrors: parseResult.error.flatten().fieldErrors,
    };
  }

  if (!supabase) {
    console.error("SERVER ERROR: Supabase credentials missing.");
    return {
      success: false,
      error: "Error de configuración del servidor",
    };
  }

  const data = parseResult.data;
  let phoneNorm: string | null;
  try {
    phoneNorm = normalizePhone(data.phone);
    if (!phoneNorm) throw new Error("phone_invalid");
  } catch {
    return {
      success: false,
      error: "Revisa el teléfono.",
      fieldErrors: {
        phone: ["Usa 10 dígitos locales, +52 México o +1 EE. UU."],
      },
    };
  }

  // Prepare JSONB data structure
  const quoteData = {
    ...data.quote,
    meta: {
      calculated_at: new Date().toISOString(),
      version: "v2.2-server-action",
      session_id: data.session_id || null,
    },
  };

  try {
    // Managed server-side domain binding; never accept a tenant ID from a public payload.
    // Until cutover establishes this binding, preserve the legacy lead without assigning a company.
    const hostname = new URL(env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase();
    const binding = await supabase
      .from("company_websites")
      .select("company_id")
      .eq("hostname", hostname)
      .eq("enabled", true)
      .maybeSingle();
    if (binding.error && !["42P01", "PGRST205"].includes(binding.error.code))
      return {
        success: false,
        error: "No se pudo validar la configuración de solicitudes.",
      };
    if (binding.data) {
      const { data: fact, error } = await supabase.rpc(
        "cej_capture_web_request",
        {
          host: hostname,
          p: { ...data, phone_norm: phoneNorm, quote_data: quoteData },
        },
      );
      if (error)
        return {
          success: false,
          error:
            "No se pudo guardar la solicitud. Conserva tus datos e intenta de nuevo.",
        };
      return { success: true, id: String(fact.id) };
    }
    const { data: dbData, error } = await supabase
      .from("leads")
      .insert([
        {
          name: data.name,
          phone: data.phone,
          quote_data: quoteData,
          visitor_id: data.visitor_id || null,
          utm_source: data.utm_source || null,
          utm_medium: data.utm_medium || null,
          utm_campaign: data.utm_campaign || null,
          utm_term: data.utm_term || null,
          utm_content: data.utm_content || null,
          fbclid: data.fbclid || null,
          privacy_accepted: data.privacy_accepted,
          privacy_accepted_at: new Date().toISOString(),
          status: "new",
          fb_event_id: data.fb_event_id || null,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Lead persistence failed:", error.code);
      return { success: false, error: "No se pudo guardar la información." };
    }

    return { success: true, id: String(dbData?.id) };
  } catch {
    console.error("Unexpected lead persistence failure.");
    return { success: false, error: "Ocurrió un error inesperado." };
  }
}
