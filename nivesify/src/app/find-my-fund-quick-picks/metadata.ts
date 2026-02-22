import type { Metadata } from "next";

const BASE_URL = "https://www.nivesify.com";

export const metadata: Metadata = {
  title: "Mutual Fund Quick Picks India 2025 | Best Funds, Recommendations | Nivesify",
  description: "Discover top mutual fund picks tailored to your investment goals. Explore expert recommendations, performance, and insights for smarter investing in India.",
  alternates: {
    canonical: `${BASE_URL}/find-my-fund-quick-picks`,
  },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/find-my-fund-quick-picks`,
    siteName: "Nivesify",
    title: "Mutual Fund Quick Picks India | Best Funds, Recommendations",
    description: "Explore India's best mutual fund picks, tailored to your goals. Expert recommendations and performance insights.",
    images: [
      {
        url: `${BASE_URL}/og/quick-picks.png`,
        width: 1200,
        height: 630,
        alt: "Nivesify Quick Picks — Best Mutual Funds India",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nivesify",
    creator: "@nivesify",
    title: "Mutual Fund Quick Picks India | Best Funds, Recommendations",
    description: "Explore India's best mutual fund picks, tailored to your goals. Expert recommendations and performance insights.",
    images: [`${BASE_URL}/og/quick-picks.png`],
  },
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
  keywords: [
    "mutual fund quick picks",
    "best mutual funds India",
    "mutual fund recommendations",
    "top funds India",
    "Nivesify quick picks",
    "mutual fund performance",
    "investment picks India",
    "expert mutual fund advice",
    "free mutual fund tools",
  ],
  authors: [{ name: "Nivesify", url: BASE_URL }],
  creator: "Nivesify",
  publisher: "Nivesify",
  category: "Finance",
};

export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${BASE_URL}/find-my-fund-quick-picks#webpage`,
      url: `${BASE_URL}/find-my-fund-quick-picks`,
      name: "Mutual Fund Quick Picks India | Best Funds, Recommendations | Nivesify",
      description: "Discover top mutual fund picks tailored to your investment goals. Explore expert recommendations, performance, and insights for smarter investing in India.",
      inLanguage: "en-IN",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      breadcrumb: { "@id": `${BASE_URL}/find-my-fund-quick-picks#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/find-my-fund-quick-picks#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Quick Picks", item: `${BASE_URL}/find-my-fund-quick-picks` },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Nivesify",
      description: "India's smart mutual fund research and planning platform for retail investors.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};