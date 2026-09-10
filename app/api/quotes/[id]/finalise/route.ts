import { NextResponse } from "next/server";
import { z } from "zod";
import { finaliseQuote } from "@/lib/quotes";
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
    const parsed = z
      .object({ version: z.number().int().positive() })
      .safeParse(await jsonBody(request));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Reload this quote and try again." },
        { status: 400 },
      );
    return NextResponse.json({ id: finaliseQuote(id, parsed.data.version) });
  } catch (error) {
    return quoteError(error);
  }
}
