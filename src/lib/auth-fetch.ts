/**
 * 401 응답 시 리프레시 토큰으로 액세스 토큰을 갱신한 뒤 원래 요청을 재시도하는 fetch 래퍼.
 * 동시 다발적 401에 대해 리프레시 요청을 단일 Promise로 공유하여 중복 호출을 방지한다.
 */

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch("/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: "include" });

  if (res.status !== 401) return res;

  // 리프레시 시도 — 이미 진행 중이면 기존 Promise 재사용
  if (!refreshPromise) {
    refreshPromise = tryRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  const refreshed = await refreshPromise;
  if (!refreshed) return res; // 리프레시도 실패 → 원래 401 반환

  // 새 액세스 토큰으로 원래 요청 재시도
  return fetch(input, { ...init, credentials: "include" });
}
