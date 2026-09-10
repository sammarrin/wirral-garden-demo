import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Status } from "./validation";
import { migrateQuotes } from "./quote-migration";
export type Photo = {
  id: string;
  leadId: string;
  filename: string;
  originalName: string;
};
export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  service: string;
  description: string;
  preferredDate: string;
  status: Status;
  notes: string;
  createdAt: string;
};
export const dataDir = path.resolve(
  /* turbopackIgnore: true */ process.env.DATA_DIR ||
    path.join(process.cwd(), "data"),
);
let connection: DatabaseSync | undefined;
export function db() {
  if (connection) return connection;
  mkdirSync(path.join(dataDir, "uploads"), { recursive: true });
  const d = new DatabaseSync(path.join(dataDir, "leads.sqlite"));
  d.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, location TEXT NOT NULL, service TEXT NOT NULL, description TEXT NOT NULL, preferredDate TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','Contacted','Quote Sent','Won','Lost')), notes TEXT NOT NULL DEFAULT '', createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, leadId TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE, filename TEXT NOT NULL, originalName TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(createdAt DESC);
 CREATE INDEX IF NOT EXISTS idx_photos_lead ON photos(leadId);
 CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  d.exec("BEGIN IMMEDIATE");
  try {
    seedLeads(d);
    migrateQuotes(d);
    d.exec("COMMIT");
  } catch (error) {
    d.exec("ROLLBACK");
    d.close();
    throw error;
  }
  connection = d;
  return d;
}
export function seedLeads(d: DatabaseSync) {
  if (!d.prepare("SELECT value FROM metadata WHERE key='seeded'").get()) {
    const rows = [
      [
        "Sarah Mitchell",
        "West Kirby, CH48",
        "Garden redesign",
        "New",
        "We have recently moved into a house with a tired back garden. We would love a seating area, low-maintenance borders and a safe lawn for our two children. The garden is roughly 8 by 12 metres.",
        "",
      ],
      [
        "James Thompson",
        "Heswall, CH60",
        "Patios & paving",
        "New",
        "Looking to replace a cracked concrete patio with porcelain paving, approximately 25 square metres. There is side access for materials. Could you include removal of the old patio?",
        "",
      ],
      [
        "Emma Davies",
        "Bebington, CH63",
        "Fencing",
        "New",
        "Three fence panels came down in the wind. We would like the whole run of six panels replaced with concrete posts and gravel boards.",
        "",
      ],
      [
        "Oliver Hughes",
        "Hoylake, CH47",
        "Lawn & turf",
        "Contacted",
        "Our lawn is patchy and uneven. We need around 60 square metres levelled and returfed. There is a narrow passage down the side of the house.",
        "Spoke with Oliver. Arrange a site visit to check access and drainage.",
      ],
      [
        "Charlotte Evans",
        "Greasby, CH49",
        "Garden maintenance",
        "Quote Sent",
        "We need a monthly garden visit for mowing, hedge trimming and keeping the beds tidy. Medium-sized front and rear gardens.",
        "Sent an estimate of £140 per monthly visit. Follow up next week.",
      ],
      [
        "Daniel Roberts",
        "Wallasey, CH45",
        "Patios & paving",
        "Won",
        "We would like a small sandstone patio outside the kitchen doors with a path leading to the shed. Around 18 square metres in total.",
        "Quote accepted: £2,850. Confirm start date with the customer.",
      ],
      [
        "Sophie Williams",
        "Neston, CH64",
        "Garden redesign",
        "Quote Sent",
        "We want to turn a sloping garden into two usable levels with raised beds and a gravel seating area. Happy to discuss options and budget at a visit.",
        "Design outline and £6,400 estimate sent. Customer reviewing options.",
      ],
      [
        "Thomas Wilson",
        "Prenton, CH43",
        "Fencing",
        "Won",
        "Please quote for a new timber side gate and four closeboard fence panels. Existing posts appear sound but would appreciate advice.",
        "Completed and customer happy. £1,180 total.",
      ],
      [
        "Lucy Taylor",
        "Moreton, CH46",
        "Garden maintenance",
        "Lost",
        "Looking for a one-off clearance of an overgrown back garden, including brambles and removal of an old compost bin.",
        "Customer postponed the work until next year.",
      ],
      [
        "Ben Clarke",
        "Caldy, CH48",
        "Lawn & turf",
        "Contacted",
        "We have a muddy area near our garden office and would like new turf and advice on drainage. Area is approximately 35 square metres.",
        "Waiting for preferred site visit time.",
      ],
    ];
    const insert = d.prepare(
      "INSERT INTO leads VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    );
    rows.forEach((r, i) =>
      insert.run(
        `demo-${i + 1}`,
        r[0],
        `${r[0].toLowerCase().replaceAll(" ", ".")}@example.com`,
        `07700 900${String(i + 1).padStart(3, "0")}`,
        r[1],
        r[2],
        r[4],
        "",
        r[3],
        r[5],
        new Date(Date.now() - i * 86400000 - 3600000).toISOString(),
      ),
    );
    d.prepare("INSERT INTO metadata VALUES ('seeded','1')").run();
  }
}
export function listLeads() {
  // node:sqlite rows have null prototypes. React's server/client boundary
  // requires plain objects for the interactive lead list.
  return db()
    .prepare("SELECT * FROM leads ORDER BY createdAt DESC")
    .all()
    .map((row) => ({ ...row }) as Lead);
}
export function getLead(id: string) {
  const row = db().prepare("SELECT * FROM leads WHERE id = ?").get(id);
  return row ? ({ ...row } as Lead) : undefined;
}
export function getPhotos(id: string) {
  return db()
    .prepare("SELECT * FROM photos WHERE leadId = ?")
    .all(id)
    .map((row) => ({ ...row }) as Photo);
}
export function createLead(
  input: Omit<Lead, "id" | "status" | "notes" | "createdAt">,
  photos: Omit<Photo, "leadId">[],
) {
  const d = db();
  const id = randomUUID();
  d.exec("BEGIN IMMEDIATE");
  try {
    d.prepare("INSERT INTO leads VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
      id,
      input.name,
      input.email,
      input.phone,
      input.location,
      input.service,
      input.description,
      input.preferredDate,
      "New",
      "",
      new Date().toISOString(),
    );
    for (const p of photos)
      d.prepare("INSERT INTO photos VALUES (?,?,?,?)").run(
        p.id,
        id,
        p.filename,
        p.originalName,
      );
    d.prepare("INSERT INTO activities VALUES (?,?,?,?,?)").run(
      `enquiry:${id}`,
      id,
      "Enquiry received",
      "Customer submitted an enquiry.",
      new Date().toISOString(),
    );
    d.exec("COMMIT");
    return id;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
