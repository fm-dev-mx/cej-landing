import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
export { normalizePhone } from "@/lib/phone";

export const quoteInputSchema = z
  .object({
    volume: z.coerce
      .number()
      .positive("Indica un volumen positivo.")
      .max(10000),
    strength: z.enum([
      "100",
      "150",
      "200",
      "210",
      "250",
      "300",
      "150 3/8",
      "200 3/8",
      "250 3/8",
      "mortero 90",
      "MR 42.5",
    ]),
    type: z.enum(["direct", "pumped"]),
    hasFiber: z.boolean().default(false),
    zone: z.enum(["local", "samalayuca"]).default("local"),
    capacity: z.coerce.number().positive().max(100).default(7),
    trucks: z.coerce.number().int().positive().max(10000).optional(),
    truckReason: z.string().trim().max(500).default(""),
    freightRate: z.coerce.number().positive().max(100000).default(1500),
    discount: z.coerce.number().min(0).max(10000000).default(0),
    reason: z.string().trim().max(500).default(""),
    mode: z.enum(["generic", "formal"]).default("generic"),
  })
  .superRefine((v, ctx) => {
    if ((v.discount > 0 || v.freightRate !== 1500) && !v.reason)
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Indica el motivo de la excepción económica.",
      });
  });
export type QuoteInput = z.infer<typeof quoteInputSchema>;
export const profileSchema = z.object({
  name: z.string().trim().min(2),
  tax_id: z.string().trim().min(12).max(13),
  address: z.string().trim().min(10),
  contact: z.string().trim().min(5),
  conditions: z.string().trim().min(10),
  validity_days: z.coerce.number().int().positive().max(365),
});
export type CompanyProfile = z.infer<typeof profileSchema>;
export const companySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  quote_profile: z.unknown(),
  profile_verified: z.boolean(),
  freight_tax: z.enum(["included", "additional"]).nullable(),
  freight_vat_rate: z.number().nullable(),
});
export type Company = z.infer<typeof companySchema>;
export const customerInputSchema = z.object({
  name: z.string().trim().min(2, "Indica el nombre.").max(200),
  phone: z.string().max(30).transform(normalizePhone),
});
export const commandSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("membership"),
    user_id: z.string().uuid(),
    role: z.enum(["owner", "admin", "operator", "viewer"]),
    active: z.boolean(),
    reason: z.string().trim().min(3),
  }),
  z.object({
    kind: z.literal("customer"),
    name: z.string(),
    phone: z.string(),
  }),
  z.object({
    kind: z.literal("project"),
    customer_id: z.string().uuid(),
    name: z.string().trim().min(2),
    address: z.string().trim().min(5),
    responsible_id: z.string().uuid().optional(),
  }),
  z.object({
    kind: z.literal("quote"),
    input: quoteInputSchema,
    id: z.string().uuid().optional(),
    expected_version: z.number().int().positive().optional(),
    customer_id: z.string().uuid().optional(),
    project_id: z.string().uuid().optional(),
    lead_id: z.coerce.number().int().positive().optional(),
  }),
  z.object({
    kind: z.literal("order"),
    revision_id: z.string().uuid().optional(),
    customer_id: z.string().uuid().optional(),
    project_id: z.string().uuid().optional(),
    input: quoteInputSchema.optional(),
    address: z.string().trim().min(5),
  }),
  z.object({
    kind: z.literal("approve"),
    id: z.string().uuid(),
    reason: z.string().trim().min(3),
  }),
  z.object({
    kind: z.literal("confirm"),
    id: z.string().uuid(),
    expected_version: z.number().int().positive(),
    accepted: z.literal(true),
    accepted_at: z.string().datetime({ offset: true }),
    source_channel: z
      .enum(["website", "phone_call", "physical_store", "chat", "other"])
      .nullable(),
    origin: z.string().trim().max(200).nullable(),
  }),
  z.object({
    kind: z.literal("schedule"),
    id: z.string().uuid(),
    expected_version: z.number().int().positive(),
    start: z.string().datetime({ offset: true }),
    end: z.string().datetime({ offset: true }),
    // Required only when an existing window changes; the service enforces that.
    reason: z.string().trim(),
    acknowledge_conflicts: z.boolean(),
  }),
  z.object({
    kind: z.literal("status"),
    id: z.string().uuid(),
    expected_version: z.number().int().positive(),
    status: z.enum(["in_progress", "completed", "cancelled"]),
    reason: z.string().trim().min(3),
  }),
  z.object({
    kind: z.literal("payment"),
    id: z.string().uuid(),
    expected_version: z.number().int().positive(),
    amount: z.coerce.number().positive(),
    kind_payment: z.enum(["anticipo", "abono", "liquidacion"]),
    method: z.enum([
      "efectivo",
      "transferencia",
      "credito",
      "deposito",
      "otro",
    ]),
    paid_at: z.string().datetime({ offset: true }),
    reference: z.string().max(200),
  }),
  z.object({
    kind: z.literal("followup"),
    customer_id: z.string().uuid(),
    project_id: z.string().uuid().optional(),
    responsible_id: z.string().uuid(),
    action: z.string().trim().min(3),
    due_at: z.string().datetime({ offset: true }),
  }),
  z.object({
    kind: z.literal("complete_followup"),
    id: z.string().uuid(),
    expected_version: z.number().int().positive(),
    result: z.string().trim().min(3),
    next_action: z.string().trim(),
    next_due_at: z.string().datetime({ offset: true }).optional(),
  }),
  z.object({
    kind: z.literal("request"),
    customer_id: z.string().uuid(),
    occurred_at: z.string().datetime({ offset: true }),
    source_channel: z
      .enum(["website", "phone_call", "physical_store", "chat", "other"])
      .nullable(),
    origin: z.string().trim().max(200).nullable(),
  }),
  z.object({
    kind: z.literal("configure"),
    profile: profileSchema,
    verified: z.boolean(),
    freight_tax: z.enum(["included", "additional"]).nullable(),
    freight_vat_rate: z.number().min(0).max(1).nullable(),
  }),
]);
