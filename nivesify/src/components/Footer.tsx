import Link from "next/link";

/* ─────────────────────────────────────────────────────────────────────────
   FOOTER — Editorial Finance theme
   Dark ink background, cream text, green accents, full sitemap
   Fraunces display + DM Sans body — matches landing page exactly
────────────────────────────────────────────────────────────────────────── */

const COLUMNS = [
  {
    heading: "Mutual Fund World",
    links: [
      { label: "Why Mutual Funds?",      href: "/why-mutual-fund" },
      { label: "Smart Fund Finder",      href: "/mutual-fund-match" },
      { label: "MF Industry Analysis",   href: "/mutual-fund-analysis" },
      { label: "Active Funds Explorer",  href: "/active-funds" },
      { label: "Index Funds Explorer",   href: "/index-funds" },
      { label: "Quick Fund Picks",       href: "/find-my-fund-quick-picks" },
      { label: "Lifetime Plan",          href: "/find-my-fund-lifetime-plan" },
    ],
  },
  {
    heading: "Portfolio Tools",
    links: [
      { label: "Fund Health Check",      href: "/mutual-fund-health-check" },
      { label: "Portfolio Dashboard",    href: "/mutual-fund-health-check/dashboard" },
      { label: "My Portfolio",           href: "/mutual-fund-health-check/portfolio" },
      { label: "Transactions",           href: "/mutual-fund-health-check/transactions" },
    ],
  },
  {
    heading: "Plan & Track",
    links: [
      { label: "Money Dashboard",        href: "/dashboard" },
      { label: "Life Calculators",       href: "/dashboard/calculators" },
      { label: "Onboarding",            href: "/dashboard/onboarding" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Nivesify",         href: "/about" },
      { label: "Disclaimer",             href: "/disclaimer" },
      { label: "Privacy Policy",         href: "/privacy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: "#0B0F1A", color: "rgba(255,255,255,.70)", fontFamily: "'DM Sans',system-ui,sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,300&family=DM+Sans:wght@400;500;600;700&display=swap');
        .ft-link {
          display: block; font-size: 13.5px; font-weight: 500;
          color: rgba(255,255,255,.52); text-decoration: none;
          padding: 4px 0; transition: color .18s;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .ft-link:hover { color: #00C97B; }
        .ft-col-head {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 10.5px; font-weight: 700; letter-spacing: .10em;
          text-transform: uppercase; color: rgba(255,255,255,.28);
          margin-bottom: 14px;
        }
        .ft-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px 20px;
        }
        @media (min-width: 640px) {
          .ft-grid { grid-template-columns: repeat(4, 1fr); gap: 24px; }
        }
        .ft-bottom-row {
          display: flex; flex-direction: column; gap: 12px;
          align-items: flex-start;
        }
        @media (min-width: 640px) {
          .ft-bottom-row { flex-direction: row; justify-content: space-between; align-items: center; }
        }
      `}</style>

      {/* Subtle glow */}
      <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, background: "radial-gradient(circle,rgba(0,201,123,.06) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, right: -100, width: 400, height: 400, background: "radial-gradient(circle,rgba(37,99,235,.05) 0%,transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(48px,7vw,80px) clamp(16px,4vw,40px) 0", position: "relative" }}>

        {/* ── TOP: brand + tagline + nav grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, marginBottom: 56 }}>

          {/* Brand block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Logo area — text fallback since logo.png is light */}
            <div>
              <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "white", letterSpacing: "-.02em" }}>
                nivesify
              </span>
              <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,201,123,.12)", border: "1px solid rgba(0,201,123,.25)", borderRadius: 100, padding: "2px 10px", fontSize: 10, fontWeight: 700, color: "#00C97B", letterSpacing: ".08em", verticalAlign: "middle" }}>
                BETA
              </span>
            </div>
            <p style={{ fontSize: "clamp(13px,1.6vw,14.5px)", color: "rgba(255,255,255,.42)", lineHeight: 1.85, maxWidth: 340, fontFamily: "'DM Sans',system-ui", fontWeight: 400 }}>
              A calm, non-transactional space for Indian investors to understand their money, reach "enough," and live better lives.
            </p>
            {/* Trust chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["✅ No ads", "✅ No spam", "✅ India-specific"].map((t, i) => (
                <span key={i} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.50)" }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Nav columns grid */}
          <div className="ft-grid">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="ft-col-head">{col.heading}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {col.links.map((l) => (
                    <Link key={l.href} href={l.href} className="ft-link">{l.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PHILOSOPHY STRIP ── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", borderBottom: "1px solid rgba(255,255,255,.07)", padding: "28px 0", margin: "0 0 28px" }}>
          <p style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1rem,2.2vw,1.3rem)", color: "rgba(255,255,255,.38)", lineHeight: 1.5, textAlign: "center" }}>
            "Enough is not a number. It is the moment money stops interfering with life."
          </p>
        </div>

        {/* ── BOTTOM: copyright + legal + tagline ── */}
        <div className="ft-bottom-row" style={{ paddingBottom: "clamp(28px,4vw,40px)" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.25)", fontFamily: "'DM Sans',system-ui" }}>
            © {new Date().getFullYear()} Nivesify. Built with restraint.
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { label: "Disclaimer", href: "/disclaimer" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "About", href: "/about" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="ft-link">{l.label}</Link>
            ))}
          </div>
          <p style={{ fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,.20)", fontFamily: "'Fraunces',Georgia,serif" }}>
            Thoughtful Money, Better Life
          </p>
        </div>
      </div>
    </footer>
  );
}