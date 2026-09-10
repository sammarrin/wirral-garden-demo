import { NextResponse } from "next/server";
import { WorkflowError } from "./quotes";
import { requestFailure } from "./security";
export function quoteError(error: unknown) {
  const invalid = requestFailure(error);
  if (invalid) return invalid;
  if (error instanceof WorkflowError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof SyntaxError)
    return NextResponse.json(
      { error: "Please submit a valid quote." },
      { status: 400 },
    );
  console.error("Quote workflow failed", error);
  return NextResponse.json(
    { error: "We could not save this change. Please try again." },
    { status: 500 },
  );
}
