// ── 로그인 직후 이동 경로 결정 ────────────────────────────
// 모바일 온보딩 순서 미러: 약관 미동의 → 약관 동의, 프로필 없음 → 프로필 생성, 그 외 홈.
// termsStatus/profileStatus 는 백엔드 로그인 응답값 (true = 완료).

export function nextAfterLogin(
  termsStatus: boolean,
  profileStatus: boolean,
): string {
  if (!termsStatus) return "/onboarding/terms";
  if (!profileStatus) return "/onboarding/profile";
  return "/";
}
