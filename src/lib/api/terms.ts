import { apiFetch } from "@/lib/api/client";

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
  agreedAt: string;
  notionUrl: string;
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
  return apiFetch<TermsMyAgree[]>("/api/v1/terms/agree", { token });
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
