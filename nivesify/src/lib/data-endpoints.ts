// src/lib/data-endpoints.ts
// Using r2.dev subdomain which has built-in CORS support (no custom domain config needed)
const IS_PROD = process.env.NODE_ENV === "production";
const R2_BASE = "https://pub-260c05cf57d44671bf81cc305a2e6856.r2.dev";

export const DATA_ENDPOINTS = {
  amfiRaw:  IS_PROD ? `${R2_BASE}/data/latest/amfi_raw.json`                       : "/api/amfi-raw",
  funds:    IS_PROD ? `${R2_BASE}/data/latest/fund-analytics.json`                 : "/api/funds",
  etfs:     IS_PROD ? `${R2_BASE}/data/latest/etf-analytics.json`                  : "/api/etfs",
  insights: IS_PROD ? `${R2_BASE}/data/latest/industry-and-category-insights.json` : "/api/insights",
  manifest: IS_PROD ? `${R2_BASE}/data/latest/manifest.json`                       : "/api/manifest",
};

/* Direct public URLs — readable from the server (RSC) in every environment,
   unlike the relative /api paths above. */
export const SERVER_DATA_URLS = {
  funds: `${R2_BASE}/data/latest/fund-analytics.json`,
  insights: `${R2_BASE}/data/latest/industry-and-category-insights.json`,
  manifest: `${R2_BASE}/data/latest/manifest.json`,
};
