import { notFound } from "next/navigation";
import { MarketHome } from "@/components/market-home";
import { isLocaleSlug, isMarketSlug, marketConfig } from "@/lib/markets";
import { getCatalogVehicles } from "@/lib/vehicles";
import { getCurrentPolicies, getCurrentPolicyNews } from "@/lib/policies";

export default async function MarketPage({ params }: { params: Promise<{ market: string; locale: string }> }) {
  const { market, locale } = await params;
  if (!isMarketSlug(market) || !isLocaleSlug(locale) || !marketConfig[market].locales.includes(locale as never)) notFound();
  const active = marketConfig[market].active;
  const [vehicles, policies, policyNews] = active
    ? await Promise.all([getCatalogVehicles(marketConfig[market].code), getCurrentPolicies(marketConfig[market].code), getCurrentPolicyNews(marketConfig[market].code)])
    : [[], [], []];
  return <MarketHome market={market} locale={locale} active={active} vehicles={vehicles} policies={policies} policyNews={policyNews} />;
}
