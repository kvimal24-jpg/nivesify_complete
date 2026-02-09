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
      
      <main className="bg-[#F5F6F3] text-[#1F2937] min-h-screen">

        {/* ================= HERO ================= */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-6 pt-40 pb-20">

          {/* Fog / Noise */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-[#1F2937]/5 rounded-full blur-[160px]" />
            <div className="absolute bottom-1/3 right-1/4 w-[420px] h-[420px] bg-[#6B7C70]/10 rounded-full blur-[140px]" />
          </div>

          {/* Compass Graphic */}
          <div className="absolute left-1/2 top-1/2 w-[260px] h-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4A5D4E]/30 pointer-events-none opacity-60">
            <div className="absolute inset-6 rounded-full border border-[#4A5D4E]/20"></div>
            <div className="absolute left-1/2 top-0 h-full w-px bg-[#4A5D4E]/40"></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-[#4A5D4E]/40"></div>
            <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-[#BDA06D] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          </div>

          {/* Hero Copy */}
          <div className="relative max-w-4xl text-center space-y-10 z-10">

            <p className="text-sm uppercase tracking-[0.35em] text-[#6B7C70] font-serif">
              a clearer way for Indian investors to think about money
            </p>

            <h1 className="text-6xl md:text-8xl font-serif tracking-tight leading-[0.95] lowercase text-[#1F2937]">
              stop chasing money
              <br />
              <span className="text-[#4A5D4E]">start finding direction</span>
            </h1>

            <p className="text-xl md:text-2xl font-serif italic text-[#6B7C70]">
              Thoughtful Money, Better Life
            </p>

            <div className="max-w-2xl mx-auto space-y-4">
              <p className="text-lg font-serif leading-relaxed text-[#1F2937]/90">
                You earn. You save. You invest.
                Yet the worry doesn’t leave.
              </p>
              <p className="text-lg font-serif leading-relaxed text-[#1F2937]/90">
                Nivesify helps you understand where you stand,
                where you are headed,
                and when money can finally stop being the problem.
              </p>
            </div>

            {/* HERO SIGNPOSTS */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
              {[
                { label: 'Know your net worth', sub: 'All assets together' },
                { label: 'Analyse your funds', sub: 'CAS-based diagnosis' },
                { label: 'Pick better funds', sub: 'Active & index logic' },
                { label: 'Plan life goals', sub: 'FIRE, retirement, breaks' }
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="mt-1 w-2 h-2 rounded-full bg-[#BDA06D] shrink-0"></div>
                  <div>
                    <p className="font-serif text-sm text-[#1F2937]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[#6B7C70] font-serif italic">
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <JourneyButton />
          </div>
        </section>

        {/* ================= STUDY DOORS ================= */}
        <section className="max-w-6xl mx-auto py-40 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

            {[
              {
                title: 'My Money Dashboard',
                desc: 'Add all your investments — mutual funds, PF, fixed deposits, gold, cash. See your full financial picture and future direction in one place.',
                quote: 'Know where you stand.',
                icon: (
                  <svg width="40" height="40" fill="none" stroke="#4A5D4E" strokeWidth="1.5">
                    <rect x="6" y="6" width="28" height="28" rx="4" />
                    <path d="M12 20h16M12 26h10" />
                  </svg>
                )
              },
              {
                title: 'Mutual Fund Health Check',
                desc: 'Upload your CAS. See portfolio and fund-level XIRR, compare with benchmarks, and get clear actions — keep, reduce, or exit.',
                quote: 'Let returns justify effort.',
                icon: (
                  <svg width="40" height="40" fill="none" stroke="#4A5D4E" strokeWidth="1.5">
                    <path d="M10 28V12M20 28V8M30 28V18" />
                  </svg>
                )
              },
              {
                title: 'Mutual Fund Analysis',
                desc: 'Industry-wide insights, category strength, and plain-language methodology before you pick active or index funds.',
                quote: 'Start with the industry map.',
                icon: (
                  <svg width="40" height="40" fill="none" stroke="#4A5D4E" strokeWidth="1.5">
                    <path d="M6 10h28M6 20h20M6 30h24" />
                  </svg>
                )
              },
              {
                title: 'Life Calculators',
                desc: 'Retirement, FIRE, education, sabbaticals, big purchases. Model real life decisions, not just investment returns.',
                quote: 'Decide with clarity.',
                icon: (
                  <svg width="40" height="40" fill="none" stroke="#4A5D4E" strokeWidth="1.5">
                    <path d="M8 10h24v20H8z" />
                    <path d="M12 16h16M12 22h10" />
                  </svg>
                )
              }
            ].map((card, i) => {
              const cardBody = (
                <div
                  className="relative p-12 bg-white rounded-[32px]
                  shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]
                  hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="absolute top-6 right-6 w-14 h-14 rounded-full bg-[#4A5D4E]/10 flex items-center justify-center">
                    {card.icon}
                  </div>

                  {/* Accent */}
                  <div className="h-1 w-14 rounded-full bg-gradient-to-r from-[#4A5D4E] to-[#BDA06D] mb-8"></div>

                  <h3 className="text-3xl font-serif mb-6 text-[#1F2937]">
                    {card.title}
                  </h3>

                  <p className="text-[17px] font-serif leading-relaxed text-[#1F2937]/80">
                    {card.desc}
                  </p>

                  <p className="mt-8 font-serif italic text-sm text-[#4A5D4E]">
                    “{card.quote}”
                  </p>
                </div>
              );

              if (card.title === 'Mutual Fund Health Check') {
                return (
                  <Link key={i} href="/mutual-fund-health-check/dashboard" className="block">
                    {cardBody}
                  </Link>
                );
              }

              if (card.title === 'My Money Dashboard') {
                return (
                  <Link key={i} href="/dashboard" className="block">
                    {cardBody}
                  </Link>
                );
              }

              if (card.title === 'Life Calculators') {
                return (
                  <Link key={i} href="/dashboard/calculators" className="block">
                    {cardBody}
                  </Link>
                );
              }

              if (card.title === 'Mutual Fund Analysis') {
                return (
                  <Link key={i} href="/mutual-fund-analysis" className="block">
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