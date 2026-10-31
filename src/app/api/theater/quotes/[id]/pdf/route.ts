import { getQuote } from "@/lib/theater/firestore-store";
import { authenticate } from "@/lib/theater/server-auth";
import { loadPreview } from "@/lib/theater/media";
import { readPrivateFile, writePrivateFile } from "@/lib/theater/private-files";
import { quotationPdf, QUOTATION_TEMPLATE_VERSION } from "@/lib/theater/pdf";
import { failure } from "@/lib/theater/http";
import { z } from "zod";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authenticate(request),
      id = z
        .string()
        .uuid()
        .parse((await context.params).id),
      quote = await getQuote(actor, id);
    const path = `theater-private/quotes/${quote.ownerUid}/${id}.${QUOTATION_TEMPLATE_VERSION}.pdf`;
    const priorTemplates =
      (quote.templateVersion ?? 1) < 3
        ? ["v2-illustrated", "v3-item-discounts-inclusive"]
        : quote.templateVersion === 3
          ? ["v3-item-discounts-inclusive"]
          : [];
    let cached = null;
    for (const template of [...priorTemplates, QUOTATION_TEMPLATE_VERSION]) {
      cached = await readPrivateFile(
        `theater-private/quotes/${quote.ownerUid}/${id}.${template}.pdf`,
      );
      if (cached) break;
    }
    let bytes: Uint8Array;
    if (cached) bytes = cached.bytes;
    else {
      if (quote.previewPath)
        quote.state.preview = await loadPreview(quote.previewPath).catch(
          () => undefined,
        );
      bytes = await quotationPdf(quote);
      await writePrivateFile(path, Buffer.from(bytes), "application/pdf");
    }
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quote.number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
