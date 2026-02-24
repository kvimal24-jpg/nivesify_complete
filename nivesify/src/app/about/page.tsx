"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────────────────
   ABOUT PAGE — Editorial Finance theme
   Warm, human, honest. Not a corporate "About Us."
   Tells the WHY behind Nivesify.
────────────────────────────────────────────────────────────────────────── */

function SR({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setV(true), delay); ob.disconnect(); }
    }, { threshold: 0.06 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [delay]);
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(24px)", transition: "opacity .65s ease, transform .65s ease" }}>
      {children}
    </div>
  );
}

const TOOLS = [
  { icon: "📊", label: "Money Dashboard",       desc: "Unified net worth across MF, PF, FD, gold & cash" },
  { icon: "🏥", label: "Fund Health Check",      desc: "True XIRR, benchmark alpha, Hold/Review/Exit signals" },
  { icon: "🗺️", label: "Smart Fund Finder",     desc: "Match funds to your goals using live data" },
  { icon: "📊", label: "MF Industry Analysis",   desc: "Market-wide performance tables & category insights" },
  { icon: "⚡", label: "Active Funds Explorer",  desc: "Alpha, IR, and composite scoring across all active funds" },
  { icon: "📈", label: "Index Funds Explorer",   desc: "Tracking difference, benchmark fit & cost comparison" },
  { icon: "🎯", label: "Quick Fund Picks",       desc: "Instant fund picks based on your profile & goals" },
  { icon: "🏗️", label: "Lifetime Plan",          desc: "Multi-phase allocation for 10, 20, 30-year goals" },
  { icon: "🧮", label: "Life Calculators",       desc: "FIRE, retirement, education, home — plan backwards from your goal" },
  { icon: "📖", label: "Why Mutual Funds?",      desc: "The complete beginner guide — no jargon" },
];

