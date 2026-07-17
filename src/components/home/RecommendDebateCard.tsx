import Link from "next/link";
import type { BestChatRoom } from "@/lib/api/home";
import { roomHref } from "@/lib/slug";

export interface DebateVote {
  agree: number;
  disagree: number;
}

// 찬반 비율(%) 계산. 표 없으면 50/50 (IssueCard 와 동일 규칙).
function getPercentages(agree: number, disagree: number) {
  const total = agree + disagree;
  if (total === 0) return { agreePercent: 50, disagreePercent: 50 };
  const agreePercent = Math.round((agree / total) * 100);
  return { agreePercent, disagreePercent: 100 - agreePercent };
}

/**
 * "이런 토론은 어때요?" 섹션용 가로 행 카드. 토론방 이름 + 소속 이슈명.
 * 우측에 찬성/반대 비율(vote 로드 후). 미로드 시 우측 비움.
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
      href={roomHref(data.issueId, data.issueTitle, data.debateId, data.debateTitle)}
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

        {/* 찬성/반대 비율 */}
        {vote && <VoteRatio agree={vote.agree} disagree={vote.disagree} />}
      </article>
    </Link>
  );
}

function VoteRatio({ agree, disagree }: DebateVote) {
  const { agreePercent, disagreePercent } = getPercentages(agree, disagree);
  return (
    <div className="flex-shrink-0 text-right leading-tight">
      <div className="text-caption-12 font-semibold text-red">
        찬성 {agreePercent}%
      </div>
      <div className="mt-0.5 text-caption-12 font-semibold text-blue">
        반대 {disagreePercent}%
      </div>
    </div>
  );
}
