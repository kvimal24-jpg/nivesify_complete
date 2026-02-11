import type { Metadata } from "next";
import PassiveFundsExplorer from "@/components/PassiveFundsExplorer";
import AnalysisTabs from "@/components/AnalysisTabs";
import { getBaseUrl } from "@/lib/base-url";
import type { ETFAnalytics, Manifest } from "@/lib/fund-types";

export const metadata: Metadata = {
  title: "Index Fund Guide",
  description: "Compare trackers by benchmark fit, tracking difference, and liquidity.",
  alternates: {
    canonical: "https://nivesify.com/index-funds",
  },
  openGraph: {
    title: "Index Fund Guide | Nivesify",
    description: "Compare trackers by benchmark fit, tracking difference, and liquidity.",
    url: "https://nivesify.com/index-funds",
    siteName: "Nivesify",
    locale: "en_US",
    type: "website",
  },
};

const fetchJson = async <T,>(baseUrl: string, path: string): Promise<T> => {
  const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return res.json() as Promise<T>;
};

export default async function IndexFundsPage() {
  const baseUrl = getBaseUrl();
  const [etfs, manifest] = await Promise.all([
    fetchJson<ETFAnalytics[]>(baseUrl, "/api/etfs"),
    fetchJson<Manifest>(baseUrl, "/api/manifest"),
  ]);

  return (
    <div className="bg-gradient-to-br from-[#F4F7F2] via-[#F7F2E7] to-[#EDF1F6] text-[#1F2937] min-h-screen">
      <section className="max-w-6xl mx-auto px-5 pt-14 pb-10">
        <div className="mb-8">
          <AnalysisTabs />
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">Index Fund Guide</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-serif tracking-tight">Simple rules, precise tracking.</h1>
        <p className="mt-3 max-w-2xl text-sm font-serif text-[#4A5D4E] leading-relaxed">
          Spot trackers with tight tracking difference and enough AUM to stay liquid.
        </p>
        <details className="mt-3 max-w-2xl text-sm font-serif text-[#4A5D4E]">
          <summary className="cursor-pointer text-xs uppercase tracking-[0.3em] text-[#6B7C70]">How to use</summary>
          <p className="mt-2">
            Start with Insights for the market snapshot, then Shortlisted for quick picks. Use the Screener
            when you want to dial thresholds.
          </p>
        </details>

        <PassiveFundsExplorer
          etfs={etfs}
          manifest={manifest}
        />

        <div className="mt-12 text-xs font-serif text-[#6B7C70]">
          This content is for informational purposes only and does not constitute investment advice. Past
          performance is not indicative of future results. Please consult a licensed advisor before making
          investment decisions.
        </div>
      </section>
    </div>
  );
}
