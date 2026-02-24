import Link from "next/link";

/* ─────────────────────────────────────────────────────────────────────────
   DISCLAIMER PAGE
   Critical for any financial content platform. Clean, readable, honest.
   Matches editorial theme.
────────────────────────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    title: "Not financial advice.",
    body: `All content, tools, data, calculators, fund analysis, XIRR figures, alpha scores, benchmark comparisons, and any other information on Nivesify is provided for educational and informational purposes only. Nothing on this platform constitutes financial advice, investment advice, trading advice, or any other form of professional financial guidance.

You should not make any investment decision based solely on information from Nivesify. Always consult a qualified SEBI-registered investment advisor before making investment decisions.`,
  },
  {
    title: "Past performance is not a guarantee.",
    body: `All return figures, XIRR calculations, CAGR numbers, and performance charts shown on Nivesify are based on historical data. Past performance of any mutual fund or investment vehicle does not guarantee or indicate future performance.

Mutual fund investments are subject to market risk. The value of your investments can go up or down. You may receive less than you invested.`,
  },
  {
    title: "We are not SEBI-registered.",
    body: `Nivesify is not registered as a Research Analyst, Investment Advisor, or Portfolio Manager under SEBI regulations. We do not provide personalised investment recommendations or portfolio management services.

Fund signals (Hold / Review / Exit) shown in the Fund Health Check tool are based on quantitative analysis of historical data and are informational in nature — not recommendations to buy, sell, or hold any specific fund.`,
  },
  {
    title: "Data accuracy.",
    body: `While we strive to ensure the accuracy of all data displayed on Nivesify, we cannot guarantee that all information is complete, current, or free of errors. Mutual fund NAV, returns, AUM, and other data are sourced from publicly available databases and may be subject to delays or inaccuracies.

Users should verify all information independently before relying on it for any purpose.`,
  },
  {
    title: "Your CAS data.",
    body: `When you upload your Consolidated Account Statement (CAS) for portfolio analysis, this data is processed locally in your browser for calculation purposes. We do not store, sell, or share your personal financial data with third parties. Please review our Privacy Policy for complete details.`,
  },
  {
    title: "No conflicts of interest.",
    body: `Nivesify does not receive commission, kickbacks, referral fees, or any other form of compensation from mutual fund houses, distributors, or financial product companies. We have no financial incentive to recommend any specific fund or product. Our tools and analysis are built to be objective and independent.`,
  },
  {
    title: "Third-party links.",
    body: `Nivesify may contain links to third-party websites or services. We are not responsible for the content, accuracy, or practices of these external sites. The inclusion of any link does not imply endorsement.`,
  },
  {
    title: "Changes to this disclaimer.",
    body: `We reserve the right to update or modify this disclaimer at any time. Continued use of Nivesify after any changes constitutes your acceptance of the updated disclaimer.`,
  },
];

export default function DisclaimerPage() {
  return (
    <main style={{ background: "#FAF9F6", minHeight: "100vh", fontFamily: "'DM Sans',system-ui,sans-serif", color: "#0B0F1A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,300&family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <section style={{ background: "#0B0F1A", padding: "clamp(48px,8vw,96px) clamp(16px,4vw,48px) clamp(40px,6vw,72px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -80, width: 400, height: 400, background: "radial-gradient(circle,rgba(239,68,68,.08) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 100, padding: "5px 14px", marginBottom: 22 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", letterSpacing: ".09em", textTransform: "uppercase" as const }}>Important · Please Read</span>
          </div>
          <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(1.8rem,5vw,3.2rem)", fontWeight: 900, color: "white", lineHeight: 1.08, letterSpacing: "-.04em", margin: "0 0 18px" }}>
            Disclaimer
          </h1>
          <p style={{ fontSize: "clamp(14px,1.8vw,16px)", color: "rgba(255,255,255,.52)", lineHeight: 1.78 }}>
            Please read this carefully. Nivesify is an educational platform. We are not a financial advisor, broker, or SEBI-registered entity.
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.28)", marginTop: 14 }}>
            Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </section>

      {/* Warning banner */}
      <div style={{ background: "#FEF2F2", borderBottom: "1px solid #FECACA" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px clamp(16px,4vw,32px)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: 13, color: "#991B1B", fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
            Mutual fund investments are subject to market risk. Past performance does not guarantee future returns. Nothing on Nivesify is financial advice. Please consult a SEBI-registered advisor before investing.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px,6vw,72px) clamp(16px,4vw,32px)" }}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 40 }}>
          {SECTIONS.map((s, i) => (
            <div key={i} style={{ borderBottom: "1px solid #E4E0D8", paddingBottom: 36 }}>
              <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(1.1rem,2.2vw,1.4rem)", fontWeight: 700, color: "#0B0F1A", letterSpacing: "-.02em", margin: "0 0 12px" }}>
                {i + 1}. {s.title}
              </h2>
              {s.body.split("\n\n").map((para, j) => (
                <p key={j} style={{ fontSize: "clamp(13px,1.5vw,14.5px)", color: "#475569", lineHeight: 1.85, margin: j < s.body.split("\n\n").length - 1 ? "0 0 14px" : "0" }}>
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div style={{ marginTop: 48, padding: "24px", background: "#F1EFE9", borderRadius: 16, border: "1px solid #E4E0D8" }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0B0F1A", margin: "0 0 12px" }}>Related policies</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            {[["Privacy Policy", "/privacy"], ["About Nivesify", "/about"]].map(([l, h]) => (
              <Link key={h} href={h} style={{ fontSize: 13, fontWeight: 600, color: "#2563EB", textDecoration: "none" }}>
                {l} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}