import { spawn } from "node:child_process";

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const commands = [
  ["--filter", "@hellocarcar/web", "dev"],
  ["--filter", "@hellocarcar/api", "dev"],
  ["--filter", "@hellocarcar/admin", "dev"],
  ["--filter", "@hellocarcar/worker", "dev"]
];

for (const args of commands) {
  const child = spawn(pnpm, args, { cwd: process.cwd(), detached: true, stdio: "ignore", windowsHide: true });
  child.unref();
}

console.log("Started web, API, admin and worker development processes");
