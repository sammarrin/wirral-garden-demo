import { NextResponse } from "next/server";
import { z } from "zod";
import { respondToQuote } from "@/lib/quotes";
import { sameOrigin } from "@/lib/request";
import { quoteError } from "@/lib/quote-api";
import { jsonBody, rateLimit } from "@/lib/security";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!sameOrigin(request))
      return NextResponse.json(
        { error: "This request is not allowed." },
        { status: 403 },
      );
    const { id: token } = await params;
    rateLimit(request, "quote-response", 60, 15 * 60 * 1000);
    const parsed = z
      .object({ decision: z.enum(["Accepted", "Declined"]) })
      .safeParse(await jsonBody(request));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Choose accept or decline." },
        { status: 400 },
      );
    respondToQuote(token, parsed.data.decision);
    return NextResponse.json({ success: true });
  } catch (error) {
    return quoteError(error);
  }
}
