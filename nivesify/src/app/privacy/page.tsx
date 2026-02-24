import Link from "next/link";

/* ─────────────────────────────────────────────────────────────────────────
   PRIVACY POLICY PAGE
   Clear, honest, no legalese fog. Matches editorial theme.
────────────────────────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    title: "What we collect",
    items: [
      { label: "Google Sign-In", body: "If you choose to sign in with Google, we receive your name, email address, and profile picture from Google. This is used only to maintain your session and, optionally, to associate your data with your account." },
      { label: "CAS Upload Data", body: "When you upload your Consolidated Account Statement (CAS), the data is processed entirely in your browser. We do not transmit your CAS file or the financial data extracted from it to our servers. Your portfolio remains private to you." },
      { label: "Usage Analytics", body: "We may collect anonymised, aggregated data about how pages are used — such as page views and feature usage — to improve the platform. This data contains no personally identifiable information." },
      { label: "Cookies", body: "We use minimal cookies necessary for authentication (if you sign in) and basic session management. We do not use cookies for advertising or cross-site tracking." },
    ],
  },
  {
    title: "What we do not collect",
    items: [
      { label: "We never collect", body: "Your bank account details, credit card information, Aadhaar number, PAN number, or any other sensitive financial identity information. Nivesify has no mechanism to collect these and does not require them." },
      { label: "We never sell", body: "Your data — personal or financial — is never sold, rented, or shared with advertisers, data brokers, or third-party marketers. Full stop." },
    ],
  },
  {
    title: "How we use your information",
    items: [
      { label: "To provide services", body: "Your sign-in information is used to maintain your authenticated session. Any preferences or saved data you create are stored to personalise your experience." },
      { label: "To improve the platform", body: "Aggregated, anonymised analytics help us understand which features are most useful and where we can improve." },
      { label: "No marketing emails", body: "We will not send you unsolicited marketing emails. If we ever send notifications, they will be strictly related to the platform and you will be able to opt out." },
    ],
  },
  {
    title: "Data security",
    items: [
      { label: "Storage", body: "Any account data we store is protected using industry-standard encryption in transit (HTTPS) and at rest." },
      { label: "CAS data", body: "As noted above, CAS data is processed client-side and not transmitted to our servers. This is by design — your most sensitive financial information never leaves your device." },
      { label: "No guarantees", body: "While we take all reasonable precautions, no internet-based system can guarantee absolute security. Please use Nivesify with appropriate care." },
    ],
  },
  {
    title: "Third-party services",
    items: [
      { label: "Google Sign-In", body: "We use Google OAuth for authentication. Google's own privacy policy governs their data practices. We only receive the basic profile information Google provides." },
      { label: "Font loading", body: "We load fonts from Google Fonts. This may involve a request to Google's servers. No personal data is transmitted in this process beyond your IP address, which Google may log per their privacy policy." },
      { label: "Mutual fund data", body: "Fund performance data is sourced from public databases. We do not share any of your personal data with these data sources." },
    ],
  },
  {
    title: "Your rights",
    items: [
      { label: "Access & deletion", body: "You may request access to any personal data we hold about you, or request its deletion, by contacting us. If you are signed in, you can delete your account and associated data at any time." },
      { label: "No account needed", body: "Most of Nivesify's tools work without any sign-in. You are not required to create an account to use the platform." },
    ],
  },
  {
    title: "Changes to this policy",
    items: [
      { label: "Updates", body: "We may update this Privacy Policy as the platform evolves. We will note the date of the last update at the top of this page. Significant changes will be communicated clearly." },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ background: "#FAF9F6", minHeight: "100vh", fontFamily: "'DM Sans',system-ui,sans-serif", color: "#0B0F1A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,300&family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <section style={{ background: "#0B0F1A", padding: "clamp(48px,8vw,96px) clamp(16px,4vw,48px) clamp(40px,6vw,72px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, left: -80, width: 400, height: 400, background: "radial-gradient(circle,rgba(37,99,235,.10) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(37,99,235,.12)", border: "1px solid rgba(37,99,235,.28)", borderRadius: 100, padding: "5px 14px", marginBottom: 22 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: ".09em", textTransform: "uppercase" as const }}>Your Privacy Matters</span>
          </div>
          <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(1.8rem,5vw,3.2rem)", fontWeight: 900, color: "white", lineHeight: 1.08, letterSpacing: "-.04em", margin: "0 0 18px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "clamp(14px,1.8vw,16px)", color: "rgba(255,255,255,.52)", lineHeight: 1.78 }}>
            Short version: We don't sell your data. We barely collect it. Your CAS data never leaves your device. Here's the full picture.
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.28)", marginTop: 14 }}>
            Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </section>

      {/* TL;DR Banner */}
      <div style={{ background: "#ECFDF5", borderBottom: "1px solid #A7F3D0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px clamp(16px,4vw,32px)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#065F46", margin: "0 0 8px" }}>TL;DR — The simple version:</p>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
            {[
              "✅ Your CAS data is processed in your browser. It never reaches our servers.",
              "✅ We don't sell your data to anyone.",
              "✅ We don't run ads. Ever.",
              "✅ You can use most of the platform without signing in.",
            ].map((t, i) => (
              <p key={i} style={{ fontSize: 13, color: "#047857", margin: 0, fontWeight: 500 }}>{t}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px,6vw,72px) clamp(16px,4vw,32px)" }}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 44 }}>
          {SECTIONS.map((s, i) => (
            <div key={i} style={{ borderBottom: "1px solid #E4E0D8", paddingBottom: 40 }}>
              <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: "clamp(1.1rem,2.2vw,1.4rem)", fontWeight: 700, color: "#0B0F1A", letterSpacing: "-.02em", margin: "0 0 20px" }}>
                {i + 1}. {s.title}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                {s.items.map((item, j) => (
                  <div key={j}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#00A862", textTransform: "uppercase" as const, letterSpacing: ".07em", marginBottom: 5 }}>{item.label}</div>
                    <p style={{ fontSize: "clamp(13px,1.5vw,14.5px)", color: "#475569", lineHeight: 1.85, margin: 0 }}>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ marginTop: 48, background: "#F1EFE9", borderRadius: 16, border: "1px solid #E4E0D8", padding: "24px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0B0F1A", margin: "0 0 8px" }}>Questions about privacy?</p>
          <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.72, margin: "0 0 14px" }}>
            If you have questions about how we handle your data, please reach out. We're committed to being transparent.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
            {[["Disclaimer", "/disclaimer"], ["About Nivesify", "/about"]].map(([l, h]) => (
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