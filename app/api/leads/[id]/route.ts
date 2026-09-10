import { NextResponse } from "next/server";
import { getLead } from "@/lib/db";
import { updateLead, WorkflowError } from "@/lib/quotes";
import { updateSchema } from "@/lib/validation";
import { sameOrigin } from "@/lib/request";
import { ownerGuard } from "@/lib/auth";
import { jsonBody, requestFailure } from "@/lib/security";
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
    if (!getLead(id))
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    const parsed = updateSchema.safeParse(await jsonBody(request));
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    updateLead(
      id,
      parsed.data.status,
      parsed.data.notes,
      parsed.data.expectedStatus,
      parsed.data.expectedNotes,
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    const invalid = requestFailure(error);
    if (invalid) return invalid;
    if (error instanceof WorkflowError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    return NextResponse.json(
      { error: "Changes could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
