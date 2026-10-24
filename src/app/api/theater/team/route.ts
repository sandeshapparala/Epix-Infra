import { authenticate } from "@/lib/theater/server-auth";
import { createMember, listMembers, memberCreate } from "@/lib/theater/team";
import { failure, readBody, sameOrigin } from "@/lib/theater/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await authenticate(request, true);
    return Response.json(
      await listMembers(
        new URL(request.url).searchParams.get("cursor") ?? undefined,
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const actor = await authenticate(request, true);
    return Response.json(
      {
        member: await createMember(
          actor,
          memberCreate.parse(await readBody(request)),
        ),
      },
      { status: 201 },
    );
  } catch (e) {
    return failure(e);
  }
}
