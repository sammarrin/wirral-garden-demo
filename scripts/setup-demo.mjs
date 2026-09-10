import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
// Run locally. Never copies secrets into the browser or repository.
if (existsSync(".env.local")) {
  console.log(
    "Existing .env.local preserved. See DEPLOYMENT.md to change credentials.",
  );
  process.exit(0);
}
const password = randomBytes(18).toString("base64url");
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
writeFileSync(
  ".env.local",
  `OWNER_USERNAME=owner\nOWNER_PASSWORD_HASH=${salt}:${hash}\nAPP_ORIGIN=http://127.0.0.1:3000\nDEMO_MODE=true\n`,
  { mode: 0o600, flag: "wx" },
);
writeFileSync(
  "DEMO-LOGIN.local.txt",
  `Wirral Garden Co. owner login\n\nURL: http://127.0.0.1:3000/login\nUsername: owner\nPassword: ${password}\n\nKeep this local file private. Do not upload or commit it.\nHosted deployments need their own credentials; see DEPLOYMENT.md.\n`,
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Owner login configured. Your credentials are in DEMO-LOGIN.local.txt.",
);
