import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";
import { isLocaleSlug, isMarketSlug, localeDirection, marketConfig, messagesByLocale } from "@/lib/markets";

export function generateStaticParams() {
  return Object.entries(marketConfig).flatMap(([market, config]) => config.locales.map((locale) => ({ market, locale })));
}

export default async function MarketLayout({ children, params }: PropsWithChildren<{ params: Promise<{ market: string; locale: string }> }>) {
  const { market, locale } = await params;
  if (!isMarketSlug(market) || !isLocaleSlug(locale) || !marketConfig[market].locales.includes(locale as never)) notFound();
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      <div lang={locale} dir={localeDirection(locale)}>{children}</div>
    </NextIntlClientProvider>
  );
}
