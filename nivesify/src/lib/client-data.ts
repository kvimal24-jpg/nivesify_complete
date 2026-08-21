import { DATA_ENDPOINTS } from "./data-endpoints";

const jsonCache = new Map<string, Promise<unknown>>();

export function fetchCachedJson<T>(key: keyof typeof DATA_ENDPOINTS): Promise<T> {
  const url = DATA_ENDPOINTS[key];
  const existing = jsonCache.get(url);
  if (existing) return existing as Promise<T>;

  const request = (async () => {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    return response.json() as T;
  })();

  jsonCache.set(url, request);
  request.catch(() => jsonCache.delete(url));
  return request;
}