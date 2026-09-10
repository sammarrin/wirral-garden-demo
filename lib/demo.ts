import { db, seedLeads, dataDir } from "./db";
import { migrateQuotes } from "./quote-migration";
import {
  readdirSync,
  unlinkSync,
  renameSync,
  mkdirSync,
  rmdirSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
export function resetDemo() {
  if (process.env.DEMO_MODE !== "true")
    throw new Error("Demo reset is disabled.");
  const d = db();
  d.exec("PRAGMA secure_delete=ON; BEGIN IMMEDIATE");
  const uploads = path.join(dataDir, "uploads");
  const retired = path.join(dataDir, `retired-uploads-${randomUUID()}`);
  let moved = false;
  try {
    d.exec(
      "DELETE FROM photos; DELETE FROM activities; DELETE FROM quotes; DELETE FROM leads; DELETE FROM metadata WHERE key IN ('seeded','quotes-v1'); DELETE FROM sqlite_sequence WHERE name='quotes';",
    );
    seedLeads(d);
    migrateQuotes(d);
    renameSync(uploads, retired);
    moved = true;
    mkdirSync(uploads);
    d.exec("COMMIT");
  } catch (error) {
    d.exec("ROLLBACK");
    if (moved) {
      try {
        rmdirSync(uploads);
      } catch {}
      renameSync(retired, uploads);
    }
    throw error;
  }
  // The committed records no longer reference these files. A cleanup failure
  // cannot roll the database back to records whose photos have been deleted.
  try {
    for (const file of readdirSync(retired, { withFileTypes: true }))
      if (file.isFile()) unlinkSync(path.join(retired, file.name));
    rmdirSync(retired);
  } catch {
    console.error("A retired uploads folder needs filesystem cleanup.");
  }
}
