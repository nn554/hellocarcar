import { createHash } from "node:crypto";
import { load } from "cheerio";
import robotsParser from "robots-parser";
import { Prisma } from "@hellocarcar/db";
import type { PrismaClient } from "@hellocarcar/db";
import { policySources, vehicleTradeKeywords } from "./policy-sources";
import type { PolicyListSource, PolicyPageSource, PolicySource } from "./policy-sources";

const userAgent = "HelloCarCarPolicyBot/1.0 (+https://hellocarcar.cn)";
const defaultTimeoutMs = 20_000;
const maxBodyBytes = 2_000_000;
const maxCandidatesPerSource = 30;

export type PolicyCandidate = {
  sourceId: string;
  authority: string;
  marketCode: "DZ";
  category: string;
  title: string;
  summary: string;
  impactSummary: string;
  language: string;
  url: string;
  sourceRef: string;
  observedAt: Date;
  publishedAt: Date | null;
  bodyExcerpt: string;
  bodySnapshot: string;
  contentHash: string;
};

export type PolicyFetchResult = {
  syncRunId: string;
  status: "SUCCEEDED" | "PARTIAL" | "FAILED";
  sourceCount: number;
  successfulSources: number;
  failedSources: Array<{ sourceId: string; message: string }>;
  discovered: number;
  drafted: number;
  duplicates: number;
  rejected: number;
};

type FetchLike = typeof fetch;

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
const normalizeForMatch = (value: string) => normalize(value).toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const truncate = (value: string, length: number) => value.length <= length ? value : `${value.slice(0, length - 1).trim()}…`;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function categoryFor(text: string) {
  const normalized = normalizeForMatch(text);
  if (/douan|tarif|tva|taxe|جمارك|تعريفة|ضريبة/.test(normalized)) return "Customs and taxes";
  if (/\bport\b|\btransit\b|\bfret\b|\btransport\b|ميناء|نقل/.test(normalized)) return "Port and shipping";
  if (/homologation|conformite|concessionnaire/.test(normalized)) return "Vehicle conformity";
  if (/banque|paiement|domiciliation/.test(normalized)) return "Banking and payment";
  return "Import policy";
}

function isRelevant(text: string) {
  const normalized = normalizeForMatch(text);
  return vehicleTradeKeywords.some((keyword) => normalized.includes(normalizeForMatch(keyword)));
}

