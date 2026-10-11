import { getRequestConfig } from "next-intl/server";
import { isLocaleSlug, messagesByLocale } from "@/lib/markets";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = requestedLocale && isLocaleSlug(requestedLocale) ? requestedLocale : "en";

  return {
    locale,
    messages: messagesByLocale[locale]
  };
});
