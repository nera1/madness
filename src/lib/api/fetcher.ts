const API_BASE = `https://api.madn.es`;

export async function fetcher<T>(
  query: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${query}`, {
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