function parsePublishedAt(text: string) {
  const match = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchText(fetchImpl: FetchLike, url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.POLICY_FETCH_TIMEOUT_MS) || defaultTimeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: { "user-agent": userAgent, accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > maxBodyBytes) throw new Error(`Response exceeds ${maxBodyBytes} bytes`);
    const body = await response.text();
    if (Buffer.byteLength(body) > maxBodyBytes) throw new Error(`Response exceeds ${maxBodyBytes} bytes`);
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureRobotsAllowed(fetchImpl: FetchLike, url: string) {
  if (process.env.POLICY_FETCH_RESPECT_ROBOTS === "false") return;
  const target = new URL(url);
  const robotsUrl = new URL("/robots.txt", target).toString();
  try {
    const body = await fetchText(fetchImpl, robotsUrl);
    const robots = robotsParser(robotsUrl, body);
    if (!robots.isAllowed(url, userAgent)) throw new Error("Blocked by robots.txt");
  } catch (error) {
    if (error instanceof Error && error.message === "Blocked by robots.txt") throw error;
    // A missing or unavailable robots file is not interpreted as a prohibition.
  }
}

async function enrichDetail(fetchImpl: FetchLike, source: PolicyListSource, url: string, fallback: string) {
  if (!source.detailSelector) return fallback;
  try {
    await ensureRobotsAllowed(fetchImpl, url);
    const html = await fetchText(fetchImpl, url);
    const $ = load(html);
    return normalize($(source.detailSelector).first().text()) || fallback;
  } catch {
    return fallback;
  }
}

function buildCandidate(source: PolicySource, input: { title: string; summary: string; body: string; url: string; publishedAt: Date | null; observedAt: Date }): PolicyCandidate {
  const normalizedBody = normalize(input.body);
  const bodyExcerpt = truncate(normalizedBody, 4_000);
  const bodySnapshot = truncate(normalizedBody, 50_000);
  const summary = truncate(normalize(input.summary) || bodyExcerpt || input.title, 1_200);
  const contentHash = hash(JSON.stringify({ title: normalize(input.title), url: input.url, body: normalizedBody }));
  return {
    sourceId: source.id,
    authority: source.authority,
    marketCode: source.marketCode,
    category: source.kind === "page" ? source.category : categoryFor(`${input.title} ${summary}`),
    title: truncate(normalize(input.title), 240),
    summary: truncate(summary, 4_000),
    impactSummary: "Automatic official-source discovery. A reviewer must confirm the legal effect, effective date and importer action before publication.",
    language: source.language,
    url: input.url,
    sourceRef: truncate(`${source.id}:${input.url}`, 240),
    observedAt: input.observedAt,
    publishedAt: input.publishedAt,
    bodyExcerpt,
    bodySnapshot,
    contentHash
  };
}

async function fetchListSource(fetchImpl: FetchLike, source: PolicyListSource, observedAt: Date) {
  await ensureRobotsAllowed(fetchImpl, source.url);
  const html = await fetchText(fetchImpl, source.url);
  const $ = load(html);
  const candidates: PolicyCandidate[] = [];
  for (const element of $(source.itemSelector).toArray().slice(0, maxCandidatesPerSource)) {
    const item = $(element);
    const title = normalize(item.find(source.titleSelector).first().text());
    const href = item.find(source.linkSelector).first().attr("href");
    const summary = normalize(source.summarySelector ? item.find(source.summarySelector).first().text() : "");
    if (!title || !href || !isRelevant(`${title} ${summary}`)) continue;
    const url = new URL(href, source.url).toString();
    const body = await enrichDetail(fetchImpl, source, url, `${title}. ${summary}`);
    candidates.push(buildCandidate(source, { title, summary, body, url, publishedAt: parsePublishedAt(item.text()), observedAt }));
  }
  return candidates;
}

async function fetchPageSource(fetchImpl: FetchLike, source: PolicyPageSource, observedAt: Date) {
  await ensureRobotsAllowed(fetchImpl, source.url);
  const html = await fetchText(fetchImpl, source.url);
  const $ = load(html);
  const title = normalize($(source.titleSelector).first().text()) || source.authority;
  const body = normalize($(source.detailSelector).first().text());
  if (!body || /web page blocked|url you requested has been blocked/i.test(body)) throw new Error("Official site blocked this crawler request");
  return [buildCandidate(source, { title, summary: body, body, url: source.url, publishedAt: null, observedAt })];
}

export async function fetchPolicySource(fetchImpl: FetchLike, source: PolicySource, observedAt = new Date()) {
  return source.kind === "list" ? fetchListSource(fetchImpl, source, observedAt) : fetchPageSource(fetchImpl, source, observedAt);
}

async function persistCandidate(prisma: PrismaClient, syncRunId: string, marketId: string, candidate: PolicyCandidate) {
  const existing = await prisma.rawSourceRecord.findUnique({
    where: { sourceSystem_sourceKey_contentHash: { sourceSystem: "PUBLIC_SOURCE", sourceKey: candidate.sourceRef, contentHash: candidate.contentHash } }
  });
  if (existing) return "duplicate" as const;
  await prisma.$transaction(async (tx) => {
    const raw = await tx.rawSourceRecord.create({ data: {
      syncRunId,
      marketId,
      sourceSystem: "PUBLIC_SOURCE",
      sourceKey: candidate.sourceRef,
      contentHash: candidate.contentHash,
      payload: {
        sourceId: candidate.sourceId,
        authority: candidate.authority,
        title: candidate.title,
        url: candidate.url,
        publishedAt: candidate.publishedAt?.toISOString() ?? null,
        bodySnapshot: candidate.bodySnapshot
      } as Prisma.InputJsonValue
    } });
    const evidence = await tx.evidence.create({ data: {
      marketId,
      scope: "MARKET",
      kind: "OFFICIAL_POLICY_NOTICE",
      title: candidate.title,
      sourceSystem: "PUBLIC_SOURCE",
      sourceRef: candidate.sourceRef,
      sourceUrl: candidate.url,
      observedAt: candidate.observedAt,
      reviewState: "DRAFT",
      contentHash: candidate.contentHash,
      metadata: { sourceId: candidate.sourceId, authority: candidate.authority, originalLanguage: candidate.language, bodyExcerpt: candidate.bodyExcerpt }
    } });
    await tx.policyNewsItem.create({ data: {
      marketId,
      category: candidate.category,
      title: candidate.title,
      summary: candidate.summary,
      impactSummary: candidate.impactSummary,
      originalLanguage: candidate.language,
      sourceUrl: candidate.url,
      sourceSystem: "PUBLIC_SOURCE",
      sourceRef: candidate.sourceRef,
      observedAt: candidate.observedAt,
      publishedAt: candidate.publishedAt,
      reviewState: "DRAFT",
      contentHash: candidate.contentHash,
      evidenceLinks: { create: { evidenceId: evidence.id } }
    } });
    await tx.rawSourceRecord.update({ where: { id: raw.id }, data: { appliedAt: new Date() } });
  });
  return "drafted" as const;
}

export async function runDailyPolicyFetch(prisma: PrismaClient, options: { fetchImpl?: FetchLike; now?: Date; sources?: PolicySource[] } = {}): Promise<PolicyFetchResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? new Date();
  const configuredIds = process.env.POLICY_FETCH_SOURCE_IDS?.split(",").map((value) => value.trim()).filter(Boolean);
  const sources = options.sources ?? (configuredIds?.length
    ? policySources.filter((source) => configuredIds.includes(source.id))
    : policySources.filter((source) => source.enabledByDefault !== false));
  const market = await prisma.market.findUniqueOrThrow({ where: { code: "DZ" } });
  const syncRun = await prisma.syncRun.create({ data: { marketId: market.id, sourceSystem: "PUBLIC_SOURCE", cursor: now.toISOString() } });
  const failedSources: Array<{ sourceId: string; message: string }> = [];
  let discovered = 0;
  let drafted = 0;
  let duplicates = 0;
  let rejected = 0;
  let successfulSources = 0;
  try {
    for (const source of sources) {
      try {
        const candidates = await fetchPolicySource(fetchImpl, source, now);
        successfulSources += 1;
        discovered += candidates.length;
        for (const candidate of candidates) {
          try {
            const result = await persistCandidate(prisma, syncRun.id, market.id, candidate);
            if (result === "drafted") drafted += 1;
            else duplicates += 1;
          } catch {
            rejected += 1;
          }
        }
      } catch (error) {
        failedSources.push({ sourceId: source.id, message: error instanceof Error ? error.message : "Unknown source failure" });
      }
    }
    const status = successfulSources === 0 ? "FAILED" : failedSources.length || rejected ? "PARTIAL" : "SUCCEEDED";
    await prisma.syncRun.update({ where: { id: syncRun.id }, data: {
      status,
      pulledCount: discovered,
      appliedCount: drafted,
      rejectedCount: rejected,
      finishedAt: new Date(),
      error: failedSources.length ? failedSources as Prisma.InputJsonValue : Prisma.JsonNull
    } });
    return { syncRunId: syncRun.id, status, sourceCount: sources.length, successfulSources, failedSources, discovered, drafted, duplicates, rejected };
  } catch (error) {
    await prisma.syncRun.update({ where: { id: syncRun.id }, data: {
      status: "FAILED", finishedAt: new Date(), error: { message: error instanceof Error ? error.message : "Unknown policy fetch failure" }
    } });
    throw error;
  }
}
