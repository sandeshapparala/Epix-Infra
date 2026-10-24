import { listProjects, saveProject } from "@/lib/theater/firestore-store";
import { authenticate } from "@/lib/theater/server-auth";
import { failure, readBody, sameOrigin } from "@/lib/theater/http";
import { parseProject, projectInput } from "@/lib/theater/validation";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const actor = await authenticate(request),
      p = new URL(request.url).searchParams;
    return Response.json(
      await listProjects(
        actor,
        p.get("cursor") ?? undefined,
        p.get("owner") ?? undefined,
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
    const actor = await authenticate(request);
    const input = projectInput.parse(await readBody(request));
    return Response.json(
      await saveProject(
        actor,
        input.id,
        input.version,
        parseProject(input.state),
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
