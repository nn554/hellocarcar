import { describe, expect, it, vi } from "vitest";
import { fetchPolicySource } from "../src/policy-fetcher";
import type { PolicyListSource } from "../src/policy-sources";

const source: PolicyListSource = {
  id: "test-official-regulations",
  marketCode: "DZ",
  authority: "Official authority",
  kind: "list",
  url: "https://official.example/regulations",
  itemSelector: "article",
  titleSelector: "h3 a",
  linkSelector: "h3 a",
  summarySelector: "p",
  detailSelector: "main",
  language: "fr"
};

describe("official policy source fetcher", () => {
  it("keeps vehicle-trade notices, enriches their body and ignores unrelated news", async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/robots.txt")) return new Response("User-agent: *\nAllow: /", { status: 200 });
      if (url.endsWith("/regulations")) return new Response(`
        <main>
          <article><h3><a href="/regulations/vehicle-import">Règles d'importation des véhicules</a></h3><p>Nouvelles formalités douanières.</p><time>01.09.2026</time></article>
          <article><h3><a href="/regulations/office">Achat de fournitures de bureau</a></h3><p>Consultation administrative.</p></article>
        </main>
      `, { status: 200, headers: { "content-type": "text/html" } });
      if (url.endsWith("/regulations/vehicle-import")) return new Response("<main>Le dossier d'importation du véhicule doit être contrôlé avant dédouanement.</main>", { status: 200 });
      return new Response("Not found", { status: 404 });
    });

    const result = await fetchPolicySource(fetchImpl as typeof fetch, source, new Date("2026-09-02T06:00:00.000Z"));

    expect(result).toHaveLength(1);
    const candidate = result[0]!;
    expect(candidate).toMatchObject({
      title: "Règles d'importation des véhicules",
      category: "Customs and taxes",
      language: "fr",
      url: "https://official.example/regulations/vehicle-import",
      publishedAt: new Date("2026-09-01T12:00:00.000Z")
    });
    expect(candidate.bodyExcerpt).toContain("dédouanement");
    expect(candidate.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails closed when robots.txt prohibits the source", async () => {
    const fetchImpl = vi.fn(async () => new Response("User-agent: *\nDisallow: /regulations", { status: 200 }));
    await expect(fetchPolicySource(fetchImpl as typeof fetch, source)).rejects.toThrow("Blocked by robots.txt");
  });
});
