import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import fa from "@/messages/fa.json";
import fr from "@/messages/fr.json";

export const marketConfig = {
  dz: { code: "DZ", name: "Algeria", locales: ["ar", "fr", "en"], defaultLocale: "ar", active: true },
  ir: { code: "IR", name: "Iran", locales: ["fa", "en"], defaultLocale: "fa", active: false }
} as const;

export const messagesByLocale = { ar, fr, en, fa } as const;
export type MarketSlug = keyof typeof marketConfig;
export type LocaleSlug = keyof typeof messagesByLocale;

export function isMarketSlug(value: string): value is MarketSlug {
  return value in marketConfig;
}

export function isLocaleSlug(value: string): value is LocaleSlug {
  return value in messagesByLocale;
}

export function localeDirection(locale: LocaleSlug) {
  return locale === "ar" || locale === "fa" ? "rtl" : "ltr";
}
