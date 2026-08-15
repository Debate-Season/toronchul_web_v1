import Link from "next/link";
import type { BestChatRoom } from "@/lib/api/home";
import { threadHref } from "@/lib/slug";
import DeVoteGauge from "@/components/TDS/DeVoteGauge";

export interface DebateVote {
  agree: number;
  disagree: number;
}

/**
 * "이런 토론은 어때요?" 섹션용 가로 행 카드. 토론 주제 + 소속 이슈명.
 * 누르면 그 주제 탭이 열린 토론방(대화 화면)으로 바로 들어간다.
 * 우측 게이지는 vote 미로드 시에도 고정 폭으로 자리를 지켜(??%) 레이아웃 시프트를 막는다.
 */
export default function RecommendDebateCard({
  data,
  vote,
}: {
  data: BestChatRoom;
  vote?: DebateVote;
}) {
  return (
    <Link
      href={threadHref(data.issueId, data.issueTitle, data.debateId, data.debateTitle)}
      className="block"
    >
      <article className="flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-colors hover:border-grey-70">
        <div className="min-w-0 flex-1">
          {/* 토론방 이름 */}
          <h3 className="text-body-16 font-semibold text-text-primary line-clamp-1">
            {data.debateTitle}
          </h3>
          {/* 소속 이슈명 (작게) */}
          <p className="mt-1 text-caption-12 text-text-secondary truncate">
            {data.issueTitle}
          </p>
        </div>

        {/* 찬반 게이지 */}
        <DeVoteGauge
          agree={vote?.agree ?? 0}
          disagree={vote?.disagree ?? 0}
          size="sm"
          revealed={vote !== undefined}
        />
      </article>
    </Link>
  );
}
