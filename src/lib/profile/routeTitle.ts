import { PROFILE_TEXT } from "@/lib/profile/constants";

/** 프로필 계열 경로별 타이틀. 모달 셸/전체 페이지 셸이 공용으로 사용. */
export const PROFILE_ROUTE_TITLES: Record<string, string> = {
  "/profile": "프로필",
  "/profile/edit": PROFILE_TEXT.modifyAppBar,
  "/profile/image": PROFILE_TEXT.imageModifyAppBar,
  "/profile/terms": "약관 및 개인정보 처리 동의",
  "/profile/withdraw": "회원탈퇴",
};

export function profileRouteTitle(pathname: string): string {
  return PROFILE_ROUTE_TITLES[pathname] ?? "프로필";
}
