import { db, dataDir, type Photo } from "@/lib/db";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ownerGuard } from "@/lib/auth";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = ownerGuard(_request);
  if (denied) return denied;
  const { id } = await params;
  const photo = db().prepare("SELECT * FROM photos WHERE id=?").get(id) as
    Photo | undefined;
  if (!photo) return new Response("Photo not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(dataDir, "uploads", photo.filename));
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Photo unavailable", { status: 404 });
  }
}
