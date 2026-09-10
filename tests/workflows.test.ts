import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";
import { quoteSchema, statuses } from "../lib/validation";
import { sameOrigin } from "../lib/request";
const temporary = mkdtempSync(path.join(tmpdir(), "wirral-tests-"));
process.env.DATA_DIR = temporary;
process.env.DEMO_MODE = "true";
process.env.OWNER_USERNAME = "test-owner";
const testPassword = randomBytes(24).toString("hex");
const testSalt = randomBytes(16).toString("hex");
process.env.OWNER_PASSWORD_HASH = `${testSalt}:${scryptSync(testPassword, testSalt, 64).toString("hex")}`;
delete process.env.APP_ORIGIN;
const {
  newSession,
  validSession,
  ownerGuard,
  sessionName,
  revokeSession,
  passwordMatches,
} = await import("../lib/auth");
const { limitedBody, rateLimit } = await import("../lib/security");
const { POST: loginPOST } = await import("../app/api/auth/login/route");
const { POST: logoutPOST } = await import("../app/api/auth/logout/route");
const { POST: resetPOST } = await import("../app/api/demo/reset/route");
const ownerCookie = `${sessionName}=${newSession()}`;
function authorized(
  handler: (
    r: Request,
    c: { params: Promise<{ id: string }> },
  ) => Promise<Response>,
) {
  return (request: Request, context: { params: Promise<{ id: string }> }) => {
    const headers = new Headers(request.headers);
    headers.set("cookie", ownerCookie);
    if (request.body) headers.set("Content-Type", "application/json");
    return handler(new Request(request, { headers }), context);
  };
}
const { db, listLeads, getLead, getPhotos, createLead } =
  await import("../lib/db");
const { POST } = await import("../app/api/leads/route");
const { PATCH: rawPATCH } = await import("../app/api/leads/[id]/route");
const { GET: rawGET } = await import("../app/api/photos/[id]/route");
const PATCH = authorized(rawPATCH);
const GET = authorized(rawGET);
const {
  saveDraft,
  getQuote,
  publicQuote,
  finaliseQuote,
  respondToQuote,
  leadActivity,
  leadQuotes,
  quoteStats,
  updateLead,
} = await import("../lib/quotes");
const { calculateItems, quoteDraftSchema, quoteExpired } =
  await import("../lib/quote-values");
const { migrateQuotes } = await import("../lib/quote-migration");
const { POST: rawDraftPOST } =
  await import("../app/api/leads/[id]/quotes/route");
const { PATCH: rawDraftPATCH } = await import("../app/api/quotes/[id]/route");
const { POST: rawFinalisePOST } =
  await import("../app/api/quotes/[id]/finalise/route");
const draftPOST = authorized(rawDraftPOST);
const draftPATCH = authorized(rawDraftPATCH);
const finalisePOST = authorized(rawFinalisePOST);
const { POST: responsePOST } =
  await import("../app/api/quotes/[id]/respond/route");
