import ts from "typescript";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
// Compile the route tests using the same TypeScript compiler as the app.
const directory = path.join(
  process.cwd(),
  "node_modules",
  ".cache",
  "wirral-tests",
);
mkdirSync(directory, { recursive: true });
const files = [
  "lib/db.ts",
  "lib/validation.ts",
  "lib/request.ts",
  "lib/auth.ts",
  "lib/security.ts",
  "lib/demo.ts",
  "app/api/auth/login/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/demo/reset/route.ts",
  "lib/quote-values.ts",
  "lib/quote-migration.ts",
  "lib/quotes.ts",
  "lib/quote-api.ts",
  "app/api/leads/[id]/quotes/route.ts",
  "app/api/quotes/[id]/route.ts",
  "app/api/quotes/[id]/finalise/route.ts",
  "app/api/quotes/[id]/respond/route.ts",
  "app/api/leads/route.ts",
  "app/api/leads/[id]/route.ts",
  "app/api/photos/[id]/route.ts",
  "tests/workflows.test.ts",
];
for (const file of files) {
  const target = path.join(directory, file.replace(/\.ts$/, ".mjs"));
  let source = readFileSync(file, "utf8");
  source = source.replace(
    /(['"])(@\/[^'"]+|\.\.?\/[^'"]+|next\/server)\1/g,
    (_match, quote, specifier) => {
      if (specifier === "next/server") return `${quote}next/server.js${quote}`;
      const resolved = specifier.startsWith("@/")
        ? specifier.slice(2)
        : path.posix.normalize(
            path.posix.join(path.posix.dirname(file), specifier),
          );
      let relative = path
        .relative(
          path.dirname(target),
          path.join(directory, resolved.replace(/\.ts$/, "") + ".mjs"),
        )
        .replaceAll("\\", "/");
      if (!relative.startsWith(".")) relative = "./" + relative;
      return quote + relative + quote;
    },
  );
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(
    target,
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
  );
}
const result = spawnSync(
  process.execPath,
  ["--test", path.join(directory, "tests/workflows.test.mjs")],
  { stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
