import { notFound } from "next/navigation";
import { AccountWorkspace } from "@/components/account-workspace";
import { isLocaleSlug, isMarketSlug, marketConfig } from "@/lib/markets";

export default async function AccountPage({ params }: { params: Promise<{ market: string; locale: string }> }) {
  const { market, locale } = await params;
  if (!isMarketSlug(market) || !isLocaleSlug(locale) || !marketConfig[market].locales.includes(locale as never) || !marketConfig[market].active) notFound();
  return <AccountWorkspace market={market} marketCode={marketConfig[market].code} locale={locale as "ar" | "fr" | "en"} />;
}
