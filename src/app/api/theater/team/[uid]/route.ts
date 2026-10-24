import { z } from "zod";
import { authenticate } from "@/lib/theater/server-auth";
import { memberUpdate, updateMember } from "@/lib/theater/team";
import { failure, readBody, sameOrigin } from "@/lib/theater/http";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  try {
    sameOrigin(request);
    const actor = await authenticate(request, true);
    const uid = z
      .string()
      .min(1)
      .max(128)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .parse((await context.params).uid);
    return Response.json({
      member: await updateMember(
        actor,
        uid,
        memberUpdate.parse(await readBody(request)),
      ),
    });
  } catch (e) {
    return failure(e);
  }
}
