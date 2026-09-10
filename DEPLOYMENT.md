# Deploy the demonstration

Prepared for **one Render web service with a persistent disk**. SQLite and photos share that disk; no external cloud database/object storage is needed. Deployment has not been performed. You must create/connect your hosting account and authorise billing.

## Why Render

Free Render web-service filesystems are ephemeral and cannot attach persistent disks. SQLite and photos would be lost on restart. Starter plus a 1 GB disk is approximately **US$7.25/month**, before tax or usage beyond allowances, at prices checked on 9 September 2026. Confirm [current pricing](https://render.com/pricing) and [disk requirements](https://render.com/docs/disks) before creating the service. No purchase has been made.

## Your steps

1. Create/sign into GitHub and [Render](https://dashboard.render.com/).
2. Put this `wirral-garden-co` folder's source at the root of a GitHub repository (private is fine). Commit the source, lockfile, Dockerfile and render.yaml. **Do not upload `.env.local`, `*.local.txt`, `data`, `.next`, `node_modules` or scratch backups.** Git/Docker ignore files exclude them. GitHub website uploads require you to select only source files yourself.
3. Locally run `node scripts/create-deployment-credentials.mjs`. It creates **DEPLOYMENT-SECRETS.local.txt** with separate strong hosted credentials. Keep this file private. If it already exists, reuse it instead of overwriting it.
4. In Render choose **New → Web Service**, connect the repository, select **Docker**, choose **Starter**, and use **one instance**. Alternatively, use **New → Blueprint** with render.yaml and supply its requested values.
5. Add a persistent disk: name `demo-data`, mount `/var/data`, size **1 GB**.
6. Set environment variables:

| Variable            | Value                                                    |
| ------------------- | -------------------------------------------------------- |
| NODE_ENV            | production                                               |
| DATA_DIR            | /var/data/wgc                                            |
| DEMO_MODE           | true                                                     |
| OWNER_USERNAME      | Copy from DEPLOYMENT-SECRETS.local.txt                   |
| OWNER_PASSWORD_HASH | Copy its complete salt:hash value                        |
| APP_ORIGIN          | Exact HTTPS origin assigned by Render, no trailing slash |

Do not set the plain password as an environment variable or use NEXT_PUBLIC_ for secrets. Render supplies PORT. Production startup validates configuration before listening.

7. Create the service. If the public URL is assigned only after creation, copy it from the service page into APP_ORIGIN, save and redeploy. Startup deliberately fails with missing/invalid settings; do not guess the URL or bypass validation.
8. Set health check to `/api/health`, wait for a healthy deployment, then open its URL.
9. Verify homepage and enquiry submission. `/dashboard` must redirect to `/login`. Sign in with hosted credentials, create/finalise a quote, sign out and test the customer link. Test accept and decline on different quotes, then reset through **Demo workspace**.

Public HTTPS cookie and proxy behaviour must be verified on the actual host before sharing with prospects. Local tests do not replace that check.

## Temporary tunnels

The earlier unprotected Cloudflare tunnel was stopped. Do not expose `next dev` for prospective-customer demos. For temporary sharing use a production build, set APP_ORIGIN to the tunnel's exact HTTPS origin, and start production with a persistent local DATA_DIR. A new tunnel URL requires updating APP_ORIGIN and restarting.

## Backups, credentials and limits

To preserve feedback, stop the app and copy the entire DATA_DIR privately before resetting. On Render, configure/check disk backup options and test restoration. Do not assume a disk snapshot alone is a transaction-consistent SQLite backup; consult Render's disk documentation.

Reset replaces demonstration activity with seeds and rotates customer links. It leaves credentials and abuse counters intact. Set DEMO_MODE=false to disable reset.

To change credentials, generate a new scrypt hash locally (the supplied generator can run in a separate empty working folder), update OWNER_PASSWORD_HASH in Render and redeploy. Existing sessions become invalid. No password-reset email flow is included.

- One instance and one persistent volume; no horizontal scaling.
- Shared owner identity, no MFA. Customer quote links identify possession, not a verified person.
- Basic rate limits and upload budgets reduce casual abuse. Sustained hostile traffic needs provider-level protection.
- No email/SMS/payment services. Quote Sent means finalised and ready to share, not proof of delivery.
- Disk-backed deploys may have downtime. Configure backups, retention and budget notifications before collecting real customer records.
- The production Next.js build and local HTTP workflows are tested. Docker and the live Render deployment must be validated in your hosting account.
