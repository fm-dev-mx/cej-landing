import Link from "next/link";
import { panelSession } from "@/lib/commercial/queries";
import styles from "../panel.module.scss";
export default async function Quotes({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const p = await searchParams;
  const page = Math.max(1, Math.trunc(Number(p.page) || 1));
  const s = await panelSession();
  const { data, count, error } = await s.db
    .from("quotes")
    .select("id,folio,current_revision,customers(display_name)", {
      count: "exact",
    })
    .eq("company_id", s.company.id)
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error("read_failed");
  return (
    <>
      <h1>Cotizaciones guardadas</h1>
      <Link href="/panel/cotizar">Nueva cotización</Link>
      <p>
        {count ?? 0} cotizaciones · página {page}
      </p>
      <ul className={styles.list}>
        {data?.map((q) => (
          <li key={q.id}>
            <Link href={`/panel/cotizaciones/${q.id}`}>
              {q.folio} · revisión {q.current_revision}
            </Link>
            <p>{q.customers?.display_name ?? "Genérica · sin cliente"}</p>
          </li>
        ))}
      </ul>
      <nav aria-label="Páginas de cotizaciones">
        {page > 1 && <Link href={`?page=${page - 1}`}>Anterior</Link>}{" "}
        {page * 20 < (count ?? 0) && (
          <Link href={`?page=${page + 1}`}>Siguiente</Link>
        )}
      </nav>
    </>
  );
}
