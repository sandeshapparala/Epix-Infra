import { listQuotes, saveQuote } from "@/lib/theater/firestore-store";
import { authenticate } from "@/lib/theater/server-auth";
import { failure, readBody, sameOrigin } from "@/lib/theater/http";
import { parseProject, quoteInput } from "@/lib/theater/validation";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const actor = await authenticate(request),
      p = new URL(request.url).searchParams;
    return Response.json(
      await listQuotes(actor, undefined, p.get("cursor") ?? undefined),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const actor = await authenticate(request);
    const input = quoteInput.parse(await readBody(request));
    return Response.json(
      await saveQuote(actor, input, parseProject(input.state)),
    );
  } catch (e) {
    return failure(e);
  }
}
