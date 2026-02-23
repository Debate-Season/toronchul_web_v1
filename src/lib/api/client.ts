// ── Shared API Client ─────────────────────────────
// 브라우저에서는 /proxy 경로를 통해 Next.js rewrites로 프록시,
// 서버(SSR)에서는 직접 외부 URL 호출
const API_URL =
  typeof window !== "undefined"
    ? "/proxy"
    : (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "");

interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  token?: string | null;
}

/**
 * 인증 헤더를 자동 첨부하는 fetch 래퍼.
 * token이 주어지면 Authorization: Bearer {token}을 추가한다.
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, headers = {}, ...rest } = options;

  const mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    mergedHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers: mergedHeaders,
    ...rest,
  });

  if (!res.ok) {
    throw new Error(`API ${rest.method ?? "GET"} ${path} failed: ${res.status}`);
  }

  return res.json();
}
