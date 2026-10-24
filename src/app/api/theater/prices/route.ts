import { updatePrices } from "@/lib/theater/firestore-store";
import { authenticate } from "@/lib/theater/server-auth";
import { failure, readBody, sameOrigin } from "@/lib/theater/http";
import { priceChanges } from "@/lib/theater/validation";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const actor = await authenticate(request, true);
    const input = priceChanges.parse(await readBody(request));
    return Response.json({
      updated: await updatePrices(
        actor,
        input.changes.map((c) => ({
          ...c,
          price: { ...c.price, revision: c.expectedRevision },
        })),
      ),
    });
  } catch (e) {
    return failure(e);
  }
}
