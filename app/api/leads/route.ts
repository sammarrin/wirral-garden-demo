import { NextResponse } from "next/server";
import { quoteSchema } from "@/lib/validation";
import { createLead, dataDir, db } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { sameOrigin } from "@/lib/request";
import {
  limitedBody,
  rateLimit,
  requestFailure,
  RequestError,
} from "@/lib/security";
import { readdirSync, statSync } from "node:fs";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const written: string[] = [];
  try {
    if (!sameOrigin(request))
      return NextResponse.json(
        { error: "This request is not allowed." },
        { status: 403 },
      );
    if (Number(request.headers.get("content-length")) > 32 * 1024 * 1024)
      return NextResponse.json(
        { error: "Please keep your upload under 30 MB." },
        { status: 413 },
      );
    rateLimit(request, "enquiry", 20, 60 * 60 * 1000);
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
      throw new RequestError("Please use the quote request form.", 415);
    const bytes = await limitedBody(request, 32 * 1024 * 1024);
    const form = await new Response(bytes, {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
    if (form.get("website"))
      throw new RequestError("Please try submitting the form again.", 400);
    const parsed = quoteSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const files = form
      .getAll("photos")
      .filter((v): v is File => v instanceof File && v.size > 0);
    if (
      files.length > 6 ||
      files.some((f) => f.size > 5 * 1024 * 1024) ||
      files.reduce((s, f) => s + f.size, 0) > 30 * 1024 * 1024
    )
      return NextResponse.json(
        { error: "Choose up to 6 photos, each no larger than 5 MB." },
        { status: 400 },
      );
    db();
    const used = readdirSync(path.join(dataDir, "uploads")).reduce(
      (sum, name) => sum + statSync(path.join(dataDir, "uploads", name)).size,
      0,
    );
    if (
      used + files.reduce((sum, file) => sum + file.size, 0) >
      50 * 1024 * 1024
    )
      throw new RequestError(
        "Photo storage is full. Please submit without photos or contact the team.",
        413,
      );
    if (
      Number(
        db().prepare("SELECT count(*) AS count FROM leads").get()?.count,
      ) >= 200
    )
      throw new RequestError(
        "The enquiry inbox is full. Please contact the team.",
        429,
      );
    const photos = [];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("PHOTO");
      const input = Buffer.from(await file.arrayBuffer());
      let bytes: Buffer;
      try {
        const processor = sharp(input, { limitInputPixels: 40000000 });
        const meta = await processor.metadata();
        if (!["jpeg", "png", "webp"].includes(meta.format || ""))
          throw new Error();
        bytes = await processor
          .rotate()
          .resize({
            width: 1800,
            height: 1800,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        throw new Error("PHOTO");
      }
      const id = randomUUID();
      const filename = `${id}.webp`;
      const full = path.join(dataDir, "uploads", filename);
      await writeFile(full, bytes, { flag: "wx" });
      written.push(full);
      photos.push({ id, filename, originalName: file.name.slice(0, 200) });
    }
    const id = createLead(parsed.data, photos);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    await Promise.all(written.map((f) => unlink(f).catch(() => {})));
    const invalid = requestFailure(error);
    if (invalid) return invalid;
    if (error instanceof Error && error.message === "PHOTO")
      return NextResponse.json(
        {
          error:
            "One photo could not be read. Please use valid JPG, PNG or WebP images up to 40 megapixels.",
        },
        { status: 400 },
      );
    console.error("Quote submission failed", error);
    return NextResponse.json(
      { error: "We could not save your request. Please try again." },
      { status: 500 },
    );
  }
}
