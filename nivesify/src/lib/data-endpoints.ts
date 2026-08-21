const IS_PROD = process.env.NODE_ENV === "production";

const R2_BASE = process.env.NEXT_PUBLIC_R2_BASE_URL ?? "";

function buildPath(filename: string, fallback: string): string {
  if (IS_PROD && R2_BASE) {
    const base = R2_BASE.replace(/\/+$/, "");
    return `${base}/data/latest/${filename}`;
  }
  return fallback;
}

export const DATA_ENDPOINTS = {
  amfiRaw: buildPath("amfi_raw.json", "/api/amfi-raw"),
  funds: buildPath("fund-analytics.json", "/api/funds"),
  etfs: buildPath("etf-analytics.json", "/api/etfs"),
  insights: buildPath("industry-and-category-insights.json", "/api/insights"),
  manifest: buildPath("manifest.json", "/api/manifest"),
};
