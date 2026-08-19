const jsonRequests = new Map<string, Promise<unknown>>();

export function fetchCachedJson<T>(url: string): Promise<T> {
  const existing = jsonRequests.get(url);
  if (existing) return existing as Promise<T>;

  const request = fetch(url).then((response) => {
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    return response.json() as Promise<T>;
  });
  jsonRequests.set(url, request);
  request.catch(() => jsonRequests.delete(url));
  return request;
}