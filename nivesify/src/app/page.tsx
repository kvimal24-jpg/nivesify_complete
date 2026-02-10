import JourneyButton from '@/components/JourneyButton';
import Header from '@/components/Header'; // We import Header here or in Layout
import Link from 'next/link';
import { homeMetadata } from "./page.metadata";

export const metadata = homeMetadata;

export default function Home() {
  return (
    <>
      {/* We are manually adding Header here if not in Layout, 
          but usually Header goes in layout.tsx. 
          For now, let's stick to your layout structure. */}
      
      <main className="bg-[#F5F8FF] text-[#1F2937] min-h-screen">

        {/* ================= HERO ================= */}
        <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden px-6 pt-14 pb-8">

          {/* Fog / Noise */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-[#2F5D7C]/10 rounded-full blur-[160px]" />
            <div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-[#9BB4D6]/20 rounded-full blur-[140px]" />
          </div>

          {/* Compass Graphic */}
          <div className="absolute left-1/2 top-1/2 w-[240px] h-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#2F5D7C]/30 pointer-events-none opacity-60">
            <div className="absolute inset-6 rounded-full border border-[#2F5D7C]/20"></div>
            <div className="absolute left-1/2 top-0 h-full w-px bg-[#2F5D7C]/40"></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-[#2F5D7C]/40"></div>
            <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-[#9BB4D6] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          </div>

          {/* Hero Copy */}
          <div className="relative max-w-4xl text-center space-y-4 z-10">

            <p className="text-[11px] uppercase tracking-[0.32em] text-[#6B7C70] font-serif">
              a clearer way for Indian investors to think about money
            </p>

            <h1 className="text-3xl md:text-5xl font-serif tracking-tight leading-[1.05] lowercase text-[#1F2937]">
              stop chasing money
              <br />
              <span className="text-[#2F5D7C]">start finding direction</span>
            </h1>

            <p className="text-sm md:text-lg font-serif italic text-[#6B7C70]">
              Thoughtful Money, Better Life
            </p>

            <div className="max-w-2xl mx-auto">
              <p className="text-xs md:text-sm font-serif leading-relaxed text-[#1F2937]/90">
                One view for your net worth, fund health, and next moves.
              </p>
            </div>

            {/* HERO SIGNPOSTS */}

          </div>
        </section>

        {/* ================= STUDY DOORS ================= */}
        <section className="max-w-6xl mx-auto py-16 px-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7C70] font-serif">What you can do</p>
              <h2 className="text-2xl md:text-4xl font-serif text-[#1F2937]">A single home for your money.</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 items-stretch">

            {[
              {
                title: 'My Money Dashboard',
                desc: 'Add all your investments — mutual funds, PF, fixed deposits, gold, cash. See your full financial picture and future direction in one place.',
                quote: 'Know where you stand.',
                icon: (
                  <svg width="36" height="36" fill="none" stroke="#2F5D7C" strokeWidth="1.6">
                    <rect x="6" y="6" width="24" height="24" rx="4" />
                    <path d="M11 18h14M11 24h9" />
                  </svg>
                )
              },
              {
                title: 'Mutual Fund Health Check',
                desc: 'Upload your CAS. See portfolio and fund-level XIRR, compare with benchmarks, and get clear actions — keep, reduce, or exit.',
                quote: 'Let returns justify effort.',
                icon: (
                  <svg width="36" height="36" fill="none" stroke="#2F5D7C" strokeWidth="1.6">
                    <path d="M9 26V12M18 26V9M27 26V16" />
                  </svg>
                )
              },
              {
                title: 'Mutual Fund Analysis',
                desc: 'Industry-wide insights, category strength, and plain-language methodology before you pick active or index funds.',
                quote: 'Start with the industry map.',
                icon: (
                  <svg width="36" height="36" fill="none" stroke="#2F5D7C" strokeWidth="1.6">
                    <path d="M6 10h24M6 18h18M6 26h20" />
                  </svg>
                )
              },
              {
                title: 'Life Calculators',
                desc: 'Retirement, FIRE, education, sabbaticals, big purchases. Model real life decisions, not just investment returns.',
                quote: 'Decide with clarity.',
                icon: (
                  <svg width="36" height="36" fill="none" stroke="#2F5D7C" strokeWidth="1.6">
                    <path d="M8 10h20v18H8z" />
                    <path d="M11 16h14M11 22h9" />
                  </svg>
                )
              }
            ].map((card, i) => {
              const cardBody = (
                <div
                  className="relative h-full min-h-[220px] p-5 bg-white rounded-[24px]
                  shadow-[0_16px_34px_-24px_rgba(0,0,0,0.25)]
                  hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Icon */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#2F5D7C]/10 flex items-center justify-center">
                    {card.icon}
                  </div>

                  {/* Accent */}
                  <div className="h-1 w-10 rounded-full bg-gradient-to-r from-[#2F5D7C] to-[#9BB4D6] mb-4"></div>

                  <h3 className="text-lg font-serif mb-3 text-[#1F2937]">
                    {card.title}
                  </h3>

                  <p className="text-xs font-serif leading-relaxed text-[#1F2937]/80">
                    {card.desc.split(".")[0]}.
                  </p>
                  <details className="mt-2">
                    <summary className="text-[11px] uppercase tracking-[0.2em] text-[#2F5D7C] cursor-pointer">Details</summary>
                    <p className="mt-2 text-xs text-[#6B7C70]">
                      {card.desc}
                    </p>
                  </details>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="font-serif italic text-[11px] text-[#2F5D7C]">
                    “{card.quote}”
                    </p>
                    <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
                      <rect x="1" y="9" width="10" height="14" rx="4" fill="#2F5D7C" />
                      <rect x="16" y="5" width="10" height="18" rx="4" fill="#9BB4D6" />
                      <rect x="31" y="12" width="10" height="11" rx="4" fill="#3F5E83" />
                      <rect x="46" y="3" width="10" height="20" rx="4" fill="#6B7C70" />
                      <rect x="61" y="7" width="10" height="16" rx="4" fill="#8B3A3A" />
                    </svg>
                  </div>
                </div>
              );

              if (card.title === 'Mutual Fund Health Check') {
                return (
                  <Link key={i} href="/mutual-fund-health-check/dashboard" className="block h-full">
                    {cardBody}
                  </Link>
                );
              }

              if (card.title === 'My Money Dashboard') {
                return (
                  <Link key={i} href="/dashboard" className="block h-full">
                    {cardBody}
                  </Link>
                );
              }

              if (card.title === 'Life Calculators') {
                return (
                  <Link key={i} href="/dashboard/calculators" className="block h-full">
                    {cardBody}
                  </Link>
                );
              }

              if (card.title === 'Mutual Fund Analysis') {
                return (
                  <Link key={i} href="/mutual-fund-analysis" className="block h-full">
                    {cardBody}
                  </Link>
                );
              }

              return (
                <div key={i}>
                  {cardBody}
                </div>
              );
            })}

          </div>
        </section>

      </main>
    </>
  );
}