import { requirePermission } from "@/lib/auth/requirePermission";
import ImportForm from "@/components/panel/ImportForm";
import PendingData from "@/components/panel/PendingData";
import { loadPendingData } from "@/lib/commercial/queries";
import { isPendingIssue } from "@/lib/commercial/import";
import styles from "../../panel.module.scss";
export default async function ImportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const s = await requirePermission("import");
  const p = await searchParams;
  const page = Math.max(1, Math.trunc(Number(p.page) || 1));
  const { data, count, error } = await s.db
    .from("import_rows")
    .select("*", { count: "exact" })
    .eq("company_id", s.company.id)
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error("read_failed");
  const pending = (await loadPendingData(s)).filter(
    (item) => item.key === "source_totals",
  );
  const { data: stagedRows } = await s.db
    .from("import_rows")
    .select("issues")
    .eq("company_id", s.company.id)
    .eq("status", "staged");
  let stagedWithPending = 0;
  for (const r of stagedRows ?? []) {
    const issues = (r.issues as string[]) || [];
    if (issues.length > 0 && issues.every(isPendingIssue)) {
      stagedWithPending++;
    }
  }
  return (
    <>
      <h1>Importación asistida</h1>
      <p>
        Primero revisa los pedidos existentes. Una fila histórica no se calcula
        con tarifas actuales ni certifica pagos o entregas desconocidos.
      </p>
      <section className={styles.card}>
        <ImportForm />
      </section>
      <h2>Conciliación de staging</h2>
      <p>
        {count ?? 0} filas únicas guardadas · página {page} · {stagedWithPending} filas en staging con datos pendientes listas para promover. No es una
        conciliación certificada del Excel real.
      </p>
      <PendingData items={pending} title="Conciliación pendiente" />
      <ul className={styles.list}>
        {data?.map((row) => {
          const rowIssues = (row.issues as string[]) || [];
          const hasBlocking =
            !row.mapped ||
            rowIssues.some((iss) => !isPendingIssue(iss));
          return (
            <li key={row.id}>
              <h3>
                {row.source_name} · {row.sheet} · fila {row.row_number}
              </h3>
              <p>
                Hoja {row.sheet_state} · fila {row.hidden ? "oculta" : "visible"}{" "}
                · {row.status}
              </p>
              <pre className={styles.pre}>{JSON.stringify(row.raw, null, 2)}</pre>
              <p>Mapeo: {JSON.stringify(row.mapped)}</p>
              <p>Incidencias: {JSON.stringify(row.issues)}</p>
              {row.status === "staged" && (
                <ImportForm
                  row={row}
                  blocked={hasBlocking}
                />
              )}
            </li>
          );
        })}
      </ul>
      <nav aria-label="Páginas de importación">
        {page > 1 && <a href={`?page=${page - 1}`}>Anterior</a>}{" "}
        {page * 20 < (count ?? 0) && (
          <a href={`?page=${page + 1}`}>Siguiente</a>
        )}
      </nav>
    </>
  );
}
