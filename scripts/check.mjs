import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const files = ["apps/web/app.js", "apps/api/src/server.mjs", "apps/api/src/payment-provider.mjs", "apps/api/src/sync-connectors.mjs"];
for (const file of files) {
  const source = await readFile(file, "utf8");
  if (!source.trim()) throw new Error(`${file} is empty`);
  await run(process.execPath, ["--check", file]);
  console.log(`ok ${file}`);
}
