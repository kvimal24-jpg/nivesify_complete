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
    <div className="bg-[#F5F6F3] text-[#1F2937] min-h-screen">
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="mb-8">
          <AnalysisTabs />
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#6B7C70] font-serif">Index Fund Guide</p>
        <h1 className="mt-4 text-4xl md:text-5xl font-serif tracking-tight">Simple rules, precise tracking.</h1>
        <p className="mt-4 max-w-2xl text-base font-serif text-[#4A5D4E] leading-relaxed">
          Passive investing still needs discernment. Use tracking difference, AUM, and benchmark fit to
          identify clean, low-leakage trackers.
        </p>

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
