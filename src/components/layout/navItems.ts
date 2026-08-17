import { Home, Map, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * 비로그인도 접근 가능한 공통 메뉴.
 *
 * 좌측 LNB(`lg` 이상)와 모바일 전체화면 메뉴(`lg` 미만)가 **같은 목록을 쓴다.**
 * 한쪽에만 항목을 추가해 두 내비가 갈라지는 일이 없도록 여기서만 관리한다.
 *
 * 프로필·설정은 상단 바 프로필 아이콘의 드롭다운으로 접근하므로 여기 없다.
 */
export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "홈", icon: Home },
  { href: "/map", label: "이슈맵", icon: Map },
];
