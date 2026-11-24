import { orderStatusLabels } from "@/lib/schemas/internal/order-status";
import Link from "next/link";
import { notFound } from "next/navigation";
import { panelSession } from "@/lib/commercial/queries";
import { money, orderAmountLines } from "@/lib/commercial/quote";
import CommandForm from "@/components/panel/CommandForm";
import styles from "../../panel.module.scss";
const when = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", { timeZone: "America/Ciudad_Juarez" });
const windowText = (start: string, end: string) =>
  `${when(start)} a ${when(end)}`;
/** "de <ventana anterior> a <ventana nueva>" when a history row changed the window. */
function windowChange(h: {
  from_window_start: string | null;
  from_window_end: string | null;
  to_window_start: string | null;
  to_window_end: string | null;
}) {
  if (!h.to_window_start || !h.to_window_end) return "";
  const changed =
    h.from_window_start !== h.to_window_start ||
    h.from_window_end !== h.to_window_end;
  if (!changed) return "";
  const next = windowText(h.to_window_start, h.to_window_end);
  return h.from_window_start && h.from_window_end
    ? ` · ventana anterior: de ${windowText(h.from_window_start, h.from_window_end)} · ventana nueva: de ${next}`
    : ` · ventana: de ${next}`;
}
export default async function OrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const s = await panelSession();
  const { data: o, error } = await s.db
    .from("orders")
    .select("*,customers!order_customer_company(display_name),projects(name)")
    .eq("id", id)
    .eq("company_id", s.company.id)
    .single();
  if (error || !o) notFound();
  const [payments, history, sale] = await Promise.all([
    s.db
      .from("order_payments")
      .select("*")
      .eq("order_id", id)
      .eq("company_id", s.company.id)
      .order("paid_at"),
    s.db
      .from("order_status_history")
      .select("*")
      .eq("order_id", id)
      .eq("company_id", s.company.id)
      .order("changed_at"),
    s.db
      .from("sale_facts")
      .select("*")
      .eq("order_id", id)
      .eq("company_id", s.company.id)
      .maybeSingle(),
  ]);
  if (payments.error || history.error || sale.error)
    throw new Error("read_failed");
  const back = search.return?.startsWith("/panel/pedidos?")
    ? search.return
    : "/panel/pedidos";
  const payload = { id, expected_version: o.version };
  return (
    <>
      <Link href={back}>Volver a los pedidos y filtros</Link>
      <h1>{o.folio}</h1>
      <section className={styles.card}>
        <p>
          Cliente: {o.customers?.display_name ?? "Pendiente"} · obra:{" "}
          {o.projects?.name ?? "Sin obra"}
        </p>
        <p>Dirección: {o.delivery_address_text}</p>
        {orderAmountLines(o).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p>
          Venta:{" "}
          {sale.data
            ? `confirmada ${new Date(sale.data.occurred_at).toLocaleString("es-MX", { timeZone: "America/Ciudad_Juarez" })}`
            : "sin confirmar"}{" "}
          · cobrado registrado:{" "}
          {money(
            (payments.data ?? [])
              .filter((p) => !p.voided_at)
              .reduce(
                (a, p) =>
                  a + (p.direction === "in" ? 1 : -1) * Number(p.amount_mxn),
                0,
              ),
          )}{" "}
          {o.import_source
            ? " (histórico: pagos anteriores y saldo desconocidos)"
            : ""}{" "}
          · entrega:{" "}
          {o.order_status === "completed" ? "completada" : "pendiente"}
        </p>
        {o.quote_revision_id && (
          <p>
            Revisión aceptada: {o.quote_revision_id}. El importe se conserva sin
            recalcular.
          </p>
        )}
        {o.scheduled_window_start && (
          <p>
            Entrega:{" "}
            {new Date(o.scheduled_window_start).toLocaleString("es-MX", {
              timeZone: "America/Ciudad_Juarez",
            })}{" "}
            a{" "}
            {new Date(o.scheduled_window_end ?? 0).toLocaleString("es-MX", {
              timeZone: "America/Ciudad_Juarez",
            })}{" "}
            · hora de Ciudad Juárez
          </p>
        )}
      </section>
      {s.role !== "viewer" && (
        <div className={styles.grid}>
          {o.order_status === "draft" && !o.import_source && (
            <section className={styles.card}>
              <h2>Confirmar venta</h2>
              <p>
                No requiere anticipo. Confirma únicamente cuando el cliente
                aceptó y el equipo confirmó el pedido.
              </p>
              <CommandForm
                kind="confirm"
                payload={payload}
                fields={[
                  {
                    name: "accepted",
                    label:
                      "El cliente aceptó esta oferta y el equipo confirma el pedido",
                    type: "checkbox",
                    required: true,
                  },
                  {
                    name: "accepted_at",
                    label: "Fecha de aceptación (hora de tu dispositivo)",
                    type: "datetime-local",
                    required: true,
                  },
                  {
                    name: "source_channel",
                    label: "Canal real del cliente",
                    type: "select",
                    options: [
                      { value: "phone_call", label: "Llamada" },
                      { value: "chat", label: "Conversación / WhatsApp" },
                      { value: "website", label: "Sitio web" },
                      { value: "physical_store", label: "Presencial" },
                      { value: "other", label: "Otro confirmado" },
                    ],
                  },
                  {
                    name: "origin",
                    label: "Origen conocido del cliente (opcional)",
                  },
                ]}
                label="Confirmar venta"
              />
            </section>
          )}
          {["confirmed", "scheduled"].includes(o.order_status) && (
            <section className={styles.card}>
              <h2>Programar o reprogramar</h2>
              <CommandForm
                kind="schedule"
                payload={payload}
                fields={[
                  {
                    name: "start",
                    label: "Inicio (hora de tu dispositivo)",
                    type: "datetime-local",
                    required: true,
                    isoValue: o.scheduled_window_start,
                  },
                  {
                    name: "end",
                    label: "Fin (hora de tu dispositivo)",
                    type: "datetime-local",
                    required: true,
                    isoValue: o.scheduled_window_end,
                  },
                  {
                    name: "reason",
                    label: o.scheduled_window_start
                      ? "Motivo del cambio de ventana"
                      : "Motivo de programación (opcional)",
                    required: Boolean(o.scheduled_window_start),
                  },
                  {
                    name: "acknowledge_conflicts",
                    label:
                      "Revisé los pedidos coincidentes y confirmo el cruce",
                    type: "checkbox",
                    showOnConflict: true,
                  },
                ]}
                label="Guardar programación"
              />
            </section>
          )}
          {o.confirmed_at && (
            <section className={styles.card}>
              <h2>Registrar cobro real</h2>
              <CommandForm
                kind="payment"
                payload={payload}
                fields={[
                  {
                    name: "amount",
                    label: "Importe recibido (MXN)",
                    type: "number",
                    min: 0.01,
                    step: "0.01",
                    required: true,
                  },
                  {
                    name: "kind_payment",
                    label: "Concepto",
                    type: "select",
                    required: true,
                    options: [
                      { value: "anticipo", label: "Anticipo" },
                      { value: "abono", label: "Abono" },
                      { value: "liquidacion", label: "Liquidación" },
                    ],
                  },
                  {
                    name: "method",
                    label: "Medio",
                    type: "select",
                    required: true,
                    options: [
                      { value: "efectivo", label: "Efectivo" },
                      { value: "transferencia", label: "Transferencia" },
                      { value: "deposito", label: "Depósito" },
                      { value: "otro", label: "Otro" },
                    ],
                  },
                  {
                    name: "paid_at",
                    label: "Fecha real (hora de tu dispositivo)",
                    type: "datetime-local",
                    required: true,
                  },
                  { name: "reference", label: "Referencia (opcional)" },
                ]}
                label="Registrar cobro"
              />
            </section>
          )}
          {!["completed", "cancelled"].includes(o.order_status) && (
            <section className={styles.card}>
              <h2>Estado de entrega</h2>
              <CommandForm
                kind="status"
                payload={payload}
                fields={[
                  {
                    name: "status",
                    label: "Nuevo estado",
                    type: "select",
                    required: true,
                    options: [
                      ...(o.order_status === "scheduled"
                        ? [{ value: "in_progress", label: "En entrega" }]
                        : []),
                      ...(["scheduled", "in_progress"].includes(o.order_status)
                        ? [{ value: "completed", label: "Entregado" }]
                        : []),
                      { value: "cancelled", label: "Cancelado" },
                    ],
                  },
                  {
                    name: "reason",
                    label: "Resultado o motivo",
                    required: true,
                  },
                ]}
                label="Guardar estado"
              />
            </section>
          )}
        </div>
      )}
      <section className={styles.card}>
        <h2>Historial</h2>
        <ul>
          {history.data?.map((h) => (
            <li key={h.id}>
              {when(h.changed_at)} ·{" "}
              {h.from_status ? orderStatusLabels[h.from_status] : "Inicio"} →{" "}
              {orderStatusLabels[h.to_status]}
              {windowChange(h)} · {h.reason}
            </li>
          ))}
        </ul>
        <h2>Cobros registrados</h2>
        <ul>
          {payments.data?.map((p) => (
            <li key={p.id}>
              {p.kind} · {money(Number(p.amount_mxn))} · {p.method} ·{" "}
              {p.voided_at ? "anulado" : "registrado"}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
