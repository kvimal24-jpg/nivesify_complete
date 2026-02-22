// app/dashboard/calculators/metadata.ts
// Drop this file alongside page.tsx in the same route folder.
// Next.js App Router will automatically pick it up.

import type { Metadata } from "next";

const BASE_URL = "https://www.nivesify.com"; // ← update to your production domain

export const metadata: Metadata = {
  // ── Core ──────────────────────────────────────────────────────────────────
  title:
    "Free Mutual Fund Calculators India 2025 | SIP, Lumpsum, SWP, Retirement | Nivesify",
  description:
    "India's most complete free mutual fund calculator suite. Calculate SIP amount needed, future value of SIP & lumpsum, SWP corpus, inflation-adjusted withdrawals, and a full retirement readiness analysis — all in one place. Built for Indian investors.",

  // ── Canonical & Alternates ────────────────────────────────────────────────
  alternates: {
    canonical: `${BASE_URL}/dashboard/calculators`,
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    url: `${BASE_URL}/dashboard/calculators`,
    siteName: "Nivesify",
    title:
      "Free Mutual Fund Calculators India | SIP · Lumpsum · SWP · Retirement",
    description:
      "Plan every stage of your investment journey — from your first SIP to full retirement — with 12 free, accurate calculators built for Indian investors. Includes SIP goal, lumpsum FV, SWP, inflation-adjusted income, and a complete retirement analysis.",
    images: [
      {
        url: `${BASE_URL}/og/calculators.png`, // ← create a 1200×630 OG image
        width: 1200,
        height: 630,
        alt: "Nivesify Life Calculators — SIP, Lumpsum, SWP, Retirement Calculator India",
      },
    ],
    locale: "en_IN",
  },

  // ── Twitter Card ──────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@nivesify", // ← update to your Twitter handle
    creator: "@nivesify",
    title:
      "Free Mutual Fund Calculators India | SIP · Lumpsum · SWP · Retirement",
    description:
      "12 free calculators for Indian mutual fund investors. Plan SIPs, lumpsum growth, SWP income, and your full retirement — in one place.",
    images: [`${BASE_URL}/og/calculators.png`],
  },

  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  // ── Keywords (secondary signal — still worth including) ───────────────────
  keywords: [
    "SIP calculator India",
    "mutual fund SIP calculator",
    "lumpsum calculator India",
    "SWP calculator",
    "retirement calculator India",
    "SIP future value calculator",
    "mutual fund return calculator",
    "SIP goal calculator",
    "corpus calculator",
    "inflation adjusted SWP",
    "limited period SIP calculator",
    "retirement readiness calculator India",
    "how much SIP for 1 crore",
    "monthly SWP calculator India",
    "mutual fund investment calculator",
    "free financial calculators India",
  ],

  // ── Authors & Publisher ───────────────────────────────────────────────────
  authors: [{ name: "Nivesify", url: BASE_URL }],
  creator: "Nivesify",
  publisher: "Nivesify",

  // ── Category ─────────────────────────────────────────────────────────────
  category: "Finance",
};

// ── JSON-LD structured data ───────────────────────────────────────────────
// Paste this as a <script type="application/ld+json"> in your page's <head>
// via a Server Component or via Next.js generateMetadata.
export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // WebPage
    {
      "@type": "WebPage",
      "@id": `${BASE_URL}/dashboard/calculators#webpage`,
      url: `${BASE_URL}/dashboard/calculators`,
      name: "Free Mutual Fund Calculators India — SIP, Lumpsum, SWP, Retirement | Nivesify",
      description:
        "12 free mutual fund calculators for Indian investors. Calculate SIP amounts, lumpsum growth, SWP withdrawals, inflation-adjusted income, and a full lifetime retirement plan.",
      inLanguage: "en-IN",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      breadcrumb: { "@id": `${BASE_URL}/dashboard/calculators#breadcrumb` },
    },

    // BreadcrumbList
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/dashboard/calculators#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: BASE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Life Calculators",
          item: `${BASE_URL}/dashboard/calculators`,
        },
      ],
    },

    // FAQPage — real questions Indian investors search for
    {
      "@type": "FAQPage",
      "@id": `${BASE_URL}/dashboard/calculators#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "How much SIP do I need to accumulate ₹1 crore?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "At 12% annual return over 10 years, you need a monthly SIP of approximately ₹43,500. Over 15 years it drops to around ₹19,800, and over 20 years it is only about ₹10,000. Use the 'SIP Required for Your Goal' calculator on this page for your exact numbers.",
          },
        },
        {
          "@type": "Question",
          name: "What is the SWP (Systematic Withdrawal Plan) in mutual funds?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "An SWP lets you withdraw a fixed amount from your mutual fund corpus every month. The remaining corpus stays invested and continues to grow. It is commonly used during retirement to generate regular income. Use our SWP calculator to find out how much you can withdraw monthly from your corpus.",
          },
        },
        {
          "@type": "Question",
          name: "How is lumpsum different from SIP for mutual fund investment?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A lumpsum is a one-time investment while SIP (Systematic Investment Plan) spreads your investments monthly. SIP benefits from rupee cost averaging in volatile markets. Lumpsum investment can grow faster if the market performs well over a long period. Our calculators let you compare both approaches.",
          },
        },
        {
          "@type": "Question",
          name: "How much corpus do I need to retire in India?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It depends on your desired monthly income, inflation rate, and expected post-retirement investment return. For example, to sustain ₹75,000/month (in today's value) for 25 years at 7% post-retirement return with 6% inflation, you would need approximately ₹2.5–3 crore at retirement. Use our Retirement Analysis calculator for a personalised estimate.",
          },
        },
        {
          "@type": "Question",
          name: "What return should I use for mutual fund calculations in India?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "For equity mutual funds (Nifty 500/large-cap), a long-term historical average of 10–12% p.a. is commonly used for planning. For debt or balanced funds, 7–8% is more appropriate. For post-retirement withdrawals, use 7–8% as your portfolio shifts to conservative funds. These are estimates, not guaranteed returns.",
          },
        },
        {
          "@type": "Question",
          name: "What is a limited period SIP strategy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A limited period SIP means you invest via SIP for a fixed number of years (e.g., 7 years) and then stop contributing, but leave the corpus invested to grow for several more years. Because of compounding, this can sometimes outperform continuing the SIP for the full period. Use our 'Invest for Fewer Years, Grow for Longer' calculator to explore this strategy.",
          },
        },
      ],
    },

    // WebSite (for sitelinks searchbox signal)
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Nivesify",
      description:
        "India's smart mutual fund research and planning platform for retail investors.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },

    // SoftwareApplication — signals this is a free tool
    {
      "@type": "SoftwareApplication",
      name: "Nivesify Life Calculators",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      featureList: [
        "SIP Required for Goal",
        "Lumpsum Required for Goal",
        "SIP Future Value",
        "Lumpsum Future Value",
        "SIP + Lumpsum Combined",
        "Limited Period SIP Future Value",
        "Limited Period SIP Goal",
        "One-time Top-up on Existing SIP",
        "SIP Required with Existing Lumpsum",
        "SWP Monthly Withdrawal",
        "Corpus Required for SWP",
        "Inflation-Adjusted SWP",
        "Full Retirement Analysis",
      ],
    },
  ],
};