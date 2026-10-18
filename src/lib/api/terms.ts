import { apiFetch } from "@/lib/api/client";
import { toBackendDateTime } from "@/lib/api/dateTime";

// ── Types ─────────────────────────────────────────
/** GET /api/v1/terms 항목 */
export interface Terms {
  termsId: number;
  termsType: string;
  version: string;
  notionUrl: string;
}

/** GET /api/v1/terms/agree 항목 (내가 동의한 약관 현황) */
export interface TermsMyAgree {
  termsType: string;
  /** `yyyy-MM-ddTHH:mm:ss`. 백엔드는 배열로 내려 주므로 받을 때 정규화한다(`dateTime.ts`). 해석 불가면 "" */
  agreedAt: string;
  notionUrl: string;
}

/** 실제 응답 — `agreedAt` 이 Jackson 배열로 온다(백엔드 확인, 앱 호환 때문에 유지) */
interface RawTermsMyAgree extends Omit<TermsMyAgree, "agreedAt"> {
  agreedAt: unknown;
}

export interface TermsAgreement {
  termsId: number;
  agreed: boolean;
}

// ── API ───────────────────────────────────────────

/** GET /api/v1/terms — 전체 약관 목록(가입 약관동의 화면용) */
export async function getTerms(token: string | null): Promise<Terms[]> {
  return apiFetch<Terms[]>("/api/v1/terms", { token });
}

/** GET /api/v1/terms/agree — 내 약관 동의 현황 */
export async function getTermsAgree(
  token: string | null,
): Promise<TermsMyAgree[]> {
  const raw = await apiFetch<RawTermsMyAgree[]>("/api/v1/terms/agree", { token });
  return raw.map((item) => ({ ...item, agreedAt: toBackendDateTime(item.agreedAt) ?? "" }));
}

/** POST /api/v1/terms/agree — 약관 동의 제출 */
export async function agreeTerms(
  agreements: TermsAgreement[],
  token: string | null,
): Promise<void> {
  await apiFetch<null>("/api/v1/terms/agree", {
    method: "POST",
    body: JSON.stringify({ agreements }),
    token,
  });
}
