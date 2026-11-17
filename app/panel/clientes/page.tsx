import Link from "next/link";
import { panelSession } from "@/lib/commercial/queries";
import styles from "../panel.module.scss";
export default async function Customers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const s = await panelSession();
  const page = Math.max(1, Math.trunc(Number(params.page) || 1));
  const q = (params.q ?? "").replace(/[^\p{L}\p{N}\s+\-]/gu, "").slice(0, 100);
  let query = s.db
    .from("customers")
    .select("*", { count: "exact" })
    .eq("company_id", s.company.id)
    .order("display_name")
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  if (q)
    query = query.or(
      `display_name.ilike.%${q}%,primary_phone_norm.ilike.%${q}%`,
    );
  const { data, count, error } = await query;
  if (error) throw new Error("read_failed");
  return (
    <>
      <h1>Clientes</h1>
      <Link href="/panel/clientes/nuevo">Nuevo cliente</Link>
      <form className={styles.filters}>
        <label>
          Nombre o teléfono
          <input name="q" defaultValue={q} />
        </label>
        <button>Buscar</button>
      </form>
      <p>
        {count ?? 0} clientes · página {page}
      </p>
      <ul className={styles.list}>
        {data?.map((c) => (
          <li key={c.id}>
            <Link href={`/panel/clientes/${c.id}`}>{c.display_name}</Link>
            <p>{c.primary_phone_norm ?? "Sin teléfono conocido"}</p>
          </li>
        ))}
      </ul>
      <nav aria-label="Páginas de clientes">
        {page > 1 && (
          <Link href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}>
            Anterior
          </Link>
        )}{" "}
        {page * 20 < (count ?? 0) && (
          <Link href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}>
            Siguiente
          </Link>
        )}
      </nav>
    </>
  );
}
