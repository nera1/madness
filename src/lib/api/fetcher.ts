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
    throw res;
  }

  const contentType = res.headers.get("Content-Type") ?? "";

  if (res.status === 204 || !contentType.includes("application/json")) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}
