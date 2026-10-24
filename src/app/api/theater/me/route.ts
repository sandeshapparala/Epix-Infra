import { authenticate } from "@/lib/theater/server-auth";
import { failure } from "@/lib/theater/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return Response.json(
      { member: await authenticate(request) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
