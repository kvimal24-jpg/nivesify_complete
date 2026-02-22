import type { Metadata } from "next";

const BASE_URL = "https://www.nivesify.com";

export const metadata: Metadata = {
  title: "Lifetime Investment Plan India 2025 | Personalized Financial Growth | Nivesify",
  description: "Build your personalized lifetime investment plan. Get expert guidance, projections, and tools for long-term financial growth in India.",
  alternates: {
    canonical: `${BASE_URL}/find-my-fund-lifetime-plan`,
  },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/find-my-fund-lifetime-plan`,
    siteName: "Nivesify",
    title: "Lifetime Investment Plan India | Personalized Financial Growth",
    description: "Build your personalized lifetime investment plan. Expert guidance and projections for long-term financial growth.",
    images: [
      {
        url: `${BASE_URL}/og/lifetime-plan.png`,
        width: 1200,
        height: 630,
        alt: "Nivesify Lifetime Plan — Personalized Financial Growth India",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nivesify",
    creator: "@nivesify",
    title: "Lifetime Investment Plan India | Personalized Financial Growth",
    description: "Build your personalized lifetime investment plan. Expert guidance and projections for long-term financial growth.",
    images: [`${BASE_URL}/og/lifetime-plan.png`],
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
    "lifetime investment plan",
    "personalized financial growth",
    "investment planning India",
    "Nivesify lifetime plan",
    "long-term investment tools",
    "financial projections India",
    "expert investment guidance",
    "free investment calculators",
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
      "@id": `${BASE_URL}/find-my-fund-lifetime-plan#webpage`,
      url: `${BASE_URL}/find-my-fund-lifetime-plan`,
      name: "Lifetime Investment Plan India | Personalized Financial Growth | Nivesify",
      description: "Build your personalized lifetime investment plan. Get expert guidance, projections, and tools for long-term financial growth in India.",
      inLanguage: "en-IN",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      breadcrumb: { "@id": `${BASE_URL}/find-my-fund-lifetime-plan#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/find-my-fund-lifetime-plan#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Lifetime Plan", item: `${BASE_URL}/find-my-fund-lifetime-plan` },
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