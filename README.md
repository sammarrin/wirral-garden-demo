# Wirral Garden Co.

A branded landscaping enquiry and quoting demonstration with a protected owner workspace. Next.js, TypeScript, Tailwind CSS, SQLite and image processing. No external database, AI, payments or messaging services are required.

## Open the app

On this computer, double-click **START-DEMO.cmd** and leave the window running. If the app is already running, simply open:

- Customer website: http://127.0.0.1:3000
- Owner login: http://127.0.0.1:3000/login
- Dashboard after login: http://127.0.0.1:3000/dashboard

Your generated local username and password are in **DEMO-LOGIN.local.txt** in this folder. Keep that file private. It is excluded from Git and Docker. Only a salted password hash is stored in the server environment.

To install elsewhere, install Node.js 24, then run in this folder:

```sh
npm install -g pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm setup
pnpm dev
```

`pnpm setup` creates a strong local password and `.env.local` if it does not already exist. Existing settings are preserved. Stop the server with Ctrl+C.

## Try the complete workflow

1. On `/quote`, submit fictional contact details, a project description and optional photos.
2. Sign in at `/login`. Open the enquiry under **All leads**. Search/filter, edit its status and save private notes.
3. Choose **Create quote**. Add descriptions, quantities, unit prices, customer notes and an optional valid-until date.
4. **Save draft & review**, edit if needed, then **Finalise & mark sent**. This locks the prices and sets the lead to **Quote Sent**; no email is sent.
5. Open or copy the customer quote link. It works without owner login and contains only that quote, not contact details, private notes or other customers.
6. Choose **Accept quote** or **Decline quote**, then confirm. The lead becomes **Won** or **Lost** and the timestamp is recorded in its activity history.
7. Revisit the dashboard for updated statistics. Reload a previously open dashboard tab if necessary.

Sent quotes can be replaced; previous versions remain visible but cannot receive responses. Accepted quotes cannot be revised. Expired quotes cannot be answered. Currency uses integer pence, rounded per line. No additional taxes or fees are calculated.

## Reset for a demonstration

Click **Demo workspace** in the dashboard top bar. Select **Reset demo data**, read the confirmation, type **RESET DEMO**, then **Confirm reset**.

This restores the original **10 fictional leads and five quotes**, removes demonstration enquiries, notes, photos and responses, and invalidates old customer quote links. It cannot be undone through the app. Login credentials and the current session remain valid. Abuse limits are deliberately not cleared.

`DEMO_MODE=true` enables reset. Set it to `false` to disable both the button and endpoint. Do not store real customer records in a workspace you intend to reset.

## Starting examples

- Charlotte Evans: £140 monthly maintenance, awaiting response.
- Sophie Williams: £6,400 garden redesign, awaiting response.
- Daniel Roberts: £2,850 patio, accepted.
- Thomas Wilson: £1,180 fencing, accepted.
- Lucy Taylor: £480 clearance, declined.

Statistics: 3 New, 2 Contacted, 2 Quote Sent, 2 Won, 1 Lost; conversion 20%. Open quote value £6,540; accepted quote value £4,030. Lead counters use current lead status; quote values use quote state. Open value excludes drafts, expired and replaced quotes. Accepted value is not money received.

## Authentication and security

- One owner identity from server-side OWNER_USERNAME and OWNER_PASSWORD_HASH; no credentials in browser code.
- Salted scrypt password hashing; random opaque session cookies; only session hashes stored in SQLite.
- Sessions expire after eight hours. Logout revokes them. Changing the configured credentials invalidates existing sessions.
- Owner pages are guarded before rendering and in the dashboard layout. Every owner API checks the session, including status/notes, quote editing, finalisation, reset and photo retrieval.
- Cookies are HttpOnly, SameSite=Lax and Secure on HTTPS. Production startup requires credentials, exact APP_ORIGIN and an absolute DATA_DIR.
- Mutations check the configured origin. Customer responses use unguessable quote tokens.
- Up to six JPEG/PNG/WebP photos, 5 MB each, 40 megapixels. Images are decoded, resized, stripped of metadata and re-encoded as WebP outside the public folder.
- Actual body bytes are limited: 64 KB JSON, 32 MB multipart. Demo budget: 200 leads and 50 MB uploaded photos.
- Persisted limits: 10 login attempts/15 minutes, 20 enquiries/hour, 60 quote responses/15 minutes. These are shared across the demo, so multiple visitors consume the same allowance. Client IP headers cannot bypass them.
- A hidden spam field, private no-cache responses, no-index quote pages, and framing/MIME-sniffing protection are included.

These are basic controls, not a managed firewall. Anyone holding a customer quote link can view and answer it; this is not verified customer identity or an electronic-signature service.

## Storage and hosting

SQLite is at `DATA_DIR/leads.sqlite`; photos at `DATA_DIR/uploads`. Local development defaults to `./data`. Both need persistent storage when hosted. Do not use static hosting or an ephemeral serverless filesystem.

Recommended: **one Render paid web service plus one persistent disk**. It avoids separate database and storage subscriptions. See **DEPLOYMENT.md** for exact steps, costs, secrets and backups. Dockerfile and render.yaml exclude local data/secrets; a new deployment starts with fictional examples.

## Checks

```sh
pnpm test
pnpm typecheck
pnpm build
```

Tests use an isolated temporary database. They cover leads/photos, quote arithmetic and transitions, expiry/replacement, privacy, authentication, origins, payload limits and confirmed reset.

`pnpm start` serves the production build and requires an absolute DATA_DIR and configured credentials/origin. Use `pnpm dev` for local development. Production uses the platform's PORT; the local launcher binds only to this computer.

## Structure and limits

- `app/`: customer/dashboard pages and APIs; login/reset.
- `proxy.ts`: early owner-route protection.
- `lib/auth.ts`, `lib/security.ts`: sessions, passwords and abuse controls.
- `lib/db.ts`, `lib/quote-migration.ts`: schema and seeds.
- `lib/quotes.ts`, `lib/quote-values.ts`: quoting workflow and money calculations.
- `lib/demo.ts`: reset; `scripts/`: credential setup and production startup.
- `tests/workflows.test.ts`: workflow and security regressions.

No multi-tenancy, user management, email/SMS, payments, bookings or AI. Multiple owners share one credential. Use one app instance; SQLite is not configured for multiple replicas. Hosted backups and public-domain verification still need to be configured.

## Image credit

Garden photograph by [Tile Merchant Ireland on Unsplash](https://unsplash.com/photos/a-backyard-with-a-table-and-chairs-and-an-umbrella-wd3L9AMXcUU), under the [Unsplash License](https://unsplash.com/license). Illustrative imagery, not a claimed project portfolio.
