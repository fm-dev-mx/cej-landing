import Link from "next/link";
import { panelSession } from "@/lib/commercial/queries";
import styles from "../panel.module.scss";
export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; days?: string }>;
}) {
  const p = await searchParams;
  const s = await panelSession();
  const days = [1, 7, 14].includes(Number(p.days)) ? Number(p.days) : 7;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date ?? "")
    ? p.date!
    : new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Ciudad_Juarez",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
  const start = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(start.getTime())) throw new Error("invalid_date");
  const dates = Array.from({ length: days }, (_, i) =>
    new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10),
  );
  const { data: orders, error } = await s.db
    .from("orders")
    .select(
      "id,folio,scheduled_window_start,scheduled_window_end,scheduled_date,quantity_m3,customers!order_customer_company(display_name)",
    )
    .eq("company_id", s.company.id)
    .eq("order_status", "scheduled")
    .gte("scheduled_date", dates[0])
    .lte("scheduled_date", dates.at(-1))
    .order("scheduled_window_start");
  if (error) throw new Error("read_failed");
  const time = (v: string | null) =>
    new Date(v ?? 0).toLocaleTimeString("es-MX", {
      timeZone: "America/Ciudad_Juarez",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <>
      <h1>Agenda de entregas</h1>
      <form className={styles.filters}>
        <label>
          Desde
          <input name="date" type="date" defaultValue={date} required />
        </label>
        <label>
          Vista
          <select name="days" defaultValue={days}>
            <option value="1">Día</option>
            <option value="7">Semana</option>
            <option value="14">Dos semanas</option>
          </select>
        </label>
        <button>Ver agenda</button>
      </form>
      <p>
        Hora de Ciudad Juárez. Las coincidencias son ventanas a revisar; no
        representan disponibilidad de flota.
      </p>
      {dates.map((d) => (
        <section className={styles.card} key={d}>
          <h2>
            {new Date(`${d}T12:00Z`).toLocaleDateString("es-MX", {
              timeZone: "America/Ciudad_Juarez",
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>
          <ul className={styles.list}>
            {(orders ?? [])
              .filter((o) => o.scheduled_date === d)
              .map((o) => (
                <li key={o.id}>
                  <Link href={`/panel/pedidos/${o.id}`}>
                    {o.folio} · {time(o.scheduled_window_start)}–
                    {time(o.scheduled_window_end)}
                  </Link>
                  <p>
                    {o.customers?.display_name} · {o.quantity_m3} m³
                  </p>
                  {(orders ?? []).some(
                    (other) =>
                      other.id !== o.id &&
                      other.scheduled_window_start &&
                      other.scheduled_window_end &&
                      o.scheduled_window_start &&
                      o.scheduled_window_end &&
                      other.scheduled_window_start < o.scheduled_window_end &&
                      other.scheduled_window_end > o.scheduled_window_start,
                  ) && (
                    <p role="status">
                      Ventana coincidente: revisar programación.
                    </p>
                  )}
                </li>
              ))}
          </ul>
          {!(orders ?? []).some((o) => o.scheduled_date === d) && (
            <p>Sin entregas programadas.</p>
          )}
        </section>
      ))}
    </>
  );
}
