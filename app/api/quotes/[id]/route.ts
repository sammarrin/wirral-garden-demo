import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteDraftSchema } from "@/lib/quote-values";
import { getQuote, saveDraft } from "@/lib/quotes";
import { sameOrigin } from "@/lib/request";
import { quoteError } from "@/lib/quote-api";
import { ownerGuard } from "@/lib/auth";
import { jsonBody } from "@/lib/security";
export async function PATCH(
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
    const quote = getQuote(id);
    if (!quote)
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    const body = await jsonBody(request);
    const parsed = quoteDraftSchema.safeParse(body);
    const version = z.number().int().positive().safeParse(body?.version);
    if (!parsed.success || !version.success)
      return NextResponse.json(
        {
          error: !parsed.success
            ? parsed.error.issues[0].message
            : "Reload this quote and try again.",
        },
        { status: 400 },
      );
    return NextResponse.json({
      id: saveDraft(quote.leadId, parsed.data, "", id, version.data),
    });
  } catch (error) {
    return quoteError(error);
  }
}
