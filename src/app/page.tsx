import IssueCard, { type ChatRoomResponse } from "@/components/home/IssueCard";
import IssueCardNew, {
  type BestIssueRoom,
} from "@/components/home/IssueCardNew";

// ── Dummy Data ────────────────────────────────────
const BEST_ISSUES: BestIssueRoom[] = [
  { id: "b1", title: "AI가 인간의 일자리를 대체해야 하는가", countChatRoom: 12 },
  { id: "b2", title: "기본소득제 전국 도입, 찬성 vs 반대", countChatRoom: 8 },
  { id: "b3", title: "SNS 실명제는 필요한가", countChatRoom: 15 },
];

const CHAT_ROOMS: ChatRoomResponse[] = [
  {
    id: "r1",
    title: "AI 규제 법안, 혁신을 막는 것인가 보호하는 것인가",
    createdAt: "2025-06-15",
    agree: 67,
    disagree: 33,
  },
  {
    id: "r2",
    title: "주 4일 근무제 전면 도입, 생산성은 유지될까",
    createdAt: "2025-06-14",
    agree: 45,
    disagree: 55,
  },
  {
    id: "r3",
    title: "사형제도 폐지, 인권인가 정의인가",
    createdAt: "2025-06-13",
    agree: 52,
    disagree: 48,
  },
];

// ── Page ──────────────────────────────────────────
export default function Home() {
  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 핫한 토론 주제 (가로 스크롤) */}
      <section>
        <h2 className="text-header-20 font-bold text-text-primary mb-4">
          🔥 핫한 토론 주제
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {BEST_ISSUES.map((issue) => (
            <IssueCardNew key={issue.id} data={issue} />
          ))}
        </div>
      </section>

      {/* 실시간 토론장 (세로 리스트) */}
      <section>
        <h2 className="text-header-20 font-bold text-text-primary mb-4">
          💬 실시간 토론장
        </h2>
        <div className="flex flex-col gap-3">
          {CHAT_ROOMS.map((room) => (
            <IssueCard key={room.id} data={room} />
          ))}
        </div>
      </section>
    </div>
  );
}
