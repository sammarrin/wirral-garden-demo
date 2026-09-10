import { ownerGuard } from "@/lib/auth";
import { sameOrigin } from "@/lib/request";
import { jsonBody, requestFailure } from "@/lib/security";
import { resetDemo } from "@/lib/demo";
export async function POST(request: Request) {
  const denied = ownerGuard(request);
  if (denied) return denied;
  if (!sameOrigin(request))
    return Response.json(
      { error: "This request is not allowed." },
      { status: 403 },
    );
  if (process.env.DEMO_MODE !== "true")
    return Response.json({ error: "Demo reset is disabled." }, { status: 403 });
  try {
    const body = await jsonBody(request);
    if (body?.confirmation !== "RESET DEMO")
      return Response.json(
        { error: "Type RESET DEMO to confirm." },
        { status: 400 },
      );
    resetDemo();
    return Response.json({ success: true });
  } catch (error) {
    return (
      requestFailure(error) ||
      Response.json(
        { error: "The reset could not complete. Please try again." },
        { status: 500 },
      )
    );
  }
}
