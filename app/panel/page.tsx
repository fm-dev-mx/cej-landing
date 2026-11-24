import Link from "next/link";
import {
  panelSession,
  loadTeam,
  loadPendingData,
} from "@/lib/commercial/queries";
import PendingData from "@/components/panel/PendingData";
import { money } from "@/lib/commercial/quote";
import CommandForm from "@/components/panel/CommandForm";
import styles from "./panel.module.scss";
export default async function PanelHome({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const params = await searchParams;
  const view = ["today", "overdue", "upcoming"].includes(params.view ?? "")
    ? params.view!
    : "today";
  const page = Math.max(
    1,
    Math.min(100000, Math.trunc(Number(params.page) || 1)),
  );
  const s = await panelSession();
  const team = await loadTeam();
  const {
    data: items,
    count,
    error,
  } = await s.db
    .from("followup_queue")
    .select("*", { count: "exact" })
    .eq("company_id", s.company.id)
    .eq("due_bucket", view)
    .order("due_at")
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  const { data: summary, error: summaryError } = await s.db.rpc("cej_summary", {
    c: s.company.id,
  });
  if (error || summaryError) throw new Error("read_failed");
  const { count: ordersWithoutTotal, error: withoutTotalError } = await s.db
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("company_id", s.company.id)
    .neq("order_status", "cancelled")
    .is("total_with_vat", null);
  if (withoutTotalError) throw new Error("read_failed");
  const totals = summary as {
    requests: number;
    sales: number;
    sold: number;
    collected: number;
    delivered: number;
    pending_events: number;
  };
  const filtered = items ?? [];
  const pending = await loadPendingData(s);
  return (
    <>
      <h1>Seguimiento comercial</h1>
      <PendingData items={pending} />
      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Hechos registrados</h2>
          <p>
            {totals.requests} solicitudes reales · {totals.sales} ventas
            confirmadas
          </p>
          <p>
            Vendido: {money(totals.sold)} · cobrado: {money(totals.collected)} ·
            entregados: {totals.delivered}
            {(ordersWithoutTotal ?? 0) > 0 && (
              <> · {ordersWithoutTotal} pedidos sin total (no suman ni se estiman)</>
            )}
          </p>
          <p>
            {totals.pending_events} intenciones de marketing pendientes.
            Registro local no significa envío, aceptación ni atribución.
          </p>
        </section>
        <section className={styles.card}>
          <h2>Continuar el trabajo</h2>
          <p>
            <Link href="/panel/cotizar">Nueva cotización o pedido directo</Link>
          </p>
          <p>
            <Link href="/panel/pedidos">Todos los pedidos</Link>
          </p>
          <p>
            <Link href="/panel/cotizaciones">Cotizaciones guardadas</Link>
          </p>
        </section>
      </div>
      <h2>Recordatorios internos</h2>
      <nav className={styles.nav} aria-label="Filtrar recordatorios">
        <Link href="?view=today">Hoy</Link>
        <Link href="?view=overdue">Vencidas</Link>
        <Link href="?view=upcoming">Próximas</Link>
      </nav>
      <p>
        {count ?? 0} pendientes en esta vista. Se actualizan al abrir o
        refrescar el panel; no envían notificaciones fuera de sesión. Página{" "}
        {page}.
      </p>
      <nav aria-label="Páginas de seguimiento">
        {page > 1 && (
          <Link href={`?view=${view}&page=${page - 1}`}>Anterior</Link>
        )}{" "}
        {page * 20 < (count ?? 0) && (
          <Link href={`?view=${view}&page=${page + 1}`}>Siguiente</Link>
        )}
      </nav>
      <ul className={styles.list}>
        {filtered.map((f) => (
          <li key={f.id}>
            <h3>{f.action}</h3>
            <p>
              <Link href={`/panel/clientes/${f.customer_id}`}>
                {f.customer_name}
              </Link>{" "}
              · {f.project_name ?? "Sin obra"} ·{" "}
              {new Date(f.due_at!).toLocaleString("es-MX", {
                timeZone: "America/Ciudad_Juarez",
              })}{" "}
              (Juárez)
            </p>
            <p>
              Responsable:{" "}
              {f.responsible_id === s.userId
                ? "Tú"
                : (team.find((m) => m.value === f.responsible_id)?.label ??
                  "Miembro inactivo")}
            </p>
            {s.role !== "viewer" && (
              <CommandForm
                kind="complete_followup"
                payload={{ id: f.id!, expected_version: f.version! }}
                fields={[
                  { name: "result", label: "Resultado", required: true },
                  { name: "next_action", label: "Siguiente acción (opcional)" },
                  {
                    name: "next_due_at",
                    label: "Siguiente recordatorio (hora de tu dispositivo)",
                    type: "datetime-local",
                  },
                ]}
                label="Completar y guardar siguiente"
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
