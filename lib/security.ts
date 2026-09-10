import { createHash } from "node:crypto";
import { db } from "./db";
export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function limitedBody(request: Request, limit: number) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new RequestError("This request is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new RequestError("This request is too large.", 413);
    }
    chunks.push(value);
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
export async function jsonBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new RequestError("Expected a JSON request.", 415);
  try {
    return JSON.parse(
      new TextDecoder().decode(await limitedBody(request, 64 * 1024)),
    );
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError("Please submit valid data.", 400);
  }
}
export function rateLimit(
  request: Request,
  scope: string,
  max: number,
  windowMs: number,
) {
  const d = db();
  d.exec(
    "CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)",
  );
  // Demo-wide buckets deliberately do not trust client-supplied IP headers.
  const client = "shared";
  const key = createHash("sha256").update(`${scope}:${client}`).digest("hex");
  const now = Date.now();
  d.prepare("DELETE FROM rate_limits WHERE expires<=?").run(now);
  const row = d
    .prepare(
      "INSERT INTO rate_limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
    )
    .get(key, now + windowMs);
  if (Number(row?.count) > max)
    throw new RequestError(
      "Too many attempts. Please wait a few minutes and try again.",
      429,
    );
}
export function requestFailure(error: unknown) {
  if (error instanceof RequestError)
    return Response.json(
      { error: error.message },
      {
        status: error.status,
        headers: error.status === 429 ? { "Retry-After": "900" } : undefined,
      },
    );
}
