import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { ManualTtProvider } from "./payment-provider.mjs";
import { connectors } from "./sync-connectors.mjs";

const port = Number(process.env.PORT || 8787);
const paymentProvider = new ManualTtProvider();
const vehicles = [
  { id: "avatr-11", make: "AVATR", name: "AVATR 11 BEV", energy: "EV", body: "SUV", seats: 5, priceFrom: 29900, priceTo: 34800, currency: "USD", verified: "2026-07-12" },
  { id: "deepal-s07", make: "Deepal", name: "Deepal S07 EREV", energy: "EREV", body: "SUV", seats: 5, priceFrom: 18800, priceTo: 22400, currency: "USD", verified: "2026-07-10" },
  { id: "changan-cs55", make: "Changan", name: "Changan CS55 PLUS", energy: "Gasoline", body: "SUV", seats: 5, priceFrom: 11600, priceTo: 14900, currency: "USD", verified: "2026-07-08" }
];
const orders = new Map([
  ["NBS-2026-AL-001", { pi: "NBS-2026-AL-001", vin: "LS5A3DCE7RA000001", model: "AVATR 11 BEV", status: "Awaiting vessel", events: [{ label: "Purchase confirmed", date: "2026-06-28", done: true }, { label: "License issued", date: "2026-07-03", done: true }, { label: "SO generated", date: "2026-07-08", done: true }, { label: "Loaded / released", date: "Expected 2026-07-22", done: false }] }]
]);

function json(res, status, data) { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }); res.end(JSON.stringify({ data, requestId: randomUUID() })); }
function body(req) { return new Promise(resolve => { let value = ""; req.on("data", chunk => value += chunk); req.on("end", () => { try { resolve(JSON.parse(value || "{}")); } catch { resolve({}); } }); }); }

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" }); return res.end(); }
  if (url.pathname === "/health") return json(res, 200, { status: "ok", mode: "contract-first", authConfigured: false });
  if (req.method === "GET" && url.pathname === "/v1/vehicles") return json(res, 200, vehicles);
  if (req.method === "GET" && url.pathname === "/v1/orders/lookup") {
    const key = url.searchParams.get("pi");
    const order = orders.get(key);
    return json(res, order ? 200 : 404, order || { code: "ORDER_NOT_FOUND", message: "No owned order matched this lookup." });
  }
  if (req.method === "POST" && url.pathname === "/v1/reports") {
    const input = await body(req);
    return json(res, 201, { id: `report-${Date.now()}`, status: "QUOTED", quote: { amount: input.package === "priority" ? 499 : 299, currency: "USD" }, scope: input.scope || "vehicle-and-supplier" });
  }
  if (req.method === "POST" && url.pathname === "/v1/payments/proofs") {
    const input = await body(req);
    return json(res, 201, await paymentProvider.createPayment({ reportId: input.reportId || "unknown", amount: input.amount || 299, currency: "USD" }));
  }
  if (req.method === "POST" && url.pathname === "/v1/sync/preview") return json(res, 200, await connectors[url.searchParams.get("source") || "feishu"].pull());
  json(res, 404, { code: "NOT_FOUND" });
}).listen(port, "127.0.0.1", () => console.log(`HelloCarCar API: http://127.0.0.1:${port}`));
