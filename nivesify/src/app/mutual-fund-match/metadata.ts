import type { Metadata } from "next";

const BASE_URL = "https://www.nivesify.com";

export const metadata: Metadata = {
  title: "Mutual Fund Match India 2025 | Personalized Recommendations | Nivesify",
  description: "Find the best mutual fund match for your investment profile. Compare schemes, get personalized recommendations, and optimize your investments in India.",
  alternates: {
    canonical: `${BASE_URL}/mutual-fund-match`,
  },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/mutual-fund-match`,
    siteName: "Nivesify",
    title: "Mutual Fund Match India | Personalized Recommendations",
    description: "Find the best mutual fund match for your investment profile. Compare schemes and get personalized recommendations.",
    images: [
      {
        url: `${BASE_URL}/og/mutual-fund-match.png`,
        width: 1200,
        height: 630,
        alt: "Nivesify Mutual Fund Match — Personalized Recommendations India",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nivesify",
    creator: "@nivesify",
    title: "Mutual Fund Match India | Personalized Recommendations",
    description: "Find the best mutual fund match for your investment profile. Compare schemes and get personalized recommendations.",
    images: [`${BASE_URL}/og/mutual-fund-match.png`],
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
    "mutual fund match",
    "personalized mutual fund recommendations",
    "best mutual funds India",
    "compare mutual fund schemes",
    "Nivesify fund match",
    "investment optimization India",
    "mutual fund advice",
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
      "@id": `${BASE_URL}/mutual-fund-match#webpage`,
      url: `${BASE_URL}/mutual-fund-match`,
      name: "Mutual Fund Match India | Personalized Recommendations | Nivesify",
      description: "Find the best mutual fund match for your investment profile. Compare schemes, get personalized recommendations, and optimize your investments in India.",
      inLanguage: "en-IN",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      breadcrumb: { "@id": `${BASE_URL}/mutual-fund-match#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/mutual-fund-match#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Fund Match", item: `${BASE_URL}/mutual-fund-match` },
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