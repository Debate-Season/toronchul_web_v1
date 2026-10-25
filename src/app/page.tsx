import { fetchRecentEvents } from "@/lib/api/article";
import HomeView from "@/components/home/HomeView";

/** 서버 익명 조회 캐시(`apiFetch`, 60초)와 같은 값 */
export const revalidate = 60;

/** "사건 발생!" 후보 수 — 이 중 하나를 홈이 무작위로 고른다 */
const RECENT_EVENT_CANDIDATES = 5;

/**
 * 홈. 화면은 클라이언트(`HomeView`)가 그리고, 서버는 여러 이슈를 훑어야 하는 최근 사건만 미리
 * 모아 넘긴다 — 브라우저가 이슈 수만큼 요청하지 않게. 실패하면 섹션만 빠진다.
 */
export default async function HomePage() {
  const recentEvents = await fetchRecentEvents(RECENT_EVENT_CANDIDATES).catch(() => []);
  return <HomeView recentEvents={recentEvents} />;
}
