"use server";
import type { Json } from "@/types/database";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/requirePermission";
import { createAdminClient } from "@/lib/supabase/server";
import { inspectWorkbook } from "@/lib/commercial/import";
const mappingSchema = z.object({
  headerRow: z.coerce.number().int().positive().max(200),
  reference: z.string().regex(/^[A-Z]{1,2}$/),
  customer: z.string().regex(/^[A-Z]{1,2}$/),
  phone: z.string().optional(),
  volume: z.string().optional(),
  total: z.string().optional(),
  orderedAt: z.string().optional(),
  address: z.string().optional(),
});
export async function stageWorkbook(form: FormData) {
  const s = await requirePermission("import");
  const file = form.get("file");
  if (!(file instanceof File) || !file.name.endsWith(".xlsx"))
    return { ok: false, message: "Selecciona el archivo XLSX correcto." };
  if (file.size > 10 * 1024 * 1024)
    return { ok: false, message: "El límite de revisión es 10 MB." };
  const parsed = mappingSchema.safeParse(
    Object.fromEntries(
      [
        "headerRow",
        "reference",
        "customer",
        "phone",
        "volume",
        "total",
        "orderedAt",
        "address",
      ].map((k) => [k, String(form.get(k) ?? "")]),
    ),
  );
  try {
    const result = await inspectWorkbook(
      new Uint8Array(await file.arrayBuffer()),
      parsed.success ? parsed.data : undefined,
    );
    if (result.rows.length > 5000)
      return {
        ok: false,
        message:
          "El lote supera 5,000 filas; prepara lotes revisables antes de cargar.",
      };
    const { error } = await createAdminClient().rpc("cej_command", {
      c: s.company.id,
      actor: s.userId,
      kind: "stage",
      p: JSON.parse(
        JSON.stringify({
          source_name: file.name,
          file_hash: result.file_hash,
          rows: result.rows,
        }),
      ) as Json,
    });
    if (error) throw new Error("stage_failed");
    return {
      ok: true,
      message: `Vista previa guardada: ${result.sheets.map((x) => `${x.name} (${x.state}, ${x.rowCount} filas)`).join("; ")}. ${result.rows.length} filas examinadas. Repetir/reordenar el mismo contenido no duplica las filas. No se importaron pedidos.`,
    };
  } catch {
    return {
      ok: false,
      message:
        "No se pudo revisar el archivo. Comprueba formato, límites y permisos; no se importaron pedidos.",
    };
  }
}
export async function promoteImport(id: string, expectedHash: string) {
  const s = await requirePermission("import");
  const { data, error } = await createAdminClient().rpc("cej_promote_import", {
    c: s.company.id,
    actor: s.userId,
    row_id: id,
    expected_hash: expectedHash,
  });
  return error
    ? {
        ok: false,
        message:
          error.message === "import_conflict"
            ? "Ya existe esa referencia. La fuente antigua no reemplazó el pedido; concilia ambos registros."
            : "No se promovió la fila. Revisa mapeo, incidencias, duplicados y permisos.",
      }
    : {
        ok: true,
        message: `Pedido histórico guardado: ${(data as { folio: string }).folio}. No se inventaron pagos, entrega ni venta confirmada.`,
      };
}
