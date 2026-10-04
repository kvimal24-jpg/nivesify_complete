import { describe, expect, it } from "vitest";
import { xirr } from "./xirr";

describe("xirr", () => {
  it("returns null without enough cashflows", () => {
    expect(xirr([{ amount: -1_000, date: new Date("2025-01-01") }])).toBeNull();
  });

  it("calculates an annualized return for a one-year investment", () => {
    const result = xirr([
      { amount: -10_000, date: new Date("2025-01-01") },
      { amount: 11_000, date: new Date("2026-01-01") },
    ]);

    expect(result).not.toBeNull();
    expect(result).toBeCloseTo(0.1, 5);
  });

  it("supports irregularly spaced contributions", () => {
    const result = xirr([
      { amount: -5_000, date: new Date("2024-01-01") },
      { amount: -2_500, date: new Date("2024-07-01") },
      { amount: 8_500, date: new Date("2025-01-01") },
    ]);

    expect(result).not.toBeNull();
    expect(result as number).toBeGreaterThan(0);
  });
});
