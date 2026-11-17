import Link from "next/link";
import { loadQuoteDocument, panelSession } from "@/lib/commercial/queries";
import { documentLines, documentStatus } from "@/lib/commercial/quote";
import { snapshotPending } from "@/lib/commercial/pending";
import PendingData from "@/components/panel/PendingData";
import QuoteExports from "@/components/panel/QuoteExports";
import CommandForm from "@/components/panel/CommandForm";
import styles from "../../panel.module.scss";
export default async function QuoteDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ revision?: string }>;
}) {
  const { id } = await params;
  const { revision } = await searchParams;
  const doc = await loadQuoteDocument(id, revision);
  const s = await panelSession();
  const { data: revisions, error } = await s.db
    .from("quote_revisions")
    .select("id,revision,created_at")
    .eq("quote_id", id)
    .eq("company_id", s.company.id)
    .order("revision", { ascending: false });
  if (error) throw new Error("read_failed");
  const text = documentLines(doc).join("\n");
  const ready =
    !doc.snapshot.pending_tax &&
    (!doc.snapshot.needs_approval || doc.approved) &&
    (doc.snapshot.mode !== "formal" || doc.snapshot.formal_ready);
  return (
    <>
      <Link href="/panel/cotizaciones">Cotizaciones</Link>
      <h1>
        {doc.folio} · revisión {doc.revision}
      </h1>
      <p className={styles.badge}>{documentStatus(doc)}</p>
      <PendingData
        items={snapshotPending(doc.snapshot)}
        title="Datos pendientes en esta revisión"
      />
      <section className={styles.card}>
        <pre className={styles.pre}>{text}</pre>
        <QuoteExports
          text={text}
          url={`/panel/cotizaciones/${id}/exportar/${doc.revisionId}`}
        />
      </section>
      <nav className={styles.nav} aria-label="Revisiones">
        {revisions?.map((r) => (
          <Link key={r.id} href={`?revision=${r.id}`}>
            Revisión {r.revision}
          </Link>
        ))}
      </nav>
      {s.role !== "viewer" && (
        <>
          <Link href={`/panel/cotizar?quote=${id}`}>Crear nueva revisión</Link>
          {doc.snapshot.needs_approval &&
            !doc.approved &&
            ["owner", "admin"].includes(s.role) && (
              <section className={styles.card}>
                <h2>Autorizar esta revisión exacta</h2>
                <CommandForm
                  kind="approve"
                  payload={{ id: doc.revisionId }}
                  fields={[
                    {
                      name: "reason",
                      label: "Motivo de autorización",
                      required: true,
                    },
                  ]}
                  label="Autorizar revisión"
                />
              </section>
            )}
          {ready && doc.customerId && (
            <section className={styles.card}>
              <h2>Convertir oferta aceptada a pedido</h2>
              <p>
                Se conservarán los importes de esta revisión; la venta se
                confirma en el pedido.
              </p>
              <CommandForm
                kind="order"
                payload={{ revision_id: doc.revisionId }}
                fields={[
                  {
                    name: "address",
                    label: "Dirección de entrega",
                    required: true,
                  },
                ]}
                label="Guardar pedido de esta revisión"
                destination="/panel/pedidos/:id"
              />
            </section>
          )}
        </>
      )}
    </>
  );
}
