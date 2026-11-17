import {
  orderStatusLabels,
  paymentStatusLabels,
} from "@/lib/schemas/internal/order-status";
import Link from "next/link";
import { listOrders } from "@/lib/commercial/queries";
import { money } from "@/lib/commercial/quote";
import styles from "../panel.module.scss";
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { orders, total, page } = await listOrders(params);
  const back = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  ).toString();
  const pageHref = (n: number) => {
    const p = new URLSearchParams(back);
    p.set("page", String(n));
    return `/panel/pedidos?${p}`;
  };
  return (
    <>
      <h1>Pedidos</h1>
      <Link href="/panel/cotizar">Crear pedido o cotización</Link>
      <form className={styles.filters}>
        <label>
          Buscar por folio actual/anterior, cliente o teléfono
          <input name="q" defaultValue={params.q} />
        </label>
        <label>
          Estado
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">Todos los pedidos</option>
            <option value="draft">Borrador</option>
            <option value="confirmed">Confirmado</option>
            <option value="scheduled">Programado</option>
            <option value="in_progress">En entrega</option>
            <option value="completed">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </label>
        <button>Buscar</button>
        <Link href="/panel/pedidos">Todos los pedidos</Link>
      </form>
      <p>
        {total} pedidos coinciden · página {page} de{" "}
        {Math.max(1, Math.ceil(total / 20))}
      </p>
      <ul className={styles.list}>
        {orders.map((o) => (
          <li key={o.id} id={`order-${o.id}`}>
            <Link
              href={`/panel/pedidos/${o.id}?return=${encodeURIComponent(`/panel/pedidos?${back}#order-${o.id}`)}`}
            >
              {o.folio}
            </Link>{" "}
            <span className={styles.badge}>
              {orderStatusLabels[o.order_status]}
            </span>
            <p>
              {o.customers?.display_name ?? "Cliente pendiente"} ·{" "}
              {o.customers?.primary_phone_norm ?? "Sin teléfono"}
            </p>
            <p>
              {o.quantity_m3 ?? "Sin volumen"} m³ · pactado{" "}
              {o.total_with_vat === null
                ? "desconocido"
                : money(Number(o.total_with_vat))}{" "}
              · cobro{" "}
              {o.import_source
                ? "desconocido (histórico)"
                : paymentStatusLabels[o.payment_status]}
            </p>
            {o.legacy_folio_raw && <p>Folio anterior: {o.legacy_folio_raw}</p>}
          </li>
        ))}
      </ul>
      {!orders.length && <p>No hay pedidos con estos filtros.</p>}
      <nav aria-label="Páginas">
        {page > 1 && <Link href={pageHref(page - 1)}>Anterior</Link>}{" "}
        {page * 20 < total && <Link href={pageHref(page + 1)}>Siguiente</Link>}
      </nav>
    </>
  );
}
