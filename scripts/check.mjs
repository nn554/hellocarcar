import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const pnpmCli = process.env.npm_execpath;
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://hellocarcar:change-me@127.0.0.1:5432/hellocarcar"
};

for (const args of [
  ["--filter", "@hellocarcar/db", "generate"],
  ["--filter", "@hellocarcar/db", "exec", "prisma", "validate"],
  ["--filter", "@hellocarcar/contracts", "build"],
  ["--filter", "@hellocarcar/db", "build"],
  ["--filter", "@hellocarcar/ui", "build"],
  ["-r", "--if-present", "check"]
]) {
  const result = pnpmCli
    ? await run(process.execPath, [pnpmCli, ...args], { cwd: process.cwd(), windowsHide: true, env })
    : process.platform === "win32"
      ? await run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", [pnpm, ...args].join(" ")], { cwd: process.cwd(), windowsHide: true, env })
      : await run(pnpm, args, { cwd: process.cwd(), env });
  if (result.stdout.trim()) process.stdout.write(result.stdout);
  if (result.stderr.trim()) process.stderr.write(result.stderr);
}

console.log("HelloCarCar workspace checks passed");
