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

/** 토큰 갱신 중복 요청 방지 */
let refreshPromise: Promise<string | null> | null = null;

/** base64url → UTF-8 문자열. 실패 시 null. */
function base64UrlDecode(input: string): string | null {
  try {
    let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    if (typeof atob === "function") {
      const bin = atob(b64);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    return Buffer.from(b64, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

/** JWT payload 의 exp(초) 추출. 디코드 불가/미포함이면 null. */
function getTokenExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const json = base64UrlDecode(parts[1]);
  if (!json) return null;
  try {
    const payload: unknown = JSON.parse(json);
    if (
      typeof payload === "object" &&
      payload !== null &&
      "exp" in payload &&
      typeof (payload as { exp: unknown }).exp === "number"
    ) {
      return (payload as { exp: number }).exp;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 액세스 토큰이 만료(또는 임박)인지 판정.
 * exp 를 못 읽으면 만료로 단정하지 않고 false 반환 → 401 반응 경로에 위임.
 */
function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const exp = getTokenExp(token);
  if (exp === null) return false;
  return exp - skewSeconds <= Date.now() / 1000;
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
  const { token: initialToken, headers = {}, timeout = DEFAULT_TIMEOUT, ...rest } = options;
  let token = initialToken;

  // ── 선제 토큰 갱신 ─────────────────────────────
  // optional-auth GET(/room, /issue 등)은 만료 토큰에도 401 대신 익명 데이터를
  // 돌려주므로 아래 401 반응 경로가 트리거되지 않는다. 요청 전에 exp 를 확인해
  // 만료(임박)면 미리 reissue 하여 "다음날 투표·입장이 풀리는" 문제를 방지한다.
  if (token && !path.includes("/auth/reissue") && isTokenExpired(token)) {
    const refreshed = await handleTokenRefresh();
    if (refreshed) {
      token = refreshed;
    } else {
      // 액세스·리프레시 토큰이 모두 만료 → 401 반응 경로와 동일하게 세션 종료.
      const { performLogout } = await import("@/lib/auth/logout");
      await performLogout();
      throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
    }
  }

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

  // ── 401 → refresh → retry ──────────────────────
  if (res.status === 401 && token && !path.includes("/auth/reissue")) {
    const newToken = await handleTokenRefresh();
    if (newToken) {
      return apiFetch<T>(path, { ...options, token: newToken });
    }
    // refresh 실패 → 로그아웃
    const { performLogout } = await import("@/lib/auth/logout");
    await performLogout();
    throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
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

/** 토큰 갱신 처리. 동시 여러 요청이 401을 받아도 갱신은 1회만 수행. */
async function handleTokenRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { default: useAuthStore } = await import("@/store/useAuthStore");
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) return null;

      const { reissueToken } = await import("@/lib/api/auth");
      const result = await reissueToken(refreshToken);

      useAuthStore.getState().setTokens(result.accessToken, result.refreshToken);
      return result.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
