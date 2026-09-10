import { randomBytes, scryptSync } from "node:crypto";
import { writeFileSync } from "node:fs";
const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16).toString("hex");
writeFileSync(
  "DEPLOYMENT-SECRETS.local.txt",
  `Keep this file private. Do not upload or commit it.\n\nOWNER_USERNAME=owner\nOWNER_PASSWORD_HASH=${salt}:${scryptSync(password, salt, 64).toString("hex")}\n\nOwner password (for signing in, NOT a hosting environment variable):\n${password}\n`,
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Generated separate deployment credentials in DEPLOYMENT-SECRETS.local.txt.",
);
