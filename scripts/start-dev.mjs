import { spawn } from "node:child_process";

for (const args of [["scripts/serve-static.mjs", "apps/web", "4173"], ["apps/api/src/server.mjs"]]) {
  const child = spawn(process.execPath, args, { cwd: process.cwd(), detached: true, stdio: "ignore" });
  child.unref();
}
console.log("started web and api");
