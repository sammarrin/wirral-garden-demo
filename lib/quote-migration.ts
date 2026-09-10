import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { calculateItems } from "./quote-values";

// Called inside the database initialisation transaction. Existing leads/photos
// are never rewritten; the marker makes seeding and history backfill one-time.
export function migrateQuotes(d: DatabaseSync) {
  d.exec(`CREATE TABLE IF NOT EXISTS quotes (
    number INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, leadId TEXT NOT NULL REFERENCES leads(id),
    token TEXT NOT NULL UNIQUE, requestKey TEXT NOT NULL UNIQUE, customerName TEXT NOT NULL, customerLocation TEXT NOT NULL,
    items TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', validUntil TEXT NOT NULL DEFAULT '', totalPence INTEGER NOT NULL CHECK(totalPence > 0),
    state TEXT NOT NULL CHECK(state IN ('Draft','Sent','Accepted','Declined','Superseded')),
    createdAt TEXT NOT NULL, sentAt TEXT, respondedAt TEXT, version INTEGER NOT NULL DEFAULT 1);
    CREATE INDEX IF NOT EXISTS idx_quotes_lead ON quotes(leadId, number DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_one_sent ON quotes(leadId) WHERE state='Sent';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_one_accepted ON quotes(leadId) WHERE state='Accepted';
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY, leadId TEXT NOT NULL REFERENCES leads(id), type TEXT NOT NULL,
      detail TEXT NOT NULL, createdAt TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(leadId, createdAt DESC);`);
  if (d.prepare("SELECT value FROM metadata WHERE key='quotes-v1'").get())
    return;
  d.exec(
    "INSERT OR IGNORE INTO activities SELECT 'enquiry:' || id,id,'Enquiry received','Customer submitted an enquiry.',createdAt FROM leads",
  );
  const samples = [
    {
      id: "demo-5",
      name: "Charlotte Evans",
      leadStatus: "Quote Sent",
      state: "Sent",
      items: [
        ["Monthly mowing and edging", "1", "65"],
        ["Hedge trimming", "1", "45"],
        ["Borders and green waste removal", "1", "30"],
      ],
    },
    {
      id: "demo-6",
      name: "Daniel Roberts",
      leadStatus: "Won",
      state: "Accepted",
      items: [
        ["Ground preparation and waste removal", "1", "650"],
        ["Sandstone paving supplied and laid (m²)", "18", "100"],
        ["Garden path finishing", "1", "400"],
      ],
    },
    {
      id: "demo-7",
      name: "Sophie Williams",
      leadStatus: "Quote Sent",
      state: "Sent",
      items: [
        ["Groundworks and levelling", "1", "2200"],
        ["Retaining walls and raised beds", "1", "2800"],
        ["Gravel seating area", "1", "1400"],
      ],
    },
    {
      id: "demo-8",
      name: "Thomas Wilson",
      leadStatus: "Won",
      state: "Accepted",
      items: [
        ["Closeboard fence panels installed", "4", "220"],
        ["Timber side gate supplied and fitted", "1", "300"],
      ],
    },
    {
      id: "demo-9",
      name: "Lucy Taylor",
      leadStatus: "Lost",
      state: "Declined",
      items: [
        ["Overgrown garden clearance", "1", "350"],
        ["Green waste and compost bin removal", "1", "130"],
      ],
    },
  ];
  for (const sample of samples) {
    const lead = d
      .prepare("SELECT * FROM leads WHERE id=? AND name=? AND status=?")
      .get(sample.id, sample.name, sample.leadStatus);
    if (
      !lead ||
      lead.email !==
        `${sample.name.toLowerCase().replaceAll(" ", ".")}@example.com` ||
      d.prepare("SELECT id FROM quotes WHERE leadId=?").get(sample.id)
    )
      continue;
    const createdAt = new Date(
      Date.parse(String(lead.createdAt)) + 3600000,
    ).toISOString();
    const sentAt = new Date(Date.parse(createdAt) + 60000).toISOString();
    const respondedAt =
      sample.state === "Sent"
        ? null
        : new Date(Date.parse(sentAt) + 3600000).toISOString();
    const items = calculateItems(
      sample.items.map(([description, quantity, price]) => ({
        description,
        quantity,
        price,
      })),
    );
    const id = randomUUID();
    const result = d
      .prepare(
        `INSERT INTO quotes (id,leadId,token,requestKey,customerName,customerLocation,items,notes,validUntil,totalPence,state,createdAt,sentAt,respondedAt)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        id,
        sample.id,
        randomUUID(),
        `seed:${sample.id}`,
        sample.name,
        String(lead.location),
        JSON.stringify(items),
        sample.id === "demo-5"
          ? "Price is per monthly visit. Frequency and start date to be agreed."
          : "Includes labour, materials and waste removal as listed. Start date to be agreed.",
        new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        items.reduce((sum, i) => sum + i.totalPence, 0),
        sample.state,
        createdAt,
        sentAt,
        respondedAt,
      );
    const number = `WGC-${String(result.lastInsertRowid).padStart(4, "0")}`;
    for (const [type, time] of [
      ["Quote created", createdAt],
      ["Quote sent", sentAt],
      ...(respondedAt
        ? [
            [
              sample.state === "Accepted" ? "Quote accepted" : "Quote declined",
              respondedAt,
            ],
          ]
        : []),
    ]) {
      d.prepare("INSERT INTO activities VALUES (?,?,?,?,?)").run(
        randomUUID(),
        sample.id,
        type,
        `${number} · seeded example`,
        time,
      );
    }
  }
  d.prepare("INSERT INTO metadata VALUES ('quotes-v1','1')").run();
}
