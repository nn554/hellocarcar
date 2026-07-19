import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = normalize(join(process.cwd(), process.argv[2] || "apps/web"));
const port = Number(process.argv[3] || 4173);
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8", ".svg": "image/svg+xml" };

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const target = normalize(join(root, relative));
    if (!target.startsWith(root)) throw new Error("invalid path");
    const info = await stat(target).catch(() => null);
    const file = info?.isFile() ? target : join(root, "index.html");
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`HelloCarCar web: http://127.0.0.1:${port}`));
