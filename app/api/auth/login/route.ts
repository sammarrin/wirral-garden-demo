import { NextResponse } from "next/server";
import {
  configured,
  passwordMatches,
  newSession,
  cookieOptions,
  sessionName,
} from "@/lib/auth";
import { sameOrigin } from "@/lib/request";
import { jsonBody, rateLimit, requestFailure } from "@/lib/security";
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request))
      return NextResponse.json(
        { error: "This request is not allowed." },
        { status: 403 },
      );
    rateLimit(request, "login", 10, 15 * 60 * 1000);
    if (!configured())
      return NextResponse.json(
        {
          error:
            "Owner login has not been configured. Follow the setup instructions.",
        },
        { status: 503 },
      );
    const body = await jsonBody(request);
    const password = typeof body?.password === "string" ? body.password : "";
    const matches = passwordMatches(password);
    if (!matches || body?.username !== process.env.OWNER_USERNAME)
      return NextResponse.json(
        { error: "Incorrect username or password." },
        { status: 401 },
      );
    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionName, newSession(), cookieOptions());
    return response;
  } catch (error) {
    return (
      requestFailure(error) ||
      NextResponse.json(
        { error: "Unable to sign in. Please try again." },
        { status: 500 },
      )
    );
  }
}
