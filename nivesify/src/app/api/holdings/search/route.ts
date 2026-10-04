import { NextRequest, NextResponse } from "next/server";
import { normalizeSchemeName, parseSchemeSearch } from "@/lib/holdings/rupeevest";

const SEARCH_URL = "https://www.rupeevest.com/home/get_search_data";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  try {
    const response = await fetch(SEARCH_URL, {
      headers: { Accept: "application/json", "User-Agent": "Nivesify/1.0" },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) throw new Error(`RupeeVest search returned ${response.status}`);
    const schemes = parseSchemeSearch(await response.json());
    const queryTokens = normalizeSchemeName(query).split(" ").filter(Boolean);
    const filtered = query.length < 2
      ? []
      : schemes.filter((scheme) => {
          const haystack = normalizeSchemeName(`${scheme.displayName} ${scheme.fundHouse}`);
          return queryTokens.every((token) => haystack.includes(token));
        }).slice(0, 24);
    return NextResponse.json({ schemes: filtered, total: schemes.length }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.error("Holdings search failed", error);
    return NextResponse.json({ schemes: [], error: "Holdings search is temporarily unavailable." }, { status: 502 });
  }
}
