import { catalog } from "@/lib/theater/firestore-store";
import { authenticate } from "@/lib/theater/server-auth";
import { failure } from "@/lib/theater/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await authenticate(request);
    return Response.json(
      { products: await catalog() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
