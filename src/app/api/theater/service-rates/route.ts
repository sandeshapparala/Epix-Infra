import { z } from "zod";
import {
  listServiceRates,
  saveServiceRate,
} from "@/lib/theater/firestore-store";
import { authenticate } from "@/lib/theater/server-auth";
import { failure, readBody, sameOrigin } from "@/lib/theater/http";
const rate = z
  .object({
    id: z.string().uuid(),
    description: z.string().trim().min(1).max(200),
    category: z.enum([
      "installation",
      "display",
      "screen",
      "seating",
      "cabling",
      "acoustics",
      "other",
    ]),
    unit: z.string().trim().min(1).max(30),
    amountPaise: z.number().int().min(1).max(10_000_000_000),
    gstRate: z.number().min(0).max(100),
    active: z.boolean(),
    revision: z.number().int().min(0),
  })
  .strict();
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const actor = await authenticate(request);
    return Response.json(
      { rates: await listServiceRates(actor) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const actor = await authenticate(request, true);
    return Response.json({
      rate: await saveServiceRate(actor, rate.parse(await readBody(request))),
    });
  } catch (e) {
    return failure(e);
  }
}
