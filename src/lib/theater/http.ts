import { ZodError } from "zod";
import { Conflict } from "./database";
import { AccessError } from "./access";
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(request.url).origin;
  if (origin && origin !== expected)
    throw new Error("Cross-origin updates are not allowed");
}
export async function readBody(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 3_000_000)
    throw new Error("Request is too large");
  const text = await request.text();
  if (text.length > 3_000_000) throw new Error("Request is too large");
  return JSON.parse(text);
}
export function failure(error: unknown) {
  if (error instanceof AccessError)
    return Response.json(
      { error: error.message },
      {
        status: error.status,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  if (error instanceof Conflict)
    return Response.json({ error: error.message }, { status: 409 });
  if (error instanceof ZodError)
    return Response.json(
      {
        error: error.issues
          .map((i) => i.message)
          .slice(0, 3)
          .join(" · "),
      },
      { status: 400 },
    );
  const message =
    error instanceof Error
      ? error.message
      : "The request could not be completed";
  const config = message.includes("THEATER_DATABASE_URL");
  console.error("Theater request failed:", message);
  return Response.json(
    {
      error: config
        ? message
        : message.includes("SQL") || message.includes("database")
          ? "The studio database is unavailable. Please retry."
          : message,
    },
    { status: config ? 503 : 400 },
  );
}