export default function AboutPage() {
  return (
    <main style={{ background: "#FAF9F6", minHeight: "100vh", fontFamily: "'DM Sans',system-ui,sans-serif", color: "#0B0F1A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* ── HERO ── */}
      <section style={{ background: "#0B0F1A", padding: "clamp(56px,9vw,110px) clamp(16px,4vw,48px) clamp(48px,7vw,88px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -150, right: -100, width: 500, height: 500, background: "radial-gradient(circle,rgba(0,201,123,.10) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.25)", borderRadius: 100, padding: "5px 14px", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#00C97B", letterSpacing: ".09em", textTransform: "uppercase" as const }}>About Nivesify</span>
          </div>
          <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(2rem,5.5vw,3.8rem)", fontWeight: 900, color: "white", lineHeight: 1.07, letterSpacing: "-.04em", margin: "0 0 22px" }}>
            Built because someone had to.
          </h1>
          <p style={{ fontSize: "clamp(15px,2vw,18px)", color: "rgba(255,255,255,.58)", lineHeight: 1.82, maxWidth: 580 }}>
            Nivesify is a free, honest financial clarity platform for salaried Indians — the kind of people who have SIPs running but aren't sure if they're working.
          </p>
        </div>
      </section>

      {/* ── THE STORY ── */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(48px,7vw,80px) clamp(16px,4vw,32px)" }}>
        <SR>
          <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(1.4rem,3.5vw,2.2rem)", fontWeight: 700, fontStyle: "italic", color: "#0B0F1A", lineHeight: 1.2, letterSpacing: "-.03em", margin: "0 0 20px" }}>
            The problem we're solving.
          </h2>
          <p style={{ fontSize: "clamp(14px,1.7vw,16px)", color: "#475569", lineHeight: 1.88, margin: "0 0 18px" }}>
            Most salaried Indians are doing the right things — running SIPs, keeping an FD, contributing to PF. But ask them: <em>"Is your money actually working?"</em> — and the honest answer is usually <strong style={{ color: "#0B0F1A" }}>"I don't know."</strong>
          </p>
          <p style={{ fontSize: "clamp(14px,1.7vw,16px)", color: "#475569", lineHeight: 1.88, margin: "0 0 18px" }}>
            Their fund's brochure says 18%. But their actual XIRR, accounting for every SIP date and market move, might be 9%. They're underperforming their benchmark and don't know it. They have money in four different places and no idea what the total looks like. They want to retire at 50, but have no idea if the numbers work.
          </p>
          <p style={{ fontSize: "clamp(14px,1.7vw,16px)", color: "#475569", lineHeight: 1.88, margin: "0 0 18px" }}>
            Every tool that exists either requires expertise to use, is buried inside a broker app trying to sell you something, or just shows you a number without telling you what to do with it.
          </p>
          <p style={{ fontSize: "clamp(14px,1.7vw,16px)", color: "#0B0F1A", fontWeight: 700, lineHeight: 1.82 }}>
            Nivesify was built to fill that gap — clearly, honestly, and for free.
          </p>
        </SR>
      </section>

      {/* ── PHILOSOPHY BLOCK ── */}
      <section style={{ background: "#0B0F1A", padding: "clamp(40px,6vw,72px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <SR>
            <div style={{ borderLeft: "3px solid #00C97B", paddingLeft: 24 }}>
              <p style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.1rem,2.5vw,1.6rem)", color: "rgba(255,255,255,.85)", lineHeight: 1.55, margin: "0 0 14px" }}>
                "Enough is not a number. It is the moment money stops interfering with life."
              </p>
              <p style={{ fontSize: "clamp(13px,1.5vw,14px)", color: "rgba(255,255,255,.35)", fontWeight: 600 }}>
                — The philosophy behind Nivesify
              </p>
            </div>
            <p style={{ fontSize: "clamp(13px,1.6vw,15px)", color: "rgba(255,255,255,.52)", lineHeight: 1.85, marginTop: 28, maxWidth: 580 }}>
              We believe the goal of financial planning isn't to maximise returns at all costs — it's to reach a state where money enables your life, rather than consuming your attention. We call this <strong style={{ color: "#00C97B" }}>Thoughtful Money</strong>.
            </p>
          </SR>
        </div>
      </section>

      {/* ── WHAT'S ON THE PLATFORM ── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(48px,7vw,80px) clamp(16px,4vw,48px)" }}>
        <SR>
          <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 900, color: "#0B0F1A", letterSpacing: "-.03em", margin: "0 0 8px" }}>
            25+ free tools. All in one place.
          </h2>
          <p style={{ fontSize: "clamp(13px,1.5vw,14.5px)", color: "#64748B", margin: "0 0 32px" }}>
            No subscriptions. No ads. No product recommendations with hidden commissions.
          </p>
        </SR>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
          {TOOLS.map((t, i) => (
            <SR key={i} delay={i * 40}>
              <div style={{ background: "white", border: "1.5px solid #E4E0D8", borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0B0F1A", marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              </div>
            </SR>
          ))}
        </div>
      </section>

      {/* ── PRINCIPLES ── */}
      <section style={{ background: "#F1EFE9", borderTop: "1px solid #E4E0D8", borderBottom: "1px solid #E4E0D8", padding: "clamp(40px,6vw,72px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <SR>
            <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 900, color: "#0B0F1A", letterSpacing: "-.03em", margin: "0 0 32px" }}>
              What we stand for.
            </h2>
          </SR>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
            {[
              { icon: "🚫", title: "No ads. Ever.",          body: "We will never show ads or be paid to recommend financial products. Our interests are aligned with yours, not advertisers'." },
              { icon: "🔍", title: "Radical transparency.",  body: "Every metric we show — XIRR, alpha, tracking difference — is calculated from real data using methods we explain openly." },
              { icon: "🗣️", title: "Plain language.",        body: "No jargon without explanation. If you don't understand something, that's our failure, not yours." },
              { icon: "🆓", title: "Always free.",           body: "Core tools will always be free. We believe financial clarity should not be a privilege of the wealthy." },
            ].map((p, i) => (
              <SR key={i} delay={i * 60}>
                <div style={{ background: "white", border: "1.5px solid #E4E0D8", borderRadius: 18, padding: "22px 20px" }}>
                  <div style={{ fontSize: 26, marginBottom: 12 }}>{p.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0B0F1A", marginBottom: 8 }}>{p.title}</div>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.72, margin: 0 }}>{p.body}</p>
                </div>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(48px,7vw,80px) clamp(16px,4vw,32px)", textAlign: "center" as const }}>
        <SR>
          <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(1.4rem,3.5vw,2.2rem)", fontWeight: 900, color: "#0B0F1A", letterSpacing: "-.03em", margin: "0 0 14px" }}>
            Ready to get started?
          </h2>
          <p style={{ fontSize: "clamp(13px,1.6vw,15px)", color: "#64748B", lineHeight: 1.82, margin: "0 0 28px" }}>
            No sign-up needed to explore most of the platform.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <Link href="/mutual-fund-health-check" style={{ textDecoration: "none" }}>
              <div style={{ background: "#0B0F1A", color: "white", borderRadius: 14, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "transform .18s, box-shadow .18s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
                🏥 Check My Portfolio
              </div>
            </Link>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <div style={{ background: "white", color: "#0B0F1A", border: "1.5px solid #E4E0D8", borderRadius: 14, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                📊 Open Dashboard
              </div>
            </Link>
          </div>
        </SR>
      </section>
    </main>
  );
}