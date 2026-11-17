"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { executeCommand } from "@/lib/commercial/service";
import { loadChoices } from "@/lib/commercial/queries";

export async function lookupQuoteChoices(raw: unknown) {
  const input = z
    .object({
      customerTerm: z.string().max(100).optional(),
      projectTerm: z.string().max(100).optional(),
      customerId: z.string().uuid().optional(),
      projectId: z.string().uuid().optional(),
    })
    .parse(raw);
  const { customers, projects, customerCount, projectCount } =
    await loadChoices(input);
  return { customers, projects, customerCount, projectCount };
}

export interface ActionResult {
  ok: boolean;
  message: string;
  fields?: Record<string, string>;
  id?: string;
  folio?: string;
  revision_id?: string;
}
const errors: Record<string, string> = {
  permission_denied: "Tu rol no permite esta acción.",
  version_conflict:
    "Otra persona modificó este registro. Actualiza la ficha antes de continuar.",
  schedule_overlap:
    "La ventana coincide con otro pedido. Revisa la agenda y confirma el cruce si corresponde.",
  truck_reason_required:
    "Indica por qué cambiaste la cantidad sugerida de camiones.",
  offer_not_authorized:
    "La oferta necesita resolver sus pendientes y autorizaciones antes de crear el pedido.",
  formal_profile_pending:
    "Falta validar los datos y condiciones de la empresa.",
  customer_required: "Selecciona un cliente para continuar.",
  next_due_required: "Indica la fecha de la siguiente acción.",
  phone_invalid: "Usa 10 dígitos locales, +52 para México o +1 para EE. UU.",
  price_unavailable:
    "No hay una tarifa para esa combinación de concreto y entrega.",
  invalid_transition: "Ese cambio de estado no está permitido.",
  confirm_before_scheduling: "Confirma la venta antes de programar.",
  invalid_window: "La fecha final debe ser posterior al inicio.",
  confirmation_requirements:
    "Confirma la aceptación del cliente y revisa los datos del pedido.",
  revision_not_approvable:
    "Esta revisión no puede autorizarse; revisa los impuestos pendientes.",
  stale_revision: "Hay una revisión posterior. Abre la cotización actual.",
  future_request: "La solicitud no puede tener una fecha futura.",
  offer_expired:
    "La oferta venció. Guarda una nueva revisión y valida sus condiciones.",
  future_acceptance: "La aceptación no puede tener una fecha futura.",
  not_found: "El registro no está disponible en esta empresa.",
  request_customer_mismatch:
    "La solicitud debe pertenecer al cliente seleccionado.",
};
export async function submitCommand(payload: unknown): Promise<ActionResult> {
  try {
    const result = await executeCommand(payload);
    revalidatePath("/panel", "layout");
    return {
      ok: true,
      message: result.folio
        ? `Guardado: ${result.folio}`
        : "Los datos se guardaron.",
      ...result,
    };
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        ok: false,
        message: "Revisa los campos indicados.",
        fields: Object.fromEntries(
          error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      };
    const key = error instanceof Error ? error.message : "";
    return {
      ok: false,
      message:
        errors[key] ??
        (key.includes("duplicate key")
          ? "Ya existe un registro con ese teléfono, referencia o revisión. Abre el registro existente."
          : key.includes("foreign key")
            ? "El cliente, obra o responsable no pertenece a esta empresa."
            : "No se pudo guardar. Conservamos tus datos; revisa e intenta de nuevo."),
    };
  }
}
export async function login(form: FormData) {
  const { error } = await (
    await createClient()
  ).auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  if (error) redirect("/login?error=1");
  redirect("/panel");
}
export async function logout() {
  await (await createClient()).auth.signOut();
  redirect("/login");
}
export async function switchCompany(form: FormData) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const id = String(form.get("company_id"));
  const { data } = await db
    .from("company_memberships")
    .select("company_id")
    .eq("company_id", id)
    .eq("user_id", user.id)
    .eq("active", true)
    .single();
  if (!data) throw new Error("permission_denied");
  (await cookies()).set("cej-company", id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  revalidatePath("/panel", "layout");
  redirect("/panel");
}
