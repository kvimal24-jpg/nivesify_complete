import { NextRequest, NextResponse } from "next/server";
import { matchSchemeByName, parseSchemeSearch } from "@/lib/holdings/rupeevest";

const SEARCH_URL = "https://www.rupeevest.com/home/get_search_data";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  const fundHouse = request.nextUrl.searchParams.get("fundHouse")?.trim() ?? "";
  if (name.length < 3) return NextResponse.json({ error: "A fund name is required." }, { status: 400 });
  try {
    const response = await fetch(SEARCH_URL, {
      headers: { Accept: "application/json", "User-Agent": "Nivesify/1.0" },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) throw new Error(`RupeeVest search returned ${response.status}`);
    const match = matchSchemeByName(name, parseSchemeSearch(await response.json()), fundHouse);
    return NextResponse.json(match, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.error("Holdings matching failed", error);
    return NextResponse.json({ error: "Fund matching is temporarily unavailable." }, { status: 502 });
  }
}
