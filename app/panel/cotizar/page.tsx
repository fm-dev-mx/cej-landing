import QuoteForm from "@/components/panel/QuoteForm";
import { loadChoices, loadQuoteDocument } from "@/lib/commercial/queries";
import styles from "../panel.module.scss";
import { z } from "zod";
export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ quote?: string; customer?: string; lead?: string }>;
}) {
  const { quote, customer, lead } = await searchParams;
  const customerId = z.string().uuid().safeParse(customer);
  const leadId = z.coerce.number().int().positive().safeParse(lead);
  const doc = quote ? await loadQuoteDocument(quote) : null;
  const { customers, projects, customerCount, projectCount } =
    await loadChoices({
      customerId:
        doc?.customerId ?? (customerId.success ? customerId.data : undefined),
      projectId: doc?.projectId ?? undefined,
    });
  return (
    <>
      <h1>{doc ? `Revisar ${doc.folio}` : "Cotizar"}</h1>
      <p>
        Guarda una cotización genérica o formal, o captura un pedido directo.
      </p>
      <section className={styles.card}>
        <QuoteForm
          customers={customers}
          projects={projects}
          customerCount={customerCount}
          projectCount={projectCount}
          initial={doc?.snapshot.inputs}
          quoteId={doc?.id}
          version={doc?.currentRevision}
          customerId={
            doc?.customerId ??
            (customerId.success ? customerId.data : undefined)
          }
          leadId={doc?.leadId ?? (leadId.success ? leadId.data : undefined)}
          projectId={doc?.projectId ?? undefined}
        />
      </section>
    </>
  );
}
