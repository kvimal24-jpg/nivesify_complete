"use client";

import type { FundAnalytics } from "@/lib/fund-types";

type SelectionGuideProps = {
  funds: FundAnalytics[];
};

export default function SelectionGuide({ funds }: SelectionGuideProps) {
  const fundCount = funds.length;
  const amcCount = new Set(funds.map((fund) => fund.AMC).filter(Boolean)).size;

  return (
    <section className="mt-8 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Selection principles</p>
        <h3 className="mt-2 text-xl md:text-2xl font-serif text-[#1F2937]">Start with fit, then refine.</h3>
        <p className="mt-2 text-sm font-serif text-[#4A5D4E] max-w-2xl">
          A short framework for suitability and mix.
        </p>
        <details className="mt-2 text-sm font-serif text-[#4A5D4E] max-w-2xl">
          <summary className="cursor-pointer text-xs uppercase tracking-[0.2em] text-[#6B7C70]">Why this matters</summary>
          <p className="mt-2">It mirrors how advisors think and keeps decisions consistent.</p>
        </details>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          {
            title: "Goal horizon",
            body: "Match equity exposure to time. Longer horizons absorb volatility better.",
          },
          {
            title: "Risk temperament",
            body: "Choose the mix you can hold through drawdowns without exiting early.",
          },
          {
            title: "Liquidity needs",
            body: "Keep short-duration buckets ready if cash flow is unpredictable.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white border border-[#E7EDF7] rounded-3xl p-3 shadow-[0_12px_30px_-24px_rgba(31,41,55,0.25)]"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-[#EEF1E9] text-[#4A5D4E]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3 7h7l-5.5 4 2 7-6-4.5L6 20l2-7L2 9h7l3-7z" />
                </svg>
              </span>
              <h3 className="text-sm font-serif text-[#1F2937]">{item.title}</h3>
            </div>
            <p className="mt-2 text-xs font-serif text-[#4A5D4E] leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-[#FFFFFF] to-[#F7F4EC] border border-[#E7EDF7] rounded-3xl p-4">
        <h3 className="text-base font-serif text-[#1F2937]">Quick selection guide</h3>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-serif text-[#4A5D4E]">
          {[
            {
              title: "Time first",
              body: "Short goals lean debt, longer goals unlock more equity.",
            },
            {
              title: "Know your temperament",
              body: "Pick a mix you can stay invested in for the full horizon.",
            },
            {
              title: "Diversify risk",
              body: "Blend equity, hybrid, and debt so one bucket can cushion the others.",
            },
            {
              title: "Review yearly",
              body: "Rebalance annually or after big life changes.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-[#E7EDF7] rounded-2xl p-3">
              <div className="flex items-center gap-2 text-[#1F2937]">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F6EBDD] text-[#8A6C3E]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span className="font-serif">{item.title}</span>
              </div>
              <p className="mt-1 text-[11px] text-[#6B7C70]">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] font-serif text-[#6B7C70]">
          Illustrative guidance only. Suitability depends on personal circumstances and should be validated with a
          licensed advisor.
        </p>
      </div>

      <div className="bg-white border border-[#E7EDF7] rounded-3xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">Portfolio mix</p>
            <h3 className="mt-2 text-base md:text-lg font-serif text-[#1F2937]">A starting allocation you can stress-test.</h3>
            <p className="mt-2 text-xs font-serif text-[#4A5D4E]">
              Use the category insights to sanity-check your split before you shortlist funds. Keep the mix simple,
              then iterate once you see how categories behave across cycles.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-serif text-[#4A5D4E]">
            <div className="bg-[#F8F9F6] border border-[#E7EDF7] rounded-2xl px-3 py-1">Funds tracked: {fundCount}</div>
            <div className="bg-[#F8F9F6] border border-[#E7EDF7] rounded-2xl px-3 py-1">AMCs covered: {amcCount}</div>
            <div className="bg-[#F8F9F6] border border-[#E7EDF7] rounded-2xl px-3 py-1">Daily refresh</div>
          </div>
        </div>
      </div>
    </section>
  );
}
