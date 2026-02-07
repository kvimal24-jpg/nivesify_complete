import { NextResponse } from "next/server";

const AMFI_NAV_URL = "https://portal.amfiindia.com/spages/NAVAll.txt";

type AmfiScheme = {
  schemeCode: number;
  schemeName: string;
  isinGrowth: string;
  isinDivReinvestment: string | null;
  schemeType?: string;
  schemeCategory?: string;
  amc?: string;
};

const parseAmfiNav = (content: string): AmfiScheme[] => {
  const lines = content.split(/\r?\n/);
  const schemes: AmfiScheme[] = [];
  let currentSchemeType: string | undefined;
  let currentSchemeCategory: string | undefined;
  let currentAmc: string | undefined;

  const parseSchemeHeader = (line: string) => {
    const match = line.match(/^(.*)Schemes\((.*)\)$/i);
    if (!match) return null;
    return {
      schemeType: match[1].trim() + "Schemes",
      schemeCategory: match[2].trim(),
    };
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("Scheme Code")) return;

    if (!trimmed.includes(";")) {
      const schemeHeader = parseSchemeHeader(trimmed);
      if (schemeHeader) {
        currentSchemeType = schemeHeader.schemeType;
        currentSchemeCategory = schemeHeader.schemeCategory;
        return;
      }
      if (!trimmed.toLowerCase().includes("schemes")) {
        currentAmc = trimmed;
      }
      return;
    }

    const parts = trimmed.split(";");
    if (parts.length < 4) return;

    const schemeCode = Number(parts[0]);
    const isinGrowth = (parts[1] || "").trim();
    const isinDivReinvestment = (parts[2] || "").trim();
    const schemeName = (parts[3] || "").trim();

    if (!Number.isFinite(schemeCode) || !schemeName) return;

    schemes.push({
      schemeCode,
      schemeName,
      isinGrowth,
      isinDivReinvestment: isinDivReinvestment || null,
      schemeType: currentSchemeType,
      schemeCategory: currentSchemeCategory,
      amc: currentAmc,
    });
  });

  return schemes;
};

export async function GET() {
  try {
    const res = await fetch(AMFI_NAV_URL, {
      headers: {
        Accept: "text/plain",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Failed to fetch scheme list", detail: text },
        { status: 502 }
      );
    }

    const text = await res.text();
    const data = parseAmfiNav(text);
    return NextResponse.json({ data, cached: false });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch scheme list", detail: error?.message || "unknown" },
      { status: 502 }
    );
  }
}
