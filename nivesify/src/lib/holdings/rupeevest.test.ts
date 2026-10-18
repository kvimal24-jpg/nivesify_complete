import { describe, expect, it } from "vitest";
import { calculateOverlap, matchSchemeByName, parsePortfolio, parseSchemeSearch } from "./rupeevest";

describe("RupeeVest holdings adapter", () => {
  it("normalizes the provider search payload", () => {
    const schemes = parseSchemeSearch({ search_data: [{
      schemecode: 9767,
      s_name: "Mirae Asset Large & Midcap Fund-Reg(G)",
      s_name1: "Mirae Asset Large & Midcap Fund",
      "REPLACE (sr.fund_house,'-',' ')": "Mirae Asset Mutual Fund",
    }] });
    expect(schemes[0]).toMatchObject({ schemeCode: 9767, displayName: "Mirae Asset Large & Midcap Fund" });
  });

  it("matches Direct and Regular plan naming variants", () => {
    const schemes = parseSchemeSearch({ search_data: [{
      schemecode: 9767,
      s_name: "Mirae Asset Large & Midcap Fund-Reg(G)",
      s_name1: "Mirae Asset Large & Midcap Fund",
      "REPLACE (sr.fund_house,'-',' ')": "Mirae Asset Mutual Fund",
    }] });
    const match = matchSchemeByName("Mirae Asset Large & Midcap Fund Direct Growth", schemes, "Mirae Asset");
    expect(match.scheme?.schemeCode).toBe(9767);
    expect(match.confidence).toBe("high");
  });

  it("merges equity and cash into a normalized monthly portfolio", () => {
    const portfolio = parsePortfolio({
      fund_info: [{ s_name: "Test Fund", aumdate: "2026-08-31", aumtotal: 100, classification: "Equity" }],
      month_name: ["Aug-26"],
      MonthwiseAUM: [{ aum: "100" }],
      stock_mapping: { "100": "Alpha Ltd." },
      stock_data: { "0": { "0": { fincode: 100, percent_aum: "6.5", noshares: 10 } } },
      stock_mapping_cash: { "900": "Cash" },
      stock_data_cash: { "0": { "0": { fincode: 900, percent_aum: "2.0" } } },
    }, 10);
    expect(portfolio.months[0].holdings).toHaveLength(2);
    expect(portfolio.months[0].holdings[0]).toMatchObject({ securityName: "Alpha Ltd.", assetType: "equity" });
  });

  it("calculates weighted overlap between two funds", () => {
    const base = { securityCode: "1", shares: null, date: null, assetType: "equity" as const };
    const result = calculateOverlap(
      [{ ...base, securityName: "Alpha Ltd.", percentAum: 6 }, { ...base, securityName: "Beta Ltd.", percentAum: 4 }],
      [{ ...base, securityName: "Alpha Ltd.", percentAum: 3 }, { ...base, securityName: "Gamma Ltd.", percentAum: 5 }, { ...base, securityName: "Beta Ltd.", percentAum: -2 }],
    );
    expect(result).toEqual({ overlap: 3, commonCount: 1 });
  });
});
