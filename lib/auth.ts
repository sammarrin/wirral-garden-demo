import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { db } from "./db";
export const sessionName = "wgc_owner";
const duration = 8 * 60 * 60 * 1000;
export function configured() {
  return !!process.env.OWNER_PASSWORD_HASH && !!process.env.OWNER_USERNAME;
}
export function passwordMatches(password: string) {
  const [salt, hash] = (process.env.OWNER_PASSWORD_HASH || "").split(":");
  if (
    !salt ||
    !hash ||
    password.length > 256 ||
    !/^([a-f0-9]{128})$/.test(hash)
  )
    return false;
  const supplied = scryptSync(password, salt, 64);
  return timingSafeEqual(supplied, Buffer.from(hash, "hex"));
}
function fingerprint() {
  return createHash("sha256")
    .update(`${process.env.OWNER_USERNAME}:${process.env.OWNER_PASSWORD_HASH}`)
    .digest("hex");
}
function sessions() {
  const d = db();
  d.exec(
    "CREATE TABLE IF NOT EXISTS owner_sessions (tokenHash TEXT PRIMARY KEY, expires INTEGER NOT NULL, credentialHash TEXT NOT NULL)",
  );
  return d;
}
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function newSession() {
  const d = sessions();
  d.prepare(
    "DELETE FROM owner_sessions WHERE expires < ? OR credentialHash != ?",
  ).run(Date.now(), fingerprint());
  const token = randomBytes(32).toString("hex");
  d.prepare("INSERT INTO owner_sessions VALUES (?,?,?)").run(
    digest(token),
    Date.now() + duration,
    fingerprint(),
  );
  return token;
}
export function validSession(token: string | undefined) {
  if (!configured() || !token || !/^[a-f0-9]{64}$/.test(token)) return false;
  return !!sessions()
    .prepare(
      "SELECT tokenHash FROM owner_sessions WHERE tokenHash=? AND expires>? AND credentialHash=?",
    )
    .get(digest(token), Date.now(), fingerprint());
}
export function tokenFromRequest(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${sessionName}=`))
    ?.slice(sessionName.length + 1);
}
export function ownerGuard(request: Request) {
  if (!validSession(tokenFromRequest(request)))
    return Response.json(
      { error: "Please sign in to the owner workspace." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
}
export function revokeSession(token: string | undefined) {
  if (token)
    sessions()
      .prepare("DELETE FROM owner_sessions WHERE tokenHash=?")
      .run(digest(token));
}
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.APP_ORIGIN?.startsWith("https://") || false,
    sameSite: "lax" as const,
    path: "/",
    maxAge: duration / 1000,
  };
}
