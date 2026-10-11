"use client";

import { StatusBadge } from "@hellocarcar/ui";
import { useTranslations } from "next-intl";
import type { CatalogVehicle } from "@/lib/vehicles";
import type { CurrentPolicy, CurrentPolicyNews } from "@/lib/policies";

const vehicleImages = [
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=82",
  "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1000&q=82"
];

export function MarketHome({ market, locale, active, vehicles, policies, policyNews }: { market: "dz" | "ir"; locale: string; active: boolean; vehicles: CatalogVehicle[]; policies: CurrentPolicy[]; policyNews: CurrentPolicyNews[] }) {
  const t = useTranslations();
  const featuredVehicle = vehicles.find((vehicle) => vehicle.priceRange !== null);
  const formatPrice = (amount: number, currency: string) => new Intl.NumberFormat(locale === "ar" || locale === "fa" ? "en-US" : locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);

  return (
    <div className="page-shell">
      <header className="page-wrap topbar">
        <a className="brand" href={`/${market}/${locale}`}>Hello<strong>Car</strong>Car</a>
        <nav aria-label="Primary navigation">
          <a href="#vehicles">{t("navVehicles")}</a>
          <a href="#method">{t("navMethod")}</a>
          <a href="#policy">{t("navPolicy")}</a>
          <a href={`/${market}/${locale}/account`}>{t("navAccount")}</a>
        </nav>
        <div className="market-switch" aria-label="Market">
          <a href="/dz/ar" aria-current={market === "dz" ? "page" : undefined}>DZ</a>
          <a href="/ir/fa" aria-current={market === "ir" ? "page" : undefined}>IR</a>
        </div>
      </header>

      <main>
        <section className="page-wrap hero">
          <div className="hero-copy">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
            <div className="hero-actions">
              <a className={`primary-link${active ? "" : " disabled"}`} href={active ? `/${market}/${locale}/account` : undefined}>{t("start")}</a>
              <a className="secondary-link" href={`/${market}/${locale}/account?view=reports`}>{t("report")}</a>
            </div>
          </div>
          <div className="hero-media">
            <img src="https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1400&q=85" alt="Vehicle prepared for international procurement" />
            {featuredVehicle?.priceRange ? (
              <div className="evidence-chip">
                <small>{t("fob")}</small>
                <strong>{formatPrice(featuredVehicle.priceRange.from, featuredVehicle.priceRange.currency)} - {formatPrice(featuredVehicle.priceRange.to, featuredVehicle.priceRange.currency)}</strong>
                <small>{featuredVehicle.name} / {featuredVehicle.priceRange.incoterm} / {new Date(featuredVehicle.priceRange.sourceDate).toLocaleDateString(locale)}</small>
              </div>
            ) : null}
          </div>
        </section>

        <section className="trust-band" id="method">
          <div className="page-wrap trust-grid">
            <article><span>01</span><strong>{t("verified")}</strong><p>{t("verifiedText")}</p></article>
            <article><span>02</span><strong>{t("marketIsolation")}</strong><p>{t("marketIsolationText")}</p></article>
            <article><span>03</span><strong>{t("humanReview")}</strong><p>{t("humanReviewText")}</p></article>
          </div>
        </section>

        <section className="page-wrap section" id="vehicles">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{market.toUpperCase()} MARKET PACK</p>
              <h2>{t("catalog")}</h2>
            </div>
            <div className="market-note">
              <StatusBadge tone={active ? "verified" : "planned"}>{active ? "ACTIVE" : "PLANNED"}</StatusBadge>
              <p>{t("marketReady")}</p>
            </div>
          </div>

          {active && vehicles.length > 0 ? (
            <div className="vehicle-grid">
              {vehicles.map((vehicle, index) => (
                <article className="vehicle-card" key={vehicle.name}>
                  <img src={vehicleImages[index % vehicleImages.length]} alt={vehicle.name} loading="lazy" />
                  <div className="vehicle-content">
                    <div className="vehicle-meta"><span>{vehicle.make}</span><span>{vehicle.energyType} / {vehicle.bodyType}</span></div>
                    <h3>{vehicle.name}</h3>
                    {vehicle.priceRange ? <div className="price"><small>{t("fob")}</small><strong>{formatPrice(vehicle.priceRange.from, vehicle.priceRange.currency)} - {formatPrice(vehicle.priceRange.to, vehicle.priceRange.currency)}</strong></div> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : active ? (
            <div className="planned">
              <StatusBadge tone="warning">NO CURRENT VERIFIED FACTS</StatusBadge>
              <p>{t("verifiedText")}</p>
            </div>
          ) : (
            <div className="planned" id="policy">
              <StatusBadge tone="warning">COMPLIANCE GATE</StatusBadge>
              <h3>{t("plannedTitle")}</h3>
              <p>{t("plannedText")}</p>
            </div>
          )}
        </section>
        {active ? (
          <>
          <section className="page-wrap section" id="policy">
            <div className="section-heading"><div><p className="eyebrow">CURRENT POLICY</p><h2>{t("navPolicy")}</h2></div><StatusBadge tone="verified">VERIFIED CURRENT</StatusBadge></div>
            {policies.length ? <div className="policy-list">{policies.map((policy) => <article key={policy.id}><span>{policy.category}</span><h3>{policy.title}</h3><p>{policy.plainExplanation || policy.summary}</p>{Array.isArray(policy.steps) && policy.steps.length ? <ol>{policy.steps.map((step, index) => <li key={index}>{String(step)}</li>)}</ol> : null}{Array.isArray(policy.requiredDocuments) && policy.requiredDocuments.length ? <p><strong>{t("requiredDocuments")}:</strong> {policy.requiredDocuments.map(String).join("、")}</p> : null}{policy.feesNote ? <p><strong>{t("feesNote")}:</strong> {policy.feesNote}</p> : null}<small>{new Date(policy.updatedAt).toLocaleDateString(locale)}</small></article>)}</div> : <div className="planned"><StatusBadge tone="warning">NO CURRENT VERIFIED POLICY</StatusBadge><p>{t("verifiedText")}</p></div>}
          </section>
          <section className="page-wrap section" id="policy-news">
            <div className="section-heading"><div><p className="eyebrow">DAILY UPDATE</p><h2>{t("policyNews")}</h2></div><StatusBadge tone="verified">{t("reviewedNews")}</StatusBadge></div>
            {policyNews.length ? <div className="policy-list news-list">{policyNews.map((news) => <article key={news.id}><span>{news.category}</span><h3>{news.title}</h3><p>{news.summary}</p><p><strong>{t("importerImpact")}:</strong> {news.impactSummary}</p><small>{new Date(news.publishedAt || news.observedAt).toLocaleDateString(locale)} · <a href={news.sourceUrl} target="_blank" rel="noreferrer">{t("viewSource")}</a></small></article>)}</div> : <div className="planned"><StatusBadge tone="warning">{t("noNews")}</StatusBadge><p>{t("verifiedText")}</p></div>}
          </section>
          </>
        ) : null}
      </main>

      <footer className="footer" id="account"><div className="page-wrap">{t("footer")}</div></footer>
    </div>
  );
}
