export async function fetcher<T>(
  query: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "https://api.madn.es";

  const res = await fetch(`${baseUrl}${query}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const message = errorBody?.message ?? res.statusText;
    throw new Error(`Request failed (${res.status}): ${message}`);
  }

  return res.json();
}
