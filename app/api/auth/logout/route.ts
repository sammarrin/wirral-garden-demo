import { NextResponse } from "next/server";
import {
  revokeSession,
  tokenFromRequest,
  cookieOptions,
  sessionName,
} from "@/lib/auth";
import { sameOrigin } from "@/lib/request";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "This request is not allowed." },
      { status: 403 },
    );
  revokeSession(tokenFromRequest(request));
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionName, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}
