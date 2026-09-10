import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteDraftSchema } from "@/lib/quote-values";
import { saveDraft } from "@/lib/quotes";
import { sameOrigin } from "@/lib/request";
import { quoteError } from "@/lib/quote-api";
import { ownerGuard } from "@/lib/auth";
import { jsonBody } from "@/lib/security";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = ownerGuard(request);
  if (denied) return denied;
  try {
    if (!sameOrigin(request))
      return NextResponse.json(
        { error: "This request is not allowed." },
        { status: 403 },
      );
    const { id } = await params;
    const body = await jsonBody(request);
    const parsed = quoteDraftSchema.safeParse(body);
    const key = z.uuid().safeParse(body?.requestKey);
    if (!parsed.success || !key.success)
      return NextResponse.json(
        {
          error: !parsed.success
            ? parsed.error.issues[0].message
            : "Invalid request key. Reload and try again.",
        },
        { status: 400 },
      );
    return NextResponse.json(
      { id: saveDraft(id, parsed.data, key.data) },
      { status: 201 },
    );
  } catch (error) {
    return quoteError(error);
  }
}
