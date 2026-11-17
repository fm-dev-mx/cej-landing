import Link from "next/link";
import { z } from "zod";
import { notFound } from "next/navigation";
import { panelSession, loadTeam } from "@/lib/commercial/queries";
import CommandForm from "@/components/panel/CommandForm";
import { money } from "@/lib/commercial/quote";
import styles from "../../panel.module.scss";
export default async function CustomerDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const { id } = await params;
  const filter = z
    .string()
    .uuid()
    .safeParse((await searchParams).project);
  const projectId = filter.success ? filter.data : undefined;
  const s = await panelSession();
  const team = await loadTeam();
  let quoteQuery = s.db
    .from("quotes")
    .select("*", { count: "exact" })
    .eq("customer_id", id)
    .eq("company_id", s.company.id);
  let orderQuery = s.db
    .from("orders")
    .select("*", { count: "exact" })
    .eq("customer_id", id)
    .eq("company_id", s.company.id);
  let followupQuery = s.db
    .from("followups")
    .select("*")
    .eq("customer_id", id)
    .eq("company_id", s.company.id);
  if (projectId) {
    quoteQuery = quoteQuery.eq("project_id", projectId);
    orderQuery = orderQuery.eq("project_id", projectId);
    followupQuery = followupQuery.eq("project_id", projectId);
  }
  const [customer, projects, quotes, orders, followups, requests] =
    await Promise.all([
      s.db
        .from("customers")
        .select("*")
        .eq("id", id)
        .eq("company_id", s.company.id)
        .single(),
      s.db
        .from("projects")
        .select("*")
        .eq("customer_id", id)
        .eq("company_id", s.company.id)
        .order("created_at"),
      quoteQuery.order("created_at", { ascending: false }).limit(50),
      orderQuery.order("ordered_at", { ascending: false }).limit(50),
      followupQuery.order("due_at", { ascending: false }).limit(50),
      s.db
        .from("leads")
        .select("id,occurred_at,source_channel,customer_source", {
          count: "exact",
        })
        .eq("customer_id", id)
        .eq("company_id", s.company.id)
        .order("occurred_at", { ascending: false })
        .limit(50),
    ]);
  if (customer.error || !customer.data) notFound();
  if (
    projects.error ||
    quotes.error ||
    orders.error ||
    followups.error ||
    requests.error
  )
    throw new Error("read_failed");
  const projectOptions =
    projects.data?.map((p) => ({ value: p.id, label: p.name })) ?? [];
  return (
    <>
      <Link href="/panel/clientes">Clientes</Link>
      <h1>{customer.data.display_name}</h1>
      <p>{customer.data.primary_phone_norm ?? "Sin teléfono conocido"}</p>
      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Obras</h2>
          <ul>
            {projects.data?.map((p) => (
              <li key={p.id}>
                {p.name} · {p.address} · responsable{" "}
                {team.find((m) => m.value === p.responsible_id)?.label ??
                  "Miembro inactivo"}
              </li>
            ))}
          </ul>
          {s.role !== "viewer" && (
            <CommandForm
              kind="project"
              payload={{ customer_id: id }}
              fields={[
                { name: "name", label: "Nombre de obra", required: true },
                { name: "address", label: "Dirección de obra", required: true },
                {
                  name: "responsible_id",
                  label: "Responsable de obra",
                  type: "select",
                  required: true,
                  value: s.userId,
                  options: team,
                },
              ]}
              label="Guardar obra"
            />
          )}
        </section>
        {s.role !== "viewer" && (
          <section className={styles.card}>
            <h2>Próxima acción</h2>
            <CommandForm
              kind="followup"
              payload={{ customer_id: id }}
              fields={[
                {
                  name: "responsible_id",
                  label: "Responsable de seguimiento",
                  type: "select",
                  required: true,
                  value: s.userId,
                  options: team,
                },
                {
                  name: "project_id",
                  label: "Obra (opcional)",
                  type: "select",
                  options: projectOptions,
                },
                { name: "action", label: "Acción a realizar", required: true },
                {
                  name: "due_at",
                  label: "Recordar (hora de tu dispositivo)",
                  type: "datetime-local",
                  required: true,
                },
              ]}
              label="Guardar seguimiento"
            />
            <h2>Solicitud real del cliente</h2>
            <p>
              Registra únicamente una solicitud que haya ocurrido. Cotizar o
              copiar no genera una solicitud.
            </p>
            <CommandForm
              kind="request"
              payload={{ customer_id: id }}
              fields={[
                {
                  name: "occurred_at",
                  label: "Fecha real de solicitud (hora de tu dispositivo)",
                  type: "datetime-local",
                  required: true,
                },
                {
                  name: "source_channel",
                  label: "Canal real de solicitud",
                  type: "select",
                  options: [
                    { value: "phone_call", label: "Llamada" },
                    { value: "chat", label: "WhatsApp / conversación" },
                    { value: "website", label: "Web" },
                    { value: "physical_store", label: "Presencial" },
                  ],
                },
                { name: "origin", label: "Origen conocido (opcional)" },
              ]}
              label="Registrar solicitud real"
            />
          </section>
        )}
      </div>
      <section className={styles.card}>
        <h2>Solicitudes reales</h2>
        <p>
          {requests.count ?? 0} solicitudes. Se muestran las 50 más recientes.
        </p>
        <ul>
          {requests.data?.map((r) => (
            <li key={r.id}>
              Solicitud {r.id} ·{" "}
              {r.occurred_at
                ? new Date(r.occurred_at).toLocaleString("es-MX", {
                    timeZone: "America/Ciudad_Juarez",
                  })
                : "fecha desconocida"}{" "}
              ·{" "}
              {(
                {
                  website: "Web",
                  phone_call: "Llamada",
                  chat: "Conversación",
                  physical_store: "Presencial",
                  other: "Otro",
                } as Record<string, string>
              )[r.source_channel ?? ""] ?? "canal desconocido"}{" "}
              · {r.customer_source ?? "origen desconocido"}{" "}
              <Link href={`/panel/cotizar?customer=${id}&lead=${r.id}`}>
                Cotizar esta solicitud
              </Link>
            </li>
          ))}
        </ul>
        <h2>Historial comercial</h2>
        <form className={styles.filters}>
          <label>
            Filtrar historial por obra
            <select name="project" defaultValue={projectId ?? ""}>
              <option value="">Todas las obras</option>
              {projectOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <button>Ver historial de obra</button>
        </form>
        <p>
          {quotes.count ?? 0} cotizaciones, {orders.count ?? 0} pedidos. Se
          muestran los 50 más recientes de cada tipo.
        </p>
        <ul>
          {quotes.data?.map((q) => (
            <li key={q.id}>
              <Link href={`/panel/cotizaciones/${q.id}`}>{q.folio}</Link> ·
              revisión {q.current_revision}
            </li>
          ))}
          {orders.data?.map((o) => (
            <li key={o.id}>
              <Link href={`/panel/pedidos/${o.id}`}>{o.folio}</Link> ·{" "}
              {o.total_with_vat === null
                ? "importe desconocido"
                : money(Number(o.total_with_vat))}
            </li>
          ))}
        </ul>
        <h2>Seguimiento y resultados</h2>
        <ul>
          {followups.data?.map((f) => (
            <li key={f.id}>
              {f.action} · {new Date(f.due_at).toLocaleString("es-MX")} ·{" "}
              {f.completed_at ? `completada: ${f.result}` : "pendiente"}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
