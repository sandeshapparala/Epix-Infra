import { saveCatalogReview } from "@/lib/theater/firestore-store";
import { authenticate } from "@/lib/theater/server-auth";
import { failure, readBody, sameOrigin } from "@/lib/theater/http";
import { catalogReviewChange } from "@/lib/theater/validation";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const actor = await authenticate(request, true);
    const input = catalogReviewChange.parse(await readBody(request));
    return Response.json({ review: await saveCatalogReview(actor, input) });
  } catch (e) {
    return failure(e);
  }
}
