export type PolicyListSource = {
  id: string;
  marketCode: "DZ";
  authority: string;
  kind: "list";
  url: string;
  itemSelector: string;
  titleSelector: string;
  linkSelector: string;
  summarySelector?: string;
  detailSelector?: string;
  language: string;
  enabledByDefault?: boolean;
};

export type PolicyPageSource = {
  id: string;
  marketCode: "DZ";
  authority: string;
  kind: "page";
  url: string;
  titleSelector: string;
  detailSelector: string;
  category: string;
  language: string;
  enabledByDefault?: boolean;
};

export type PolicySource = PolicyListSource | PolicyPageSource;

export const policySources: PolicySource[] = [
  {
    id: "dz-commerce-regulatory-news",
    marketCode: "DZ",
    authority: "Algerian Ministry of Commerce",
    kind: "list",
    url: "https://www.commerce.gov.dz/fr/actualites/collection/nouveautes-rglementaires",
    itemSelector: "main article",
    titleSelector: "h3 a",
    linkSelector: "h3 a",
    summarySelector: "p",
    detailSelector: "main article, main",
    language: "fr"
  },
  {
    id: "dz-customs-used-vehicle-import",
    marketCode: "DZ",
    authority: "Algerian Customs",
    kind: "page",
    url: "https://www.douane.gov.dz/spip.php?article604",
    titleSelector: "h1, h2, title",
    detailSelector: "main, article, #content, body",
    category: "Vehicle import eligibility",
    language: "fr",
    enabledByDefault: false
  },
  {
    id: "dz-customs-new-vehicle-import",
    marketCode: "DZ",
    authority: "Algerian Customs",
    kind: "page",
    url: "https://www.douane.gov.dz/spip.php?article130",
    titleSelector: "h1, h2, title",
    detailSelector: "main, article, #content, body",
    category: "New vehicle import",
    language: "fr",
    enabledByDefault: false
  },
  {
    id: "dz-customs-clearance-formalities",
    marketCode: "DZ",
    authority: "Algerian Customs",
    kind: "page",
    url: "https://www.douane.gov.dz/spip.php?article64",
    titleSelector: "h1, h2, title",
    detailSelector: "main, article, #content, body",
    category: "Customs clearance",
    language: "fr",
    enabledByDefault: false
  }
];

export const vehicleTradeKeywords = [
  "automobile", "vehicule", "voiture", "import", "export", "douane", "tarif", "taxe", "tva",
  "homologation", "conformite", "concessionnaire", "port", "transit", "fret", "transport", "banque",
  "سيارة", "مركبة", "استيراد", "تصدير", "جمارك", "تعريفة", "ضريبة", "ميناء", "نقل"
];
