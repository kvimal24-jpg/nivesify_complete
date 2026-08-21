const IS_PROD = process.env.NODE_ENV === "production";

const R2_BASE = "https://data.nivesify.com";

function localPath(...segments: string[]): string {
  return ["/api", ...segments].join("/");
}

function buildPath(filename: string, fallback: string): string {
  return IS_PROD ? `${R2_BASE}/data/latest/${filename}` : fallback;
}

export const DATA_ENDPOINTS = {
  amfiRaw: buildPath("amfi_raw.json", localPath("amfi-raw")),
  funds: buildPath("fund-analytics.json", localPath("funds")),
  etfs: buildPath("etf-analytics.json", localPath("etfs")),
  insights: buildPath("industry-and-category-insights.json", localPath("insights")),
  manifest: buildPath("manifest.json", localPath("manifest")),
};
