import { NextRequest, NextResponse } from "next/server";
import { parsePortfolio } from "@/lib/holdings/rupeevest";

const PORTFOLIO_URL = "https://www.rupeevest.com/home/get_mf_portfolio_tracker";

export async function GET(request: NextRequest) {
  const rawCode = request.nextUrl.searchParams.get("schemecode") ?? "";
  if (!/^\d{1,10}$/.test(rawCode)) {
    return NextResponse.json({ error: "A valid scheme code is required." }, { status: 400 });
  }
  const schemeCode = Number(rawCode);
  try {
    const response = await fetch(`${PORTFOLIO_URL}?schemecode=${schemeCode}`, {
      headers: { Accept: "application/json", "User-Agent": "Nivesify/1.0" },
      next: { revalidate: 21_600 },
    });
    if (!response.ok) throw new Error(`RupeeVest portfolio returned ${response.status}`);
    const portfolio = parsePortfolio(await response.json(), schemeCode);
    if (!portfolio.months.length) {
      return NextResponse.json({ error: "No disclosed holdings were found for this scheme." }, { status: 404 });
    }
    return NextResponse.json(portfolio, {
      headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("Holdings portfolio failed", error);
    return NextResponse.json({ error: "Holdings are temporarily unavailable." }, { status: 502 });
  }
}