const valid = {
  name: "Test Gardener",
  email: "garden@example.com",
  phone: "07700 900099",
  location: "CH48, West Kirby",
  service: "Garden redesign",
  description: "Please redesign the lawn and add a small patio.",
  preferredDate: "",
};
function request(files: File[] = [], values = valid) {
  const form = new FormData();
  Object.entries(values).forEach(([k, v]) => form.set(k, v));
  files.forEach((f) => form.append("photos", f));
  return new Request("http://localhost:3000/api/leads", {
    method: "POST",
    body: form,
  });
}
after(() => {
  db().close();
  rmSync(temporary, { recursive: true, force: true });
});
test("seeds exactly ten fictional leads once with all five statuses", () => {
  assert.equal(listLeads().length, 10);
  db();
  assert.equal(listLeads().length, 10);
  assert.deepEqual(
    new Set(listLeads().map((l) => l.status)),
    new Set(statuses),
  );
});
test("validates contact details, description and calendar dates", () => {
  assert.equal(quoteSchema.safeParse(valid).success, true);
  for (const change of [
    { email: "broken" },
    { name: " " },
    { phone: "abcdefghi" },
    { description: "short" },
    { preferredDate: "2020-01-01" },
    { preferredDate: "2099-02-31" },
  ])
    assert.equal(quoteSchema.safeParse({ ...valid, ...change }).success, false);
});
test("returns plain lead records that React can pass to client components", () => {
  for (const lead of listLeads()) {
    assert.equal(Object.getPrototypeOf(lead), Object.prototype);
    assert.deepEqual(JSON.parse(JSON.stringify(lead)), lead);
  }
  assert.equal(Object.getPrototypeOf(getLead("demo-1")), Object.prototype);
  assert.equal(getLead("missing"), undefined);
});
test("submits multiple real photos, reads them, saves all statuses and notes, and persists to SQLite", async () => {
  const bytes = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#447744" },
  })
    .png()
    .toBuffer();
  const response = await POST(
    request([
      new File([Uint8Array.from(bytes)], "garden.png", { type: "image/png" }),
      new File([Uint8Array.from(bytes)], "patio.png", { type: "image/png" }),
    ]),
  );
  assert.equal(response.status, 201);
  const { id } = await response.json();
  assert.equal(getLead(id)?.status, "New");
  assert.equal(getLead(id)?.name, valid.name);
  const photos = getPhotos(id);
  assert.equal(Object.getPrototypeOf(photos[0]), Object.prototype);
  assert.equal(photos.length, 2);
  const image = await GET(new Request("http://localhost:3000"), {
    params: Promise.resolve({ id: photos[0].id }),
  });
  assert.equal(image.status, 200);
  assert.equal(
    (await sharp(Buffer.from(await image.arrayBuffer())).metadata()).format,
    "webp",
  );
  for (const status of statuses) {
    const patch = await PATCH(
      new Request(`http://localhost:3000/api/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          notes: "Private: site visit on Tuesday.",
        }),
      }),
      { params: Promise.resolve({ id }) },
    );
    assert.equal(patch.status, 200);
    assert.equal(getLead(id)?.status, status);
  }
  const second = new DatabaseSync(path.join(temporary, "leads.sqlite"));
  assert.equal(
    second.prepare("SELECT notes FROM leads WHERE id=?").get(id)?.notes,
    "Private: site visit on Tuesday.",
  );
  second.close();
});
test("rejects invalid forms, excess photos, fake image bytes and cleans partial uploads", async () => {
  const before = listLeads().length;
  const beforeFiles = readdirSync(path.join(temporary, "uploads")).length;
  assert.equal(
    (await POST(request([], { ...valid, email: "invalid" }))).status,
    400,
  );
  assert.equal(
    (
      await POST(
        request(
          Array.from(
            { length: 7 },
            () => new File(["x"], "x.png", { type: "image/png" }),
          ),
        ),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await POST(
        request([
          new File(["x".repeat(5 * 1024 * 1024 + 1)], "big.png", {
            type: "image/png",
          }),
        ]),
      )
    ).status,
    400,
  );
  const bytes = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  assert.equal(
    (
      await POST(
        request([
          new File([Uint8Array.from(bytes)], "valid.png", {
            type: "image/png",
          }),
          new File(["not a photo"], "fake.png", { type: "image/png" }),
        ]),
      )
    ).status,
    400,
  );
  assert.equal(listLeads().length, before);
  assert.equal(
    readdirSync(path.join(temporary, "uploads")).length,
    beforeFiles,
  );
});
test("invalid statuses and missing leads/photos cannot be edited or retrieved", async () => {
  assert.equal(
    (
      await PATCH(
        new Request("http://localhost:3000", {
          method: "PATCH",
          body: JSON.stringify({ status: "Invalid", notes: "" }),
        }),
        { params: Promise.resolve({ id: "demo-1" }) },
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await PATCH(
        new Request("http://localhost:3000", { method: "PATCH", body: "{}" }),
        { params: Promise.resolve({ id: "missing" }) },
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await GET(new Request("http://localhost:3000"), {
        params: Promise.resolve({ id: "../../secret" }),
      })
    ).status,
    404,
  );
});
test("rejects cross-origin mutations", async () => {
  assert.equal(
    sameOrigin(
      new Request("http://localhost:3000/api/leads", {
        headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
      }),
    ),
    true,
  );
  assert.equal(
    (
      await POST(
        new Request("http://localhost:3000/api/leads", {
          method: "POST",
          headers: { origin: "https://example.net" },
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await PATCH(
        new Request("http://localhost:3000/api/leads/demo-1", {
          method: "PATCH",
          headers: { origin: "https://example.net" },
        }),
        { params: Promise.resolve({ id: "demo-1" }) },
      )
    ).status,
    403,
  );
});

const draft = {
  items: [
    { description: "Garden clearance", quantity: "1", price: "300" },
    { description: "Waste removal", quantity: "1", price: "100" },
    { description: "New turf installation", quantity: "1", price: "650" },
  ],
  notes: "Includes labour and disposal.",
  validUntil: "",
};
const jsonRequest = (body: unknown) =>
  new Request("http://localhost:3000", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
function freshLead() {
  return createLead({ ...valid, name: "Quote Workflow Customer" }, []);
}

test("quote migration preserves all lead fields, photos and one-time sample quotes", () => {
  const before = JSON.stringify(listLeads());
  const photos = JSON.stringify(db().prepare("SELECT * FROM photos").all());
  const count = db().prepare("SELECT COUNT(*) AS n FROM quotes").get()!.n;
  migrateQuotes(db());
  assert.equal(JSON.stringify(listLeads()), before);
  assert.equal(
    JSON.stringify(db().prepare("SELECT * FROM photos").all()),
    photos,
  );
  assert.equal(
    db().prepare("SELECT COUNT(*) AS n FROM quotes").get()!.n,
    count,
  );
  assert.equal(leadQuotes("demo-5")[0].totalPence, 14000);
  assert.equal(leadQuotes("demo-6")[0].state, "Accepted");
});
test("money calculations use pence and round fractional quantities per line", () => {
  assert.equal(
    calculateItems(draft.items).reduce((sum, i) => sum + i.totalPence, 0),
    105000,
  );
  assert.equal(
    calculateItems([
      { description: "Fractional", quantity: "1.25", price: "10.99" },
    ])[0].totalPence,
    1374,
  );
  for (const input of [
    { ...draft, items: [] },
    { ...draft, items: [{ description: "", quantity: "1", price: "10" }] },
    { ...draft, items: [{ description: "Bad", quantity: "-1", price: "10" }] },
    {
      ...draft,
      items: [{ description: "Bad", quantity: "1", price: "0.001" }],
    },
    { ...draft, items: [{ description: "Free", quantity: "1", price: "0" }] },
    { ...draft, validUntil: "2099-02-31" },
    { ...draft, validUntil: "2000-01-01" },
    {
      ...draft,
      items: [{ description: "Huge", quantity: "10000", price: "100000" }],
    },
  ])
    assert.equal(quoteDraftSchema.safeParse(input).success, false);
});
test("draft → edit → finalise → accept updates lead, history, totals and survives reopening", async () => {
  const leadId = freshLead();
  const statsBefore = quoteStats();
  const requestKey = crypto.randomUUID();
  const response = await draftPOST(
    jsonRequest({ ...draft, requestKey, totalPence: 1 }),
    { params: Promise.resolve({ id: leadId }) },
  );
  assert.equal(response.status, 201);
  const { id } = await response.json();
  assert.equal(getLead(leadId)?.status, "New");
  assert.equal(getQuote(id)!.totalPence, 105000);
  assert.equal(publicQuote(getQuote(id)!.token), undefined);
  const duplicate = await draftPOST(jsonRequest({ ...draft, requestKey }), {
    params: Promise.resolve({ id: leadId }),
  });
  assert.equal((await duplicate.json()).id, id);
  assert.equal(leadQuotes(leadId).length, 1);
  const edited = await draftPATCH(
    jsonRequest({ ...draft, notes: "Customer-facing quote note.", version: 1 }),
    { params: Promise.resolve({ id }) },
  );
  assert.equal(edited.status, 200);
  assert.equal(
    (
      await finalisePOST(jsonRequest({ version: 1 }), {
        params: Promise.resolve({ id }),
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await finalisePOST(jsonRequest({ version: 2 }), {
        params: Promise.resolve({ id }),
      })
    ).status,
    200,
  );
  assert.equal(getLead(leadId)?.status, "Quote Sent");
  assert.ok(getQuote(id)!.sentAt);
  assert.equal(quoteStats().pendingPence, statsBefore.pendingPence + 105000);
  assert.equal(
    (
      await draftPATCH(jsonRequest({ ...draft, version: 3 }), {
        params: Promise.resolve({ id }),
      })
    ).status,
    409,
  );
  const token = getQuote(id)!.token;
  assert.equal(
    (
      await responsePOST(jsonRequest({ decision: "Accepted" }), {
        params: Promise.resolve({ id: token }),
      })
    ).status,
    200,
  );
  assert.equal(getLead(leadId)?.status, "Won");
  assert.ok(getQuote(id)!.respondedAt);
  assert.equal(quoteStats().acceptedPence, statsBefore.acceptedPence + 105000);
  assert.equal(quoteStats().pendingPence, statsBefore.pendingPence);
  const events = leadActivity(leadId).map((e) => e.type);
  for (const name of [
    "Enquiry received",
    "Quote created",
    "Quote sent",
    "Quote accepted",
    "Status changed",
  ])
    assert.ok(events.includes(name));
  const before = leadActivity(leadId).length;
  respondToQuote(token, "Accepted");
  assert.equal(leadActivity(leadId).length, before);
  assert.throws(() => respondToQuote(token, "Declined"));
  assert.throws(() => saveDraft(leadId, draft, crypto.randomUUID()));
  const second = new DatabaseSync(path.join(temporary, "leads.sqlite"));
  assert.equal(
    second.prepare("SELECT state FROM quotes WHERE id=?").get(id)?.state,
    "Accepted",
  );
  second.close();
});
test("declining a quote marks the lead Lost and records its response once", async () => {
  const leadId = freshLead();
  const id = saveDraft(leadId, draft, crypto.randomUUID());
  finaliseQuote(id, 1);
  const token = getQuote(id)!.token;
  const result = await responsePOST(jsonRequest({ decision: "Declined" }), {
    params: Promise.resolve({ id: token }),
  });
  assert.equal(result.status, 200);
  assert.equal(getLead(leadId)!.status, "Lost");
  assert.equal(getQuote(id)!.state, "Declined");
  assert.ok(getQuote(id)!.respondedAt);
  const events = leadActivity(leadId).length;
  respondToQuote(token, "Declined");
  assert.equal(leadActivity(leadId).length, events);
  assert.throws(() => respondToQuote(token, "Accepted"));
});
test("replaced and expired links cannot overwrite lead status; expired value is excluded", () => {
  const leadId = freshLead();
  const first = saveDraft(leadId, draft, crypto.randomUUID());
  finaliseQuote(first, 1);
  const second = saveDraft(leadId, draft, crypto.randomUUID());
  finaliseQuote(second, 1);
  assert.equal(getQuote(first)!.state, "Superseded");
  assert.throws(() => respondToQuote(getQuote(first)!.token, "Accepted"));
  assert.equal(getLead(leadId)!.status, "Quote Sent");
  const before = quoteStats().pendingPence;
  db()
    .prepare("UPDATE quotes SET validUntil='2000-01-01' WHERE id=?")
    .run(second);
  assert.equal(quoteExpired(getQuote(second)!), true);
  assert.throws(() => respondToQuote(getQuote(second)!.token, "Accepted"));
  assert.equal(quoteStats().pendingPence, before - 105000);
  const third = saveDraft(leadId, draft, crypto.randomUUID());
  db()
    .prepare("UPDATE quotes SET validUntil='2000-01-01' WHERE id=?")
    .run(third);
  assert.throws(() => finaliseQuote(third, 1));
  assert.equal(getQuote(third)!.state, "Draft");
});
test("notes/status changes are logged only on changes and stale forms cannot undo customer responses", () => {
  const leadId = freshLead();
  updateLead(leadId, "Contacted", "Private detail", "New", "");
  const count = leadActivity(leadId).length;
  updateLead(
    leadId,
    "Contacted",
    "Private detail",
    "Contacted",
    "Private detail",
  );
  assert.equal(leadActivity(leadId).length, count);
  const id = saveDraft(leadId, draft, crypto.randomUUID());
  finaliseQuote(id, 1);
  respondToQuote(getQuote(id)!.token, "Accepted");
  assert.throws(() =>
    updateLead(
      leadId,
      "Quote Sent",
      "Private detail",
      "Quote Sent",
      "Private detail",
    ),
  );
  assert.equal(getLead(leadId)!.status, "Won");
  assert.equal(
    leadActivity(leadId).filter((e) => e.type === "Private note updated")
      .length,
    1,
  );
  assert.ok(
    !JSON.stringify(publicQuote(getQuote(id)!.token)).includes(
      "Private detail",
    ),
  );
});
test("quote endpoints reject invalid data, unknown/draft tokens and cross-origin changes", async () => {
  const leadId = freshLead();
  assert.equal(
    (
      await draftPOST(jsonRequest(null), {
        params: Promise.resolve({ id: leadId }),
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await draftPOST(
        jsonRequest({ ...draft, items: [], requestKey: crypto.randomUUID() }),
        { params: Promise.resolve({ id: leadId }) },
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await draftPOST(
        jsonRequest({ ...draft, requestKey: crypto.randomUUID() }),
        { params: Promise.resolve({ id: "missing" }) },
      )
    ).status,
    404,
  );
  const id = saveDraft(leadId, draft, crypto.randomUUID());
  assert.equal(
    (
      await responsePOST(jsonRequest({ decision: "Accepted" }), {
        params: Promise.resolve({ id: getQuote(id)!.token }),
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await responsePOST(jsonRequest({ decision: "Accepted" }), {
        params: Promise.resolve({ id: "missing" }),
      })
    ).status,
    404,
  );
  for (const handler of [draftPOST, finalisePOST, responsePOST])
    assert.equal(
      (
        await handler(
          new Request("http://localhost:3000", {
            method: "POST",
            headers: { origin: "https://example.org" },
          }),
          { params: Promise.resolve({ id }) },
        )
      ).status,
      403,
    );
});

test("owner routes and uploaded photos reject missing or forged sessions", async () => {
  for (const handler of [
    rawPATCH,
    rawDraftPOST,
    rawDraftPATCH,
    rawFinalisePOST,
    rawGET,
  ]) {
    assert.equal(
      (
        await handler(jsonRequest({}), {
          params: Promise.resolve({ id: "demo-1" }),
        })
      ).status,
      401,
    );
  }
  assert.equal(
    ownerGuard(
      new Request("http://localhost:3000", {
        headers: { cookie: `${sessionName}=forged` },
      }),
    )?.status,
    401,
  );
  assert.equal(
    (await resetPOST(jsonRequest({ confirmation: "RESET DEMO" }))).status,
    401,
  );
});
test("login uses revocable expiring server sessions and rejects wrong credentials", async () => {
  assert.equal(passwordMatches("wrong"), false);
  assert.equal(
    (
      await loginPOST(
        jsonRequest({ username: "test-owner", password: "wrong" }),
      )
    ).status,
    401,
  );
  const login = await loginPOST(
    jsonRequest({ username: "test-owner", password: testPassword }),
  );
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie")!;
  assert.ok(cookie.includes("HttpOnly"));
  assert.ok(cookie.includes("SameSite=lax"));
  const token = cookie.split(";")[0].split("=")[1];
  assert.equal(validSession(token), true);
  assert.equal(
    (
      await logoutPOST(
        new Request("http://localhost:3000", {
          method: "POST",
          headers: { cookie: cookie.split(";")[0] },
        }),
      )
    ).status,
    200,
  );
  assert.equal(validSession(token), false);
  const expired = newSession();
  db()
    .prepare("UPDATE owner_sessions SET expires=0 WHERE tokenHash=?")
    .run(
      (await import("node:crypto"))
        .createHash("sha256")
        .update(expired)
        .digest("hex"),
    );
  assert.equal(validSession(expired), false);
});
test("body limits count actual bytes and request origin uses the configured HTTPS origin", async () => {
  await assert.rejects(() =>
    limitedBody(
      new Request("http://localhost:3000", {
        method: "POST",
        body: "01234567890",
      }),
      10,
    ),
  );
  process.env.APP_ORIGIN = "https://demo.example.com";
  assert.equal(
    sameOrigin(
      new Request("http://localhost:3000", {
        headers: { origin: "https://demo.example.com" },
      }),
    ),
    true,
  );
  assert.equal(
    sameOrigin(
      new Request("http://localhost:3000", {
        headers: {
          origin: "https://evil.example.com",
          host: "evil.example.com",
        },
      }),
    ),
    false,
  );
  delete process.env.APP_ORIGIN;
  for (let i = 0; i < 3; i++)
    rateLimit(new Request("http://localhost:3000"), "limit-test", 3, 60000);
  assert.throws(() =>
    rateLimit(
      new Request("http://localhost:3000", {
        headers: { "x-forwarded-for": "changed" },
      }),
      "limit-test",
      3,
      60000,
    ),
  );
});
test("confirmed owner reset restores ten fictional leads, five quotes, totals and removes uploads", async () => {
  const previousToken = leadQuotes("demo-5")[0].token;
  const resetRequest = (confirmation: string) =>
    new Request("http://localhost:3000", {
      method: "POST",
      headers: { cookie: ownerCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
  assert.equal((await resetPOST(resetRequest("oops"))).status, 400);
  process.env.DEMO_MODE = "false";
  assert.equal((await resetPOST(resetRequest("RESET DEMO"))).status, 403);
  process.env.DEMO_MODE = "true";
  const response = await resetPOST(resetRequest("RESET DEMO"));
  assert.equal(response.status, 200);
  assert.equal(listLeads().length, 10);
  assert.equal(db().prepare("SELECT count(*) AS n FROM quotes").get()?.n, 5);
  assert.equal(readdirSync(path.join(temporary, "uploads")).length, 0);
  assert.equal(getPhotos("demo-1").length, 0);
  assert.equal(quoteStats().acceptedPence, 403000);
  assert.equal(quoteStats().pendingPence, 654000);
  assert.equal(listLeads().filter((l) => l.status === "Won").length, 2);
  assert.equal(listLeads().filter((l) => l.status === "New").length, 3);
  assert.equal(publicQuote(previousToken), undefined);
  assert.ok(listLeads().every((l) => l.email.endsWith("@example.com")));
});
