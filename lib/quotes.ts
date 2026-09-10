import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { db, type Lead } from "./db";
import {
  calculateItems,
  quoteNumber,
  quoteExpired,
  type Quote,
  type QuoteDraft,
} from "./quote-values";
import type { Status } from "./validation";
export class WorkflowError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
export type Activity = {
  id: string;
  leadId: string;
  type: string;
  detail: string;
  createdAt: string;
};
export function activity(
  d: DatabaseSync,
  leadId: string,
  type: string,
  detail: string,
  time = new Date().toISOString(),
) {
  d.prepare("INSERT INTO activities VALUES (?,?,?,?,?)").run(
    randomUUID(),
    leadId,
    type,
    detail,
    time,
  );
}
function transaction<T>(work: (d: DatabaseSync) => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const result = work(d);
    d.exec("COMMIT");
    return result;
  } catch (error) {
    d.exec("ROLLBACK");
    throw error;
  }
}
function fromRow(row: Record<string, unknown>): Quote {
  return { ...row, items: JSON.parse(String(row.items)) } as unknown as Quote;
}
export function getQuote(id: string) {
  const row = db().prepare("SELECT * FROM quotes WHERE id=?").get(id);
  return row ? fromRow(row) : undefined;
}
export function publicQuote(token: string) {
  const row = db()
    .prepare("SELECT * FROM quotes WHERE token=? AND state!='Draft'")
    .get(token);
  return row ? fromRow(row) : undefined;
}
export function leadQuotes(leadId: string) {
  return db()
    .prepare("SELECT * FROM quotes WHERE leadId=? ORDER BY number DESC")
    .all(leadId)
    .map(fromRow);
}
export function leadActivity(leadId: string) {
  return db()
    .prepare(
      "SELECT * FROM activities WHERE leadId=? ORDER BY createdAt DESC, rowid DESC",
    )
    .all(leadId)
    .map((row) => ({ ...row }) as Activity);
}
function setLeadStatus(
  d: DatabaseSync,
  leadId: string,
  status: Status,
  time: string,
) {
  const lead = d.prepare("SELECT status FROM leads WHERE id=?").get(leadId);
  if (lead?.status !== status) {
    d.prepare("UPDATE leads SET status=? WHERE id=?").run(status, leadId);
    activity(d, leadId, "Status changed", `${lead?.status} → ${status}`, time);
  }
}
export function saveDraft(
  leadId: string,
  input: QuoteDraft,
  requestKey: string,
  existingId?: string,
  version?: number,
) {
  return transaction((d) => {
    const lead = d.prepare("SELECT * FROM leads WHERE id=?").get(leadId) as
      Lead | undefined;
    if (!lead) throw new WorkflowError("Lead not found.", 404);
    if (existingId) {
      const old = d
        .prepare("SELECT * FROM quotes WHERE id=? AND leadId=?")
        .get(existingId, leadId);
      if (!old) throw new WorkflowError("Quote not found.", 404);
      if (old.state !== "Draft")
        throw new WorkflowError("Finalised quotes cannot be edited.");
      if (old.version !== version)
        throw new WorkflowError(
          "This draft has changed. Reload before editing again.",
        );
    } else {
      const retry = d
        .prepare("SELECT id,leadId FROM quotes WHERE requestKey=?")
        .get(requestKey);
      if (retry) {
        if (retry.leadId !== leadId)
          throw new WorkflowError("Request key already used.");
        return String(retry.id);
      }
    }
    if (
      d
        .prepare("SELECT id FROM quotes WHERE leadId=? AND state='Accepted'")
        .get(leadId)
    )
      throw new WorkflowError("This lead already has an accepted quote.");
    const items = calculateItems(input.items);
    const total = items.reduce((s, i) => s + i.totalPence, 0);
    if (existingId) {
      d.prepare(
        "UPDATE quotes SET items=?,notes=?,validUntil=?,totalPence=?,version=version+1 WHERE id=?",
      ).run(
        JSON.stringify(items),
        input.notes,
        input.validUntil,
        total,
        existingId,
      );
      activity(
        d,
        leadId,
        "Quote draft updated",
        "Draft line items or customer notes updated.",
      );
      return existingId;
    }
    const id = randomUUID();
    const time = new Date().toISOString();
    const inserted = d
      .prepare(
        `INSERT INTO quotes (id,leadId,token,requestKey,customerName,customerLocation,items,notes,validUntil,totalPence,state,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,'Draft',?)`,
      )
      .run(
        id,
        leadId,
        randomUUID(),
        requestKey,
        lead.name,
        lead.location,
        JSON.stringify(items),
        input.notes,
        input.validUntil,
        total,
        time,
      );
    activity(
      d,
      leadId,
      "Quote created",
      `${quoteNumber(Number(inserted.lastInsertRowid))} · draft`,
      time,
    );
    return id;
  });
}
export function finaliseQuote(id: string, version: number) {
  return transaction((d) => {
    const row = d.prepare("SELECT * FROM quotes WHERE id=?").get(id);
    if (!row) throw new WorkflowError("Quote not found.", 404);
    const quote = fromRow(row);
    if (quote.state === "Sent") return id;
    if (quote.state !== "Draft")
      throw new WorkflowError(
        "This quote has already been finalised or replaced.",
      );
    if (quote.version !== version)
      throw new WorkflowError(
        "The draft has changed. Reload and review the latest version.",
      );
    if (quoteExpired({ ...quote, state: "Sent" }))
      throw new WorkflowError(
        "The valid-until date has passed. Edit the draft first.",
      );
    if (
      d
        .prepare("SELECT id FROM quotes WHERE leadId=? AND state='Accepted'")
        .get(quote.leadId)
    )
      throw new WorkflowError("This lead already has an accepted quote.");
    const time = new Date().toISOString();
    for (const previous of d
      .prepare("SELECT number FROM quotes WHERE leadId=? AND state='Sent'")
      .all(quote.leadId))
      activity(
        d,
        quote.leadId,
        "Quote replaced",
        `${quoteNumber(Number(previous.number))} replaced by ${quoteNumber(quote.number)}.`,
        time,
      );
    d.prepare(
      "UPDATE quotes SET state='Superseded' WHERE leadId=? AND state='Sent'",
    ).run(quote.leadId);
    d.prepare(
      "UPDATE quotes SET state='Sent',sentAt=?,version=version+1 WHERE id=?",
    ).run(time, id);
    activity(
      d,
      quote.leadId,
      "Quote sent",
      `${quoteNumber(quote.number)} finalised. Customer link ready; no email sent.`,
      time,
    );
    setLeadStatus(d, quote.leadId, "Quote Sent", time);
    return id;
  });
}
export function respondToQuote(
  token: string,
  decision: "Accepted" | "Declined",
) {
  return transaction((d) => {
    const row = d
      .prepare("SELECT * FROM quotes WHERE token=? AND state!='Draft'")
      .get(token);
    if (!row) throw new WorkflowError("Quote not found.", 404);
    const quote = fromRow(row);
    if (quote.state === decision) return;
    if (quote.state !== "Sent")
      throw new WorkflowError(
        "This quote has already been answered or replaced.",
      );
    if (quoteExpired(quote))
      throw new WorkflowError(
        "This quote has expired. Please contact Wirral Garden Co. for an updated quote.",
      );
    const time = new Date().toISOString();
    d.prepare(
      "UPDATE quotes SET state=?,respondedAt=?,version=version+1 WHERE id=?",
    ).run(decision, time, quote.id);
    activity(
      d,
      quote.leadId,
      decision === "Accepted" ? "Quote accepted" : "Quote declined",
      `${quoteNumber(quote.number)} · customer response`,
      time,
    );
    setLeadStatus(
      d,
      quote.leadId,
      decision === "Accepted" ? "Won" : "Lost",
      time,
    );
  });
}
export function updateLead(
  id: string,
  status: Status,
  notes: string,
  expectedStatus?: Status,
  expectedNotes?: string,
) {
  return transaction((d) => {
    const lead = d.prepare("SELECT * FROM leads WHERE id=?").get(id);
    if (!lead) throw new WorkflowError("Lead not found.", 404);
    if (
      (expectedStatus !== undefined && lead.status !== expectedStatus) ||
      (expectedNotes !== undefined && lead.notes !== expectedNotes)
    )
      throw new WorkflowError(
        "This lead changed since you opened it. Reload to see the latest details before saving.",
      );
    const time = new Date().toISOString();
    setLeadStatus(d, id, status, time);
    if (lead.notes !== notes) {
      d.prepare("UPDATE leads SET notes=? WHERE id=?").run(notes, id);
      activity(
        d,
        id,
        "Private note updated",
        notes ? "Workspace notes updated." : "Workspace notes cleared.",
        time,
      );
    }
  });
}
export function quoteStats() {
  const quotes = db()
    .prepare(
      "SELECT state,validUntil,totalPence FROM quotes WHERE state IN ('Sent','Accepted')",
    )
    .all()
    .map(
      (row) =>
        ({ ...row }) as Pick<Quote, "state" | "validUntil" | "totalPence">,
    );
  const pending = quotes.filter((q) => q.state === "Sent" && !quoteExpired(q));
  return {
    pending: pending.length,
    pendingPence: pending.reduce((s, q) => s + q.totalPence, 0),
    acceptedPence: quotes
      .filter((q) => q.state === "Accepted")
      .reduce((s, q) => s + q.totalPence, 0),
  };
}
