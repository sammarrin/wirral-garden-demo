// Next.js can normalise request.url to localhost; Host retains the browser URL.
export function sameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const supplied = new URL(origin);
    if (process.env.APP_ORIGIN)
      return supplied.origin === new URL(process.env.APP_ORIGIN).origin;
    if (process.env.NODE_ENV === "production") return false;
    const target = new URL(request.url);
    return (
      supplied.host === (request.headers.get("host") || target.host) &&
      supplied.protocol === target.protocol
    );
  } catch {
    return false;
  }
}
