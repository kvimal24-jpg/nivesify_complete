export type UxEventName =
  | "holdings_search_select"
  | "holdings_view_change"
  | "holdings_watchlist_change"
  | "fund_research_view_change";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackUxEvent(name: UxEventName, properties: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  const detail = { event: name, ...properties };
  window.dispatchEvent(new CustomEvent("nivesify:analytics", { detail }));
  window.dataLayer?.push(detail);
}
