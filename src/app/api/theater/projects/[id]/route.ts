import { getProject, listQuotes } from "@/lib/theater/firestore-store";
import { authenticate } from "@/lib/theater/server-auth";
import { failure } from "@/lib/theater/http";
import { z } from "zod";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authenticate(request);
    const id = z
      .string()
      .uuid()
      .parse((await context.params).id);
    const project = await getProject(actor, id);
    return Response.json(
      { ...project, ...(await listQuotes(actor, id)) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
