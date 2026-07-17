import { PROFILE_TEXT } from "@/lib/profile/constants";

/** 프로필 계열 경로별 타이틀. 프로필 전체 페이지 셸이 사용. */
export const PROFILE_ROUTE_TITLES: Record<string, string> = {
  "/profile": "프로필",
  "/profile/edit": PROFILE_TEXT.modifyAppBar,
  "/profile/image": PROFILE_TEXT.imageModifyAppBar,
};

export function profileRouteTitle(pathname: string): string {
  return PROFILE_ROUTE_TITLES[pathname] ?? "프로필";
}
