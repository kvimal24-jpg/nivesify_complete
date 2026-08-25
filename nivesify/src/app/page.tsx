import LandingClient from "./page.client";
import { getR2Json } from "@/lib/r2";
import { SERVER_DATA_URLS } from "@/lib/data-endpoints";
import { type LiveFund, type Manifest, type InsightRow, type LandingData, buildLandingData } from "@/lib/landing-shared";

/* Landing is rendered per-request with live numbers baked into the HTML
   (SEO + instant first paint). R2 binding when available on Workers,
   public dataset URLs otherwise. */
export const dynamic = "force-dynamic";

async function loadLandingData(): Promise<LandingData | null> {
  try {
    let funds = await getR2Json<LiveFund[]>("data/latest/fund-analytics.json");
    let manifest = await getR2Json<Manifest>("data/latest/manifest.json");
    let insights = await getR2Json<InsightRow[]>("data/latest/industry-and-category-insights.json");

    if (!funds || !manifest || !insights) {
      const [f2, m2, i2] = await Promise.all([
        fetch(SERVER_DATA_URLS.funds, { next: { revalidate: 3600 } }).then(r => r.ok ? r.json() as Promise<LiveFund[]> : null).catch(() => null),
        fetch(SERVER_DATA_URLS.manifest, { next: { revalidate: 3600 } }).then(r => r.ok ? r.json() as Promise<Manifest> : null).catch(() => null),
        fetch(SERVER_DATA_URLS.insights, { next: { revalidate: 3600 } }).then(r => r.ok ? r.json() as Promise<InsightRow[]> : null).catch(() => null),
      ]);
      funds ??= f2; manifest ??= m2; insights ??= i2;
    }

    if (!funds || !manifest || !insights) return null;
    return buildLandingData(funds, manifest, insights);
  } catch {
    return null;
  }
}

export default async function Home() {
  const data = await loadLandingData();
  return <LandingClient server={data} />;
}
