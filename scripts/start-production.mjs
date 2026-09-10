import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const origin = new URL(process.env.APP_ORIGIN || "http://invalid");
if (
  !process.env.OWNER_USERNAME ||
  !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(process.env.OWNER_PASSWORD_HASH || "")
)
  throw new Error(
    "Configure OWNER_USERNAME and OWNER_PASSWORD_HASH before starting.",
  );
if (
  !process.env.APP_ORIGIN ||
  origin.origin !== process.env.APP_ORIGIN ||
  (origin.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(origin.hostname))
)
  throw new Error(
    "APP_ORIGIN must be the exact HTTPS site origin (localhost HTTP allowed for testing).",
  );
if (!process.env.DATA_DIR || !path.isAbsolute(process.env.DATA_DIR))
  throw new Error(
    "Set DATA_DIR to an absolute persistent-disk path before starting production.",
  );
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    process.env.HOSTNAME_BIND || "0.0.0.0",
    "--port",
    process.env.PORT || "3000",
  ],
  { stdio: "inherit", env: process.env },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
