// ── Shared API Client ─────────────────────────────
// 브라우저에서는 /proxy 경로를 통해 Next.js rewrites로 프록시,
// 서버(SSR)에서는 직접 외부 URL 호출
const API_URL =
  typeof window !== "undefined"
    ? "/proxy"
    : (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "");

interface FetchOptions extends Omit<RequestInit, "headers" | "signal"> {
  headers?: Record<string, string>;
  token?: string | null;
  /** 요청 타임아웃(ms). 기본 10 000 ms */
  timeout?: number;
}

/** Swagger 공통 응답 래퍼 */
interface ApiResponse<T> {
  status: number;
  code: string;
  message: string;
  data: T;
}

/**
 * 인증 헤더를 자동 첨부하는 fetch 래퍼.
 * token이 주어지면 Authorization: Bearer {token}을 추가한다.
 * 응답의 { status, code, message, data } 래퍼에서 data만 추출하여 반환한다.
 */
const DEFAULT_TIMEOUT = 10_000; // 10 s

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, headers = {}, timeout = DEFAULT_TIMEOUT, ...rest } = options;

  const mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    mergedHeaders["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: mergedHeaders,
      signal: controller.signal,
      ...rest,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`서버 응답 시간이 초과되었습니다. (${timeout / 1000}초)`);
    }
    throw new Error("네트워크에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const code = body?.code ?? res.status;
    const msg = body?.message ?? `API ${rest.method ?? "GET"} ${path} failed: ${res.status}`;
    throw new Error(`[${code}] ${msg}`);
  }

  const json: ApiResponse<T> = await res.json();
  return json.data;
}
