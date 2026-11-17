import { loadQuoteDocument } from "@/lib/commercial/queries";
import { quotePdf, quotePng } from "@/lib/commercial/exports";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; revision: string }> },
) {
  const { id, revision } = await params;
  const doc = await loadQuoteDocument(id, revision);
  const png = new URL(request.url).searchParams.get("format") === "png";
  const bytes = png ? await quotePng(doc) : await quotePdf(doc);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": png ? "image/png" : "application/pdf",
      "Content-Disposition": `attachment; filename="${doc.folio}-r${doc.revision}.${png ? "png" : "pdf"}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
